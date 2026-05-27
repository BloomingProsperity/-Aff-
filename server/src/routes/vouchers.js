import { randomBytes } from "node:crypto";
import { publicUser, requireAdmin, requireUser } from "../lib/auth.js";
import { writeAuditLog } from "../lib/audit.js";
import { amountToCents, centsToAmount, cleanOrderId, toIso } from "../lib/common.js";
import { exec, many, one } from "../lib/db.js";
import { enforceRateLimit, verifyTurnstile } from "../lib/security.js";
import { generateVoucherCode, hashVoucherCode, normalizeVoucherCode, voucherSuffix } from "../lib/vouchers.js";

function batchId() {
  return `VC${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
}

function normalizeVoucher(row) {
  return {
    id: Number(row.id),
    batchId: row.batch_id,
    codeSuffix: row.code_suffix,
    amount: centsToAmount(row.amount_cents),
    status: row.status,
    note: row.note || "",
    redeemedBy: row.redeemed_by_email || "",
    createdBy: row.created_by_email || "",
    expiresAt: toIso(row.expires_at),
    createdAt: toIso(row.created_at),
    redeemedAt: toIso(row.redeemed_at),
    voidedAt: toIso(row.voided_at),
  };
}

function siteOrigin(request, config) {
  const origin = String(request.headers.origin || "").replace(/\/+$/, "");
  if (/^https:\/\/(www\.)?hkai\.shop$/i.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
    return origin;
  }
  return String(config.siteUrl || "https://hkai.shop").replace(/\/+$/, "");
}

export async function voucherRoutes(app) {
  app.post("/api/vouchers/redeem", async (request, reply) => {
    const auth = await requireUser(app.db, request, reply);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "voucher:redeem",
      extra: `user:${auth.user.id}`,
      limit: 8,
      windowSeconds: 600,
      config: app.config,
    });
    if (limited) return limited;

    const body = request.body || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, body.turnstileToken);
    if (turnstile) return turnstile;

    const code = normalizeVoucherCode(body.code);
    if (code.length < 8) {
      reply.code(400);
      await writeAuditLog(app.db, request, {
        actorUserId: auth.user.id,
        targetUserId: auth.user.id,
        action: "voucher.redeem",
        resourceType: "voucher",
        status: "failed",
        httpStatus: 400,
        metadata: { reason: "invalid_code", codeLength: code.length },
      });
      return { error: "兑换码无效。" };
    }

    const client = await app.db.connect();
    let redeemed;
    let updated;
    try {
      await client.query("BEGIN");
      redeemed = await one(
        client,
        `UPDATE balance_vouchers
            SET status = 'redeemed',
                redeemed_by_user_id = $1,
                redeemed_at = now()
          WHERE code_hash = $2
            AND status = 'active'
            AND (expires_at IS NULL OR expires_at > now())
        RETURNING *`,
        [auth.user.id, hashVoucherCode(code)],
      );
      if (!redeemed) {
        await client.query("ROLLBACK");
        reply.code(400);
        await writeAuditLog(app.db, request, {
          actorUserId: auth.user.id,
          targetUserId: auth.user.id,
          action: "voucher.redeem",
          resourceType: "voucher",
          status: "failed",
          httpStatus: 400,
          metadata: { reason: "not_active_or_expired", codeSuffix: voucherSuffix(code) },
        });
        return { error: "兑换码无效、已使用或已过期。" };
      }

      updated = await one(
        client,
        `UPDATE users
            SET balance_cents = balance_cents + $1, updated_at = now()
          WHERE id = $2
          RETURNING *`,
        [redeemed.amount_cents, auth.user.id],
      );
      await exec(
        client,
        `INSERT INTO balance_logs (user_id, delta_cents, balance_after_cents, reason, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          auth.user.id,
          redeemed.amount_cents,
          updated.balance_cents,
          "voucher_redeem",
          `充值券尾号 ${redeemed.code_suffix}`,
        ],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      targetUserId: auth.user.id,
      action: "voucher.redeem",
      resourceType: "voucher",
      resourceId: redeemed.id,
      status: "success",
      httpStatus: 200,
      metadata: {
        amount: centsToAmount(redeemed.amount_cents),
        codeSuffix: redeemed.code_suffix,
        batchId: redeemed.batch_id,
      },
    });

    return {
      ok: true,
      amount: centsToAmount(redeemed.amount_cents),
      balance: centsToAmount(updated.balance_cents),
      user: publicUser(updated),
    };
  });

  app.get("/api/referrals/me", async (request, reply) => {
    const auth = await requireUser(app.db, request, reply);
    if (auth.response) return auth.response;

    const user = await one(app.db, "SELECT * FROM users WHERE id = $1", [auth.user.id]);
    const invited = await one(
      app.db,
      "SELECT COUNT(*)::int AS total FROM users WHERE referred_by_user_id = $1",
      [auth.user.id],
    );
    const rewards = await one(
      app.db,
      "SELECT COALESCE(SUM(reward_cents), 0)::bigint AS total_cents, COUNT(*)::int AS total FROM referral_rewards WHERE referrer_user_id = $1",
      [auth.user.id],
    );
    const code = user.referral_code || "";
    return {
      referralCode: code,
      referralLink: `${siteOrigin(request, app.config)}/login?ref=${encodeURIComponent(code)}`,
      invitedCount: Number(invited?.total || 0),
      rewardedCount: Number(rewards?.total || 0),
      rewardTotal: centsToAmount(rewards?.total_cents || 0),
      rewardRate: 0.1,
    };
  });

  app.post("/api/admin/voucher-batches", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:voucher-create",
      extra: `admin:${auth.user.id}`,
      limit: 12,
      windowSeconds: 300,
      config: app.config,
    });
    if (limited) return limited;

    const body = request.body || {};
    const count = Math.min(200, Math.max(1, Number.parseInt(body.count, 10) || 1));
    const amountCents = amountToCents(body.amount);
    const note = String(body.note || "").slice(0, 200);
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (amountCents <= 0) {
      reply.code(400);
      return { error: "金额必须大于 0。" };
    }
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      reply.code(400);
      return { error: "过期时间不正确。" };
    }

    const id = batchId();
    const codes = [];
    while (codes.length < count) {
      const code = generateVoucherCode();
      try {
        await exec(
          app.db,
          `INSERT INTO balance_vouchers
             (batch_id, code_hash, code_suffix, amount_cents, note, expires_at, created_by_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, hashVoucherCode(code), voucherSuffix(code), amountCents, note, expiresAt, auth.user.id],
        );
        codes.push(code);
      } catch (error) {
        if (error.code !== "23505") throw error;
      }
    }

    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      action: "admin.voucher_batch.create",
      resourceType: "voucher_batch",
      resourceId: id,
      status: "success",
      httpStatus: 200,
      metadata: {
        count: codes.length,
        amount: centsToAmount(amountCents),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        note,
      },
    });

    return {
      batchId: id,
      amount: centsToAmount(amountCents),
      count: codes.length,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      codes,
    };
  });

  app.get("/api/admin/vouchers", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const status = String(request.query.status || "").trim().toLowerCase();
    const params = [];
    let where = "";
    if (status) {
      params.push(status);
      where = `WHERE v.status = $${params.length}`;
    }
    const count = await one(app.db, `SELECT COUNT(*)::int AS total FROM balance_vouchers v ${where}`, params);
    params.push(30, (page - 1) * 30);
    const rows = await many(
      app.db,
      `SELECT v.*, ru.email AS redeemed_by_email, cu.email AS created_by_email
         FROM balance_vouchers v
    LEFT JOIN users ru ON ru.id = v.redeemed_by_user_id
    LEFT JOIN users cu ON cu.id = v.created_by_user_id
        ${where}
        ORDER BY v.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { vouchers: rows.map(normalizeVoucher), total: Number(count?.total || 0), page };
  });

  app.post("/api/admin/vouchers/:id/void", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const id = cleanOrderId(request.params.id);
    if (!id) {
      reply.code(400);
      return { error: "兑换券不存在。" };
    }

    const row = await one(
      app.db,
      `UPDATE balance_vouchers
          SET status = 'void', voided_at = now()
        WHERE id = $1 AND status = 'active'
      RETURNING *`,
      [id],
    );
    if (!row) {
      reply.code(400);
      await writeAuditLog(app.db, request, {
        actorUserId: auth.user.id,
        action: "admin.voucher.void",
        resourceType: "voucher",
        resourceId: id,
        status: "failed",
        httpStatus: 400,
        metadata: { reason: "not_active_or_missing" },
      });
      return { error: "兑换券不可作废。" };
    }
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      action: "admin.voucher.void",
      resourceType: "voucher",
      resourceId: row.id,
      status: "success",
      httpStatus: 200,
      metadata: { codeSuffix: row.code_suffix, batchId: row.batch_id },
    });
    return { voucher: normalizeVoucher(row) };
  });
}

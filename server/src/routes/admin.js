import { publicUser, requireAdmin } from "../lib/auth.js";
import { amountToCents, centsToAmount } from "../lib/common.js";
import { exec, many, one } from "../lib/db.js";
import { enforceRateLimit, verifyTurnstile } from "../lib/security.js";
import { adminSettingsView, applySettingToConfig, normalizeAdminSetting, settingKeys } from "../lib/settings.js";

function pageParams(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

function adminUser(row) {
  return {
    ...publicUser(row),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function logType(row) {
  if (row.reason === "sms_order") return "order";
  if (row.reason === "refund") return "refund";
  if (row.reason === "voucher_redeem") return "voucher";
  if (row.reason === "referral_reward") return "referral";
  if (row.reason === "admin_adjust" && Number(row.delta_cents || 0) >= 0) return "topup";
  if (row.reason === "admin_adjust") return "deduct";
  return row.reason || "order";
}

function normalizeLog(row) {
  return {
    ...row,
    type: logType(row),
    delta_cents: Number(row.delta_cents || 0),
  };
}

export async function adminRoutes(app) {
  app.get("/api/admin/stats", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const users = await one(
      app.db,
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS new_today
         FROM users`,
    );
    const orders = await one(
      app.db,
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE lower(status) IN ('pending', 'received'))::int AS pending,
              COUNT(*) FILTER (WHERE lower(status) IN ('finished', 'completed'))::int AS completed,
              COUNT(*) FILTER (WHERE lower(status) IN ('banned', 'failed'))::int AS failed,
              COUNT(*) FILTER (WHERE lower(status) = 'cancelled')::int AS cancelled
         FROM sms_orders`,
    );
    const revenue = await one(
      app.db,
      `SELECT COALESCE(SUM(price_cents) FILTER (
                WHERE lower(status) IN ('finished', 'completed', 'received', 'pending')
              ), 0)::bigint AS total_cents
         FROM sms_orders`,
    );
    const pageviews = await many(
      app.db,
      `SELECT page, SUM(count)::bigint AS total
         FROM page_views
        WHERE view_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY page
        ORDER BY total DESC
        LIMIT 20`,
    );

    return { users, orders, revenue, pageviews };
  });

  app.get("/api/admin/users", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const { page, limit, offset } = pageParams(request.query);
    const q = String(request.query.q || "").trim().slice(0, 100);
    const params = [];
    let where = "";
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE email ILIKE $${params.length}`;
    }
    const count = await one(app.db, `SELECT COUNT(*)::int AS total FROM users ${where}`, params);
    params.push(limit, offset);
    const rows = await many(
      app.db,
      `SELECT id, email, role, balance_cents, created_at
         FROM users
        ${where}
        ORDER BY id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { users: rows.map(adminUser), total: Number(count?.total || 0), page };
  });

  app.post("/api/admin/credit", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:credit",
      extra: `admin:${auth.user.id}`,
      limit: 20,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) return limited;

    const body = request.body || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, body.turnstileToken);
    if (turnstile) return turnstile;

    const userId = Number(body.userId);
    const delta = amountToCents(body.amount);
    const note = String(body.note || "").slice(0, 200);
    if (!userId || !delta) {
      reply.code(400);
      return { error: "用户和金额不能为空。" };
    }

    const target = await one(app.db, "SELECT * FROM users WHERE id = $1", [userId]);
    if (!target) {
      reply.code(404);
      return { error: "用户不存在。" };
    }

    const updated = await one(
      app.db,
      `UPDATE users
          SET balance_cents = balance_cents + $1, updated_at = now()
        WHERE id = $2
        RETURNING *`,
      [delta, userId],
    );
    await exec(
      app.db,
      `INSERT INTO balance_logs (user_id, admin_id, delta_cents, balance_after_cents, reason, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, auth.user.id, delta, updated.balance_cents, "admin_adjust", note],
    );

    return { user: publicUser(updated), amount: centsToAmount(delta) };
  });

  app.get("/api/admin/orders", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const { page, limit, offset } = pageParams(request.query);
    const status = String(request.query.status || "").trim().toLowerCase();
    const params = [];
    let where = "";
    if (status) {
      params.push(status);
      where = `WHERE lower(o.status) = $${params.length}`;
    }
    const count = await one(
      app.db,
      `SELECT COUNT(*)::int AS total FROM sms_orders o ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await many(
      app.db,
      `SELECT o.*, u.email AS user_email
         FROM sms_orders o
         JOIN users u ON u.id = o.user_id
        ${where}
        ORDER BY o.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { orders: rows, total: Number(count?.total || 0), page };
  });

  app.get("/api/admin/logs", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const { page, limit, offset } = pageParams(request.query);
    const count = await one(app.db, "SELECT COUNT(*)::int AS total FROM balance_logs");
    const rows = await many(
      app.db,
      `SELECT l.*, u.email AS user_email, a.email AS admin_email
         FROM balance_logs l
         JOIN users u ON u.id = l.user_id
    LEFT JOIN users a ON a.id = l.admin_id
        ORDER BY l.id DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { logs: rows.map(normalizeLog), total: Number(count?.total || 0), page };
  });

  app.get("/api/admin/settings", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    return adminSettingsView(app.config);
  });

  app.post("/api/admin/settings", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:settings",
      extra: `admin:${auth.user.id}`,
      limit: 10,
      windowSeconds: 300,
      config: app.config,
    });
    if (limited) return limited;

    const input = request.body?.settings || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, request.body?.turnstileToken);
    if (turnstile) return turnstile;

    const allowed = settingKeys();
    for (const key of allowed) {
      if (input[key] === undefined) continue;
      const normalized = normalizeAdminSetting(key, input[key]);
      if (!normalized.ok) {
        reply.code(400);
        return { error: normalized.error };
      }
      if (normalized.skip) continue;
      applySettingToConfig(app.config, key, normalized.value);
      await exec(
        app.db,
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, normalized.value],
      );
    }

    return {
      ok: true,
      ...adminSettingsView(app.config),
    };
  });
}

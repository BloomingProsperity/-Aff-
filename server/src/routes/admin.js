import { normalizeUserStatus, publicUser, requireAdmin } from "../lib/auth.js";
import { writeAuditLog } from "../lib/audit.js";
import { amountToCents, centsToAmount } from "../lib/common.js";
import { exec, many, one } from "../lib/db.js";
import { enforceRateLimit } from "../lib/security.js";
import { adminSettingsView, applySettingToConfig, normalizeAdminSetting, settingKeys } from "../lib/settings.js";
import { smsProviderHealth } from "../lib/smsProviders.js";

function pageParams(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

function adminUser(row) {
  return {
    ...publicUser(row),
    status: normalizeUserStatus(row.status),
    status_note: row.status_note || "",
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

function normalizeAuditLog(row) {
  let metadata = {};
  try { metadata = JSON.parse(row.metadata_json || "{}"); } catch {}
  return {
    id: Number(row.id),
    actorUserId: row.actor_user_id ? Number(row.actor_user_id) : null,
    actorEmail: row.actor_email || "",
    targetUserId: row.target_user_id ? Number(row.target_user_id) : null,
    targetEmail: row.target_email || "",
    action: row.action,
    resourceType: row.resource_type || "",
    resourceId: row.resource_id || "",
    status: row.status,
    httpStatus: row.http_status ? Number(row.http_status) : null,
    ip: row.ip || "",
    userAgent: row.user_agent || "",
    method: row.method || "",
    path: row.path || "",
    metadata,
    createdAt: row.created_at,
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
    let risk = {
      failedActions24h: 0,
      failedLogins24h: 0,
      failedPurchases24h: 0,
      uniqueFailedIps24h: 0,
      riskyIps24h: 0,
      activeSmsOrders: 0,
      activeSmsUsers: 0,
    };
    try {
      risk = await one(
        app.db,
        `WITH recent AS (
           SELECT *
             FROM audit_logs
            WHERE created_at >= now() - INTERVAL '24 hours'
         ),
         ip_failures AS (
           SELECT ip, COUNT(*)::int AS total
             FROM recent
            WHERE status = 'failed' AND COALESCE(ip, '') <> ''
            GROUP BY ip
         )
         SELECT
           COUNT(*) FILTER (WHERE status = 'failed')::int AS "failedActions24h",
           COUNT(*) FILTER (WHERE status = 'failed' AND action = 'auth.login')::int AS "failedLogins24h",
           COUNT(*) FILTER (WHERE status = 'failed' AND action = 'sms.buy')::int AS "failedPurchases24h",
           COUNT(DISTINCT ip) FILTER (WHERE status = 'failed' AND COALESCE(ip, '') <> '')::int AS "uniqueFailedIps24h",
           (SELECT COUNT(*)::int FROM ip_failures WHERE total >= 10) AS "riskyIps24h",
           (SELECT COUNT(*)::int FROM sms_orders WHERE lower(status) IN ('pending', 'received')) AS "activeSmsOrders",
           (SELECT COUNT(DISTINCT user_id)::int FROM sms_orders WHERE lower(status) IN ('pending', 'received')) AS "activeSmsUsers"
          FROM recent`,
      );
    } catch (error) {
      if (error.code !== "42P01") throw error;
    }

    return { users, orders, revenue, pageviews, risk };
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
      `SELECT id, email, role, status, status_note, balance_cents, created_at
         FROM users
        ${where}
        ORDER BY id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { users: rows.map(adminUser), total: Number(count?.total || 0), page };
  });

  app.post("/api/admin/users/:id/status", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:user-status",
      extra: `admin:${auth.user.id}`,
      limit: 30,
      windowSeconds: 300,
      config: app.config,
    });
    if (limited) return limited;

    const userId = Number(request.params.id);
    const status = normalizeUserStatus(request.body?.status);
    const note = String(request.body?.note || "").slice(0, 200);
    if (!userId) {
      reply.code(400);
      return { error: "用户不存在。" };
    }
    if (userId === Number(auth.user.id) && status === "suspended") {
      reply.code(400);
      return { error: "不能暂停自己的管理员账号。" };
    }

    const updated = await one(
      app.db,
      `UPDATE users
          SET status = $1,
              status_note = $2,
              status_updated_at = now(),
              updated_at = now()
        WHERE id = $3
      RETURNING *`,
      [status, note, userId],
    );
    if (!updated) {
      reply.code(404);
      return { error: "用户不存在。" };
    }
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      targetUserId: userId,
      action: "admin.user.status",
      resourceType: "user",
      resourceId: userId,
      status: "success",
      httpStatus: 200,
      metadata: { status, note },
    });

    return { user: adminUser(updated) };
  });

  app.get("/api/admin/provider-health", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:provider-health",
      extra: `admin:${auth.user.id}`,
      limit: 30,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) return limited;

    const providers = await smsProviderHealth(app, { lowBalanceUsd: 1 });
    return { providers };
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
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      targetUserId: userId,
      action: "admin.balance.adjust",
      resourceType: "balance",
      resourceId: userId,
      status: "success",
      httpStatus: 200,
      metadata: { amount: centsToAmount(delta), note },
    });

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

  app.get("/api/admin/audit-logs", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const { page, limit, offset } = pageParams(request.query);
    const action = String(request.query.action || "").trim().slice(0, 80);
    const status = String(request.query.status || "").trim().slice(0, 24);
    const q = String(request.query.q || "").trim().slice(0, 120);
    const params = [];
    const filters = [];

    if (action) {
      params.push(action);
      filters.push(`l.action = $${params.length}`);
    }
    if (status) {
      params.push(status);
      filters.push(`l.status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      filters.push(`(l.ip ILIKE $${params.length} OR l.action ILIKE $${params.length} OR l.path ILIKE $${params.length} OR au.email ILIKE $${params.length} OR tu.email ILIKE $${params.length})`);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const count = await one(
      app.db,
      `SELECT COUNT(*)::int AS total
         FROM audit_logs l
    LEFT JOIN users au ON au.id = l.actor_user_id
    LEFT JOIN users tu ON tu.id = l.target_user_id
        ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await many(
      app.db,
      `SELECT l.*, au.email AS actor_email, tu.email AS target_email
         FROM audit_logs l
    LEFT JOIN users au ON au.id = l.actor_user_id
    LEFT JOIN users tu ON tu.id = l.target_user_id
        ${where}
        ORDER BY l.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { logs: rows.map(normalizeAuditLog), total: Number(count?.total || 0), page };
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

    const allowed = settingKeys();
    const changedKeys = [];
    for (const key of allowed) {
      if (input[key] === undefined) continue;
      const normalized = normalizeAdminSetting(key, input[key]);
      if (!normalized.ok) {
        reply.code(400);
        return { error: normalized.error };
      }
      if (normalized.skip) continue;
      applySettingToConfig(app.config, key, normalized.value);
      changedKeys.push(key);
      await exec(
        app.db,
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, normalized.value],
      );
    }
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      action: "admin.settings.update",
      resourceType: "settings",
      status: "success",
      httpStatus: 200,
      metadata: { changedKeys },
    });

    return {
      ok: true,
      ...adminSettingsView(app.config),
    };
  });
}

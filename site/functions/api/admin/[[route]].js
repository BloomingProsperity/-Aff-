import { publicUser, requireAdmin } from "../../_lib/auth.js";
import { amountToCents, centsToAmount, json, readJson, routeParts } from "../../_lib/common.js";
import { enforceRateLimit } from "../../_lib/security.js";

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const parts = routeParts(context);
  const action = parts[0] || "";

  if (!env.DB) return json({ error: "数据库未绑定。" }, { status: 503 });

  const auth = await requireAdmin(request, env);
  if (auth.response) return auth.response;

  if (method === "GET" && action === "users") {
    const rows = await env.DB.prepare(
      `SELECT id, email, role, balance_cents, created_at
         FROM users
        ORDER BY id DESC
        LIMIT 100`,
    ).all();
    return json({ users: (rows.results || []).map(publicUser) });
  }

  if (method === "POST" && action === "credit") {
    const limited = await enforceRateLimit(env, request, {
      scope: "admin:credit",
      extra: `admin:${auth.user.id}`,
      limit: 20,
      windowSeconds: 60,
    });
    if (limited) return limited;

    const body = await readJson(request);
    const userId = Number(body.userId);
    const delta = amountToCents(body.amount);
    const note = String(body.note || "").slice(0, 200);
    if (!userId || !delta) return json({ error: "用户和金额不能为空。" }, { status: 400 });

    const target = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    if (!target) return json({ error: "用户不存在。" }, { status: 404 });

    await env.DB.prepare(
      "UPDATE users SET balance_cents = balance_cents + ?, updated_at = datetime('now') WHERE id = ?",
    ).bind(delta, userId).run();
    const updated = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    await env.DB.prepare(
      `INSERT INTO balance_logs (user_id, admin_id, delta_cents, balance_after_cents, reason, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(userId, auth.user.id, delta, updated.balance_cents, "admin_adjust", note).run();

    return json({ user: publicUser(updated), amount: centsToAmount(delta) });
  }

  return json({ error: "未找到这个操作。" }, { status: 404 });
}

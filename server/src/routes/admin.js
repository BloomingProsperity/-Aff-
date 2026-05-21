import { publicUser, requireAdmin } from "../lib/auth.js";
import { amountToCents, centsToAmount } from "../lib/common.js";
import { exec, many, one } from "../lib/db.js";
import { enforceRateLimit } from "../lib/security.js";

export async function adminRoutes(app) {
  app.get("/api/admin/users", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply);
    if (auth.response) return auth.response;

    const rows = await many(
      app.db,
      `SELECT id, email, role, balance_cents, created_at
         FROM users
        ORDER BY id DESC
        LIMIT 100`,
    );
    return { users: rows.map(publicUser) };
  });

  app.post("/api/admin/credit", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:credit",
      extra: `admin:${auth.user.id}`,
      limit: 20,
      windowSeconds: 60,
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

    return { user: publicUser(updated), amount: centsToAmount(delta) };
  });
}

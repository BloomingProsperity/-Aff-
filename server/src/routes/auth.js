import { adminRoleForNewUser, clearSessionCookie, createSession, currentUser, destroySession, hashPassword, passwordNeedsRehash, publicUser, verifyPassword } from "../lib/auth.js";
import { cleanEmail, isAllowedAuthEmail } from "../lib/common.js";
import { exec, one } from "../lib/db.js";
import { enforceRateLimit, verifyTurnstile } from "../lib/security.js";

export async function authRoutes(app) {
  app.get("/api/auth/me", async request => {
    const user = await currentUser(app.db, request);
    return { user: publicUser(user) };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await destroySession(app.db, request);
    reply.header("set-cookie", clearSessionCookie(app.config));
    return { ok: true };
  });

  app.post("/api/auth/register", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "auth:register",
      limit: 5,
      windowSeconds: 3600,
      config: app.config,
    });
    if (limited) return limited;

    const body = request.body || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, body.turnstileToken);
    if (turnstile) return turnstile;

    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reply.code(400);
      return { error: "邮箱格式不正确。" };
    }
    if (!isAllowedAuthEmail(email)) {
      reply.code(400);
      return { error: "只支持 QQ、163、Gmail 邮箱。" };
    }
    if (password.length < 8) {
      reply.code(400);
      return { error: "密码至少 8 位。" };
    }

    const hashed = hashPassword(password);
    const role = await adminRoleForNewUser(app.db, app.config, email);
    try {
      const result = await one(
        app.db,
        `INSERT INTO users (email, password_hash, password_salt, role)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [email, hashed.hash, hashed.salt, role],
      );
      const session = await createSession(app.db, result.id, app.config);
      reply.header("set-cookie", session.header);
      return { user: publicUser(result) };
    } catch (error) {
      if (error.code === "23505") {
        reply.code(409);
        return { error: "这个邮箱已经注册。" };
      }
      throw error;
    }
  });

  app.post("/api/auth/login", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "auth:login",
      limit: 8,
      windowSeconds: 600,
      config: app.config,
    });
    if (limited) return limited;

    const body = request.body || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, body.turnstileToken);
    if (turnstile) return turnstile;

    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    if (!isAllowedAuthEmail(email)) {
      reply.code(400);
      return { error: "只支持 QQ、163、Gmail 邮箱。" };
    }

    const accountLimited = await enforceRateLimit(app.db, request, reply, {
      scope: "auth:login-email",
      extra: email,
      limit: 20,
      windowSeconds: 3600,
      config: app.config,
    });
    if (accountLimited) return accountLimited;

    const user = await one(app.db, "SELECT * FROM users WHERE email = $1", [email]);
    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      reply.code(401);
      return { error: "邮箱或密码不正确。" };
    }

    if (passwordNeedsRehash(password, user.password_salt, user.password_hash)) {
      const hashed = hashPassword(password);
      await exec(
        app.db,
        "UPDATE users SET password_hash = $1, password_salt = $2, updated_at = now() WHERE id = $3",
        [hashed.hash, hashed.salt, user.id],
      );
    }

    await exec(app.db, "DELETE FROM sessions WHERE user_id = $1 AND expires_at <= now()", [user.id]);
    const session = await createSession(app.db, user.id, app.config);
    reply.header("set-cookie", session.header);
    return { user: publicUser(user) };
  });
}

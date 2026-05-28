import { adminRoleForNewUser, clearSessionCookie, createSession, currentUser, destroySession, hashPassword, passwordNeedsRehash, publicUser, validatePasswordInput, verifyPassword } from "../lib/auth.js";
import { writeAuditLog } from "../lib/audit.js";
import { cleanEmail, isAllowedAuthEmail } from "../lib/common.js";
import { exec, one } from "../lib/db.js";
import { findReferrerByCode, generateReferralCode, normalizeReferralCode } from "../lib/referrals.js";
import { enforceRateLimit, verifyTurnstile } from "../lib/security.js";

export async function authRoutes(app) {
  app.get("/api/auth/me", async request => {
    const user = await currentUser(app.db, request);
    return { user: publicUser(user) };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const user = await currentUser(app.db, request);
    await destroySession(app.db, request);
    reply.header("set-cookie", clearSessionCookie(app.config));
    await writeAuditLog(app.db, request, {
      actorUserId: user?.id || null,
      action: "auth.logout",
      resourceType: "session",
      status: "success",
      httpStatus: 200,
    });
    return { ok: true };
  });

  app.post("/api/auth/register", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "auth:register",
      limit: 20,
      windowSeconds: 3600,
      config: app.config,
    });
    if (limited) {
      await writeAuditLog(app.db, request, {
        action: "auth.register",
        status: "failed",
        httpStatus: reply.statusCode || 429,
        metadata: { reason: "rate_limited", email: cleanEmail(request.body?.email) },
      });
      return limited;
    }

    const body = request.body || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, body.turnstileToken);
    if (turnstile) {
      await writeAuditLog(app.db, request, {
        action: "auth.register",
        status: "failed",
        httpStatus: reply.statusCode || 400,
        metadata: { reason: "turnstile_failed" },
      });
      return turnstile;
    }

    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    const passwordInput = validatePasswordInput(password);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reply.code(400);
      await writeAuditLog(app.db, request, {
        action: "auth.register",
        status: "failed",
        httpStatus: 400,
        metadata: { email, reason: "invalid_email" },
      });
      return { error: "邮箱格式不正确。" };
    }
    if (!isAllowedAuthEmail(email)) {
      reply.code(400);
      await writeAuditLog(app.db, request, {
        action: "auth.register",
        status: "failed",
        httpStatus: 400,
        metadata: { email, reason: "unsupported_email_domain" },
      });
      return { error: "只支持 QQ、163、Gmail 邮箱。" };
    }
    if (!passwordInput.ok) {
      reply.code(400);
      await writeAuditLog(app.db, request, {
        action: "auth.register",
        status: "failed",
        httpStatus: 400,
        metadata: { email, reason: passwordInput.reason },
      });
      return { error: passwordInput.error };
    }
    const hashed = hashPassword(passwordInput.value);
    const role = await adminRoleForNewUser(app.db, app.config, email);
    const referrer = await findReferrerByCode(app.db, normalizeReferralCode(body.ref || body.referralCode), email);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const result = await one(
          app.db,
          `INSERT INTO users
             (email, password_hash, password_salt, role, referral_code, referred_by_user_id, referred_at)
           VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6::bigint IS NULL THEN NULL ELSE now() END)
           RETURNING *`,
          [email, hashed.hash, hashed.salt, role, generateReferralCode(), referrer?.id || null],
        );
        const session = await createSession(app.db, result.id, app.config);
        reply.header("set-cookie", session.header);
        await writeAuditLog(app.db, request, {
          actorUserId: result.id,
          targetUserId: result.id,
          action: "auth.register",
          resourceType: "user",
          resourceId: result.id,
          status: "success",
          httpStatus: 200,
          metadata: { email, role, hasReferrer: Boolean(referrer?.id) },
        });
        return { user: publicUser(result) };
      } catch (error) {
        if (error.code === "23505" && String(error.constraint || "").includes("referral_code")) continue;
        if (error.code === "23505") {
          reply.code(409);
          await writeAuditLog(app.db, request, {
            action: "auth.register",
            status: "failed",
            httpStatus: 409,
            metadata: { email, reason: "email_exists" },
          });
          return { error: "这个邮箱已经注册。" };
        }
        throw error;
      }
    }
    reply.code(500);
    await writeAuditLog(app.db, request, {
      action: "auth.register",
      status: "failed",
      httpStatus: 500,
      metadata: { email, reason: "referral_code_collision" },
    });
    return { error: "注册失败，请稍后重试。" };
  });

  app.post("/api/auth/login", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "auth:login",
      limit: 30,
      windowSeconds: 600,
      config: app.config,
    });
    if (limited) {
      await writeAuditLog(app.db, request, {
        action: "auth.login",
        status: "failed",
        httpStatus: reply.statusCode || 429,
        metadata: { reason: "rate_limited", email: cleanEmail(request.body?.email) },
      });
      return limited;
    }

    const body = request.body || {};
    const turnstile = await verifyTurnstile(app.config, request, reply, body.turnstileToken);
    if (turnstile) {
      await writeAuditLog(app.db, request, {
        action: "auth.login",
        status: "failed",
        httpStatus: reply.statusCode || 400,
        metadata: { reason: "turnstile_failed" },
      });
      return turnstile;
    }

    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    const passwordInput = validatePasswordInput(password);
    if (!isAllowedAuthEmail(email)) {
      reply.code(400);
      await writeAuditLog(app.db, request, {
        action: "auth.login",
        status: "failed",
        httpStatus: 400,
        metadata: { email, reason: "unsupported_email_domain" },
      });
      return { error: "只支持 QQ、163、Gmail 邮箱。" };
    }

    if (!passwordInput.ok) {
      reply.code(400);
      await writeAuditLog(app.db, request, {
        action: "auth.login",
        status: "failed",
        httpStatus: 400,
        metadata: { email, reason: passwordInput.reason },
      });
      return { error: passwordInput.error };
    }

    const accountLimited = await enforceRateLimit(app.db, request, reply, {
      scope: "auth:login-email",
      extra: email,
      identity: "extra",
      limit: 60,
      windowSeconds: 3600,
      config: app.config,
    });
    if (accountLimited) {
      await writeAuditLog(app.db, request, {
        action: "auth.login",
        status: "failed",
        httpStatus: reply.statusCode || 429,
        metadata: { reason: "account_rate_limited", email },
      });
      return accountLimited;
    }

    const user = await one(app.db, "SELECT * FROM users WHERE email = $1", [email]);
    if (!user || !verifyPassword(passwordInput.value, user.password_salt, user.password_hash)) {
      reply.code(401);
      await writeAuditLog(app.db, request, {
        actorUserId: user?.id || null,
        targetUserId: user?.id || null,
        action: "auth.login",
        resourceType: "user",
        resourceId: user?.id || "",
        status: "failed",
        httpStatus: 401,
        metadata: { email, reason: "bad_credentials" },
      });
      return { error: "邮箱或密码不正确。" };
    }

    if (passwordNeedsRehash(passwordInput.value, user.password_salt, user.password_hash)) {
      const hashed = hashPassword(passwordInput.value);
      await exec(
        app.db,
        "UPDATE users SET password_hash = $1, password_salt = $2, updated_at = now() WHERE id = $3",
        [hashed.hash, hashed.salt, user.id],
      );
    }

    await exec(app.db, "DELETE FROM sessions WHERE user_id = $1 AND expires_at <= now()", [user.id]);
    const session = await createSession(app.db, user.id, app.config);
    reply.header("set-cookie", session.header);
    await writeAuditLog(app.db, request, {
      actorUserId: user.id,
      targetUserId: user.id,
      action: "auth.login",
      resourceType: "user",
      resourceId: user.id,
      status: "success",
      httpStatus: 200,
      metadata: { email },
    });
    return { user: publicUser(user) };
  });
}

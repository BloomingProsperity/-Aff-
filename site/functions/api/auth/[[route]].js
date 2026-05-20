import { adminRoleForNewUser, createSession, currentUser, destroySession, hashPassword, publicUser, verifyPassword } from "../../_lib/auth.js";
import { cleanEmail, clearSessionCookie, isAllowedAuthEmail, json, readJson, routeParts } from "../../_lib/common.js";
import { enforceRateLimit, verifyTurnstile } from "../../_lib/security.js";

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const parts = routeParts(context);
  const action = parts[0] || "";

  if (!env.DB) return json({ error: "数据库未绑定。" }, { status: 503 });

  if (method === "GET" && action === "me") {
    const user = await currentUser(request, env);
    return json({ user: publicUser(user) });
  }

  if (method === "POST" && action === "logout") {
    await destroySession(env.DB, request);
    return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(request.url) } });
  }

  if (method === "POST" && action === "register") {
    const limited = await enforceRateLimit(env, request, { scope: "auth:register", limit: 5, windowSeconds: 3600 });
    if (limited) return limited;

    const body = await readJson(request);
    const turnstile = await verifyTurnstile(env, request, body.turnstileToken);
    if (turnstile) return turnstile;

    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "邮箱格式不正确。" }, { status: 400 });
    }
    if (!isAllowedAuthEmail(email)) {
      return json({ error: "只支持 QQ、163、Gmail 邮箱。" }, { status: 400 });
    }
    if (password.length < 8) {
      return json({ error: "密码至少 8 位。" }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const role = await adminRoleForNewUser(env.DB, env, email);
    try {
      const result = await env.DB.prepare(
        "INSERT INTO users (email, password_hash, password_salt, role) VALUES (?, ?, ?, ?)",
      ).bind(email, hashed.hash, hashed.salt, role).run();
      const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(result.meta.last_row_id).first();
      const session = await createSession(env.DB, user.id, request.url);
      return json({ user: publicUser(user) }, { headers: { "set-cookie": session.header } });
    } catch {
      return json({ error: "这个邮箱已经注册。" }, { status: 409 });
    }
  }

  if (method === "POST" && action === "login") {
    const limited = await enforceRateLimit(env, request, { scope: "auth:login", limit: 8, windowSeconds: 600 });
    if (limited) return limited;

    const body = await readJson(request);
    const turnstile = await verifyTurnstile(env, request, body.turnstileToken);
    if (turnstile) return turnstile;

    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    if (!isAllowedAuthEmail(email)) {
      return json({ error: "只支持 QQ、163、Gmail 邮箱。" }, { status: 400 });
    }
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
      return json({ error: "邮箱或密码不正确。" }, { status: 401 });
    }
    const session = await createSession(env.DB, user.id, request.url);
    return json({ user: publicUser(user) }, { headers: { "set-cookie": session.header } });
  }

  return json({ error: "未找到这个操作。" }, { status: 404 });
}

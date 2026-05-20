import { addDaysIso, cleanEmail, cookieValue, json, sessionCookie } from "./common.js";

const textEncoder = new TextEncoder();

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    balance: Number((Number(user.balance_cents || 0) / 100).toFixed(2)),
    createdAt: user.created_at,
  };
}

export async function hashPassword(password, saltBase64) {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    key,
    256,
  );
  return {
    salt: bytesToBase64(salt),
    hash: bytesToBase64(new Uint8Array(bits)),
  };
}

export async function verifyPassword(password, salt, expectedHash) {
  const next = await hashPassword(password, salt);
  return next.hash === expectedHash;
}

export async function createSession(db, userId, url) {
  const raw = crypto.randomUUID() + "." + bytesToBase64(crypto.getRandomValues(new Uint8Array(24)));
  const tokenHash = await sha256(raw);
  const expiresAt = addDaysIso(14);
  await db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).bind(tokenHash, userId, expiresAt).run();
  return {
    token: raw,
    header: sessionCookie(raw, url, 60 * 60 * 24 * 14),
  };
}

export async function destroySession(db, request) {
  const token = cookieValue(request, "hkai_session");
  if (!token) return;
  const tokenHash = await sha256(token);
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function currentUser(request, env) {
  if (!env.DB) return null;
  const token = cookieValue(request, "hkai_session");
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT users.*
       FROM sessions
       JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > datetime('now')`,
  ).bind(tokenHash).first();
  return row || null;
}

export async function requireUser(request, env) {
  const user = await currentUser(request, env);
  if (!user) return { response: json({ error: "请先登录。" }, { status: 401 }) };
  return { user };
}

export async function requireAdmin(request, env) {
  const found = await requireUser(request, env);
  if (found.response) return found;
  if (found.user.role !== "admin") {
    return { response: json({ error: "没有管理员权限。" }, { status: 403 }) };
  }
  return found;
}

export async function adminRoleForNewUser(db, env, email) {
  const normalized = cleanEmail(email);
  if (env.ADMIN_EMAIL && cleanEmail(env.ADMIN_EMAIL) === normalized) return "admin";
  if (env.FIVESIM_API_KEY || env.FIVESIM_TOKEN) return "user";
  const count = await db.prepare("SELECT COUNT(*) AS count FROM users").first();
  return Number(count?.count || 0) === 0 ? "admin" : "user";
}

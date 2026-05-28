import { createHash, pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { cleanEmail, centsToAmount, toIso } from "./common.js";
import { exec, one } from "./db.js";

const SESSION_DAYS = 14;
const CURRENT_PASSWORD_ITERATIONS = 600000;
const LEGACY_PASSWORD_ITERATIONS = [120000];
const USER_STATUSES = new Set(["active", "suspended"]);

function sha256Base64(value) {
  return createHash("sha256").update(value).digest("base64url");
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: Number(user.id),
    email: user.email,
    role: user.role,
    status: normalizeUserStatus(user.status),
    statusNote: user.status_note || "",
    balance: centsToAmount(user.balance_cents),
    referralCode: user.referral_code || "",
    createdAt: toIso(user.created_at),
  };
}

export function normalizeUserStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return USER_STATUSES.has(status) ? status : "active";
}

export function canUsePaidFeatures(user) {
  return normalizeUserStatus(user?.status) === "active";
}

export function hashPassword(password, saltBase64, iterations = CURRENT_PASSWORD_ITERATIONS) {
  const salt = saltBase64 ? Buffer.from(saltBase64, "base64") : randomBytes(16);
  const safeIterations = Math.max(120000, Number(iterations || CURRENT_PASSWORD_ITERATIONS));
  const hash = pbkdf2Sync(String(password), salt, safeIterations, 32, "sha256");
  return {
    salt: salt.toString("base64"),
    hash: hash.toString("base64"),
  };
}

function hashMatches(password, salt, expectedHash, iterations) {
  const next = hashPassword(password, salt, iterations).hash;
  const left = Buffer.from(next);
  const right = Buffer.from(String(expectedHash || ""));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyPassword(password, salt, expectedHash) {
  return hashMatches(password, salt, expectedHash, CURRENT_PASSWORD_ITERATIONS)
    || LEGACY_PASSWORD_ITERATIONS.some(iterations => hashMatches(password, salt, expectedHash, iterations));
}

export function passwordNeedsRehash(password, salt, expectedHash) {
  return !hashMatches(password, salt, expectedHash, CURRENT_PASSWORD_ITERATIONS)
    && LEGACY_PASSWORD_ITERATIONS.some(iterations => hashMatches(password, salt, expectedHash, iterations));
}

export function sessionCookie(value, config, maxAgeSeconds) {
  const pieces = [
    `hkai_session=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    "Priority=High",
  ];
  if (config.cookieSecure) pieces.push("Secure");
  if (config.cookieDomain) pieces.push(`Domain=${config.cookieDomain}`);
  return pieces.join("; ");
}

export function clearSessionCookie(config) {
  return sessionCookie("", config, 0);
}

export async function createSession(db, userId, config) {
  const raw = `${randomUUID()}.${randomBytes(24).toString("base64url")}`;
  const tokenHash = sha256Base64(raw);
  await exec(
    db,
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + ($3 || ' days')::interval)",
    [tokenHash, userId, SESSION_DAYS],
  );
  return {
    token: raw,
    header: sessionCookie(raw, config, 60 * 60 * 24 * SESSION_DAYS),
  };
}

export async function destroySession(db, request) {
  const token = request.cookies?.hkai_session || "";
  if (!token) return;
  await exec(db, "DELETE FROM sessions WHERE token_hash = $1", [sha256Base64(token)]);
}

export async function destroyUserSessions(db, userId) {
  const result = await exec(db, "DELETE FROM sessions WHERE user_id = $1", [Number(userId)]);
  return Number(result.rowCount || 0);
}

export async function currentUser(db, request) {
  const token = request.cookies?.hkai_session || "";
  if (!token) return null;
  return one(
    db,
    `SELECT users.*
       FROM sessions
       JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > now()`,
    [sha256Base64(token)],
  );
}

export async function requireUser(db, request, reply) {
  const user = await currentUser(db, request);
  if (!user) {
    reply.code(401);
    return { response: { error: "请先登录。" } };
  }
  return { user };
}

export async function requirePaidUser(db, request, reply) {
  const auth = await requireUser(db, request, reply);
  if (auth.response) return auth;
  if (!canUsePaidFeatures(auth.user)) {
    reply.code(403);
    return { response: { error: "账号已暂停，请联系管理员。" }, user: auth.user, blockedReason: "account_suspended" };
  }
  return auth;
}

export async function requireAdmin(db, request, reply, config = request.server?.config || request.config || {}) {
  const auth = await requireUser(db, request, reply);
  if (auth.response) return auth;
  if (!isConfiguredAdmin(auth.user, config)) {
    reply.code(403);
    return { response: { error: "没有管理员权限。" } };
  }
  return auth;
}

export function isConfiguredAdmin(user, config) {
  const configuredEmail = cleanEmail(config?.adminEmail || "");
  return Boolean(
    user
    && user.role === "admin"
    && configuredEmail
    && cleanEmail(user.email) === configuredEmail,
  );
}

export async function adminRoleForNewUser(db, config, email) {
  const normalized = cleanEmail(email);
  if (config.adminEmail && cleanEmail(config.adminEmail) === normalized) return "admin";
  return "user";
}

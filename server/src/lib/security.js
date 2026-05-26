import { createHash, randomUUID } from "node:crypto";
import { exec, one } from "./db.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function header(request, name) {
  const headers = request.headers || {};
  if (typeof headers.get === "function") return headers.get(name) || "";
  return headers[name] || headers[name.toLowerCase()] || "";
}

function isLocalAddress(value) {
  const ip = String(value || "").trim().toLowerCase();
  return ip === "127.0.0.1"
    || ip === "::1"
    || ip.startsWith("::ffff:127.")
    || ip.startsWith("10.")
    || ip.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

function forwardedIp(request, config = {}) {
  const remote = request.ip || request.socket?.remoteAddress || "";
  const trustProxy = Boolean(config.trustProxyHeaders) || isLocalAddress(remote);
  if (!trustProxy) return "";
  return header(request, "cf-connecting-ip")
    || header(request, "x-real-ip")
    || String(header(request, "x-forwarded-for") || "").split(",")[0].trim();
}

function clientIdentity(request, config = {}) {
  const ip = forwardedIp(request, config)
    || request.ip
    || request.socket?.remoteAddress
    || "unknown-ip";
  const ua = header(request, "user-agent") || "unknown-agent";
  return `${ip}|${ua}`;
}

function normalizeOrigin(value) {
  if (!value) return "";
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return "";
  }
}

export function isAllowedRequestOrigin(origin, config = {}) {
  const value = normalizeOrigin(origin);
  if (!value) return true;
  const allowed = new Set((config.corsOrigins || []).map(normalizeOrigin).filter(Boolean));
  return allowed.has(value);
}

export function isMutatingRequest(request) {
  return !SAFE_METHODS.has(String(request.method || "GET").toUpperCase());
}

export async function rateLimitKey(request, scope, extra = "", config = {}) {
  const fingerprint = sha256Hex(`${clientIdentity(request, config)}|${extra}`);
  return `${scope}:${fingerprint}`;
}

export async function enforceRateLimit(db, request, reply, options) {
  const scope = options.scope || "global";
  const limit = Math.max(1, Number(options.limit || 60));
  const windowSeconds = Math.max(1, Number(options.windowSeconds || 60));
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  const key = await rateLimitKey(request, scope, options.extra || "", options.config || {});

  const row = await one(
    db,
    `INSERT INTO rate_limits (key, count, reset_at, updated_at)
     VALUES ($1, 1, $2, now())
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.reset_at <= $3 THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at <= $3 THEN $2 ELSE rate_limits.reset_at END,
       updated_at = now()
     RETURNING count, reset_at`,
    [key, resetAt, now],
  );

  if (Number(row?.count || 0) > limit) {
    const retryAfter = Math.max(1, Number(row.reset_at || resetAt) - now);
    reply.header("retry-after", String(retryAfter));
    reply.code(429);
    return { error: "操作太频繁，请稍后再试。" };
  }

  return null;
}

export function turnstileEnabled(config) {
  return Boolean(String(config.turnstileSecretKey || "").trim());
}

export async function verifyTurnstile(config, request, reply, token) {
  const secret = String(config.turnstileSecretKey || "").trim();
  if (!secret) return null;

  const responseToken = String(token || "").trim();
  if (!responseToken) {
    reply.code(400);
    return { error: "请先完成人机验证。" };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", responseToken);
  const remoteIp = request.headers["cf-connecting-ip"]
    || String(request.headers["x-forwarded-for"] || "").split(",")[0].trim()
    || request.ip;
  if (remoteIp) formData.append("remoteip", remoteIp);
  formData.append("idempotency_key", randomUUID());

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      reply.code(400);
      return { error: "验证失败，请刷新后重试。" };
    }
  } catch {
    reply.code(503);
    return { error: "验证失败，请稍后重试。" };
  }

  return null;
}

export async function cleanupRateLimits(db) {
  await exec(db, "DELETE FROM rate_limits WHERE reset_at < $1", [Math.floor(Date.now() / 1000) - 3600]);
}

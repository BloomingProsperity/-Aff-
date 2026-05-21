import { createHash, randomUUID } from "node:crypto";
import { exec, one } from "./db.js";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function clientIdentity(request) {
  const forwarded = request.headers["cf-connecting-ip"]
    || String(request.headers["x-forwarded-for"] || "").split(",")[0].trim()
    || request.ip
    || "unknown-ip";
  const ua = request.headers["user-agent"] || "unknown-agent";
  return `${forwarded}|${ua}`;
}

export async function rateLimitKey(request, scope, extra = "") {
  const fingerprint = sha256Hex(`${clientIdentity(request)}|${extra}`);
  return `${scope}:${fingerprint}`;
}

export async function enforceRateLimit(db, request, reply, options) {
  const scope = options.scope || "global";
  const limit = Math.max(1, Number(options.limit || 60));
  const windowSeconds = Math.max(1, Number(options.windowSeconds || 60));
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  const key = await rateLimitKey(request, scope, options.extra || "");

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

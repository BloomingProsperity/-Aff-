import { json } from "./common.js";

const textEncoder = new TextEncoder();
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function clientIdentity(request) {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown-ip";
  const ua = request.headers.get("user-agent") || "unknown-agent";
  return `${ip}|${ua}`;
}

export function turnstileSiteKey(env) {
  return String(env.TURNSTILE_SITE_KEY || env.TURNSTILE_SITEKEY || "").trim();
}

function turnstileSecret(env) {
  return String(env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET || "").trim();
}

export function turnstileEnabled(env) {
  return Boolean(turnstileSecret(env));
}

export async function verifyTurnstile(env, request, token) {
  const secret = turnstileSecret(env);
  if (!secret) return null;

  const responseToken = String(token || "").trim();
  if (!responseToken) {
    return json({ error: "请先完成人机验证。" }, { status: 400 });
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", responseToken);
  const remoteIp = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (remoteIp) formData.append("remoteip", remoteIp);
  formData.append("idempotency_key", crypto.randomUUID());

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      return json({ error: "验证失败，请刷新后重试。" }, { status: 400 });
    }
  } catch {
    return json({ error: "验证失败，请稍后重试。" }, { status: 503 });
  }

  return null;
}

export async function rateLimitKey(request, scope, extra = "") {
  const fingerprint = await sha256Hex(`${clientIdentity(request)}|${extra}`);
  return `${scope}:${fingerprint}`;
}

export async function enforceRateLimit(env, request, options) {
  if (!env.DB) return null;
  const scope = options.scope || "global";
  const limit = Math.max(1, Number(options.limit || 60));
  const windowSeconds = Math.max(1, Number(options.windowSeconds || 60));
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  const key = await rateLimitKey(request, scope, options.extra || "");

  const row = await env.DB.prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?").bind(key).first();
  if (!row || Number(row.reset_at || 0) <= now) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO rate_limits (key, count, reset_at, updated_at)
       VALUES (?, 1, ?, datetime('now'))`,
    ).bind(key, resetAt).run();
    return null;
  }

  if (Number(row.count || 0) >= limit) {
    const retryAfter = Math.max(1, Number(row.reset_at || resetAt) - now);
    return json(
      { error: "操作太频繁，请稍后再试。" },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  await env.DB.prepare(
    "UPDATE rate_limits SET count = count + 1, updated_at = datetime('now') WHERE key = ?",
  ).bind(key).run();
  return null;
}

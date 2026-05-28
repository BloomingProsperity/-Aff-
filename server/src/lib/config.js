function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function normalizeOrigin(value) {
  if (!value) return "";
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return "";
  }
}

function normalizeHost(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw.includes("://") ? raw : `http://${raw}`);
    return url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  } catch {
    return "";
  }
}

function parseHosts(value) {
  return String(value || "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);
}

export const DEFAULT_ADMIN_EMAIL = "huakaifugui2.0@gmail.com";

export function loadConfig(env = process.env) {
  const publicUrl = env.PUBLIC_URL || "";
  const explicitCorsOrigins = String(env.CORS_ORIGIN || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
  const corsOrigins = [...new Set([
    ...explicitCorsOrigins,
    normalizeOrigin(publicUrl),
    "https://hkai.shop",
    "https://www.hkai.shop",
    "http://localhost:4321",
    "http://localhost:4323",
    "http://localhost:4325",
    "http://localhost:4326",
    "http://127.0.0.1:4321",
    "http://127.0.0.1:4323",
    "http://127.0.0.1:4325",
    "http://127.0.0.1:4326",
  ].filter(Boolean))];
  const cookieSecureDefault = String(env.NODE_ENV || "").toLowerCase() === "production"
    || normalizeOrigin(publicUrl).startsWith("https://");
  const allowedHosts = [...new Set([
    ...parseHosts(env.API_ALLOWED_HOSTS || env.ALLOWED_HOSTS),
    normalizeHost(env.API_PUBLIC_URL || env.API_ORIGIN),
    "api.hkai.shop",
    "localhost",
    "127.0.0.1",
    "::1",
  ].filter(Boolean))];

  return {
    nodeEnv: env.NODE_ENV || "development",
    port: Number(env.PORT || 8788),
    host: env.HOST || "127.0.0.1",
    databaseUrl: env.DATABASE_URL || "",
    publicUrl,
    siteUrl: env.SITE_URL || env.PUBLIC_SITE_URL || "https://hkai.shop",
    corsOrigins,
    allowedHosts,
    cookieDomain: env.COOKIE_DOMAIN || "",
    cookieSecure: parseBool(env.COOKIE_SECURE, cookieSecureDefault),
    trustProxyHeaders: parseBool(env.TRUST_PROXY_HEADERS, false),
    adminEmail: env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
    fivesimApiKey: env.FIVESIM_API_KEY || env.FIVESIM_TOKEN || "",
    smspoolApiKey: env.SMSPOOL_API_KEY || env.SMSPOOL_TOKEN || "",
    beeSmsApiToken: env.BEESMS_API_TOKEN || env.BEE_SMS_API_TOKEN || env.BEESMS_TOKEN || "",
    smsUsdCnyRate: Number(env.SMS_USD_CNY_RATE || env.SMS_PRICE_RATE || 7.2),
    smsMarginCny: Number(env.SMS_MARGIN_CNY || env.SMS_PRICE_FIXED || 10),
    smsActiveOrderLimit: Number(env.SMS_ACTIVE_ORDER_LIMIT || 3),
    smsBuyCooldownSeconds: Number(env.SMS_BUY_COOLDOWN_SECONDS || 10),
    smsOrderTimeoutMinutes: Number(env.SMS_ORDER_TIMEOUT_MINUTES || 30),
    smsMaintenanceIntervalSeconds: Number(env.SMS_MAINTENANCE_INTERVAL_SECONDS || 60),
    smsMaintenanceBatchLimit: Number(env.SMS_MAINTENANCE_BATCH_LIMIT || 100),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || env.TURNSTILE_SITEKEY || "",
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET || "",
  };
}

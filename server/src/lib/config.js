export function loadConfig(env = process.env) {
  const corsOrigins = String(env.CORS_ORIGIN || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

  return {
    nodeEnv: env.NODE_ENV || "development",
    port: Number(env.PORT || 8788),
    databaseUrl: env.DATABASE_URL || "",
    publicUrl: env.PUBLIC_URL || "",
    corsOrigins,
    cookieDomain: env.COOKIE_DOMAIN || "",
    cookieSecure: String(env.COOKIE_SECURE || "").toLowerCase() === "true",
    adminEmail: env.ADMIN_EMAIL || "",
    fivesimApiKey: env.FIVESIM_API_KEY || env.FIVESIM_TOKEN || "",
    smsUsdCnyRate: Number(env.SMS_USD_CNY_RATE || env.SMS_PRICE_RATE || 7.2),
    smsMarginCny: Number(env.SMS_MARGIN_CNY || env.SMS_PRICE_FIXED || 10),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || env.TURNSTILE_SITEKEY || "",
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET || "",
  };
}

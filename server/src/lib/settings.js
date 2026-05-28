import { many } from "./db.js";

const SETTING_DEFS = {
  SMS_USD_CNY_RATE: { prop: "smsUsdCnyRate", type: "number", min: 1, max: 20 },
  SMS_MARGIN_CNY: { prop: "smsMarginCny", type: "number", min: 0.01, max: 500 },
  SMS_ACTIVE_ORDER_LIMIT: { prop: "smsActiveOrderLimit", type: "positive_int", min: 1, max: 20 },
  SMS_BUY_COOLDOWN_SECONDS: { prop: "smsBuyCooldownSeconds", type: "non_negative_int", min: 0, max: 3600 },
  SMS_ORDER_TIMEOUT_MINUTES: { prop: "smsOrderTimeoutMinutes", type: "positive_int", min: 5, max: 180 },
  SMS_MAINTENANCE_INTERVAL_SECONDS: { prop: "smsMaintenanceIntervalSeconds", type: "positive_int", min: 10, max: 3600 },
  SMS_MAINTENANCE_BATCH_LIMIT: { prop: "smsMaintenanceBatchLimit", type: "positive_int", min: 1, max: 500 },
  FIVESIM_API_KEY: { prop: "fivesimApiKey", type: "secret", maxLength: 4096 },
  SMSPOOL_API_KEY: { prop: "smspoolApiKey", type: "secret", maxLength: 4096 },
  BEESMS_API_TOKEN: { prop: "beeSmsApiToken", type: "secret", maxLength: 4096 },
  TURNSTILE_SITE_KEY: { prop: "turnstileSiteKey", type: "text", skipBlank: true, maxLength: 200 },
  TURNSTILE_SECRET_KEY: { prop: "turnstileSecretKey", type: "secret", maxLength: 4096 },
};

const SECRET_KEYS = ["FIVESIM_API_KEY", "SMSPOOL_API_KEY", "BEESMS_API_TOKEN", "TURNSTILE_SECRET_KEY"];

function maskSecret(value) {
  const raw = String(value || "");
  if (!raw) return "";
  return `••••${raw.slice(-4)}`;
}

function turnstileDiagnostics(config) {
  const siteKey = String(config.turnstileSiteKey || "");
  const secret = String(config.turnstileSecretKey || "");
  const lastResult = config.turnstileLastResult || null;
  return {
    enabled: Boolean(secret.trim()),
    siteKeySuffix: siteKey ? siteKey.slice(-6) : "",
    lastResult: lastResult ? {
      success: Boolean(lastResult.success),
      errorCodes: Array.isArray(lastResult.errorCodes)
        ? lastResult.errorCodes.map(code => String(code || "")).filter(Boolean).slice(0, 10)
        : [],
      hostname: String(lastResult.hostname || ""),
      checkedAt: String(lastResult.checkedAt || ""),
    } : null,
  };
}

export function normalizeAdminSetting(key, value) {
  const def = SETTING_DEFS[key];
  if (!def) return { ok: false, error: "设置项不存在。" };
  const raw = String(value ?? "").trim();

  if ((def.type === "secret" || def.skipBlank) && !raw) {
    return { ok: true, skip: true };
  }
  if (def.maxLength && raw.length > def.maxLength) {
    return { ok: false, error: "设置内容过长。" };
  }

  if (def.type === "number") {
    const n = Number(raw);
    const min = Number(def.min ?? 0);
    const max = Number(def.max ?? Number.POSITIVE_INFINITY);
    if (!Number.isFinite(n) || n < min || n > max) return { ok: false, error: "设置数值不正确。" };
    return { ok: true, value: String(n) };
  }

  if (def.type === "positive_int" || def.type === "non_negative_int") {
    const n = Number.parseInt(raw, 10);
    const min = Number(def.min ?? (def.type === "positive_int" ? 1 : 0));
    const max = Number(def.max ?? Number.POSITIVE_INFINITY);
    if (!Number.isFinite(n) || String(n) !== raw || n < min || n > max) {
      return { ok: false, error: "设置数值不正确。" };
    }
    return { ok: true, value: String(n) };
  }

  return { ok: true, value: raw };
}

export function applySettingToConfig(config, key, value) {
  const def = SETTING_DEFS[key];
  if (!def) return false;
  const normalized = normalizeAdminSetting(key, value);
  if (!normalized.ok || normalized.skip) return false;

  if (def.type === "number" || def.type === "positive_int" || def.type === "non_negative_int") {
    config[def.prop] = Number(normalized.value);
    return true;
  }

  config[def.prop] = normalized.value;
  return true;
}

export function adminSettingsView(config) {
  return {
    settings: {
      SMS_USD_CNY_RATE: String(config.smsUsdCnyRate || 7.2),
      SMS_MARGIN_CNY: String(config.smsMarginCny || 10),
      SMS_ACTIVE_ORDER_LIMIT: String(config.smsActiveOrderLimit ?? 3),
      SMS_BUY_COOLDOWN_SECONDS: String(config.smsBuyCooldownSeconds ?? 10),
      SMS_ORDER_TIMEOUT_MINUTES: String(config.smsOrderTimeoutMinutes ?? 30),
      SMS_MAINTENANCE_INTERVAL_SECONDS: String(config.smsMaintenanceIntervalSeconds ?? 60),
      SMS_MAINTENANCE_BATCH_LIMIT: String(config.smsMaintenanceBatchLimit ?? 100),
      TURNSTILE_SITE_KEY: String(config.turnstileSiteKey || ""),
    },
    secrets: Object.fromEntries(SECRET_KEYS.map(key => {
      const value = String(config[SETTING_DEFS[key].prop] || "");
      return [key, { configured: Boolean(value), masked: maskSecret(value) }];
    })),
    diagnostics: {
      turnstile: turnstileDiagnostics(config),
    },
  };
}

export function settingKeys() {
  return Object.keys(SETTING_DEFS);
}

export async function applyRuntimeSettings(db, config) {
  try {
    const rows = await many(db, "SELECT key, value FROM app_settings");
    for (const row of rows) applySettingToConfig(config, row.key, row.value);
  } catch (error) {
    if (error.code !== "42P01") throw error;
  }
}

import assert from "node:assert/strict";
import test from "node:test";
import { adminSettingsView, applySettingToConfig, normalizeAdminSetting } from "../src/lib/settings.js";

test("admin settings view never exposes secret values", () => {
  const view = adminSettingsView({
    smsUsdCnyRate: 7.2,
    smsMarginCny: 10,
    smsActiveOrderLimit: 4,
    smsBuyCooldownSeconds: 15,
    smsOrderTimeoutMinutes: 45,
    smsMaintenanceIntervalSeconds: 60,
    smsMaintenanceBatchLimit: 100,
    fivesimApiKey: "abc123456789",
    smspoolApiKey: "pool123456789",
    beeSmsApiToken: "bee123456789",
    turnstileSiteKey: "0x4AAAA-site",
    turnstileSecretKey: "secret-987654",
  });

  assert.equal(view.settings.SMS_USD_CNY_RATE, "7.2");
  assert.equal(view.settings.SMS_MARGIN_CNY, "10");
  assert.equal(view.settings.SMS_ACTIVE_ORDER_LIMIT, "4");
  assert.equal(view.settings.SMS_BUY_COOLDOWN_SECONDS, "15");
  assert.equal(view.settings.SMS_ORDER_TIMEOUT_MINUTES, "45");
  assert.equal(view.settings.SMS_MAINTENANCE_INTERVAL_SECONDS, "60");
  assert.equal(view.settings.SMS_MAINTENANCE_BATCH_LIMIT, "100");
  assert.equal(view.settings.TURNSTILE_SITE_KEY, "0x4AAAA-site");
  assert.equal("FIVESIM_API_KEY" in view.settings, false);
  assert.equal("SMSPOOL_API_KEY" in view.settings, false);
  assert.equal("BEESMS_API_TOKEN" in view.settings, false);
  assert.equal("TURNSTILE_SECRET_KEY" in view.settings, false);
  assert.equal(view.secrets.FIVESIM_API_KEY.configured, true);
  assert.equal(view.secrets.SMSPOOL_API_KEY.configured, true);
  assert.equal(view.secrets.BEESMS_API_TOKEN.configured, true);
  assert.equal(view.secrets.TURNSTILE_SECRET_KEY.configured, true);
  assert.equal(JSON.stringify(view).includes("abc123456789"), false);
  assert.equal(JSON.stringify(view).includes("secret-987654"), false);
});

test("admin settings view exposes only safe turnstile diagnostics", () => {
  const view = adminSettingsView({
    turnstileSiteKey: "0x4AAAAAADWtP4gvLTD6rL6R",
    turnstileSecretKey: "secret-987654",
    turnstileLastResult: {
      success: false,
      errorCodes: ["timeout-or-duplicate"],
      hostname: "hkai.shop",
      checkedAt: "2026-05-27T09:00:00.000Z",
    },
  });

  assert.equal(view.diagnostics.turnstile.enabled, true);
  assert.equal(view.diagnostics.turnstile.siteKeySuffix, "D6rL6R");
  assert.deepEqual(view.diagnostics.turnstile.lastResult.errorCodes, ["timeout-or-duplicate"]);
  assert.equal(JSON.stringify(view).includes("secret-987654"), false);
});

test("runtime key settings can be applied without restart", () => {
  const config = {};

  assert.equal(applySettingToConfig(config, "SMS_ACTIVE_ORDER_LIMIT", "5"), true);
  assert.equal(applySettingToConfig(config, "SMS_BUY_COOLDOWN_SECONDS", "20"), true);
  assert.equal(applySettingToConfig(config, "SMS_ORDER_TIMEOUT_MINUTES", "45"), true);
  assert.equal(applySettingToConfig(config, "SMS_MAINTENANCE_INTERVAL_SECONDS", "90"), true);
  assert.equal(applySettingToConfig(config, "SMS_MAINTENANCE_BATCH_LIMIT", "120"), true);
  assert.equal(applySettingToConfig(config, "FIVESIM_API_KEY", "new-5sim-key"), true);
  assert.equal(applySettingToConfig(config, "SMSPOOL_API_KEY", "new-pool-key"), true);
  assert.equal(applySettingToConfig(config, "BEESMS_API_TOKEN", "new-bee-token"), true);
  assert.equal(applySettingToConfig(config, "TURNSTILE_SITE_KEY", "site-key"), true);
  assert.equal(applySettingToConfig(config, "TURNSTILE_SECRET_KEY", "secret-key"), true);

  assert.equal(config.smsActiveOrderLimit, 5);
  assert.equal(config.smsBuyCooldownSeconds, 20);
  assert.equal(config.smsOrderTimeoutMinutes, 45);
  assert.equal(config.smsMaintenanceIntervalSeconds, 90);
  assert.equal(config.smsMaintenanceBatchLimit, 120);
  assert.equal(config.fivesimApiKey, "new-5sim-key");
  assert.equal(config.smspoolApiKey, "new-pool-key");
  assert.equal(config.beeSmsApiToken, "new-bee-token");
  assert.equal(config.turnstileSiteKey, "site-key");
  assert.equal(config.turnstileSecretKey, "secret-key");
});

test("blank secret updates are skipped instead of wiping keys", () => {
  const normalized = normalizeAdminSetting("FIVESIM_API_KEY", "   ");

  assert.equal(normalized.ok, true);
  assert.equal(normalized.skip, true);
});

test("numeric settings reject unsafe values", () => {
  assert.equal(normalizeAdminSetting("SMS_USD_CNY_RATE", "-1").ok, false);
  assert.equal(normalizeAdminSetting("SMS_ACTIVE_ORDER_LIMIT", "0").ok, false);
  assert.equal(normalizeAdminSetting("SMS_BUY_COOLDOWN_SECONDS", "-1").ok, false);
  assert.equal(normalizeAdminSetting("SMS_ORDER_TIMEOUT_MINUTES", "0").ok, false);
  assert.equal(normalizeAdminSetting("SMS_MAINTENANCE_INTERVAL_SECONDS", "0").ok, false);
  assert.equal(normalizeAdminSetting("SMS_MAINTENANCE_BATCH_LIMIT", "0").ok, false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { adminSettingsView, applySettingToConfig, normalizeAdminSetting } from "../src/lib/settings.js";

test("admin settings view never exposes secret values", () => {
  const view = adminSettingsView({
    smsUsdCnyRate: 7.2,
    smsMarginCny: 10,
    fivesimApiKey: "abc123456789",
    turnstileSiteKey: "0x4AAAA-site",
    turnstileSecretKey: "secret-987654",
  });

  assert.equal(view.settings.SMS_USD_CNY_RATE, "7.2");
  assert.equal(view.settings.SMS_MARGIN_CNY, "10");
  assert.equal(view.settings.TURNSTILE_SITE_KEY, "0x4AAAA-site");
  assert.equal("FIVESIM_API_KEY" in view.settings, false);
  assert.equal("TURNSTILE_SECRET_KEY" in view.settings, false);
  assert.deepEqual(view.secrets.FIVESIM_API_KEY, { configured: true, masked: "••••6789" });
  assert.deepEqual(view.secrets.TURNSTILE_SECRET_KEY, { configured: true, masked: "••••7654" });
});

test("runtime key settings can be applied without restart", () => {
  const config = {};

  assert.equal(applySettingToConfig(config, "FIVESIM_API_KEY", "new-5sim-key"), true);
  assert.equal(applySettingToConfig(config, "TURNSTILE_SITE_KEY", "site-key"), true);
  assert.equal(applySettingToConfig(config, "TURNSTILE_SECRET_KEY", "secret-key"), true);

  assert.equal(config.fivesimApiKey, "new-5sim-key");
  assert.equal(config.turnstileSiteKey, "site-key");
  assert.equal(config.turnstileSecretKey, "secret-key");
});

test("blank secret updates are skipped instead of wiping keys", () => {
  const normalized = normalizeAdminSetting("FIVESIM_API_KEY", "   ");

  assert.equal(normalized.ok, true);
  assert.equal(normalized.skip, true);
});

test("numeric settings reject unsafe values", () => {
  assert.deepEqual(normalizeAdminSetting("SMS_USD_CNY_RATE", "-1"), {
    ok: false,
    error: "设置数值不正确。",
  });
});

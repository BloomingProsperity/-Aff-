import assert from "node:assert/strict";
import test from "node:test";
import {
  activeSmsOrderStatuses,
  cooldownSecondsLeft,
  smsRiskSettings,
} from "../src/lib/smsRisk.js";

test("sms risk settings keep safe defaults and bounded values", () => {
  assert.deepEqual(smsRiskSettings({}), {
    activeOrderLimit: 3,
    buyCooldownSeconds: 10,
  });
  assert.deepEqual(smsRiskSettings({
    smsActiveOrderLimit: 99,
    smsBuyCooldownSeconds: -3,
  }), {
    activeOrderLimit: 20,
    buyCooldownSeconds: 0,
  });
});

test("active sms order statuses are normalized for database checks", () => {
  assert.deepEqual(activeSmsOrderStatuses(), ["pending", "received"]);
});

test("cooldownSecondsLeft returns remaining whole seconds", () => {
  const now = new Date("2026-05-28T12:00:10Z");

  assert.equal(cooldownSecondsLeft("2026-05-28T12:00:05Z", now, { smsBuyCooldownSeconds: 10 }), 5);
  assert.equal(cooldownSecondsLeft("2026-05-28T11:59:50Z", now, { smsBuyCooldownSeconds: 10 }), 0);
  assert.equal(cooldownSecondsLeft("", now, { smsBuyCooldownSeconds: 10 }), 0);
});

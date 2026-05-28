import assert from "node:assert/strict";
import test from "node:test";
import {
  activeSmsOrderStatuses,
  cooldownSecondsLeft,
  isStaleActiveSmsOrder,
  smsRiskSettings,
} from "../src/lib/smsRisk.js";

test("sms risk settings keep safe defaults and bounded values", () => {
  assert.deepEqual(smsRiskSettings({}), {
    activeOrderLimit: 3,
    buyCooldownSeconds: 10,
    orderTimeoutMinutes: 30,
  });
  assert.deepEqual(smsRiskSettings({
    smsActiveOrderLimit: 99,
    smsBuyCooldownSeconds: -3,
    smsOrderTimeoutMinutes: 999,
  }), {
    activeOrderLimit: 20,
    buyCooldownSeconds: 0,
    orderTimeoutMinutes: 180,
  });
});

test("active sms order statuses are normalized for database checks", () => {
  assert.deepEqual(activeSmsOrderStatuses(), ["pending", "received", "processing", "activating", "resend"]);
});

test("cooldownSecondsLeft returns remaining whole seconds", () => {
  const now = new Date("2026-05-28T12:00:10Z");

  assert.equal(cooldownSecondsLeft("2026-05-28T12:00:05Z", now, { smsBuyCooldownSeconds: 10 }), 5);
  assert.equal(cooldownSecondsLeft("2026-05-28T11:59:50Z", now, { smsBuyCooldownSeconds: 10 }), 0);
  assert.equal(cooldownSecondsLeft("", now, { smsBuyCooldownSeconds: 10 }), 0);
});

test("stale active sms orders expire only after the configured timeout", () => {
  const now = new Date("2026-05-28T12:40:00Z");

  assert.equal(isStaleActiveSmsOrder({
    status: "received",
    created_at: "2026-05-28T12:00:00Z",
  }, now, { smsOrderTimeoutMinutes: 30 }), true);
  assert.equal(isStaleActiveSmsOrder({
    status: "pending",
    updated_at: "2026-05-28T12:20:01Z",
  }, now, { smsOrderTimeoutMinutes: 20 }), false);
  assert.equal(isStaleActiveSmsOrder({
    status: "completed",
    created_at: "2026-05-28T12:00:00Z",
  }, now, { smsOrderTimeoutMinutes: 30 }), false);
  assert.equal(isStaleActiveSmsOrder({
    status: "received",
  }, now, { smsOrderTimeoutMinutes: 30 }), false);
});

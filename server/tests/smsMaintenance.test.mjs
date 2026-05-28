import assert from "node:assert/strict";
import test from "node:test";
import { smsMaintenanceSettings, shouldRunSmsMaintenance } from "../src/lib/smsMaintenance.js";

test("sms maintenance settings keep bounded operational defaults", () => {
  assert.deepEqual(smsMaintenanceSettings({}), {
    intervalSeconds: 60,
    batchLimit: 100,
  });
  assert.deepEqual(smsMaintenanceSettings({
    smsMaintenanceIntervalSeconds: 3,
    smsMaintenanceBatchLimit: 5000,
  }), {
    intervalSeconds: 10,
    batchLimit: 500,
  });
});

test("sms maintenance does not start another run while one is active", () => {
  assert.equal(shouldRunSmsMaintenance({ running: true }), false);
  assert.equal(shouldRunSmsMaintenance({ running: false }), true);
});

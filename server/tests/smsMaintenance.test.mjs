import assert from "node:assert/strict";
import test from "node:test";
import { expireStaleSmsOrders, smsMaintenanceSettings, shouldRunSmsMaintenance } from "../src/lib/smsMaintenance.js";

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

test("sms maintenance timeout is based on order creation time, not polling updates", async () => {
  const calls = [];
  const app = {
    config: { smsOrderTimeoutMinutes: 30, smsMaintenanceBatchLimit: 20 },
    db: {
      async query(sql, params = []) {
        calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
        return { rows: [] };
      },
    },
  };

  await expireStaleSmsOrders(app, { limit: 10 });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /created_at <= now\(\) - \(\$2::int \* INTERVAL '1 minute'\)/);
  assert.equal(calls[0].sql.includes("COALESCE(updated_at, created_at)"), false);
});

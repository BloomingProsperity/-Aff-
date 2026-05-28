import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

test("admin can manually run log retention cleanup with audit trail", async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) {
        return {
          rows: [{
            id: 1,
            email: "huakaifugui2.0@gmail.com",
            role: "admin",
            status: "active",
            balance_cents: 0,
          }],
        };
      }
      if (sql.includes("INSERT INTO rate_limits")) return { rows: [{ count: 1, reset_at: 1_800_000_000 }] };
      if (sql.includes("DELETE FROM audit_logs")) return { rows: [], rowCount: 4 };
      if (sql.includes("DELETE FROM sms_order_events")) return { rows: [], rowCount: 6 };
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/log-retention/run",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {},
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().summary, { auditLogs: 4, smsOrderEvents: 6, days: 30 });

    const rateLimit = calls.find(call => call.sql.includes("INSERT INTO rate_limits"));
    const auditDelete = calls.find(call => call.sql.includes("DELETE FROM audit_logs"));
    const smsDelete = calls.find(call => call.sql.includes("DELETE FROM sms_order_events"));
    const auditWrite = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));

    assert.ok(rateLimit);
    assert.ok(auditDelete);
    assert.ok(smsDelete);
    assert.ok(auditWrite);
    assert.ok(calls.indexOf(rateLimit) < calls.indexOf(auditDelete));
    assert.equal(auditWrite.params[2], "admin.log_retention.run");
    assert.equal(auditWrite.params[5], "success");
    assert.match(auditWrite.params[11], /"auditLogs":4/);
    assert.match(auditWrite.params[11], /"smsOrderEvents":6/);
  } finally {
    await app.close();
  }
});

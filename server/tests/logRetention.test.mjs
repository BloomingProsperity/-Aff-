import assert from "node:assert/strict";
import test from "node:test";
import { cleanupOldLogs, logRetentionStatus, LOG_RETENTION_DAYS } from "../src/lib/logRetention.js";

test("log retention removes operational logs older than 30 days", async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
      if (sql.includes("audit_logs")) return { rowCount: 3, rows: [] };
      if (sql.includes("sms_order_events")) return { rowCount: 5, rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };

  const summary = await cleanupOldLogs(db);

  assert.equal(LOG_RETENTION_DAYS, 30);
  assert.deepEqual(summary, { auditLogs: 3, smsOrderEvents: 5, days: 30 });
  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /DELETE FROM audit_logs/);
  assert.match(calls[1].sql, /DELETE FROM sms_order_events/);
  assert.deepEqual(calls[0].params, [30]);
  assert.deepEqual(calls[1].params, [30]);
  assert.equal(JSON.stringify(calls).includes("balance_logs"), false);
});

test("log retention status is safe for admin overview", () => {
  const status = logRetentionStatus({
    lastRunAt: new Date("2026-05-28T01:02:03.000Z"),
    lastSummary: { auditLogs: 7, smsOrderEvents: 9, days: 30 },
    lastError: new Error("database unavailable"),
  });

  assert.deepEqual(status, {
    enabled: true,
    days: 30,
    tables: ["audit_logs", "sms_order_events"],
    lastRunAt: "2026-05-28T01:02:03.000Z",
    lastDeleted: { auditLogs: 7, smsOrderEvents: 9 },
    lastError: "database unavailable",
  });
});

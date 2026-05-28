import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanupOperationalData,
  housekeepingStatus,
  PAGE_VIEW_RETENTION_DAYS,
} from "../src/lib/housekeeping.js";

test("housekeeping removes expired temporary database rows without touching business ledgers", async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
      if (sql.includes("DELETE FROM sessions")) return { rowCount: 2, rows: [] };
      if (sql.includes("DELETE FROM rate_limits")) return { rowCount: 3, rows: [] };
      if (sql.includes("DELETE FROM product_cache")) return { rowCount: 4, rows: [] };
      if (sql.includes("DELETE FROM operation_locks")) return { rowCount: 5, rows: [] };
      if (sql.includes("DELETE FROM page_views")) return { rowCount: 6, rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };

  const summary = await cleanupOperationalData(db, { nowEpoch: 1_800_000 });

  assert.deepEqual(summary, { sessions: 2, rateLimits: 3, productCache: 4, operationLocks: 5, pageViews: 6 });
  assert.equal(calls.length, 5);
  assert.match(calls[0].sql, /DELETE FROM sessions WHERE expires_at <= now\(\)/);
  assert.match(calls[1].sql, /DELETE FROM rate_limits WHERE reset_at < \$1/);
  assert.match(calls[2].sql, /DELETE FROM product_cache WHERE expires_at < \$1/);
  assert.match(calls[3].sql, /DELETE FROM operation_locks WHERE expires_at <= now\(\)/);
  assert.match(calls[4].sql, /DELETE FROM page_views WHERE view_date < CURRENT_DATE - \(\$1::int \* INTERVAL '1 day'\)/);
  assert.deepEqual(calls[1].params, [1_800_000 - 3600]);
  assert.deepEqual(calls[2].params, [1_800_000 - 86400]);
  assert.deepEqual(calls[4].params, [90]);
  assert.equal(JSON.stringify(calls).includes("balance_logs"), false);
  assert.equal(JSON.stringify(calls).includes("sms_orders"), false);
});

test("housekeeping status is safe for admin overview", () => {
  const status = housekeepingStatus({
    lastRunAt: new Date("2026-05-28T02:03:04.000Z"),
    lastSummary: { sessions: 2, rateLimits: 3, productCache: 4, operationLocks: 5, pageViews: 6 },
    lastError: new Error("temporary cleanup failed"),
  });

  assert.equal(PAGE_VIEW_RETENTION_DAYS, 90);
  assert.deepEqual(status, {
    enabled: true,
    pageViewRetentionDays: 90,
    lastRunAt: "2026-05-28T02:03:04.000Z",
    lastDeleted: {
      sessions: 2,
      rateLimits: 3,
      productCache: 4,
      operationLocks: 5,
      pageViews: 6,
    },
    lastError: "temporary cleanup failed",
  });
});

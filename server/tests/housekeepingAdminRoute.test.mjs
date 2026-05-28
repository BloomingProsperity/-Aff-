import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

test("admin can manually run temporary data cleanup with audit trail", async () => {
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
      if (sql.includes("DELETE FROM sessions WHERE expires_at <= now()")) return { rows: [], rowCount: 2 };
      if (sql.includes("DELETE FROM rate_limits WHERE reset_at <")) return { rows: [], rowCount: 3 };
      if (sql.includes("DELETE FROM product_cache")) return { rows: [], rowCount: 4 };
      if (sql.includes("DELETE FROM operation_locks")) return { rows: [], rowCount: 5 };
      if (sql.includes("DELETE FROM page_views")) return { rows: [], rowCount: 6 };
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
      url: "/api/admin/housekeeping/run",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {},
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().summary, {
      sessions: 2,
      rateLimits: 3,
      productCache: 4,
      operationLocks: 5,
      pageViews: 6,
    });
    assert.equal(response.json().housekeeping.pageViewRetentionDays, 90);

    const rateLimit = calls.find(call => call.sql.includes("INSERT INTO rate_limits"));
    const sessionDelete = calls.find(call => call.sql.includes("DELETE FROM sessions WHERE expires_at <= now()"));
    const auditWrite = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));

    assert.ok(rateLimit);
    assert.ok(sessionDelete);
    assert.ok(auditWrite);
    assert.ok(calls.indexOf(rateLimit) < calls.indexOf(sessionDelete));
    assert.equal(auditWrite.params[2], "admin.housekeeping.run");
    assert.equal(auditWrite.params[5], "success");
    assert.match(auditWrite.params[11], /"pageViews":6/);
  } finally {
    await app.close();
  }
});

test("rate-limited temporary data cleanup is audited before deletion", async () => {
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
      if (sql.includes("INSERT INTO rate_limits")) {
        return { rows: [{ count: 6, reset_at: Math.floor(Date.now() / 1000) + 60 }] };
      }
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("DELETE FROM sessions") || sql.includes("DELETE FROM page_views")) {
        throw new Error("rate-limited cleanup reached deletion");
      }
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
      url: "/api/admin/housekeeping/run",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {},
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("DELETE FROM sessions")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[2], "admin.housekeeping.run");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

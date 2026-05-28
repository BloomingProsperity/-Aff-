import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

function adminUser() {
  return {
    id: 1,
    email: "huakaifugui2.0@gmail.com",
    role: "admin",
    status: "active",
    balance_cents: 0,
  };
}

function rateLimitedAdminDb(calls) {
  return {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      calls.push({ sql: normalized, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) return { rows: [adminUser()] };
      if (sql.includes("INSERT INTO rate_limits")) return { rows: [{ count: 99, reset_at: 1_800_000_600 }] };
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("FROM sms_orders") || sql.includes("UPDATE sms_orders")) {
        throw new Error("rate-limited order close reached order data");
      }
      if (sql.includes("UPDATE balance_vouchers")) {
        throw new Error("rate-limited voucher void reached voucher mutation");
      }
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
}

test("rate-limited admin order close is audited before touching order data", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/orders/123/close",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: { note: "close duplicate" },
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("FROM sms_orders") || call.sql.includes("UPDATE sms_orders")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 1);
    assert.equal(audit.params[2], "admin.sms_order.close");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

test("rate-limited voucher void is audited before touching voucher rows", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/vouchers/123/void",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {},
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("UPDATE balance_vouchers")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 1);
    assert.equal(audit.params[2], "admin.voucher.void");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

function activeUser() {
  return {
    id: 7,
    email: "buyer@gmail.com",
    role: "user",
    status: "active",
    balance_cents: 1000,
  };
}

function activeOrder() {
  return {
    id: 55,
    user_id: 7,
    fivesim_id: "123456",
    provider: "5sim",
    country: "usa",
    operator: "any",
    product: "telegram",
    phone: "+15550001111",
    price_cents: 1200,
    status: "received",
    sms_json: "[]",
    raw_json: "{}",
  };
}

function rateLimitedSmsDb(calls) {
  return {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      calls.push({ sql: normalized, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) return { rows: [activeUser()] };
      if (sql.includes("SELECT * FROM sms_orders WHERE id = $1 AND user_id = $2")) return { rows: [activeOrder()] };
      if (sql.includes("INSERT INTO rate_limits")) return { rows: [{ count: 99, reset_at: 1_800_000_600 }] };
      if (sql.includes("INSERT INTO sms_order_events")) return { rows: [], rowCount: 1 };
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("UPDATE sms_orders")) throw new Error("rate-limited sms action reached order update");
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
}

test("rate-limited sms check is audited and recorded before provider check", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedSmsDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
    fivesimClient: async () => {
      throw new Error("rate-limited sms check reached provider");
    },
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/sms/check/55",
      cookies: { hkai_session: "session-token" },
      headers: { origin: "https://hkai.shop" },
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("UPDATE sms_orders")), false);
    const event = calls.find(call => call.sql.includes("INSERT INTO sms_order_events"));
    assert.ok(event);
    assert.equal(event.params[0], 55);
    assert.equal(event.params[3], "provider.check_rate_limited");
    assert.equal(event.params[4], "failed");
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 7);
    assert.equal(audit.params[1], 7);
    assert.equal(audit.params[2], "sms.check");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

test("rate-limited sms order action is audited and recorded before provider mutation", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedSmsDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
    fivesimClient: async () => {
      throw new Error("rate-limited sms action reached provider");
    },
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/sms/cancel",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: { id: 55 },
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("UPDATE sms_orders")), false);
    const event = calls.find(call => call.sql.includes("INSERT INTO sms_order_events"));
    assert.ok(event);
    assert.equal(event.params[0], 55);
    assert.equal(event.params[3], "provider.cancel_rate_limited");
    assert.equal(event.params[4], "failed");
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 7);
    assert.equal(audit.params[1], 7);
    assert.equal(audit.params[2], "sms.cancel");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

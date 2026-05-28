import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

test("sms buy compensates reserved balance and supplier order after post-purchase failures", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");
  const start = source.indexOf('app.post("/api/sms/buy"');
  const end = source.indexOf('app.get("/api/sms/check/:id"', start);
  const body = source.slice(start, end);

  assert.match(body, /catch\s*\(\s*error\s*\)/);
  assert.match(body, /!localOrderCommitted\s*&&\s*bought\s*&&\s*chosen/);
  assert.match(body, /changeSmsProviderOrder[\s\S]*"cancel"/);
  assert.match(body, /!localOrderCommitted\s*&&\s*reservedCents\s*>\s*0[\s\S]*refundBalance/);
  assert.match(body, /throw\s+error/);
});

test("sms buy writes local order and balance ledger in one database transaction", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");
  const routeStart = source.indexOf('app.post("/api/sms/buy"');
  const start = source.indexOf("const client = await app.db.connect()", routeStart);
  const end = source.indexOf('await writeSmsOrderEvent(app.db, {', start);
  const body = source.slice(start, end);

  assert.match(body, /const\s+client\s*=\s*await\s+app\.db\.connect\(\)/);
  assert.match(body, /client\.query\("BEGIN"\)/);
  assert.match(body, /INSERT INTO sms_orders/);
  assert.match(body, /INSERT INTO balance_logs/);
  assert.match(body, /client\.query\("COMMIT"\)/);
  assert.match(body, /client\.query\("ROLLBACK"\)/);
  assert.match(body, /client\.release\(\)/);
});

test("sms buy success event logging is best-effort after the local order is committed", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");
  const routeStart = source.indexOf('app.post("/api/sms/buy"');
  const start = source.indexOf("localOrderCommitted = true", routeStart);
  const end = source.indexOf("return { order:", start);
  const body = source.slice(start, end);

  assert.match(body, /try\s*{[\s\S]*writeSmsOrderEvent/);
  assert.match(body, /catch\s*\(\s*eventError\s*\)/);
  assert.match(body, /sms buy success event log failed/);
});

test("sms buy logs an internal event when upstream price jumps above fixed price", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");
  const routeStart = source.indexOf('app.post("/api/sms/buy"');
  const start = source.indexOf("if (!supplierCostAllowed(app.config, bought.cost || chosen.cost || 0))", routeStart);
  const end = source.indexOf("const realQuote = quoteCharge", start);
  const body = source.slice(start, end);

  assert.match(body, /writeSmsOrderEvent/);
  assert.match(body, /provider\.price_over_fixed/);
  assert.match(body, /publicCode:\s*"supplier_price_over_fixed_price"/);
  assert.match(body, /changeSmsProviderOrder[\s\S]*"cancel"/);
  assert.match(body, /refundBalance/);
});

test("sms buy rate limit writes an audit log before returning", async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) {
        return { rows: [{ id: 7, email: "buyer@gmail.com", role: "user", status: "active", balance_cents: 5000 }] };
      }
      if (sql.includes("INTO rate_limits")) return { rows: [{ count: 99, reset_at: Math.floor(Date.now() / 1000) + 60 }] };
      if (sql.includes("INTO audit_logs")) return { rows: [], rowCount: 1 };
      throw new Error(`Rate-limited sms buy reached unexpected SQL: ${sql}`);
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
      url: "/api/sms/buy",
      headers: {
        host: "api.hkai.shop",
        cookie: "hkai_session=session-token",
      },
      payload: { country: "usa", operator: "any", product: "telegram" },
    });

    assert.equal(response.statusCode, 429);
    const audit = calls.find(call => call.sql.includes("INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 7);
    assert.equal(audit.params[2], "sms.buy");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

test("sms buy rejects malformed lookup before lock or provider work", async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) {
        return { rows: [{ id: 7, email: "buyer@gmail.com", role: "user", status: "active", balance_cents: 5000 }] };
      }
      if (sql.includes("INTO rate_limits")) return { rows: [{ count: 1, reset_at: Math.floor(Date.now() / 1000) + 60 }] };
      if (sql.includes("INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("operation_locks") || sql.includes("UPDATE users") || sql.includes("sms_orders")) {
        throw new Error(`Malformed sms buy reached protected SQL: ${sql}`);
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop", FIVESIM_API_KEY: "token" }),
    fivesimClient: async () => {
      throw new Error("Malformed sms buy reached provider");
    },
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/sms/buy",
      headers: {
        host: "api.hkai.shop",
        cookie: "hkai_session=session-token",
      },
      payload: { country: "usa", operator: "any", product: "tele gram" },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(calls.some(call => call.sql.includes("operation_locks")), false);
    const audit = calls.find(call => call.sql.includes("INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[2], "sms.buy");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 400);
    assert.match(audit.params[11], /invalid_lookup/);
  } finally {
    await app.close();
  }
});

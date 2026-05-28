import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

test("admin settings update validates the whole batch before writing", async () => {
  const calls = [];
  const config = loadConfig({
    PUBLIC_URL: "https://hkai.shop",
    SMS_USD_CNY_RATE: "7.2",
  });
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
      if (sql.includes("INSERT INTO app_settings")) throw new Error("invalid batch wrote app_settings");
      if (sql.includes("INSERT INTO audit_logs")) throw new Error("invalid batch wrote audit log");
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const app = await buildApp({ db, logger: false, config });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/settings",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {
        settings: {
          SMS_USD_CNY_RATE: "7.3",
          SMS_ACTIVE_ORDER_LIMIT: "999",
        },
      },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(config.smsUsdCnyRate, 7.2);
    assert.equal(calls.some(call => call.sql.includes("INSERT INTO app_settings")), false);
    assert.equal(calls.some(call => call.sql.includes("INSERT INTO audit_logs")), false);
  } finally {
    await app.close();
  }
});

test("admin settings database failure leaves runtime config unchanged", async () => {
  const calls = [];
  const config = loadConfig({
    PUBLIC_URL: "https://hkai.shop",
    SMS_USD_CNY_RATE: "7.2",
  });
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params, via: "client" });
      if (sql === "BEGIN") return { rows: [] };
      if (sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("INSERT INTO app_settings")) throw new Error("database write failed");
      throw new Error(`Unexpected client SQL: ${sql}`);
    },
    release() {
      calls.push({ sql: "release", params: [], via: "client" });
    },
  };
  const db = {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params, via: "pool" });
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
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected pool SQL: ${sql}`);
    },
    async connect() {
      calls.push({ sql: "connect", params: [], via: "pool" });
      return client;
    },
  };
  const app = await buildApp({ db, logger: false, config });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/settings",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {
        settings: {
          SMS_USD_CNY_RATE: "7.3",
        },
      },
    });

    assert.equal(response.statusCode, 500);
    assert.equal(config.smsUsdCnyRate, 7.2);
    assert.ok(calls.some(call => call.sql === "BEGIN"));
    assert.ok(calls.some(call => call.sql === "ROLLBACK"));
    assert.equal(calls.some(call => call.sql === "COMMIT"), false);
    assert.ok(calls.some(call => call.sql === "release"));
  } finally {
    await app.close();
  }
});

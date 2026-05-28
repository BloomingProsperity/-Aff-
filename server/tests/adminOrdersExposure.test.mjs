import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

const admin = {
  id: 1,
  email: "huakaifugui2.0@gmail.com",
  role: "admin",
  status: "active",
  balance_cents: 0,
};

const orderRow = {
  id: 88,
  user_id: 7,
  user_email: "buyer@gmail.com",
  fivesim_id: "smspool:upstream-order-secret-123456",
  provider: "smspool",
  country: "us",
  operator: "any",
  product: "google",
  phone: "+15550001111",
  price_cents: 1800,
  refund_cents: 0,
  status: "received",
  sms_json: "[{\"code\":\"123456\",\"text\":\"Your code is 123456\"}]",
  raw_json: "{\"provider\":\"smspool\",\"data\":{\"internal\":\"raw upstream payload\"}}",
  created_at: "2026-05-28T09:00:00.000Z",
  updated_at: "2026-05-28T09:01:00.000Z",
};

function buildDb(calls) {
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params, client: true });
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("FOR UPDATE OF o")) return { rows: [{ ...orderRow, status: "failed", price_cents: 0 }] };
      if (sql.includes("UPDATE sms_orders") && sql.includes("status = 'admin_closed'")) {
        return { rows: [{ ...orderRow, status: "admin_closed", price_cents: 0 }] };
      }
      if (sql.includes("SELECT o.*, u.email AS user_email") && sql.includes("WHERE o.id = $1")) {
        return { rows: [{ ...orderRow, status: "admin_closed", price_cents: 0 }] };
      }
      throw new Error(`Unexpected client SQL: ${sql}`);
    },
    release() {},
  };
  return {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) return { rows: [admin] };
      if (sql.includes("SELECT COUNT(*)::int AS total FROM sms_orders")) return { rows: [{ total: 1 }] };
      if (sql.includes("FROM sms_orders o") && sql.includes("JOIN users u") && sql.includes("ORDER BY o.id DESC")) {
        return { rows: [orderRow] };
      }
      if (sql.includes("FROM sms_orders o") && sql.includes("WHERE o.id = $1")) return { rows: [orderRow] };
      if (sql.includes("SELECT * FROM sms_orders WHERE id = $1")) return { rows: [{ ...orderRow, status: "failed", price_cents: 0 }] };
      if (sql.includes("INSERT INTO rate_limits")) return { rows: [{ count: 1, reset_at: 1_800_000_000 }] };
      if (sql.includes("FROM sms_order_events")) return { rows: [] };
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("INSERT INTO sms_order_events")) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
    async connect() {
      return client;
    },
  };
}

test("admin order list does not expose raw upstream payloads to the browser", async () => {
  const calls = [];
  const app = await buildApp({
    db: buildDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/admin/orders",
      cookies: { hkai_session: "session-token" },
      headers: { origin: "https://hkai.shop" },
    });

    assert.equal(response.statusCode, 200);
    const order = response.json().orders[0];
    assert.equal(order.id, 88);
    assert.equal(order.provider, "smspool");
    assert.equal(order.phone, "+15550001111");
    assert.equal(Object.hasOwn(order, "raw_json"), false);
    assert.equal(Object.hasOwn(order, "sms_json"), false);
    assert.equal(Object.hasOwn(order, "fivesim_id"), false);
    assert.equal(JSON.stringify(order).includes("upstream-order-secret"), false);
    assert.equal(JSON.stringify(order).includes("raw upstream payload"), false);
  } finally {
    await app.close();
  }
});

test("admin order event detail does not expose raw upstream payloads through the order shell", async () => {
  const calls = [];
  const app = await buildApp({
    db: buildDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/admin/orders/88/events",
      cookies: { hkai_session: "session-token" },
      headers: { origin: "https://hkai.shop" },
    });

    assert.equal(response.statusCode, 200);
    const order = response.json().order;
    assert.equal(order.id, 88);
    assert.equal(order.provider, "smspool");
    assert.equal(Object.hasOwn(order, "raw_json"), false);
    assert.equal(Object.hasOwn(order, "sms_json"), false);
    assert.equal(Object.hasOwn(order, "fivesim_id"), false);
    assert.equal(JSON.stringify(order).includes("upstream-order-secret"), false);
    assert.equal(JSON.stringify(order).includes("raw upstream payload"), false);
  } finally {
    await app.close();
  }
});

test("admin manual order close response does not expose raw upstream payloads", async () => {
  const calls = [];
  const app = await buildApp({
    db: buildDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/orders/88/close",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: { note: "manual close" },
    });

    assert.equal(response.statusCode, 200);
    const order = response.json().order;
    assert.equal(order.id, 88);
    assert.equal(order.status, "admin_closed");
    assert.equal(Object.hasOwn(order, "raw_json"), false);
    assert.equal(Object.hasOwn(order, "sms_json"), false);
    assert.equal(Object.hasOwn(order, "fivesim_id"), false);
    assert.equal(JSON.stringify(order).includes("upstream-order-secret"), false);
    assert.equal(JSON.stringify(order).includes("raw upstream payload"), false);
  } finally {
    await app.close();
  }
});

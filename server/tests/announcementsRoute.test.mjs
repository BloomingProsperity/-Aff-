import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

test("public announcements endpoint returns active announcements only", async () => {
  const db = {
    async query(sql) {
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM announcements")) {
        return {
          rows: [{
            id: 2,
            title: "系统公告",
            body: "接码服务已开启自动比价。",
            link_label: "去接码",
            link_url: "/sms",
            priority: 9,
            status: "active",
            created_by_user_id: 1,
          }],
        };
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
    const response = await app.inject({ method: "GET", url: "/api/announcements" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      announcements: [{
        id: 2,
        title: "系统公告",
        body: "接码服务已开启自动比价。",
        linkLabel: "去接码",
        linkUrl: "/sms",
        priority: 9,
        status: "active",
        startsAt: "",
        endsAt: "",
      }],
    });
    assert.equal(response.body.includes("created_by"), false);
  } finally {
    await app.close();
  }
});

test("admin announcement create stores publish window", async () => {
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
      if (sql.includes("INSERT INTO announcements")) {
        return {
          rows: [{
            id: 9,
            title: params[0],
            body: params[1],
            link_label: params[2],
            link_url: params[3],
            priority: params[4],
            status: params[5],
            created_by_user_id: params[8],
            updated_by_user_id: params[8],
            starts_at: params[6],
            ends_at: params[7],
            created_at: "2026-05-28T00:00:00.000Z",
            updated_at: "2026-05-28T00:00:00.000Z",
          }],
        };
      }
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
      url: "/api/admin/announcements",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {
        title: "Maintenance",
        body: "SMS service maintenance tonight.",
        startsAt: "2026-06-01T12:30",
        endsAt: "2026-06-02T01:00",
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().announcement.startsAt, "2026-06-01T12:30:00.000Z");
    assert.equal(response.json().announcement.endsAt, "2026-06-02T01:00:00.000Z");

    const insert = calls.find(call => call.sql.includes("INSERT INTO announcements"));
    assert.ok(insert);
    assert.match(insert.sql, /starts_at/);
    assert.match(insert.sql, /ends_at/);
    assert.equal(insert.params[6], "2026-06-01T12:30:00.000Z");
    assert.equal(insert.params[7], "2026-06-02T01:00:00.000Z");
  } finally {
    await app.close();
  }
});

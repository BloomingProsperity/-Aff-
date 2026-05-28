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
      if (sql.includes("INSERT INTO announcements") || sql.includes("UPDATE announcements") || sql.includes("DELETE FROM announcements")) {
        throw new Error("rate-limited announcement mutation reached announcements table");
      }
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
}

const announcementPayload = {
  title: "系统通知",
  body: "维护窗口",
  status: "active",
  priority: 1,
};

test("rate-limited announcement create is audited before inserting", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedAdminDb(calls),
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
      payload: announcementPayload,
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("INSERT INTO announcements")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 1);
    assert.equal(audit.params[2], "admin.announcement.create");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

test("rate-limited announcement update is audited before updating", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "PATCH",
      url: "/api/admin/announcements/22",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: announcementPayload,
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("UPDATE announcements")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 1);
    assert.equal(audit.params[2], "admin.announcement.update");
    assert.equal(audit.params[4], "22");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

test("rate-limited announcement delete is audited before deleting", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/admin/announcements/22",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {},
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("DELETE FROM announcements")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 1);
    assert.equal(audit.params[2], "admin.announcement.delete");
    assert.equal(audit.params[4], "22");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

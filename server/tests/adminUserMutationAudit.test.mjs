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
      if (sql.includes("UPDATE users")) throw new Error("rate-limited user status reached user mutation");
      if (sql.includes("DELETE FROM sessions")) throw new Error("rate-limited session revoke reached session deletion");
      if (sql.includes("SELECT id, email FROM users")) throw new Error("rate-limited session revoke reached target lookup");
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
}

test("rate-limited admin user status change is audited before mutating users", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/users/7/status",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: { status: "suspended", note: "risk" },
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("UPDATE users")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 1);
    assert.equal(audit.params[1], 7);
    assert.equal(audit.params[2], "admin.user.status");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

test("rate-limited admin user session revoke is audited before deleting sessions", async () => {
  const calls = [];
  const app = await buildApp({
    db: rateLimitedAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/users/7/sessions/revoke",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {},
    });

    assert.equal(response.statusCode, 429);
    assert.equal(calls.some(call => call.sql.includes("DELETE FROM sessions")), false);
    assert.equal(calls.some(call => call.sql.includes("SELECT id, email FROM users")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[0], 1);
    assert.equal(audit.params[1], 7);
    assert.equal(audit.params[2], "admin.user.sessions.revoke");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

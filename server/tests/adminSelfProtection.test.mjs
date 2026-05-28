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

function selfAdminDb(calls) {
  return {
    async query(sql, params = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) return { rows: [adminUser()] };
      if (sql.includes("INSERT INTO rate_limits")) return { rows: [{ count: 1, reset_at: 1_800_000_000 }] };
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("UPDATE users")) throw new Error("self-protection reached user update");
      if (sql.includes("DELETE FROM sessions")) throw new Error("self-protection reached session deletion");
      if (sql.includes("SELECT id, email FROM users")) throw new Error("self-protection reached target lookup");
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test("admin cannot suspend their own owner account and the attempt is audited", async () => {
  const calls = [];
  const app = await buildApp({
    db: selfAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/users/1/status",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: { status: "suspended", note: "mistake" },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(calls.some(call => call.sql.includes("UPDATE users")), false);
    assert.equal(calls.some(call => call.sql.includes("DELETE FROM sessions")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[2], "admin.user.status");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 400);
    assert.match(audit.params[11], /self_suspend_blocked/);
  } finally {
    await app.close();
  }
});

test("admin cannot revoke their own owner account sessions from user management", async () => {
  const calls = [];
  const app = await buildApp({
    db: selfAdminDb(calls),
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/users/1/sessions/revoke",
      cookies: { hkai_session: "session-token" },
      headers: {
        "content-type": "application/json",
        origin: "https://hkai.shop",
      },
      payload: {},
    });

    assert.equal(response.statusCode, 400);
    assert.equal(calls.some(call => call.sql.includes("SELECT id, email FROM users")), false);
    assert.equal(calls.some(call => call.sql.includes("DELETE FROM sessions")), false);
    const audit = calls.find(call => call.sql.includes("INSERT INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[2], "admin.user.sessions.revoke");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 400);
    assert.match(audit.params[11], /self_session_revoke_blocked/);
  } finally {
    await app.close();
  }
});

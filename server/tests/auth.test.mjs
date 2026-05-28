import assert from "node:assert/strict";
import test from "node:test";
import {
  adminRoleForNewUser,
  canUsePaidFeatures,
  destroyUserSessions,
  hashPassword,
  isConfiguredAdmin,
  normalizeUserStatus,
  passwordNeedsRehash,
  requireAdmin,
  requirePaidUser,
  validatePasswordInput,
  verifyPassword,
} from "../src/lib/auth.js";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

test("public registration never grants admin role automatically", async () => {
  const db = { query: async () => ({ rows: [{ count: 0 }] }) };

  assert.equal(
    await adminRoleForNewUser(db, { adminEmail: "owner@gmail.com" }, "OWNER@gmail.com"),
    "user",
  );
  assert.equal(
    await adminRoleForNewUser(db, { adminEmail: "" }, "first@gmail.com"),
    "user",
  );
});

test("default admin email is locked to site owner", () => {
  assert.equal(loadConfig({}).adminEmail, "huakaifugui2.0@gmail.com");
});

test("admin access requires both admin role and configured owner email", () => {
  const config = { adminEmail: "huakaifugui2.0@gmail.com" };

  assert.equal(isConfiguredAdmin({ email: "huakaifugui2.0@gmail.com", role: "admin" }, config), true);
  assert.equal(isConfiguredAdmin({ email: "other@gmail.com", role: "admin" }, config), false);
  assert.equal(isConfiguredAdmin({ email: "huakaifugui2.0@gmail.com", role: "user" }, config), false);
});

test("password input rejects oversized values before expensive hashing", () => {
  assert.deepEqual(validatePasswordInput("1234567"), {
    ok: false,
    reason: "too_short",
    error: "密码至少 8 位。",
  });
  assert.deepEqual(validatePasswordInput("x".repeat(128)), {
    ok: true,
    value: "x".repeat(128),
  });
  assert.deepEqual(validatePasswordInput("x".repeat(129)), {
    ok: false,
    reason: "too_long",
    error: "密码最多 128 位。",
  });
});

test("user account status defaults to active and blocks suspended buyers", () => {
  assert.equal(normalizeUserStatus(""), "active");
  assert.equal(normalizeUserStatus("ACTIVE"), "active");
  assert.equal(normalizeUserStatus("suspended"), "suspended");
  assert.equal(normalizeUserStatus("unknown"), "active");

  assert.equal(canUsePaidFeatures({ status: "active" }), true);
  assert.equal(canUsePaidFeatures({ status: "suspended" }), false);
  assert.equal(canUsePaidFeatures({}), true);
});

test("paid user guard marks suspended accounts for audit", async () => {
  const db = {
    query: async () => ({
      rows: [{
        id: 7,
        email: "buyer@gmail.com",
        role: "user",
        status: "suspended",
        balance_cents: 1000,
      }],
    }),
  };
  const reply = {
    statusCode: 200,
    code(value) {
      this.statusCode = value;
      return this;
    },
  };

  const auth = await requirePaidUser(db, { cookies: { hkai_session: "session-token" } }, reply);

  assert.equal(reply.statusCode, 403);
  assert.equal(auth.blockedReason, "account_suspended");
  assert.equal(auth.user.email, "buyer@gmail.com");
  assert.ok(auth.response.error);
});

test("admin guard audits authenticated users without admin access", async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("FROM sessions") && sql.includes("JOIN users")) {
        return { rows: [{ id: 9, email: "buyer@gmail.com", role: "user", status: "active", balance_cents: 0 }] };
      }
      if (sql.includes("INTO audit_logs")) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const reply = {
    statusCode: 200,
    code(value) {
      this.statusCode = value;
      return this;
    },
  };
  const request = {
    cookies: { hkai_session: "session-token" },
    method: "GET",
    url: "/api/admin/stats",
    headers: { "user-agent": "test-agent" },
    ip: "203.0.113.8",
  };

  const auth = await requireAdmin(db, request, reply, { adminEmail: "huakaifugui2.0@gmail.com" });

  assert.equal(reply.statusCode, 403);
  assert.ok(auth.response.error);
  const audit = calls.find(call => call.sql.includes("INTO audit_logs"));
  assert.ok(audit);
  assert.equal(audit.params[0], 9);
  assert.equal(audit.params[2], "admin.access");
  assert.equal(audit.params[5], "failed");
  assert.equal(audit.params[6], 403);
  assert.match(audit.params[11], /not_configured_admin/);
});

test("admin can revoke all sessions for a user", async () => {
  const calls = [];
  const db = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      return { rowCount: 3, rows: [] };
    },
  };

  const revoked = await destroyUserSessions(db, 7);

  assert.equal(revoked, 3);
  assert.match(calls[0].sql, /DELETE FROM sessions/);
  assert.deepEqual(calls[0].params, [7]);
});

test("legacy password hashes still verify but require rehash", () => {
  const legacy = hashPassword("correct horse battery staple", undefined, 120000);

  assert.equal(verifyPassword("correct horse battery staple", legacy.salt, legacy.hash), true);
  assert.equal(passwordNeedsRehash("correct horse battery staple", legacy.salt, legacy.hash), true);
});

test("new password hashes do not require rehash", () => {
  const current = hashPassword("correct horse battery staple");

  assert.equal(verifyPassword("correct horse battery staple", current.salt, current.hash), true);
  assert.equal(passwordNeedsRehash("correct horse battery staple", current.salt, current.hash), false);
});

test("auth routes reject oversized passwords before account lookup", async () => {
  const calls = [];
  const db = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("INTO rate_limits")) return { rows: [{ count: 1, reset_at: 1_800_000_000 }] };
      if (sql.includes("INTO audit_logs")) return { rows: [], rowCount: 1 };
      if (sql.includes("FROM users")) throw new Error("oversized password reached user lookup");
      if (sql.includes("INTO users")) throw new Error("oversized password reached user insert");
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
      url: "/api/auth/login",
      headers: { host: "api.hkai.shop" },
      payload: { email: "buyer@gmail.com", password: "x".repeat(129) },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error, "密码最多 128 位。");
    assert.equal(calls.some(call => call.sql.includes("FROM users") || call.sql.includes("INTO users")), false);
  } finally {
    await app.close();
  }
});

async function buildRateLimitedAuthApp(calls) {
  const db = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("INTO rate_limits")) return { rows: [{ count: 99, reset_at: Math.floor(Date.now() / 1000) + 60 }] };
      if (sql.includes("INTO audit_logs")) return { rows: [], rowCount: 1 };
      throw new Error(`Rate-limited auth reached unexpected SQL: ${sql}`);
    },
  };
  return buildApp({
    db,
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });
}

test("rate-limited login attempts are written to audit logs", async () => {
  const calls = [];
  const app = await buildRateLimitedAuthApp(calls);

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { host: "api.hkai.shop" },
      payload: { email: "buyer@gmail.com", password: "correct-password" },
    });

    assert.equal(response.statusCode, 429);
    const audit = calls.find(call => call.sql.includes("INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[2], "auth.login");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

test("rate-limited registration attempts are written to audit logs", async () => {
  const calls = [];
  const app = await buildRateLimitedAuthApp(calls);

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      headers: { host: "api.hkai.shop" },
      payload: { email: "buyer@gmail.com", password: "correct-password" },
    });

    assert.equal(response.statusCode, 429);
    const audit = calls.find(call => call.sql.includes("INTO audit_logs"));
    assert.ok(audit);
    assert.equal(audit.params[2], "auth.register");
    assert.equal(audit.params[5], "failed");
    assert.equal(audit.params[6], 429);
    assert.match(audit.params[11], /rate_limited/);
  } finally {
    await app.close();
  }
});

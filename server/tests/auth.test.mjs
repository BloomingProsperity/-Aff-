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
  requirePaidUser,
  verifyPassword,
} from "../src/lib/auth.js";
import { loadConfig } from "../src/lib/config.js";

test("only configured admin email gets admin role", async () => {
  const db = { query: async () => ({ rows: [{ count: 0 }] }) };

  assert.equal(
    await adminRoleForNewUser(db, { adminEmail: "owner@gmail.com" }, "OWNER@gmail.com"),
    "admin",
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

import assert from "node:assert/strict";
import test from "node:test";
import { adminRoleForNewUser, hashPassword, isConfiguredAdmin, passwordNeedsRehash, verifyPassword } from "../src/lib/auth.js";
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

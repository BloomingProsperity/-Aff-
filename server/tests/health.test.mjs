import assert from "node:assert/strict";
import test from "node:test";
import { healthStatus } from "../src/lib/health.js";

test("health status verifies database connectivity without exposing secrets", async () => {
  const db = { query: async () => ({ rows: [{ ok: 1 }] }) };

  const result = await healthStatus(db, {
    appVersion: "0.1.0",
    appCommit: "5951728deadbeef",
    nodeEnv: "production",
  });

  assert.equal(result.httpStatus, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.database, "ok");
  assert.equal(result.body.service, "hkai-sms-api");
  assert.equal(result.body.version, "0.1.0");
  assert.equal(result.body.commit, "5951728");
  assert.equal(result.body.environment, "production");
  assert.equal(JSON.stringify(result).includes("postgres://"), false);
});

test("health status redacts unsafe build identity values", async () => {
  const db = { query: async () => ({ rows: [{ ok: 1 }] }) };

  const result = await healthStatus(db, {
    appVersion: "0.1.0;postgres://secret",
    appCommit: "not-a-commit-secret-token",
    nodeEnv: "prod;secret",
  });

  assert.equal(result.body.version, "unknown");
  assert.equal(result.body.commit, "unknown");
  assert.equal(result.body.environment, "unknown");
  assert.equal(JSON.stringify(result).includes("secret"), false);
});

test("health status fails closed when database check fails", async () => {
  const db = { query: async () => { throw new Error("postgres://secret-url failed"); } };

  const result = await healthStatus(db);

  assert.equal(result.httpStatus, 503);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.database, "error");
  assert.equal(JSON.stringify(result).includes("secret-url"), false);
});

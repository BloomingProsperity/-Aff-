import assert from "node:assert/strict";
import test from "node:test";
import { healthStatus } from "../src/lib/health.js";

test("health status verifies database connectivity without exposing secrets", async () => {
  const db = { query: async () => ({ rows: [{ ok: 1 }] }) };

  const result = await healthStatus(db);

  assert.equal(result.httpStatus, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.database, "ok");
  assert.equal(JSON.stringify(result).includes("postgres://"), false);
});

test("health status fails closed when database check fails", async () => {
  const db = { query: async () => { throw new Error("postgres://secret-url failed"); } };

  const result = await healthStatus(db);

  assert.equal(result.httpStatus, 503);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.database, "error");
  assert.equal(JSON.stringify(result).includes("secret-url"), false);
});

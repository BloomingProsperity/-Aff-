import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  acquireOperationLock,
  operationLockKey,
  releaseOperationLock,
} from "../src/lib/operationLocks.js";

function memoryLockDb(now = Date.now()) {
  const locks = new Map();
  return {
    locks,
    async query(sql, params = []) {
      if (sql.includes("INSERT INTO operation_locks")) {
        const [key, ownerToken, ttlSeconds] = params;
        const existing = locks.get(key);
        if (existing && existing.expiresAt > now) return { rows: [], rowCount: 0 };
        const row = {
          lock_key: key,
          owner_token: ownerToken,
          expires_at: new Date(now + Number(ttlSeconds) * 1000).toISOString(),
        };
        locks.set(key, { ownerToken, expiresAt: now + Number(ttlSeconds) * 1000, row });
        return { rows: [row], rowCount: 1 };
      }
      if (sql.includes("DELETE FROM operation_locks")) {
        const [key, ownerToken] = params;
        const existing = locks.get(key);
        if (existing?.ownerToken === ownerToken) {
          locks.delete(key);
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test("operation lock key is scoped, stable, and bounded", () => {
  assert.equal(operationLockKey("sms:buy", 7), "sms:buy:7");
  assert.equal(operationLockKey("SMS BUY", "user@example.com"), "sms-buy:user-example-com");
  assert.equal(operationLockKey("x".repeat(200)).length, 160);
});

test("operation lock blocks duplicate active work and releases only by owner", async () => {
  const db = memoryLockDb();
  const first = await acquireOperationLock(db, { key: "sms:buy:7", ttlSeconds: 30 });
  const second = await acquireOperationLock(db, { key: "sms:buy:7", ttlSeconds: 30 });

  assert.equal(first.acquired, true);
  assert.equal(second.acquired, false);

  assert.equal(await releaseOperationLock(db, { key: first.key, ownerToken: "wrong" }), false);
  assert.equal(db.locks.has("sms:buy:7"), true);
  assert.equal(await releaseOperationLock(db, first), true);
  assert.equal(db.locks.has("sms:buy:7"), false);
});

test("expired operation lock can be replaced", async () => {
  const db = memoryLockDb(Date.parse("2026-05-28T12:00:00Z"));
  db.locks.set("sms:buy:8", {
    ownerToken: "old",
    expiresAt: Date.parse("2026-05-28T11:59:59Z"),
  });

  const next = await acquireOperationLock(db, { key: "sms:buy:8", ttlSeconds: 30 });

  assert.equal(next.acquired, true);
  assert.notEqual(db.locks.get("sms:buy:8").ownerToken, "old");
});

test("sms buy route holds a per-user operation lock around provider purchase", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");

  assert.match(source, /acquireOperationLock/);
  assert.match(source, /operationLockKey\("sms:buy", auth\.user\.id\)/);
  assert.match(source, /finally\s*{[\s\S]*releaseOperationLock/);
});

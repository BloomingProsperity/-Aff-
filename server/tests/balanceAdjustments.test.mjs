import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validateBalanceAdjustment } from "../src/lib/balance.js";

test("admin balance adjustment cannot create a negative user balance", () => {
  assert.deepEqual(validateBalanceAdjustment(1000, 500), { ok: true, balanceAfterCents: 1500 });
  assert.deepEqual(validateBalanceAdjustment(1000, -700), { ok: true, balanceAfterCents: 300 });
  assert.deepEqual(validateBalanceAdjustment(1000, -1000), { ok: true, balanceAfterCents: 0 });

  const blocked = validateBalanceAdjustment(1000, -1001);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "negative_balance");
});

test("admin credit route validates balance before updating user balance", async () => {
  const source = await readFile(new URL("../src/routes/admin.js", import.meta.url), "utf8");
  const start = source.indexOf('app.post("/api/admin/credit"');
  const end = source.indexOf('app.get("/api/admin/orders"', start);
  const body = source.slice(start, end);

  assert.match(body, /validateBalanceAdjustment/);
  assert.match(body, /balance_after_cents/);
});

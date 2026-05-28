import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin announcement delete is rate limited before deletion", async () => {
  const source = await readFile(new URL("../src/routes/announcements.js", import.meta.url), "utf8");
  const start = source.indexOf('app.delete("/api/admin/announcements/:id"');
  const end = source.indexOf("\n  });", start);
  const route = source.slice(start, end);

  assert.notEqual(start, -1);
  assert.match(route, /enforceRateLimit\(app\.db, request, reply/);
  assert.ok(route.indexOf("enforceRateLimit") < route.indexOf("DELETE FROM announcements"));
});

test("admin voucher void is rate limited before status mutation", async () => {
  const source = await readFile(new URL("../src/routes/vouchers.js", import.meta.url), "utf8");
  const start = source.indexOf('app.post("/api/admin/vouchers/:id/void"');
  const end = source.indexOf("\n  });", start);
  const route = source.slice(start, end);

  assert.notEqual(start, -1);
  assert.match(route, /enforceRateLimit\(app\.db, request, reply/);
  assert.ok(route.indexOf("enforceRateLimit") < route.indexOf("UPDATE balance_vouchers"));
});

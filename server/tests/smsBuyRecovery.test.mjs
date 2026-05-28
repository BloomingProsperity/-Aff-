import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("sms buy compensates reserved balance and supplier order after post-purchase failures", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");
  const start = source.indexOf('app.post("/api/sms/buy"');
  const end = source.indexOf('app.get("/api/sms/check/:id"', start);
  const body = source.slice(start, end);

  assert.match(body, /catch\s*\(\s*error\s*\)/);
  assert.match(body, /!localOrderCommitted\s*&&\s*bought\s*&&\s*chosen/);
  assert.match(body, /changeSmsProviderOrder[\s\S]*"cancel"/);
  assert.match(body, /!localOrderCommitted\s*&&\s*reservedCents\s*>\s*0[\s\S]*refundBalance/);
  assert.match(body, /throw\s+error/);
});

test("sms buy writes local order and balance ledger in one database transaction", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");
  const routeStart = source.indexOf('app.post("/api/sms/buy"');
  const start = source.indexOf("const client = await app.db.connect()", routeStart);
  const end = source.indexOf('await writeSmsOrderEvent(app.db, {', start);
  const body = source.slice(start, end);

  assert.match(body, /const\s+client\s*=\s*await\s+app\.db\.connect\(\)/);
  assert.match(body, /client\.query\("BEGIN"\)/);
  assert.match(body, /INSERT INTO sms_orders/);
  assert.match(body, /INSERT INTO balance_logs/);
  assert.match(body, /client\.query\("COMMIT"\)/);
  assert.match(body, /client\.query\("ROLLBACK"\)/);
  assert.match(body, /client\.release\(\)/);
});

test("sms buy success event logging is best-effort after the local order is committed", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");
  const routeStart = source.indexOf('app.post("/api/sms/buy"');
  const start = source.indexOf("localOrderCommitted = true", routeStart);
  const end = source.indexOf("return { order:", start);
  const body = source.slice(start, end);

  assert.match(body, /try\s*{[\s\S]*writeSmsOrderEvent/);
  assert.match(body, /catch\s*\(\s*eventError\s*\)/);
  assert.match(body, /sms buy success event log failed/);
});

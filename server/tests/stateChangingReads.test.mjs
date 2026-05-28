import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { loadConfig } from "../src/lib/config.js";
import { isAllowedStateChangingRead } from "../src/lib/security.js";

test("state-changing reads reject explicit cross-site browser requests", () => {
  const config = loadConfig({ PUBLIC_URL: "https://hkai.shop" });

  assert.equal(isAllowedStateChangingRead({ headers: { "sec-fetch-site": "cross-site" } }, config), false);
  assert.equal(isAllowedStateChangingRead({ headers: { referer: "https://evil.example/page" } }, config), false);
  assert.equal(isAllowedStateChangingRead({ headers: { origin: "https://evil.example" } }, config), false);
  assert.equal(isAllowedStateChangingRead({ headers: { "sec-fetch-site": "same-origin" } }, config), true);
  assert.equal(isAllowedStateChangingRead({ headers: { referer: "https://hkai.shop/sms" } }, config), true);
  assert.equal(isAllowedStateChangingRead({ headers: {} }, config), true);
});

test("sms GET endpoints that mutate order state enforce state-changing read guard", async () => {
  const source = await readFile(new URL("../src/routes/sms.js", import.meta.url), "utf8");

  const ordersStart = source.indexOf('app.get("/api/sms/orders"');
  const ordersEnd = source.indexOf('app.post("/api/sms/buy"', ordersStart);
  const ordersBody = source.slice(ordersStart, ordersEnd);

  const checkStart = source.indexOf('app.get("/api/sms/check/:id"');
  const checkEnd = source.indexOf('for (const action of ["finish", "cancel", "ban"])', checkStart);
  const checkBody = source.slice(checkStart, checkEnd);

  assert.match(ordersBody, /isAllowedStateChangingRead/);
  assert.match(ordersBody, /reply\.code\(403\)/);
  assert.match(checkBody, /isAllowedStateChangingRead/);
  assert.match(checkBody, /reply\.code\(403\)/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { normalizePublicSmsOrder } from "../src/lib/smsOrders.js";

test("public sms orders do not expose upstream supplier internals", () => {
  const order = normalizePublicSmsOrder({
    id: 12,
    fivesim_id: "bee-sms:secret-upstream-id",
    provider: "bee-sms",
    country: "usa",
    operator: "any",
    product: "telegram",
    phone: "+15550001111",
    price_cents: 1600,
    status: "received",
    refund_cents: 0,
    sms_json: "[{\"code\":\"123456\",\"text\":\"Your code is 123456\"}]",
    created_at: "2026-05-28T01:00:00Z",
    updated_at: "2026-05-28T01:01:00Z",
  });

  assert.equal(order.id, 12);
  assert.equal(order.price, 16);
  assert.equal(order.phone, "+15550001111");
  assert.equal(order.sms[0].code, "123456");
  assert.equal(Object.hasOwn(order, "provider"), false);
  assert.equal(Object.hasOwn(order, "providerName"), false);
  assert.equal(Object.hasOwn(order, "fivesimId"), false);
});

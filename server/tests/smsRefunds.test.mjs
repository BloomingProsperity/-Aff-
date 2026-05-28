import assert from "node:assert/strict";
import test from "node:test";
import {
  adminClosableSmsOrderStatus,
  isRefundedSmsOrder,
  refundableSmsOrderStatus,
  smsRefundCents,
  smsRefundNote,
  shouldRefundSmsOrder,
} from "../src/lib/smsRefunds.js";

test("sms refund statuses include cancelled and banned variants", () => {
  assert.equal(refundableSmsOrderStatus("cancelled"), true);
  assert.equal(refundableSmsOrderStatus("canceled"), true);
  assert.equal(refundableSmsOrderStatus("banned"), true);
  assert.equal(refundableSmsOrderStatus("ban"), true);
  assert.equal(refundableSmsOrderStatus("refunded"), true);
  assert.equal(refundableSmsOrderStatus("admin_closed"), true);
  assert.equal(refundableSmsOrderStatus("failed"), true);
  assert.equal(refundableSmsOrderStatus("completed"), false);
  assert.equal(refundableSmsOrderStatus("received"), false);
});

test("admins can close unresolved orders but not completed orders", () => {
  assert.equal(adminClosableSmsOrderStatus("pending"), true);
  assert.equal(adminClosableSmsOrderStatus("received"), true);
  assert.equal(adminClosableSmsOrderStatus("failed"), true);
  assert.equal(adminClosableSmsOrderStatus("admin_closed"), true);
  assert.equal(adminClosableSmsOrderStatus("completed"), false);
  assert.equal(adminClosableSmsOrderStatus("finished"), false);
  assert.equal(adminClosableSmsOrderStatus("finish"), false);
  assert.equal(adminClosableSmsOrderStatus(""), false);
});

test("sms refund eligibility is idempotent and requires a positive paid order", () => {
  assert.equal(shouldRefundSmsOrder({ status: "cancelled", price_cents: 1200 }), true);
  assert.equal(shouldRefundSmsOrder({ status: "banned", price_cents: 1200, refunded_at: new Date() }), false);
  assert.equal(shouldRefundSmsOrder({ status: "cancelled", price_cents: 0 }), false);
  assert.equal(shouldRefundSmsOrder({ status: "finished", price_cents: 1200 }), false);
});

test("sms refund amount never exceeds paid order price", () => {
  assert.equal(smsRefundCents({ price_cents: 1200 }), 1200);
  assert.equal(smsRefundCents({ price_cents: -50 }), 0);
  assert.equal(smsRefundCents({ price_cents: "399" }), 399);
});

test("sms refunded state supports old rows without refund columns", () => {
  assert.equal(isRefundedSmsOrder({}), false);
  assert.equal(isRefundedSmsOrder({ refund_cents: 500 }), true);
  assert.equal(isRefundedSmsOrder({ refunded_at: "2026-05-28T00:00:00Z" }), true);
});

test("sms refund note stays useful but short", () => {
  assert.equal(smsRefundNote({ id: 8, country: "usa", operator: "any", product: "google" }), "usa/any/google #8");
  assert.ok(smsRefundNote({ id: 8, country: "x".repeat(80), operator: "any", product: "google" }).length <= 120);
});

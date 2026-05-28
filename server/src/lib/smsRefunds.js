const REFUNDABLE_SMS_STATUSES = new Set([
  "admin_closed",
  "ban",
  "banned",
  "cancel",
  "cancelled",
  "canceled",
  "expired",
  "failed",
  "refunded",
  "timeout",
]);

const COMPLETED_SMS_STATUSES = new Set(["complete", "completed", "finish", "finished"]);

function cleanNotePart(value) {
  return String(value || "")
    .trim()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, "")
    .slice(0, 40);
}

export function refundableSmsOrderStatus(status) {
  return REFUNDABLE_SMS_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function adminClosableSmsOrderStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return Boolean(normalized) && !COMPLETED_SMS_STATUSES.has(normalized);
}

export function isRefundedSmsOrder(order = {}) {
  return Boolean(order.refunded_at) || Number(order.refund_cents || 0) > 0;
}

export function smsRefundCents(order = {}) {
  const cents = Math.trunc(Number(order.price_cents || 0));
  return Number.isFinite(cents) && cents > 0 ? cents : 0;
}

export function shouldRefundSmsOrder(order = {}) {
  return !isRefundedSmsOrder(order)
    && smsRefundCents(order) > 0
    && refundableSmsOrderStatus(order.status);
}

export function smsRefundNote(order = {}) {
  const parts = [order.country, order.operator, order.product].map(cleanNotePart).filter(Boolean);
  const id = cleanNotePart(order.id ? `#${order.id}` : "");
  return `${parts.join("/")}${id ? ` ${id}` : ""}`.slice(0, 120);
}

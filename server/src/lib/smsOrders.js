import { centsToAmount, toIso } from "./common.js";

export function normalizePublicSmsOrder(row) {
  if (!row) return null;
  let sms = [];
  try { sms = JSON.parse(row.sms_json || "[]"); } catch {}
  return {
    id: Number(row.id),
    country: row.country,
    operator: row.operator,
    product: row.product,
    phone: row.phone,
    price: centsToAmount(row.price_cents),
    status: row.status,
    refund: centsToAmount(row.refund_cents),
    refundedAt: toIso(row.refunded_at),
    sms,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

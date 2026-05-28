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

export function normalizeAdminSmsOrder(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    user_id: row.user_id == null ? null : Number(row.user_id),
    user_email: row.user_email || row.email || "",
    provider: row.provider || "",
    country: row.country || "",
    operator: row.operator || "",
    product: row.product || "",
    phone: row.phone || "",
    price_cents: Number(row.price_cents || 0),
    refund_cents: Number(row.refund_cents || 0),
    status: row.status || "",
    refunded_at: row.refunded_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

import { sanitizeAuditMetadata } from "./audit.js";
import { exec } from "./db.js";

function cleanText(value, max = 240) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, "")
    .slice(0, max);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function sanitizeSmsEventMetadata(metadata = {}) {
  return sanitizeAuditMetadata(metadata || {});
}

export function normalizeSmsOrderEvent(row = {}) {
  let metadata = {};
  try {
    metadata = JSON.parse(row.metadata_json || "{}");
  } catch {
    metadata = {};
  }
  return {
    id: toNumber(row.id),
    orderId: toNumber(row.order_id),
    userId: toNumber(row.user_id),
    actorUserId: toNumber(row.actor_user_id),
    userEmail: row.user_email || "",
    actorEmail: row.actor_email || "",
    type: row.event_type || "",
    status: row.status || "info",
    provider: row.provider || "",
    publicCode: row.public_code || "",
    message: row.message || "",
    metadata: sanitizeSmsEventMetadata(metadata),
    createdAt: row.created_at,
  };
}

export async function writeSmsOrderEvent(db, {
  orderId = null,
  userId = null,
  actorUserId = null,
  type,
  status = "info",
  provider = "",
  publicCode = "",
  message = "",
  metadata = {},
} = {}) {
  if (!type) return;
  try {
    await exec(
      db,
      `INSERT INTO sms_order_events
         (order_id, user_id, actor_user_id, event_type, status, provider, public_code, message, metadata_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        orderId || null,
        userId || null,
        actorUserId || null,
        cleanText(type, 80),
        cleanText(status || "info", 24),
        cleanText(provider, 60),
        cleanText(publicCode, 80),
        cleanText(message, 300),
        JSON.stringify(sanitizeSmsEventMetadata(metadata)),
      ],
    );
  } catch (error) {
    if (error.code === "42P01") return;
    throw error;
  }
}

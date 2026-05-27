import { exec } from "./db.js";

const REDACTED = "[redacted]";
const SENSITIVE_KEY_RE = /(^key$|password|passwd|pwd|secret|token|api[_-]?key|apikey|authorization|cookie|session|credential)/i;

function printable(value, max = 240) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, "")
    .slice(0, max);
}

function isLocalAddress(value) {
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"].includes(String(value || "").trim());
}

export function auditClientIp(request = {}) {
  const headers = request.headers || {};
  const cfIp = printable(headers["cf-connecting-ip"], 80);
  if (cfIp) return cfIp;

  const forwarded = printable(headers["x-forwarded-for"], 200).split(",")[0]?.trim();
  if (forwarded && isLocalAddress(request.ip)) return forwarded;
  return printable(request.ip || request.socket?.remoteAddress || "", 80);
}

export function auditUserAgent(request = {}) {
  return printable(request.headers?.["user-agent"], 240);
}

export function sanitizeAuditMetadata(value, depth = 0) {
  if (depth > 5) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return printable(value, 500);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map(item => sanitizeAuditMetadata(item, depth + 1));
  if (typeof value !== "object") return printable(value, 120);

  const out = {};
  for (const [key, item] of Object.entries(value).slice(0, 80)) {
    const safeKey = printable(key, 80);
    out[safeKey] = SENSITIVE_KEY_RE.test(safeKey) ? REDACTED : sanitizeAuditMetadata(item, depth + 1);
  }
  return out;
}

export async function writeAuditLog(db, request, {
  actorUserId = null,
  targetUserId = null,
  action,
  resourceType = "",
  resourceId = "",
  status = "success",
  httpStatus = null,
  metadata = {},
} = {}) {
  if (!action) return;
  try {
    await exec(
      db,
      `INSERT INTO audit_logs
         (actor_user_id, target_user_id, action, resource_type, resource_id, status,
          http_status, ip, user_agent, method, path, metadata_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        actorUserId,
        targetUserId,
        printable(action, 80),
        printable(resourceType, 80),
        printable(resourceId, 120),
        printable(status || "success", 24),
        httpStatus || null,
        auditClientIp(request),
        auditUserAgent(request),
        printable(request?.method, 12),
        printable(request?.url, 500),
        JSON.stringify(sanitizeAuditMetadata(metadata || {})),
      ],
    );
  } catch (error) {
    if (error.code === "42P01") return;
    request?.log?.warn?.({ error: error.message, action }, "audit log write failed");
  }
}

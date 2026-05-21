export const AUTH_EMAIL_DOMAINS = ["qq.com", "163.com", "gmail.com"];

export function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isAllowedAuthEmail(email) {
  const value = cleanEmail(email);
  const domain = value.slice(value.lastIndexOf("@") + 1);
  return AUTH_EMAIL_DOMAINS.includes(domain);
}

export function cleanPart(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

export function cleanOrderId(value) {
  return String(value || "").trim().replace(/[^0-9]/g, "");
}

export function amountToCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToAmount(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

export function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

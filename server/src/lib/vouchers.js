import { createHash, randomBytes } from "node:crypto";

const VOUCHER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomReadable(size) {
  const bytes = randomBytes(size);
  let out = "";
  for (const byte of bytes) out += VOUCHER_ALPHABET[byte % VOUCHER_ALPHABET.length];
  return out;
}

export function normalizeVoucherCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function generateVoucherCode() {
  const raw = randomReadable(12);
  return `HKAI-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function hashVoucherCode(value) {
  return createHash("sha256").update(normalizeVoucherCode(value)).digest("hex");
}

export function voucherSuffix(value) {
  return normalizeVoucherCode(value).slice(-4);
}

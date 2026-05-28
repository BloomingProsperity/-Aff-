import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const DEFAULT_STALE_HOURS = 36;

function positiveNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function safeShaSuffix(value) {
  const raw = String(value || "").trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(raw) ? raw.slice(-6) : "";
}

function safeFile(value) {
  return basename(String(value || "").trim()).slice(0, 160);
}

function ageHoursFrom(value, now = new Date()) {
  const finished = new Date(value || "");
  if (!Number.isFinite(finished.getTime())) return null;
  return Math.max(0, (now.getTime() - finished.getTime()) / 3_600_000);
}

export function normalizeBackupStatus(raw = {}, options = {}) {
  const staleHours = positiveNumber(options.staleHours) || DEFAULT_STALE_HOURS;
  const ageHours = ageHoursFrom(raw.finishedAt, options.now);
  const stale = ageHours === null || ageHours > staleHours;
  const ok = raw.ok === true && !stale;
  return {
    enabled: true,
    ok,
    status: ok ? "ok" : stale ? "stale" : "error",
    finishedAt: typeof raw.finishedAt === "string" ? raw.finishedAt : "",
    ageHours: ageHours === null ? null : Number(ageHours.toFixed(2)),
    staleHours,
    file: safeFile(raw.file),
    sizeBytes: positiveNumber(raw.sizeBytes),
    sha256Suffix: safeShaSuffix(raw.sha256),
  };
}

export async function readBackupStatus(config = {}, options = {}) {
  const file = String(config.backupStatusFile || "").trim();
  const staleHours = positiveNumber(config.backupStaleHours) || DEFAULT_STALE_HOURS;
  if (!file) {
    return {
      enabled: false,
      ok: false,
      status: "disabled",
      staleHours,
    };
  }

  try {
    const raw = JSON.parse(await readFile(file, "utf8"));
    return normalizeBackupStatus(raw, { staleHours, now: options.now });
  } catch (error) {
    return {
      enabled: true,
      ok: false,
      status: error?.code === "ENOENT" ? "missing" : "invalid",
      staleHours,
    };
  }
}

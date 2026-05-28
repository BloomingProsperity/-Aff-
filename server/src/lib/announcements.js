import { toIso } from "./common.js";

const STATUSES = new Set(["active", "paused", "draft"]);

function clean(value, limit) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function cleanMultiline(value, limit) {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, limit);
}

function cleanStatus(value) {
  const status = String(value || "active").trim().toLowerCase();
  return STATUSES.has(status) ? status : "active";
}

function cleanPriority(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.trunc(n), 0), 100);
}

function validLink(value) {
  const link = clean(value, 300);
  if (!link) return "";
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

function cleanPublishTime(value, label) {
  const raw = String(value || "").trim();
  if (!raw) return { ok: true, value: null };
  const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const normalized = hasZone ? raw : `${raw}Z`;
  const date = new Date(normalized);
  if (!Number.isFinite(date.getTime())) {
    return { ok: false, error: `${label}时间不正确。` };
  }
  return { ok: true, value: date.toISOString() };
}

export function normalizeAnnouncementInput(input = {}) {
  const title = clean(input.title, 80);
  const body = cleanMultiline(input.body, 500);
  const linkLabel = clean(input.linkLabel ?? input.link_label, 40);
  const linkUrl = validLink(input.linkUrl ?? input.link_url);
  const startsAt = cleanPublishTime(input.startsAt ?? input.starts_at, "开始");
  const endsAt = cleanPublishTime(input.endsAt ?? input.ends_at, "结束");

  if (!title) return { ok: false, error: "公告标题不能为空。" };
  if (!body) return { ok: false, error: "公告内容不能为空。" };
  if (linkUrl === null) return { ok: false, error: "公告链接不正确。" };
  if (!startsAt.ok) return { ok: false, error: startsAt.error };
  if (!endsAt.ok) return { ok: false, error: endsAt.error };
  if (startsAt.value && endsAt.value && new Date(endsAt.value) <= new Date(startsAt.value)) {
    return { ok: false, error: "结束时间必须晚于开始时间。" };
  }

  return {
    ok: true,
    value: {
      title,
      body,
      linkLabel,
      linkUrl,
      priority: cleanPriority(input.priority),
      status: cleanStatus(input.status),
      startsAt: startsAt.value,
      endsAt: endsAt.value,
    },
  };
}

export function publicAnnouncement(row = {}) {
  return {
    id: Number(row.id),
    title: row.title || "",
    body: row.body || "",
    linkLabel: row.link_label || "",
    linkUrl: row.link_url || "",
    priority: Number(row.priority || 0),
    status: row.status || "active",
    startsAt: toIso(row.starts_at) || "",
    endsAt: toIso(row.ends_at) || "",
  };
}

export function adminAnnouncement(row = {}) {
  return {
    ...publicAnnouncement(row),
    createdAt: toIso(row.created_at) || "",
    updatedAt: toIso(row.updated_at) || "",
  };
}

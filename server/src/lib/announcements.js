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

export function normalizeAnnouncementInput(input = {}) {
  const title = clean(input.title, 80);
  const body = cleanMultiline(input.body, 500);
  const linkLabel = clean(input.linkLabel ?? input.link_label, 40);
  const linkUrl = validLink(input.linkUrl ?? input.link_url);

  if (!title) return { ok: false, error: "公告标题不能为空。" };
  if (!body) return { ok: false, error: "公告内容不能为空。" };
  if (linkUrl === null) return { ok: false, error: "公告链接不正确。" };

  return {
    ok: true,
    value: {
      title,
      body,
      linkLabel,
      linkUrl,
      priority: cleanPriority(input.priority),
      status: cleanStatus(input.status),
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

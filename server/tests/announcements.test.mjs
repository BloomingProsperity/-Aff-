import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnnouncementInput, publicAnnouncement } from "../src/lib/announcements.js";

test("announcement input is bounded and safe for public display", () => {
  const input = normalizeAnnouncementInput({
    title: "  新功能上线  ",
    body: "  接码服务已支持自动比价  ",
    linkLabel: "  去看看  ",
    linkUrl: "https://hkai.shop/sms",
    priority: "7",
    status: "ACTIVE",
  });

  assert.deepEqual(input, {
    ok: true,
    value: {
      title: "新功能上线",
      body: "接码服务已支持自动比价",
      linkLabel: "去看看",
      linkUrl: "https://hkai.shop/sms",
      priority: 7,
      status: "active",
      startsAt: null,
      endsAt: null,
    },
  });

  assert.equal(normalizeAnnouncementInput({ title: "", body: "x" }).ok, false);
  assert.equal(normalizeAnnouncementInput({ title: "x", body: "x", linkUrl: "javascript:alert(1)" }).ok, false);
});

test("public announcement shape exposes no admin fields", () => {
  const item = publicAnnouncement({
    id: 12,
    title: "维护通知",
    body: "今晚 23:00 短暂维护。",
    link_label: "查看",
    link_url: "/faq",
    priority: 3,
    status: "active",
    created_by_user_id: 1,
    updated_by_user_id: 2,
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T01:00:00.000Z",
  });

  assert.deepEqual(item, {
    id: 12,
    title: "维护通知",
    body: "今晚 23:00 短暂维护。",
    linkLabel: "查看",
    linkUrl: "/faq",
    priority: 3,
    status: "active",
    startsAt: "",
    endsAt: "",
  });
  assert.equal(JSON.stringify(item).includes("created_by"), false);
});

test("announcement input accepts optional publish window", () => {
  const input = normalizeAnnouncementInput({
    title: "Maintenance",
    body: "SMS service maintenance tonight.",
    startsAt: "2026-06-01T12:30",
    endsAt: "2026-06-02T01:00",
  });

  assert.equal(input.ok, true);
  assert.equal(input.value.startsAt, "2026-06-01T12:30:00.000Z");
  assert.equal(input.value.endsAt, "2026-06-02T01:00:00.000Z");

  const invalidDate = normalizeAnnouncementInput({
    title: "Maintenance",
    body: "SMS service maintenance tonight.",
    startsAt: "not-a-date",
  });
  assert.equal(invalidDate.ok, false);

  const invalidWindow = normalizeAnnouncementInput({
    title: "Maintenance",
    body: "SMS service maintenance tonight.",
    startsAt: "2026-06-02T01:00",
    endsAt: "2026-06-01T12:30",
  });
  assert.equal(invalidWindow.ok, false);
});

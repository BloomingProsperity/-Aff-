import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

test("public announcements endpoint returns active announcements only", async () => {
  const db = {
    async query(sql) {
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("FROM announcements")) {
        return {
          rows: [{
            id: 2,
            title: "系统公告",
            body: "接码服务已开启自动比价。",
            link_label: "去接码",
            link_url: "/sms",
            priority: 9,
            status: "active",
            created_by_user_id: 1,
          }],
        };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };

  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }),
  });

  try {
    const response = await app.inject({ method: "GET", url: "/api/announcements" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      announcements: [{
        id: 2,
        title: "系统公告",
        body: "接码服务已开启自动比价。",
        linkLabel: "去接码",
        linkUrl: "/sms",
        priority: 9,
        status: "active",
        startsAt: "",
        endsAt: "",
      }],
    });
    assert.equal(response.body.includes("created_by"), false);
  } finally {
    await app.close();
  }
});

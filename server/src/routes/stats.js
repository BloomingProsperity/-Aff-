import { exec } from "../lib/db.js";
import { enforceRateLimit } from "../lib/security.js";

const ALLOWED_PAGES = new Set([
  "home", "cards", "gifts", "sms", "accounts", "login", "admin", "faq", "contact",
]);

export async function statsRoutes(app) {
  app.post("/api/stats/pageview", async (request, reply) => {
    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "stats:pageview",
      limit: 60,
      windowSeconds: 60,
      config: app.config,
    });
    if (limited) return limited;

    const page = String((request.body || {}).page || "").slice(0, 100);
    if (!page || !ALLOWED_PAGES.has(page)) return { ok: false };
    await exec(
      app.db,
      `INSERT INTO page_views (page, view_date, count)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (page, view_date)
       DO UPDATE SET count = page_views.count + 1`,
      [page],
    );
    return { ok: true };
  });
}

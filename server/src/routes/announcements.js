import { adminAnnouncement, normalizeAnnouncementInput, publicAnnouncement } from "../lib/announcements.js";
import { requireAdmin } from "../lib/auth.js";
import { writeAuditLog } from "../lib/audit.js";
import { cleanOrderId } from "../lib/common.js";
import { exec, many, one } from "../lib/db.js";
import { enforceRateLimit } from "../lib/security.js";

export async function announcementRoutes(app) {
  app.get("/api/announcements", async () => {
    const rows = await many(
      app.db,
      `SELECT *
         FROM announcements
        WHERE status = 'active'
          AND (starts_at IS NULL OR starts_at <= now())
          AND (ends_at IS NULL OR ends_at > now())
        ORDER BY priority DESC, id DESC
        LIMIT 5`,
    );
    return { announcements: rows.map(publicAnnouncement) };
  });

  app.get("/api/admin/announcements", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const rows = await many(
      app.db,
      `SELECT *
         FROM announcements
        ORDER BY id DESC
        LIMIT 100`,
    );
    return { announcements: rows.map(adminAnnouncement) };
  });

  app.post("/api/admin/announcements", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:announcements",
      extra: `admin:${auth.user.id}`,
      limit: 20,
      windowSeconds: 300,
      config: app.config,
    });
    if (limited) return limited;

    const input = normalizeAnnouncementInput(request.body || {});
    if (!input.ok) {
      reply.code(400);
      return { error: input.error };
    }

    const value = input.value;
    const row = await one(
      app.db,
      `INSERT INTO announcements
         (title, body, link_label, link_url, priority, status, created_by_user_id, updated_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING *`,
      [value.title, value.body, value.linkLabel, value.linkUrl, value.priority, value.status, auth.user.id],
    );
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      action: "admin.announcement.create",
      resourceType: "announcement",
      resourceId: row.id,
      status: "success",
      httpStatus: 200,
      metadata: { status: row.status, priority: row.priority },
    });
    return { announcement: adminAnnouncement(row) };
  });

  app.patch("/api/admin/announcements/:id", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const id = cleanOrderId(request.params.id);
    if (!id) {
      reply.code(400);
      return { error: "公告编号无效。" };
    }

    const limited = await enforceRateLimit(app.db, request, reply, {
      scope: "admin:announcements",
      extra: `admin:${auth.user.id}`,
      limit: 20,
      windowSeconds: 300,
      config: app.config,
    });
    if (limited) return limited;

    const input = normalizeAnnouncementInput(request.body || {});
    if (!input.ok) {
      reply.code(400);
      return { error: input.error };
    }

    const value = input.value;
    const row = await one(
      app.db,
      `UPDATE announcements
          SET title = $1,
              body = $2,
              link_label = $3,
              link_url = $4,
              priority = $5,
              status = $6,
              updated_by_user_id = $7,
              updated_at = now()
        WHERE id = $8
        RETURNING *`,
      [value.title, value.body, value.linkLabel, value.linkUrl, value.priority, value.status, auth.user.id, id],
    );
    if (!row) {
      reply.code(404);
      return { error: "公告不存在。" };
    }
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      action: "admin.announcement.update",
      resourceType: "announcement",
      resourceId: row.id,
      status: "success",
      httpStatus: 200,
      metadata: { status: row.status, priority: row.priority },
    });
    return { announcement: adminAnnouncement(row) };
  });

  app.delete("/api/admin/announcements/:id", async (request, reply) => {
    const auth = await requireAdmin(app.db, request, reply, app.config);
    if (auth.response) return auth.response;

    const id = cleanOrderId(request.params.id);
    if (!id) {
      reply.code(400);
      return { error: "公告编号无效。" };
    }

    const row = await one(app.db, "DELETE FROM announcements WHERE id = $1 RETURNING *", [id]);
    if (!row) {
      reply.code(404);
      return { error: "公告不存在。" };
    }
    await writeAuditLog(app.db, request, {
      actorUserId: auth.user.id,
      action: "admin.announcement.delete",
      resourceType: "announcement",
      resourceId: row.id,
      status: "success",
      httpStatus: 200,
    });
    return { ok: true };
  });
}

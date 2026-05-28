import { healthStatus } from "../lib/health.js";
import { turnstileEnabled } from "../lib/security.js";

export async function configRoutes(app) {
  app.get("/api/config", async () => ({
    turnstileSiteKey: app.config.turnstileSiteKey || "",
    turnstileEnabled: Boolean(app.config.turnstileSiteKey && turnstileEnabled(app.config)),
  }));

  app.get("/api/health", async (request, reply) => {
    const result = await healthStatus(app.db);
    reply.code(result.httpStatus);
    return result.body;
  });
}

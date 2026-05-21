import { turnstileEnabled } from "../lib/security.js";

export async function configRoutes(app) {
  app.get("/api/config", async () => ({
    turnstileSiteKey: app.config.turnstileSiteKey || "",
    turnstileEnabled: Boolean(app.config.turnstileSiteKey && turnstileEnabled(app.config)),
  }));

  app.get("/api/health", async () => ({ ok: true }));
}

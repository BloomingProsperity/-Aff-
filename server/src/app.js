import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { fivesim } from "./lib/fivesim.js";
import { applyRuntimeSettings } from "./lib/settings.js";
import { isAllowedRequestOrigin, isMutatingRequest } from "./lib/security.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { configRoutes } from "./routes/config.js";
import { smsRoutes } from "./routes/sms.js";
import { statsRoutes } from "./routes/stats.js";

function allowOrigin(config, origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (isAllowedRequestOrigin(origin, config)) {
    callback(null, true);
    return;
  }
  callback(null, false);
}

function originFromReferer(request) {
  const referer = request.headers.referer || "";
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

export async function buildApp({ db, config, fivesimClient = fivesim, logger = true }) {
  const app = Fastify({ logger });
  app.decorate("db", db);
  app.decorate("config", config);
  app.decorate("fivesim", fivesimClient);

  await applyRuntimeSettings(db, config);

  await app.register(cors, {
    origin: (origin, callback) => allowOrigin(config, origin, callback),
    credentials: true,
  });
  await app.register(cookie);

  app.addHook("onRequest", async (request, reply) => {
    if (!isMutatingRequest(request)) return;
    const origin = request.headers.origin || originFromReferer(request);
    if (origin && !isAllowedRequestOrigin(origin, config)) {
      reply.code(403).send({ error: "请求来源无效。" });
    }
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("referrer-policy", "same-origin");
    reply.header("x-frame-options", "DENY");
    reply.header("permissions-policy", "camera=(), microphone=(), geolocation=()");
    return payload;
  });

  await app.register(configRoutes);
  await app.register(authRoutes);
  await app.register(smsRoutes);
  await app.register(statsRoutes);
  await app.register(adminRoutes);

  app.setNotFoundHandler((request, reply) => {
    reply.code(404);
    return { error: "未找到这个操作。" };
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.code(error.statusCode || 500);
    return { error: "请求失败，请稍后重试。" };
  });

  return app;
}

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { fivesim } from "./lib/fivesim.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { configRoutes } from "./routes/config.js";
import { smsRoutes } from "./routes/sms.js";

function allowOrigin(config, origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (!config.corsOrigins.length || config.corsOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(null, false);
}

export async function buildApp({ db, config, fivesimClient = fivesim, logger = true }) {
  const app = Fastify({ logger });
  app.decorate("db", db);
  app.decorate("config", config);
  app.decorate("fivesim", fivesimClient);

  await app.register(cors, {
    origin: (origin, callback) => allowOrigin(config, origin, callback),
    credentials: true,
  });
  await app.register(cookie);

  await app.register(configRoutes);
  await app.register(authRoutes);
  await app.register(smsRoutes);
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

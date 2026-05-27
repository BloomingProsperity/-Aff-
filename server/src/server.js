import { buildApp } from "./app.js";
import { loadConfig } from "./lib/config.js";
import { createPool } from "./lib/db.js";

const config = loadConfig();
const db = createPool(config);
const app = await buildApp({ db, config });

const close = async () => {
  await app.close();
  await db.end();
};

process.on("SIGINT", async () => {
  await close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await close();
  process.exit(0);
});

await app.listen({ port: config.port, host: config.host });

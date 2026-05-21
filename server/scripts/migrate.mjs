import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/lib/config.js";
import { createPool } from "../src/lib/db.js";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const migrationsDir = join(root, "migrations");
const config = loadConfig();
const db = createPool(config);

try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter(name => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const exists = await db.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
    if (exists.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, file), "utf8");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await db.end();
}

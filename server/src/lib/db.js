import pg from "pg";

const { Pool } = pg;

export function createPool(config) {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  return new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

export async function one(db, sql, params = []) {
  const result = await db.query(sql, params);
  return result.rows[0] || null;
}

export async function many(db, sql, params = []) {
  const result = await db.query(sql, params);
  return result.rows;
}

export async function exec(db, sql, params = []) {
  return db.query(sql, params);
}

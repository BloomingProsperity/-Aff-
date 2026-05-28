import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

function quoteCacheDb() {
  const cache = new Map();
  return {
    cache,
    async query(sql, params = []) {
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("INSERT INTO rate_limits")) return { rows: [{ count: 1, reset_at: params[1] }] };
      if (sql.includes("SELECT data_json, expires_at FROM product_cache")) {
        const row = cache.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      if (sql.includes("INSERT INTO product_cache")) {
        cache.set(params[0], { data_json: params[1], expires_at: params[2] });
        return { rows: [] };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test("selected sms quote uses a short public cache to avoid repeated upstream calls", async () => {
  const db = quoteCacheDb();
  const upstreamCalls = [];
  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ FIVESIM_API_KEY: "token", PUBLIC_URL: "https://hkai.shop" }),
    fivesimClient: async (path) => {
      upstreamCalls.push(path);
      if (path === "/guest/products/usa/any") {
        return { ok: true, data: { telegram: { cost: 0.74, count: 9 } } };
      }
      if (path === "/user/profile") {
        return { ok: true, data: { balance: 100 } };
      }
      return { ok: false, status: 404, data: {} };
    },
  });

  try {
    const first = await app.inject({ method: "GET", url: "/api/sms/quote?country=usa&operator=any&product=telegram" });
    const second = await app.inject({ method: "GET", url: "/api/sms/quote?country=usa&operator=any&product=telegram" });

    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    assert.equal(first.headers["x-cache"], "MISS");
    assert.equal(second.headers["x-cache"], "HIT");
    assert.deepEqual(second.json(), { available: true, count: 9, charge: 15.33, currency: "CNY" });
    assert.deepEqual(upstreamCalls, ["/guest/products/usa/any", "/user/profile"]);
  } finally {
    await app.close();
  }
});

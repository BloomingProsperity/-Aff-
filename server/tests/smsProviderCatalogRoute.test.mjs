import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";

function catalogDb() {
  const cache = new Map();
  return {
    async query(sql, params = []) {
      if (sql.includes("FROM app_settings")) return { rows: [] };
      if (sql.includes("INTO rate_limits")) {
        return { rows: [{ count: 1, reset_at: Math.floor(Date.now() / 1000) + 60 }], rowCount: 1 };
      }
      if (sql.includes("SELECT data_json, expires_at FROM product_cache")) {
        const row = cache.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      if (sql.includes("INSERT INTO product_cache")) {
        cache.set(params[0], {
          data_json: params[1],
          expires_at: params[2],
        });
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

test("sms products falls back to configured provider service catalogs when 5sim catalog is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    if (String(url).includes("/service/retrieve_all")) {
      return new Response(JSON.stringify([
        { short_name: "openai", name: "OpenAI / ChatGPT", stock: 7 },
      ]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`Unexpected provider request: ${url}`);
  };

  const app = await buildApp({
    db: catalogDb(),
    logger: false,
    config: loadConfig({
      PUBLIC_URL: "https://hkai.shop",
      SMSPOOL_API_KEY: "sms-pool-secret",
    }),
    fivesimClient: async () => ({ ok: false, status: 502, data: null, error: "5sim unavailable" }),
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/sms/products?country=usa&operator=any",
      headers: { host: "api.hkai.shop" },
    });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.deepEqual(body.openai, { count: 7, currency: "CNY" });
    assert.equal(JSON.stringify(body).includes("sms-pool-secret"), false);
  } finally {
    globalThis.fetch = originalFetch;
    await app.close();
  }
});

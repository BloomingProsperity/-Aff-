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

test("sms countries uses a public cache to avoid repeated upstream calls", async () => {
  const db = quoteCacheDb();
  const upstreamCalls = [];
  const countries = {
    usa: { iso: "US", name: "United States" },
    india: { iso: "IN", name: "India" },
  };
  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ FIVESIM_API_KEY: "token", PUBLIC_URL: "https://hkai.shop" }),
    fivesimClient: async (path) => {
      upstreamCalls.push(path);
      if (path === "/guest/countries") {
        return { ok: true, data: countries };
      }
      return { ok: false, status: 404, data: {} };
    },
  });

  try {
    const first = await app.inject({ method: "GET", url: "/api/sms/countries" });
    const second = await app.inject({ method: "GET", url: "/api/sms/countries" });

    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    assert.equal(first.headers["x-cache"], "MISS");
    assert.equal(second.headers["x-cache"], "HIT");
    assert.deepEqual(second.json(), countries);
    assert.deepEqual(upstreamCalls, ["/guest/countries"]);
  } finally {
    await app.close();
  }
});

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
    assert.deepEqual(second.json(), { available: true, count: 9, charge: 19.9, currency: "CNY" });
    assert.deepEqual(upstreamCalls, ["/guest/products/usa/any", "/user/profile"]);
  } finally {
    await app.close();
  }
});

test("selected sms quote shows out of stock when supplier price exceeds fixed customer price", async () => {
  const db = quoteCacheDb();
  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ FIVESIM_API_KEY: "token", PUBLIC_URL: "https://hkai.shop" }),
    fivesimClient: async (path) => {
      if (path === "/guest/products/usa/any") {
        return { ok: true, data: { telegram: { cost: 3, count: 9 } } };
      }
      if (path === "/user/profile") {
        return { ok: true, data: { balance: 100 } };
      }
      return { ok: false, status: 404, data: {} };
    },
  });

  try {
    const response = await app.inject({ method: "GET", url: "/api/sms/quote?country=usa&operator=any&product=telegram" });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { available: false, count: 0, charge: 0, currency: "CNY" });
  } finally {
    await app.close();
  }
});

test("sms products rejects malformed lookup parts before upstream lookup", async () => {
  const db = quoteCacheDb();
  const upstreamCalls = [];
  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ FIVESIM_API_KEY: "token", PUBLIC_URL: "https://hkai.shop" }),
    fivesimClient: async (path) => {
      upstreamCalls.push(path);
      throw new Error("malformed products request reached upstream");
    },
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: `/api/sms/products?country=${"a".repeat(80)}&operator=any`,
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(upstreamCalls, []);
    assert.equal(db.cache.size, 0);
  } finally {
    await app.close();
  }
});

test("sms quote rejects malformed product before provider routing", async () => {
  const db = quoteCacheDb();
  const upstreamCalls = [];
  const app = await buildApp({
    db,
    logger: false,
    config: loadConfig({ FIVESIM_API_KEY: "token", PUBLIC_URL: "https://hkai.shop" }),
    fivesimClient: async (path) => {
      upstreamCalls.push(path);
      throw new Error("malformed quote request reached upstream");
    },
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/sms/quote?country=usa&operator=any&product=tele gram",
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(upstreamCalls, []);
    assert.equal(db.cache.size, 0);
  } finally {
    await app.close();
  }
});

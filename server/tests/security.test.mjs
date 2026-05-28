import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/lib/config.js";
import { isAllowedAuthEmail } from "../src/lib/common.js";
import {
  isAllowedFetchSite,
  isAllowedRequestHost,
  isAllowedRequestOrigin,
  rateLimitKey,
  turnstileEnabled,
  verifyTurnstile,
} from "../src/lib/security.js";

test("only allows QQ, 163 and Gmail accounts", () => {
  assert.equal(isAllowedAuthEmail("user@qq.com"), true);
  assert.equal(isAllowedAuthEmail("user@163.com"), true);
  assert.equal(isAllowedAuthEmail("USER@GMAIL.COM"), true);
  assert.equal(isAllowedAuthEmail("123@129.com"), false);
  assert.equal(isAllowedAuthEmail("user@hotmail.com"), false);
  assert.equal(isAllowedAuthEmail("user@mail.qq.com"), false);
});

test("rate limit key hashes request identity", async () => {
  const request = new Request("https://api.hkai.shop/api/auth/login", {
    headers: {
      "x-forwarded-for": "203.0.113.10",
      "user-agent": "Mozilla/5.0 test",
    },
  });

  const key = await rateLimitKey(request, "login");
  assert.match(key, /^login:[a-f0-9]{64}$/);
  assert.equal(key.includes("203.0.113.10"), false);
  assert.equal(key.includes("Mozilla"), false);
  assert.equal(await rateLimitKey(request, "login"), key);
});

test("rate limit does not trust spoofed forwarded headers on direct requests", async () => {
  const directA = {
    ip: "198.51.100.7",
    headers: {
      "x-forwarded-for": "203.0.113.10",
      "user-agent": "Mozilla/5.0 test",
    },
  };
  const directB = {
    ip: "198.51.100.7",
    headers: {
      "x-forwarded-for": "203.0.113.99",
      "user-agent": "Mozilla/5.0 test",
    },
  };

  assert.equal(await rateLimitKey(directA, "login"), await rateLimitKey(directB, "login"));
});

test("rate limit trusts forwarded headers only from local proxy", async () => {
  const proxiedA = {
    ip: "127.0.0.1",
    headers: {
      "x-forwarded-for": "203.0.113.10",
      "user-agent": "Mozilla/5.0 test",
    },
  };
  const proxiedB = {
    ip: "127.0.0.1",
    headers: {
      "x-forwarded-for": "203.0.113.99",
      "user-agent": "Mozilla/5.0 test",
    },
  };

  assert.notEqual(await rateLimitKey(proxiedA, "login"), await rateLimitKey(proxiedB, "login"));
});

test("request origin must match configured site origins", () => {
  const config = loadConfig({ PUBLIC_URL: "https://hkai.shop", CORS_ORIGIN: "" });

  assert.equal(isAllowedRequestOrigin("", config), true);
  assert.equal(isAllowedRequestOrigin("https://hkai.shop", config), true);
  assert.equal(isAllowedRequestOrigin("https://evil.example", config), false);
});

test("request host must match the API host allowlist", () => {
  const config = loadConfig({
    PUBLIC_URL: "https://hkai.shop",
    API_ALLOWED_HOSTS: "api.hkai.shop",
  });

  assert.equal(isAllowedRequestHost("api.hkai.shop", config), true);
  assert.equal(isAllowedRequestHost("api.hkai.shop:443", config), true);
  assert.equal(isAllowedRequestHost("localhost:8788", config), true);
  assert.equal(isAllowedRequestHost("127.0.0.1:8788", config), true);
  assert.equal(isAllowedRequestHost("45.8.114.249", config), false);
  assert.equal(isAllowedRequestHost("evil.example", config), false);
});

test("fetch metadata rejects cross-site browser mutations but allows same-site and non-browser requests", () => {
  assert.equal(isAllowedFetchSite({ headers: { "sec-fetch-site": "cross-site" } }), false);
  assert.equal(isAllowedFetchSite({ headers: { "sec-fetch-site": "same-origin" } }), true);
  assert.equal(isAllowedFetchSite({ headers: { "sec-fetch-site": "same-site" } }), true);
  assert.equal(isAllowedFetchSite({ headers: { "sec-fetch-site": "none" } }), true);
  assert.equal(isAllowedFetchSite({ headers: {} }), true);
});

test("api hook blocks cross-site browser mutations before route handlers", async () => {
  const db = { query: async () => ({ rows: [] }) };
  const app = await buildApp({ db, config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }), logger: false });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: {
        "sec-fetch-site": "cross-site",
        origin: "https://evil.example",
      },
    });

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.json(), { error: "请求来源无效。" });
  } finally {
    await app.close();
  }
});

test("api hook rejects non-json mutation bodies before route handlers", async () => {
  const calls = [];
  const db = {
    query: async (sql, params = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      throw new Error(`Non-json mutation reached database: ${sql}`);
    },
  };
  const app = await buildApp({ db, config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }), logger: false });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: {
        host: "api.hkai.shop",
        "content-type": "text/plain",
        origin: "https://hkai.shop",
      },
      payload: "not-json",
    });

    assert.equal(response.statusCode, 415);
    assert.ok(response.json().error);
    assert.equal(calls.some(call => !call.sql.includes("FROM app_settings")), false);
  } finally {
    await app.close();
  }
});

test("api hook blocks direct IP host scans before route handlers", async () => {
  const db = { query: async () => ({ rows: [] }) };
  const app = await buildApp({
    db,
    config: loadConfig({
      PUBLIC_URL: "https://hkai.shop",
      API_ALLOWED_HOSTS: "api.hkai.shop",
    }),
    logger: false,
  });
  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: { host: "45.8.114.249" },
    });

    assert.equal(response.statusCode, 421);
    assert.ok(response.json().error);
  } finally {
    await app.close();
  }
});

test("api responses disable browser and proxy caching", async () => {
  const db = { query: async () => ({ rows: [] }) };
  const app = await buildApp({ db, config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }), logger: false });
  try {
    const response = await app.inject({ method: "GET", url: "/api/auth/me" });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal(response.headers.pragma, "no-cache");
    assert.equal(response.headers.expires, "0");
  } finally {
    await app.close();
  }
});

test("api rejects oversized JSON bodies before route handlers", async () => {
  const calls = [];
  const db = {
    query: async (sql, params = []) => {
      calls.push({ sql, params });
      if (sql.includes("FROM app_settings")) return { rows: [] };
      throw new Error(`Oversized request reached database: ${sql}`);
    },
  };
  const app = await buildApp({ db, config: loadConfig({ PUBLIC_URL: "https://hkai.shop" }), logger: false });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        host: "api.hkai.shop",
        "content-type": "application/json",
      },
      payload: JSON.stringify({
        email: "buyer@gmail.com",
        password: "correct-password",
        padding: "x".repeat(70 * 1024),
      }),
    });

    assert.equal(response.statusCode, 413);
    assert.equal(calls.some(call => !call.sql.includes("FROM app_settings")), false);
  } finally {
    await app.close();
  }
});

test("secure cookies default on for production and https public url", () => {
  assert.equal(loadConfig({ NODE_ENV: "production" }).cookieSecure, true);
  assert.equal(loadConfig({ PUBLIC_URL: "https://hkai.shop" }).cookieSecure, true);
  assert.equal(loadConfig({ PUBLIC_URL: "http://localhost:4321" }).cookieSecure, false);
  assert.equal(loadConfig({ COOKIE_SECURE: "false", NODE_ENV: "production" }).cookieSecure, false);
});

test("api server binds to localhost unless explicitly changed", () => {
  assert.equal(loadConfig({}).host, "127.0.0.1");
  assert.equal(loadConfig({ HOST: "0.0.0.0" }).host, "0.0.0.0");
});

test("turnstile is optional until a secret is configured", () => {
  assert.equal(turnstileEnabled({}), false);
  assert.equal(turnstileEnabled({ turnstileSecretKey: "secret" }), true);
});

test("turnstile verification records safe failure diagnostics", async () => {
  const originalFetch = globalThis.fetch;
  const logs = [];
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: false,
    "error-codes": ["invalid-input-secret"],
    hostname: "hkai.shop",
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const config = { turnstileSecretKey: "secret-value" };
  const reply = {
    statusCode: 200,
    code(value) {
      this.statusCode = value;
      return this;
    },
  };
  const request = {
    headers: {},
    ip: "127.0.0.1",
    log: {
      warn(payload, message) {
        logs.push({ level: "warn", payload, message });
      },
      info(payload, message) {
        logs.push({ level: "info", payload, message });
      },
    },
  };

  try {
    const result = await verifyTurnstile(config, request, reply, "token-value");

    assert.equal(reply.statusCode, 400);
    assert.ok(result?.error);
    assert.equal(config.turnstileLastResult.success, false);
    assert.deepEqual(config.turnstileLastResult.errorCodes, ["invalid-input-secret"]);
    assert.equal(config.turnstileLastResult.hostname, "hkai.shop");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].level, "warn");
    assert.deepEqual(logs[0].payload.turnstile.errorCodes, ["invalid-input-secret"]);
    assert.equal(JSON.stringify(logs).includes("token-value"), false);
    assert.equal(JSON.stringify(logs).includes("secret-value"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

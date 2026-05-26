import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/lib/config.js";
import { isAllowedAuthEmail } from "../src/lib/common.js";
import { isAllowedRequestOrigin, rateLimitKey, turnstileEnabled } from "../src/lib/security.js";

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

test("secure cookies default on for production and https public url", () => {
  assert.equal(loadConfig({ NODE_ENV: "production" }).cookieSecure, true);
  assert.equal(loadConfig({ PUBLIC_URL: "https://hkai.shop" }).cookieSecure, true);
  assert.equal(loadConfig({ PUBLIC_URL: "http://localhost:4321" }).cookieSecure, false);
  assert.equal(loadConfig({ COOKIE_SECURE: "false", NODE_ENV: "production" }).cookieSecure, false);
});

test("turnstile is optional until a secret is configured", () => {
  assert.equal(turnstileEnabled({}), false);
  assert.equal(turnstileEnabled({ turnstileSecretKey: "secret" }), true);
});

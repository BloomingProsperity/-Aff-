import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedAuthEmail } from "../src/lib/common.js";
import { rateLimitKey, turnstileEnabled } from "../src/lib/security.js";

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

test("turnstile is optional until a secret is configured", () => {
  assert.equal(turnstileEnabled({}), false);
  assert.equal(turnstileEnabled({ turnstileSecretKey: "secret" }), true);
});

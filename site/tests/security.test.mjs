import assert from "node:assert/strict";
import { isAllowedAuthEmail } from "../functions/_lib/common.js";
import { rateLimitKey, turnstileEnabled, turnstileSiteKey, verifyTurnstile } from "../functions/_lib/security.js";

const request = new Request("https://hkai.shop/api/auth/login", {
  headers: {
    "cf-connecting-ip": "203.0.113.10",
    "user-agent": "Mozilla/5.0 test",
  },
});

const key = await rateLimitKey(request, "login");
assert.match(key, /^login:[a-f0-9]{64}$/);
assert.equal(key.includes("203.0.113.10"), false);
assert.equal(key.includes("Mozilla"), false);

const second = await rateLimitKey(request, "login");
assert.equal(second, key);

const differentScope = await rateLimitKey(request, "register");
assert.notEqual(differentScope, key);

assert.equal(isAllowedAuthEmail("user@qq.com"), true);
assert.equal(isAllowedAuthEmail("user@163.com"), true);
assert.equal(isAllowedAuthEmail("user@gmail.com"), true);
assert.equal(isAllowedAuthEmail("USER@GMAIL.COM"), true);
assert.equal(isAllowedAuthEmail("123@129.com"), false);
assert.equal(isAllowedAuthEmail("user@hotmail.com"), false);
assert.equal(isAllowedAuthEmail("user@mail.qq.com"), false);

assert.equal(turnstileEnabled({}), false);
assert.equal(turnstileEnabled({ TURNSTILE_SECRET_KEY: "secret" }), true);
assert.equal(turnstileSiteKey({ TURNSTILE_SITE_KEY: "site" }), "site");
assert.equal(await verifyTurnstile({}, request, ""), null);

console.log("security tests passed");

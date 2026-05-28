import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isAllowedAuthEmail } from "../../server/src/lib/common.js";
import { rateLimitKey, turnstileEnabled, verifyTurnstile } from "../../server/src/lib/security.js";

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
assert.equal(turnstileEnabled({ turnstileSecretKey: "secret" }), true);
assert.equal(await verifyTurnstile({}, request, {}, ""), null);

const smsSource = await readFile(new URL("../static/sms.jsx", import.meta.url), "utf8");
assert.match(smsSource, /className="sms-password-wrap"[\s\S]*maxLength=\{128\}/);

console.log("security tests passed");

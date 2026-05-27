import assert from "node:assert/strict";
import test from "node:test";
import { auditClientIp, auditUserAgent, sanitizeAuditMetadata } from "../src/lib/audit.js";

test("audit metadata redacts secrets and keeps useful context", () => {
  const meta = sanitizeAuditMetadata({
    email: "user@gmail.com",
    password: "plain-password",
    turnstileToken: "token-value",
    nested: {
      apiSecret: "secret-value",
      orderId: 123,
    },
    list: [{ key: "hidden" }, "ok"],
  });

  assert.equal(meta.email, "user@gmail.com");
  assert.equal(meta.password, "[redacted]");
  assert.equal(meta.turnstileToken, "[redacted]");
  assert.equal(meta.nested.apiSecret, "[redacted]");
  assert.equal(meta.nested.orderId, 123);
  assert.equal(meta.list[0].key, "[redacted]");
  assert.equal(meta.list[1], "ok");
});

test("audit client ip prefers Cloudflare visitor ip behind local proxy", () => {
  const request = {
    ip: "127.0.0.1",
    headers: {
      "cf-connecting-ip": "203.0.113.9",
      "x-forwarded-for": "198.51.100.8, 10.0.0.2",
    },
  };

  assert.equal(auditClientIp(request), "203.0.113.9");
});

test("audit user agent is bounded and printable", () => {
  const request = {
    headers: {
      "user-agent": `Mozilla ${"x".repeat(400)}\nnext-line`,
    },
  };

  const ua = auditUserAgent(request);
  assert.equal(ua.includes("\n"), false);
  assert.equal(ua.length, 240);
});

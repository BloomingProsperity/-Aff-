import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const headersText = await readFile(new URL("../static/_headers", import.meta.url), "utf8");
const tokensCss = await readFile(new URL("../static/tokens.css", import.meta.url), "utf8");

function readHeadersFor(path) {
  const lines = headersText.split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === path);
  assert.notEqual(start, -1, `${path} rule should exist in _headers`);

  const headers = new Map();
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) continue;
    if (!line.startsWith("  ")) break;
    const [name, ...valueParts] = line.trim().split(":");
    headers.set(name.toLowerCase(), valueParts.join(":").trim());
  }
  return headers;
}

const headers = readHeadersFor("/*");
const csp = headers.get("content-security-policy") || "";

assert.equal(headers.get("x-content-type-options"), "nosniff");
assert.equal(headers.get("x-frame-options"), "DENY");
assert.equal(headers.get("referrer-policy"), "same-origin");
assert.equal(headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
assert.match(headers.get("strict-transport-security") || "", /max-age=31536000/);

assert.match(csp, /default-src 'self'/);
assert.match(csp, /script-src .*https:\/\/challenges\.cloudflare\.com/);
assert.equal(csp.includes("'unsafe-eval'"), false);
assert.match(csp, /connect-src .*https:\/\/api\.hkai\.shop/);
assert.match(csp, /frame-src https:\/\/challenges\.cloudflare\.com/);
assert.match(csp, /frame-ancestors 'none'/);

assert.equal(tokensCss.includes("fonts.googleapis.com"), false, "static CSS should not load external Google Fonts blocked by CSP");

console.log("static headers tests passed");

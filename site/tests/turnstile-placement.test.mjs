import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const turnstileScript = "https://challenges.cloudflare.com/turnstile/v0/api.js";

const indexHtml = await readFile(new URL("../static/index.html", import.meta.url), "utf8");
const smsJsx = await readFile(new URL("../static/sms.jsx", import.meta.url), "utf8");
const smsDeskStart = smsJsx.indexOf("function SmsDesk()");
const smsDeskEnd = smsJsx.indexOf("function LoginDesk()");
const smsDeskSource = smsJsx.slice(smsDeskStart, smsDeskEnd);

assert.equal(
  indexHtml.includes(turnstileScript),
  false,
  "Turnstile script should not load on every page from the shared HTML shell",
);

assert.equal(
  smsJsx.includes(turnstileScript),
  true,
  "Login component should load Turnstile only when the login flow needs it",
);

assert.equal(
  smsDeskSource.includes("turnstile"),
  false,
  "SMS buying page should not load or manage Turnstile; verification belongs to the login flow",
);

assert.equal(
  smsJsx.includes('retry: "never"'),
  false,
  "Turnstile should be allowed to retry automatically so normal logins do not get stuck",
);

assert.equal(
  smsJsx.includes('"refresh-timeout"'),
  false,
  "Non-interactive Turnstile ignores refresh-timeout, so the login flow should not set it",
);

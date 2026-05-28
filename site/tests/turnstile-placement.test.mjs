import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const turnstileScript = "https://challenges.cloudflare.com/turnstile/v0/api.js";

const indexHtml = await readFile(new URL("../static/index.html", import.meta.url), "utf8");
const smsJsx = await readFile(new URL("../static/sms.jsx", import.meta.url), "utf8");

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

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../scripts/deploy-vps.ps1", import.meta.url), "utf8");

assert.match(source, /greencloud_hkai_api_rsa/);
assert.match(source, /--exclude\s+node_modules/);
assert.match(source, /--exclude\s+\.env/);
assert.match(source, /APP_COMMIT/);
assert.match(source, /npm ci --omit=dev/);
assert.match(source, /npm run migrate/);
assert.match(source, /systemctl restart hkai-sms/);
assert.doesNotMatch(source, /FIVESIM_API_KEY\s*=/);
assert.doesNotMatch(source, /SMSPOOL_API_KEY\s*=/);
assert.doesNotMatch(source, /TURNSTILE_SECRET_KEY\s*=/);

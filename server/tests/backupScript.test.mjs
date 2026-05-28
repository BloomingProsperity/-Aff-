import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../scripts/install-db-backup.ps1", import.meta.url), "utf8");

assert.match(source, /greencloud_hkai_api_rsa/);
assert.match(source, /hkai-db-backup\.sh/);
assert.match(source, /hkai-db-backup\.service/);
assert.match(source, /hkai-db-backup\.timer/);
assert.match(source, /pg_dump/);
assert.match(source, /gzip -9/);
assert.match(source, /sha256sum/);
assert.match(source, /find "\$BACKUP_DIR" -type f/);
assert.match(source, /OnCalendar=/);
assert.match(source, /RandomizedDelaySec=/);
assert.match(source, /systemctl enable --now hkai-db-backup\.timer/);
assert.match(source, /WriteAllText/);
assert.doesNotMatch(source, /echo\s+\$DATABASE_URL/);
assert.doesNotMatch(source, /pg_dump\s+["']?\$DATABASE_URL/);
assert.doesNotMatch(source, /FIVESIM_API_KEY\s*=/);
assert.doesNotMatch(source, /SMSPOOL_API_KEY\s*=/);
assert.doesNotMatch(source, /TURNSTILE_SECRET_KEY\s*=/);

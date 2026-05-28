import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminJsx = await readFile(new URL("../static/admin.jsx", import.meta.url), "utf8");

assert.equal(
  adminJsx.includes("backup = {}"),
  true,
  "admin overview should read backup status from stats",
);
assert.equal(
  adminJsx.includes("数据库备份"),
  true,
  "admin overview should show database backup status",
);
assert.equal(
  adminJsx.includes("backup.status"),
  true,
  "admin overview should map backup status to user-facing state",
);

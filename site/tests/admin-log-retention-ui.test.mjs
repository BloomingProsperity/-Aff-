import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminJsx = await readFile(new URL("../static/admin.jsx", import.meta.url), "utf8");

assert.equal(
  adminJsx.includes("/admin/log-retention/run"),
  true,
  "admin overview should expose a manual log retention cleanup action",
);
assert.equal(
  adminJsx.includes("cleanOldLogs"),
  true,
  "manual log retention cleanup should refresh overview state after running",
);
assert.equal(
  adminJsx.includes("/admin/housekeeping/run"),
  true,
  "admin overview should expose a manual temporary data cleanup action",
);
assert.equal(
  adminJsx.includes("cleanHousekeeping"),
  true,
  "manual temporary data cleanup should refresh overview state after running",
);

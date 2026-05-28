import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminJsx = await readFile(new URL("../static/admin.jsx", import.meta.url), "utf8");

assert.equal(
  adminJsx.includes("item.message"),
  true,
  "admin provider health rows should show the safe backend status message",
);

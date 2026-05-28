import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminJsx = await readFile(new URL("../static/admin.jsx", import.meta.url), "utf8");

assert.equal(adminJsx.includes("function AdminUsers({ currentUser })"), true);
assert.equal(adminJsx.includes("isCurrentAdminUser"), true);
assert.equal(adminJsx.includes("当前管理员"), true);
assert.equal(adminJsx.includes('<AdminUsers currentUser={user} />'), true);

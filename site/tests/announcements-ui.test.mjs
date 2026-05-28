import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appJsx = await readFile(new URL("../static/app.jsx", import.meta.url), "utf8");
const adminJsx = await readFile(new URL("../static/admin.jsx", import.meta.url), "utf8");

assert.equal(appJsx.includes("/api/announcements"), true, "home promo bar should load public announcements");
assert.equal(adminJsx.includes("AdminAnnouncements"), true, "admin should include announcement management");
assert.equal(adminJsx.includes("/admin/announcements"), true, "admin should call announcement API");
assert.equal(adminJsx.includes("开始显示"), true, "admin announcement form should support a start time");
assert.equal(adminJsx.includes("结束显示"), true, "admin announcement form should support an end time");
assert.equal(adminJsx.includes("公告已下线"), true, "admin should support one-click announcement pause");

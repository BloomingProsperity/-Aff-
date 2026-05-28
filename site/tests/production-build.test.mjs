import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const distDir = join(projectRoot, "dist");

await execFileAsync(process.execPath, ["scripts/build-static.mjs"], { cwd: projectRoot });

const indexHtml = await readFile(join(distDir, "index.html"), "utf8");
const headersText = await readFile(join(distDir, "_headers"), "utf8");

assert.equal(indexHtml.includes("/vendor/babel.min.js"), false, "production HTML should not load browser Babel");
assert.equal(indexHtml.includes('type="text/babel"'), false, "production HTML should not ship JSX scripts");
assert.match(indexHtml, /\/assets\/detail\.js/);
assert.match(indexHtml, /\/assets\/sms\.js/);
assert.match(indexHtml, /\/assets\/admin\.js/);
assert.match(indexHtml, /\/assets\/app\.js/);
assert.match(indexHtml, /<script defer src="\/assets\/detail\.js"><\/script>/);
assert.match(indexHtml, /<script defer src="\/assets\/app\.js"><\/script>/);

for (const file of ["detail.js", "sms.js", "admin.js", "app.js"]) {
  const compiled = await readFile(join(distDir, "assets", file), "utf8");
  assert.match(compiled, /^\(\(\) => \{\n/);
  assert.match(compiled, /\n\}\)\(\);\n?$/);
  if (file === "sms.js") {
    assert.match(compiled, /const \{\s*useState\s*\} = React;/);
    assert.match(compiled, /const \{\s*DetailHeader\s*\} = window;/);
  }
}

for (const file of ["detail.jsx", "sms.jsx", "admin.jsx", "app.jsx"]) {
  await assert.rejects(
    access(join(distDir, file), constants.F_OK),
    /ENOENT/,
    `production dist should not ship ${file}`,
  );
}
await assert.rejects(
  access(join(distDir, "vendor", "babel.min.js"), constants.F_OK),
  /ENOENT/,
  "production dist should not ship browser Babel",
);

const csp = headersText.match(/Content-Security-Policy:\s*(.+)/)?.[1] || "";
assert.equal(csp.includes("'unsafe-eval'"), false, "production CSP should not allow unsafe-eval");
assert.match(csp, /https:\/\/challenges\.cloudflare\.com/);

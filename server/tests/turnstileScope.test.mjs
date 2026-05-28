import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const routesDir = new URL("../src/routes/", import.meta.url);
const routeFiles = (await readdir(routesDir)).filter(name => name.endsWith(".js"));

const filesUsingTurnstile = [];
for (const file of routeFiles) {
  const source = await readFile(new URL(file, routesDir), "utf8");
  if (source.includes("verifyTurnstile") || source.includes("turnstileToken")) {
    filesUsingTurnstile.push(file);
  }
}

assert.deepEqual(
  filesUsingTurnstile,
  ["auth.js"],
  "Only login/register auth routes should verify Turnstile tokens",
);

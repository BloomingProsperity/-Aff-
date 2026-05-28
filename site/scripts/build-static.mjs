import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, '..');
const distDir = join(projectRoot, 'dist');
const publicDir = join(projectRoot, 'public');
const staticDir = join(projectRoot, 'static');

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(from, to) {
  if (!(await exists(from))) return 0;
  await cp(from, to, { recursive: true, force: true });
  return (await readdir(from)).length;
}

async function loadBabel() {
  const source = await readFile(join(staticDir, 'vendor', 'babel.min.js'), 'utf8');
  const sandbox = { console, setTimeout, clearTimeout };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  if (!sandbox.Babel?.transform) {
    throw new Error('Unable to load Babel for static production build');
  }
  return sandbox.Babel;
}

async function compileJsxAssets() {
  const babel = await loadBabel();
  const assetsDir = join(distDir, 'assets');
  await mkdir(assetsDir, { recursive: true });

  for (const name of ['detail', 'sms', 'admin', 'app']) {
    const source = await readFile(join(staticDir, `${name}.jsx`), 'utf8');
    const hookAliases = name === 'sms'
      ? 'const { useState } = React;\nconst { DetailHeader } = window;\n'
      : '';
    const result = babel.transform(source, {
      presets: ['react'],
      filename: `${name}.jsx`,
      sourceType: 'script',
      compact: false,
      comments: false,
    });
    await writeFile(join(assetsDir, `${name}.js`), `(() => {\n${hookAliases}${result.code}\n})();\n`, 'utf8');
  }
}

async function rewriteProductionShell() {
  const indexPath = join(distDir, 'index.html');
  let html = await readFile(indexPath, 'utf8');
  html = html.replace(/\r?\n?<script src="\/vendor\/babel\.min\.js[^"]*"><\/script>/, '');
  html = html.replace(
    /<script type="text\/babel" src="\/(detail|sms|admin|app)\.jsx[^"]*"><\/script>/g,
    '<script defer src="/assets/$1.js"></script>',
  );
  await writeFile(indexPath, html, 'utf8');

  const headersPath = join(distDir, '_headers');
  if (await exists(headersPath)) {
    const headers = await readFile(headersPath, 'utf8');
    await writeFile(headersPath, headers.replace(/\s+'unsafe-eval'/g, ''), 'utf8');
  }
}

async function removeDevelopmentAssets() {
  await Promise.all(
    ['detail.jsx', 'sms.jsx', 'admin.jsx', 'app.jsx', join('vendor', 'babel.min.js')]
      .map(name => rm(join(distDir, name), { force: true }))
  );
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const publicCount = await copyDir(publicDir, distDir);
const staticCount = await copyDir(staticDir, distDir);
const distEntries = await readdir(distDir);

await Promise.all(
  distEntries
    .filter(name => (
      name.startsWith('.') ||
      name === 'README.md' ||
      name === 'blogs.html' ||
      /^compare(?:-[a-z0-9]+)?\.html$/i.test(name)
    ))
    .map(name => rm(join(distDir, name), { recursive: true, force: true }))
);

await compileJsxAssets();
await rewriteProductionShell();
await removeDevelopmentAssets();

console.log(`Static build complete: copied ${publicCount} public entries and ${staticCount} static entries to dist.`);

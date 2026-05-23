import { access, cp, mkdir, readdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

console.log(`Static build complete: copied ${publicCount} public entries and ${staticCount} static entries to dist.`);

import './build-static.mjs';

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(join(scriptDir, '..', 'dist'));
const port = Number(process.env.PORT || 4321);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function safeFilePath(url, isDirectory = false) {
  const requestUrl = new URL(url, 'http://localhost');
  const pathname = decodeURIComponent(requestUrl.pathname);
  const target = resolve(normalize(join(distDir, pathname)));
  if (!target.startsWith(distDir)) return null;
  return isDirectory ? join(target, 'index.html') : target;
}

async function findFile(reqUrl) {
  const direct = safeFilePath(reqUrl);
  if (!direct) return null;

  try {
    const info = await stat(direct);
    if (info.isDirectory()) return safeFilePath(reqUrl, true);
    if (info.isFile()) return direct;
  } catch {}

  return join(distDir, 'index.html');
}

const server = createServer(async (req, res) => {
  const file = await findFile(req.url || '/');
  if (!file) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const type = types[extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Serving static site at http://localhost:${port}`);
});

// Minimal static server for local development: `npm run dev` → http://localhost:3000
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
};

http.createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/') path = '/index.html';
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
  const type = types[extname(safe)];
  if (!type || safe.includes('node_modules') || safe.startsWith('/.')) { res.writeHead(404); res.end(); return; }
  try {
    const data = await readFile(join(root, safe));
    res.writeHead(200, { 'Content-Type': type }); res.end(data);
  } catch { res.writeHead(404); res.end(); }
}).listen(3000, '0.0.0.0', () => console.log('http://localhost:3000'));

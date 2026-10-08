import { mkdir, copyFile, readdir, rm } from 'node:fs/promises';

const FILES = ['index.html', 'app.css', 'app.js', 'data.js', 'sw.js', 'manifest.webmanifest',
  'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
for (const f of FILES) await copyFile(f, `dist/${f}`);
let n = 0;
for (const f of await readdir('assets')) if (f.endsWith('.webp')) { await copyFile(`assets/${f}`, `dist/assets/${f}`); n++; }
console.log(`Built ${FILES.length} app files and ${n} motion images into dist/`);

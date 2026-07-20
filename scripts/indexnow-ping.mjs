import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const host = 'motodok.com';
const key = '6f80ff50c19440d4a15174119746fcd2';
const keyLocation = `https://${host}/${key}.txt`;
const manifestPath = join(root, '.cache', 'indexnow-manifest.json');

const sitemap = readFileSync(join(root, 'dist', 'sitemap.xml'), 'utf-8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

const previousManifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
  : {};

const manifest = {};
const changedUrls = [];

for (const url of urls) {
  const path = new URL(url).pathname;
  const filePath = join(root, 'dist', path, 'index.html');
  const html = readFileSync(filePath, 'utf-8');
  const hash = createHash('sha256').update(html).digest('hex');
  manifest[url] = hash;
  if (previousManifest[url] !== hash) changedUrls.push(url);
}

mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

if (changedUrls.length === 0) {
  console.log('IndexNow: no changed pages, skipping ping');
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation, urlList: changedUrls }),
});

if (!res.ok) {
  console.error(`IndexNow ping failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}

console.log(`IndexNow: pinged ${changedUrls.length}/${urls.length} changed URLs (${res.status})`);

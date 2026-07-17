import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const sitemap0 = join(dist, 'sitemap-0.xml');
const sitemapIndex = join(dist, 'sitemap-index.xml');
const sitemap = join(dist, 'sitemap.xml');

if (existsSync(sitemap0)) {
  const content = readFileSync(sitemap0, 'utf-8');
  writeFileSync(sitemap, content);
  unlinkSync(sitemap0);
  console.log('sitemap-0.xml → sitemap.xml');
}

if (existsSync(sitemapIndex)) {
  unlinkSync(sitemapIndex);
  console.log('removed sitemap-index.xml');
}

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const SRC = join(import.meta.dirname, '../../old/motodok.com');
const DST = join(import.meta.dirname, '../content');

const COLLECTION_MAP = {
  Articles: { collection: 'articles', type: 'content' },
  News: { collection: 'news', type: 'content' },
  Services: { collection: 'services', type: 'content' },
  Diagnosis: { collection: 'products', type: 'content', category: 'diagnosis' },
  Immobilizer: { collection: 'products', type: 'content', category: 'immobilizer' },
  Measure: { collection: 'products', type: 'content', category: 'measure' },
  Odometers: { collection: 'products', type: 'content', category: 'odometers' },
  Databases: { collection: 'products', type: 'content', category: 'databases' },
};

const ROOT_PAGES = {
  'Contacts.html': { slug: 'contacts', order: 30 },
  'How-to-buy.html': { slug: 'how-to-buy', order: 20 },
  'Prices.html': { slug: 'prices', order: 15 },
};

const CATEGORY_MAP = {
  diagnosis: { title: 'Диагностика', slug: 'diagnosis', description: 'Диагностическое оборудование для автомобилей', order: 1 },
  immobilizer: { title: 'Иммобилайзеры', slug: 'immobilizer', description: 'Оборудование для работы с иммобилайзерами', order: 3 },
  measure: { title: 'Осциллографы', slug: 'measure', description: 'Измерительное оборудование и осциллографы', order: 4 },
  odometers: { title: 'Одометры', slug: 'odometers', description: 'Оборудование для коррекции одометров', order: 5 },
  databases: { title: 'Базы данных', slug: 'databases', description: 'Автомобильные базы данных и каталоги', order: 2 },
};

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
});

function extractTitle($) {
  let title = '';
  const h1 = $('.page-content .container h1').first();
  if (h1.length) {
    title = h1.text().trim();
  }
  if (!title) {
    const h1Any = $('h1').first();
    if (h1Any.length) title = h1Any.text().trim();
  }
  if (!title) {
    title = $('title').text().trim();
  }
  return title.replace(/\s*\|\s*Motodok\s*$/, '').trim();
}

function extractContentHtml($) {
  const container = $('.page-content .container').first();
  if (!container.length) return '';
  const h1 = container.find('h1').first();
  if (h1.length) h1.remove();
  return container.html() || '';
}

function normalizeImages($, baseDir) {
  $('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (src) $el.attr('src', resolveImagePath(src, baseDir));
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\wа-яё\s-]/gi, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || 'untitled';
}

function safeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || 'untitled';
}

function parsePrice(text) {
  const match = text.match(/(\d+[\s\d]*)/);
  if (match) return parseFloat(match[1].replace(/\s/g, ''));
  return undefined;
}

function frontmatter(obj) {
  let yaml = '---\n';
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      const needsQuotes = /[:\-#\[\]{},"']/.test(val) || val.includes('\n');
      if (val === '') continue;
      yaml += needsQuotes ? `${key}: "${val.replace(/"/g, '\\"')}"\n` : `${key}: ${val}\n`;
    } else if (typeof val === 'number') {
      yaml += `${key}: ${val}\n`;
    } else if (typeof val === 'boolean') {
      yaml += `${key}: ${val}\n`;
    } else if (Array.isArray(val) && val.length > 0) {
      yaml += `${key}:\n${val.map(v => `  - ${v}`).join('\n')}\n`;
    }
  }
  yaml += '---\n\n';
  return yaml;
}

function isRedirect(html) {
  return /<meta[^>]*http-equiv\s*=\s*["']?refresh["'\s>]/i.test(html);
}

function escapeMdx(text) {
  return text.replace(/<(?![/!a-zA-Z])/g, '&lt;');
}

function resolveImagePath(src, baseDir) {
  if (!src || src.startsWith('http') || src.startsWith('/') || src.startsWith('data:')) return src;
  const parts = [];
  const srcParts = src.split('/');
  const baseParts = baseDir.split('/').filter(Boolean);
  for (const part of srcParts) {
    if (part === '..') baseParts.pop();
    else if (part !== '.') parts.push(part);
  }
  return '/' + [...baseParts, ...parts].join('/');
}

async function processProduct(dirName, fileName, filePath) {
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  normalizeImages($, dirName);
  const title = extractTitle($);
  if (!title) return null;
  const slug = safeSlug(basename(fileName, '.html'));
  const bodyHtml = extractContentHtml($);
  const body = turndown.turndown(bodyHtml);
  const info = COLLECTION_MAP[dirName];
  const meta = {
    title,
    category: info.category,
    inStock: true,
  };
  if (body.includes('$') || body.includes('USD') || body.includes('usd')) meta.currency = 'USD';
  const priceMatch = body.match(/(?:Цена|Price|price)[:\s]*\$?(\d[\d\s]*)/i);
  if (priceMatch) meta.price = parsePrice(priceMatch[1]);
  const imgEls = $('.page-content .container img');
  const images = [];
  imgEls.each((_, el) => {
    const src = $(el).attr('src');
    if (src) images.push(src);
  });
  if (images.length > 0) meta.images = images;
  return { slug, body, meta };
}

async function processArticle(dirName, fileName, filePath) {
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  normalizeImages($, dirName);
  const title = extractTitle($);
  if (!title) return null;
  const slug = safeSlug(basename(fileName, '.html'));
  const bodyHtml = extractContentHtml($);
  const body = turndown.turndown(bodyHtml);
  const meta = { title };
  const imgEl = $('.page-content .container img').first();
  if (imgEl.length) meta.image = imgEl.attr('src');
  return { slug, body, meta };
}

async function processNews(dirName, fileName, filePath) {
  return processArticle(dirName, fileName, filePath);
}

async function processService(dirName, fileName, filePath) {
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  normalizeImages($, dirName);
  const title = extractTitle($);
  const slug = safeSlug(basename(fileName, '.html'));
  const bodyHtml = extractContentHtml($);
  const body = turndown.turndown(bodyHtml);
  const meta = { title };
  const imgEl = $('.page-content .container img').first();
  if (imgEl.length) meta.image = imgEl.attr('src');
  const priceMatch = body.match(/(?:Цена|Price|price|Стоимость)[:\s]*\$?(\d+[\d\s]*)/i);
  if (priceMatch) meta.price = parsePrice(priceMatch[1])?.toString();
  return { slug, body, meta };
}

async function processPage(fileName, filePath, pageConfig) {
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  normalizeImages($, '');
  const title = extractTitle($);
  if (!title) return null;
  const slug = pageConfig.slug;
  const bodyHtml = extractContentHtml($);
  const body = turndown.turndown(bodyHtml);
  const meta = { title, order: pageConfig.order };
  return { slug, body, meta };
}

async function processDocumentation(filePath) {
  const html = readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  normalizeImages($, '');
  const title = extractTitle($);
  if (!title) return null;
  const bodyHtml = extractContentHtml($);
  const body = turndown.turndown(bodyHtml);
  const meta = { title, order: 40 };
  return { slug: 'documentation', body, meta };
}

async function main() {
  const entries = readdirSync(SRC, { withFileTypes: true });

  const results = [];

  const SKIP_FILES = new Set(['index.html']);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirName = entry.name;
    const info = COLLECTION_MAP[dirName];
    if (!info) continue;
    const dirPath = join(SRC, dirName);
    const files = readdirSync(dirPath).filter(f => f.endsWith('.html'));
    for (const file of files) {
      if (SKIP_FILES.has(file)) continue;
      const filePath = join(dirPath, file);
      if (!statSync(filePath).isFile()) continue;
      const rawHtml = readFileSync(filePath, 'utf-8');
      if (isRedirect(rawHtml)) continue;
      try {
        let result;
        if (info.collection === 'products') {
          result = await processProduct(dirName, file, filePath);
        } else if (info.collection === 'articles') {
          result = await processArticle(dirName, file, filePath);
        } else if (info.collection === 'news') {
          result = await processNews(dirName, file, filePath);
        } else if (info.collection === 'services') {
          result = await processService(dirName, file, filePath);
        }
        if (!result) continue;
        results.push({ ...result, collection: info.collection });
        console.log(`  ${info.collection}/${result.slug}.mdx`);
      } catch (err) {
        console.error(`  ERROR ${dirName}/${file}: ${err.message}`);
      }
    }
  }

  for (const [fileName, config] of Object.entries(ROOT_PAGES)) {
    const filePath = join(SRC, fileName);
    if (!existsSync(filePath)) continue;
    const rawHtml = readFileSync(filePath, 'utf-8');
    if (isRedirect(rawHtml)) continue;
    try {
      const result = await processPage(fileName, filePath, config);
      if (!result) continue;
      results.push({ ...result, collection: 'pages' });
      console.log(`  pages/${result.slug}.mdx`);
    } catch (err) {
      console.error(`  ERROR ${fileName}: ${err.message}`);
    }
  }

  const docPath = join(SRC, 'Documentation/index.html');
  if (existsSync(docPath)) {
    try {
      const result = await processDocumentation(docPath);
      if (result) {
        results.push({ ...result, collection: 'pages' });
        console.log(`  pages/documentation.mdx`);
      }
    } catch (err) {
      console.error(`  ERROR Documentation/index.html: ${err.message}`);
    }
  }

  for (const result of results) {
    const outDir = join(DST, result.collection);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const content = frontmatter(result.meta) + escapeMdx(result.body);
    writeFileSync(join(outDir, `${result.slug}.mdx`), content, 'utf-8');
  }

  console.log(`\nDone: ${results.length} files`);
}

main().catch(console.error);

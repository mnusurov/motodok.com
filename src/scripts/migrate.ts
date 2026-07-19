import { readFileSync, readdirSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, basename, extname, dirname, parse } from 'path';

const OLD_DIST = join(process.cwd(), 'old', 'dist');
const ASTRO_DIR = process.cwd();
const CONTENT_DIR = join(ASTRO_DIR, 'src/content');
const IMAGES_DIR = join(ASTRO_DIR, 'public/images');
const PDF_DIR = join(ASTRO_DIR, 'public/pdf');

const CATEGORY_MAP: Record<string, string> = {
  Diagnosis: 'diagnosis',
  Measure: 'measure',
  Immobilizer: 'immobilizer',
  Odometers: 'odometers',
  Databases: 'databases',
};

interface Product {
  title: string;
  slug: string;
  category: string;
  price?: number;
  images: string[];
  pdfFiles: string[];
  body: string;
  features: string[];
  metaDescription?: string;
}

function parseHtml(filePath: string) {
  const html = readFileSync(filePath, 'utf-8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.split(' - ')[0]?.trim();
  const metaDesc = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  let body = bodyMatch?.[1] || '';

  body = body
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, metaDescription: metaDesc, body };
}

function extractFeatures(html: string): string[] {
  const features: string[] = [];
  const ulMatch = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/);
  if (ulMatch) {
    const items = ulMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/g);
    if (items) {
      items.forEach(item => {
        const text = item.replace(/<[^>]+>/g, '').trim();
        if (text) features.push(text);
      });
    }
  }
  return features;
}

function extractPrice(html: string): number | undefined {
  const match = html.match(/(\d+)\s*\$/);
  return match ? parseInt(match[1]) : undefined;
}

function collectFiles(section: string, slug: string, exts: string[], srcDir: string): string[] {
  const files: string[] = [];
  const sectionDir = join(OLD_DIST, section);
  try {
    const entries = readdirSync(sectionDir);
    const contentDir = entries.find(e => e.startsWith(slug + '-Files') || e.startsWith(slug.split('-').slice(0, 2).join('-') + '-Files'));
    if (contentDir) {
      const dirPath = join(sectionDir, contentDir);
      const dirFiles = readdirSync(dirPath);
      dirFiles.forEach(f => {
        if (exts.includes(extname(f).toLowerCase())) {
          copyFileSync(join(dirPath, f), join(srcDir, f));
          const publicPath = srcDir === IMAGES_DIR ? `/images/${f}` : `/pdfs/${f}`;
          files.push(publicPath);
        }
      });
    }
  } catch {}
  return files;
}

function generateProductMdx(product: Product): string {
  const lines: string[] = ['---'];
  lines.push(`title: "${product.title}"`);
  lines.push(`slug: "${product.slug}"`);
  lines.push(`category: "${product.category}"`);
  if (product.price !== undefined) lines.push(`price: ${product.price}`);
  const md = product.metaDescription?.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
  if (md) lines.push(`metaDescription: "${md}"`);
  if (product.images.length > 0) {
    lines.push('images:');
    product.images.forEach(i => lines.push(`  - "${i}"`));
  }
  if (product.features.length > 0) {
    lines.push('features:');
    product.features.forEach(f => lines.push(`  - "${f.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`));
  }
  lines.push('---', '');
  lines.push(product.body);
  return lines.join('\n');
}

function generateYamlFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      lines.push(`${key}: "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach((item: unknown) => {
        if (typeof item === 'string') lines.push(`  - "${item.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
        else lines.push(`  - ${item}`);
      });
    }
  }
  return lines.join('\n');
}

function migrateCategories() {
  const categorySlugs = Object.keys(CATEGORY_MAP);
  categorySlugs.forEach(slug => {
    const catValue = CATEGORY_MAP[slug];
    const indexPath = join(OLD_DIST, slug, 'index.html');
    if (!existsSync(indexPath)) return;
    const { title, metaDescription, body } = parseHtml(indexPath);
    const data = {
      title: title || slug,
      slug: catValue,
      description: metaDescription || '',
      image: '',
      order: Object.values(CATEGORY_MAP).indexOf(catValue) + 1,
    };
    const yaml = generateYamlFrontmatter(data);
    writeFileSync(join(CONTENT_DIR, 'categories', `${catValue}.yml`), yaml);
    console.log(`  Category: ${catValue}.yml`);
  });
}

function migrateBrands() {
  const brandsDir = join(OLD_DIST, 'Diagnosis', 'Manufacturers');
  try {
    const files = readdirSync(brandsDir).filter(f => f.endsWith('.html') && f !== 'index.html');

    files.forEach(file => {
      const { title, metaDescription, body } = parseHtml(join(brandsDir, file));
      const slug = basename(file, '.html').toLowerCase();
      const data = {
        title: title || basename(file, '.html'),
        slug,
        description: metaDescription || '...',
        country: '',
        website: '',
      };
      const yaml = generateYamlFrontmatter(data);
      writeFileSync(join(CONTENT_DIR, 'brands', `${slug}.yml`), yaml);
      console.log(`  Brand: ${slug}.yml`);
    });
  } catch (err) {
    console.warn('  Brands directory not found, skipping.');
  }
}

function migrateProducts() {
  Object.entries(CATEGORY_MAP).forEach(([section, catValue]) => {
    const sectionDir = join(OLD_DIST, section);
    try {
      const files = readdirSync(sectionDir).filter(f => f.endsWith('.html') && f !== 'index.html');
      files.forEach(file => {
        const filePath = join(sectionDir, file);
        const html = readFileSync(filePath, 'utf-8');
        const { title, metaDescription, body } = parseHtml(filePath);
        if (!title) return;
        const slug = basename(file, '.html');
        const features = extractFeatures(html);
        const price = extractPrice(html);
        const images = collectFiles(section, slug, ['.jpg', '.jpeg', '.png', '.gif'], IMAGES_DIR);
        const pdfs = collectFiles(section, slug, ['.pdf'], PDF_DIR);

        const product: Product = { title, slug, category: catValue, price, images, pdfFiles: pdfs, body, features, metaDescription };
        const mdx = generateProductMdx(product);
        const mdxFile = slug.replace(/[^a-zA-Z0-9_-]/g, '_') + '.mdx';
        writeFileSync(join(CONTENT_DIR, 'products', mdxFile), mdx);
        console.log(`  Product: ${mdxFile}`);
      });
    } catch (err) {
      console.warn(`  Section ${section} not found, skipping.`);
    }
  });
}

function migrateContentPages(sectionName: string, distSection: string, format: 'mdx' | 'yml') {
  const sectionDir = join(OLD_DIST, distSection);
  try {
    const files = readdirSync(sectionDir).filter(f => f.endsWith('.html') && f !== 'index.html');
    files.forEach(file => {
      const filePath = join(sectionDir, file);
      const { title, metaDescription, body } = parseHtml(filePath);
      if (!title) return;
      const slug = basename(file, '.html');
      const data: Record<string, unknown> = {
        title,
        slug: slug.toLowerCase(),
        description: metaDescription || '',
        publishedDate: new Date().toISOString(),
        body,
      };
      if (sectionName === 'articles') data.author = 'Motodok';
      const ext = format === 'mdx' ? '.mdx' : '.yml';
      const content = format === 'mdx' ? generateProductMdx({ title, slug: slug.toLowerCase(), category: '', price: undefined, images: [], pdfFiles: [], body, features: [], metaDescription }) : generateYamlFrontmatter(data);
      const fileName = slug.replace(/[^a-zA-Z0-9_-]/g, '_') + ext;
      writeFileSync(join(CONTENT_DIR, sectionName, fileName), content);
      console.log(`  ${sectionName}: ${fileName}`);
    });
  } catch (err) {
    console.warn(`  ${sectionName} directory not found, skipping.`);
  }
}

function migratePages() {
  const pagesDir = OLD_DIST;
  try {
    const files = readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'index.html' && f !== '404.html');
    files.forEach(file => {
      const filePath = join(pagesDir, file);
      const { title, metaDescription, body } = parseHtml(filePath);
      if (!title) return;
      const slug = basename(file, '.html').toLowerCase();
      const content = generateProductMdx({ title, slug, category: '', price: undefined, images: [], pdfFiles: [], body, features: [], metaDescription });
      writeFileSync(join(CONTENT_DIR, 'pages', `${slug}.mdx`), content);
      console.log(`  Page: ${slug}.mdx`);
    });
  } catch (err) {
    console.warn('  Pages directory not found, skipping.');
  }
}

async function migrate() {
  console.log('Starting migration...');

  const collections = ['products', 'categories', 'brands', 'articles', 'news', 'services', 'pages'];
  collections.forEach(c => mkdirSync(join(CONTENT_DIR, c), { recursive: true }));
  mkdirSync(IMAGES_DIR, { recursive: true });
  mkdirSync(PDF_DIR, { recursive: true });

  console.log('Migrating categories...');
  migrateCategories();

  console.log('Migrating brands...');
  migrateBrands();

  console.log('Migrating products...');
  migrateProducts();

  console.log('Migrating articles...');
  migrateContentPages('articles', 'Articles', 'mdx');

  console.log('Migrating news...');
  migrateContentPages('news', 'News', 'mdx');

  console.log('Migrating services...');
  migrateContentPages('services', 'Services', 'mdx');

  console.log('Migrating pages...');
  migratePages();

  console.log('Migration complete!');
}

migrate().catch(console.error);

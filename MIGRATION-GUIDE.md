# Руководство по миграции motodok.com на Astro + Decap CMS + Cloudflare Pages

## Результаты аудита текущего сайта

### Текущая архитектура

| Компонент | Текущее состояние |
|-----------|------------------|
| CMS | Fog Creek CityDesk 2.0.25 (мёртвый продукт, 2007) |
| Генерация | build.py (Python) конвертирует source/ → dist/ |
| Хостинг | Собственный сервер (неизвестно где) |
| Домен | motodok.com (в sitemap указан motodok.ru) |

### Инвентаризация контента

| Тип контента | Количество | Расположение |
|---|---|---|
| HTML-страниц | ~121 (без Settings и VagCom manual) | source/ |
| Изображений | ~461 | source/*/Images/ |
| PDF-файлов | ~82 | source/Documentation/Files/ + source/Diagnosis/ |
| Категорий товаров | 6 | Diagnosis, Measure, Immobilizer, Odometers, Databases |
| Товаров | ~73 | По категориям |
| Брендов | 10 | Diagnosis/Manufacturers/ |
| Статей | 15 | Articles/ |
| Новостей | 7 | News/ |
| Услуг | 4 | Services/ |
| ZIP/RAR | 2 | Documentation/Files/ |

### Структура URL (критично сохранить)

```
/                           → Главная
/Diagnosis/                 → Каталог диагностики
/Diagnosis/BMW-GT1.html    → Товар
/Diagnosis/Manufacturers/Bmw.html → Производитель
/Measure/                   → Измерительные приборы
/Measure/DigitalTester.html → Товар
/Immobilizer/               → Иммобилайзеры
/Odometers/                 → Одометры
/Databases/                 → Базы данных
/Services/                  → Услуги
/News/                      → Новости
/Articles/                  → Статьи
/Documentation/             → Файлы и документация
/Contacts.html              → Контакты
/How-to-buy.html            → Как купить
/Prices.html                → Цены
/404.html                   → 404
```

### SEO-аудит

| Элемент | Статус |
|---------|--------|
| Title-теги | Есть, но включают цену в название товара |
| Meta description | Есть, главная страница — «Домашняя страница сайта» (плохо) |
| Canonical | Только на 6 страницах-редиректах |
| Open Graph | **Отсутствует полностью** |
| Twitter Cards | **Отсутствует полностью** |
| Schema.org/JSON-LD | **Отсутствует полностью** |
| Sitemap.xml | Есть, но ссылается на http://motodok.ru (устарел) |
| robots.txt | Есть, тоже motodok.ru |
| Подтверждение GSC | Есть google4eb0e64fbd842662.html |
| Alt-тексты | Есть на детальных страницах, пустые на ICOM |
| Микроразметка | Отсутствует |
| Hreflang | Отсутствует |

---

## 1. Подготовка окружения

### Требования

- Node.js 18+
- npm 9+
- Git
- Аккаунт GitHub
- Аккаунт Cloudflare
- Доступ к DNS домена motodok.com

### Установка инструментов

```bash
# Установка Node.js (если нет)
# Скачать с https://nodejs.org или через nvm
nvm install 18

# Проверка
node --version
npm --version

# Установка wrangler CLI
npm install -g wrangler

# Установка Astro CLI
npm install -g create-astro

# Проверка Git
git --version
```

---

## 2. Создание проекта Astro

```bash
# Создание нового проекта
npm create astro@latest motodok-astro -- --template basics
cd motodok-astro

# Установка зависимостей
npm install @astrojs/mdx astro-content-loader
npm install @astrojs/sitemap @astrojs/rss
npm install sharp

# Decap CMS не требует npm-пакета — работает как SPA в /admin
```

### Структура проекта

```
/
├── public/
│   ├── admin/
│   │   └── index.html          # Decap CMS entry
│   │   └── config.yml          # Decap CMS config
│   ├── images/                  # Все изображения сайта
│   │   ├── diagnosis/
│   │   ├── measure/
│   │   ├── immobilizer/
│   │   ├── odometers/
│   │   ├── databases/
│   │   ├── articles/
│   │   ├── services/
│   │   ├── brands/
│   │   └── noimage.jpg
│   ├── pdf/                     # Все PDF-файлы
│   │   ├── bmw/
│   │   ├── launch-x431/
│   │   ├── mb/
│   │   └── ...
│   ├── favicon.ico
│   ├── favicon.gif
│   └── google4eb0e64fbd842662.html
│
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro     # Основной layout (header, nav, footer)
│   │   └── AdminLayout.astro    # Layout для /admin
│   │
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Navigation.astro     # Главное меню
│   │   ├── Sidebar.astro        # Левая панель (категории)
│   │   ├── ProductCard.astro    # Карточка товара
│   │   ├── CategoryCard.astro   # Карточка категории
│   │   ├── Breadcrumbs.astro
│   │   ├── ProductGrid.astro
│   │   ├── ArticleCard.astro
│   │   ├── NewsCard.astro
│   │   ├── SearchBar.astro
│   │   └── SEO.astro            # Компонент для OG/Schema
│   │
│   ├── content/
│   │   ├── config.ts            # Определение коллекций
│   │   ├── products/            # Товары (MDX)
│   │   │   ├── bmw-gt1.mdx
│   │   │   ├── launch-x431.mdx
│   │   │   └── ...
│   │   ├── categories/          # Категории (YAML)
│   │   │   ├── diagnosis.yml
│   │   │   ├── measure.yml
│   │   │   └── ...
│   │   ├── brands/              # Бренды (YAML)
│   │   │   ├── bmw.yml
│   │   │   ├── mercedes.yml
│   │   │   └── ...
│   │   ├── articles/            # Статьи (MDX)
│   │   ├── news/                # Новости (MDX)
│   │   ├── services/            # Услуги (MDX)
│   │   └── pages/               # Статические страницы (MDX)
│   │       ├── contacts.mdx
│   │       ├── how-to-buy.mdx
│   │       ├── prices.mdx
│   │       └── 404.mdx
│   │
│   ├── pages/
│   │   ├── index.astro          # Главная
│   │   ├── [slug].astro         # Статические страницы
│   │   ├── Diagnosis/
│   │   │   ├── index.astro      # Категория диагностики
│   │   │   ├── [slug].astro     # Товар в диагностике
│   │   │   └── Manufacturers/
│   │   │       ├── [slug].astro # Бренд
│   │   ├── Measure/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── Immobilizer/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── Odometers/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── Databases/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── News/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── Articles/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── Services/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── Documentation/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── Contacts.astro
│   │   ├── How-to-buy.astro
│   │   ├── Prices.astro
│   │   └── 404.astro
│   │
│   └── scripts/
│       └── migrate.ts           # Скрипт миграции контента
│
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── wrangler.jsonc
```

---

## 3. Конфигурация Astro

### astro.config.mjs

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://motodok.com',
  base: '/',
  output: 'static',
  adapter: cloudflare({
    mode: 'directory',
  }),
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize: (item) => {
        // Приоритет для главной и категорий
        if (item.url === 'https://motodok.com/') {
          item.priority = 1.0;
        } else if (item.url.includes('/Diagnosis/') || item.url.includes('/Measure/')) {
          item.priority = 0.9;
        }
        return item;
      },
    }),
  ],
  vite: {
    ssr: {
      external: ['@11ty/eleventy-img'],
    },
  },
});
```

### src/content/config.ts

```ts
import { defineCollection, z } from 'astro:content';

const products = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    category: z.enum(['diagnosis', 'measure', 'immobilizer', 'odometers', 'databases']),
    brand: z.string().optional(),
    article: z.string().optional(),          // Артикул
    price: z.number().optional(),
    currency: z.string().default('USD'),
    oldPrice: z.number().optional(),
    inStock: z.boolean().default(true),
    images: z.array(z.string()).default([]),
    pdfFiles: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    specifications: z.record(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().optional(),
    publishedDate: z.date().optional(),
    updatedDate: z.date().optional(),
    order: z.number().optional(),
    featured: z.boolean().default(false),
  }),
});

const categories = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    order: z.number(),
  }),
});

const brands = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    logo: z.string(),
    description: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string().optional(),
    author: z.string().default('Motodok'),
    publishedDate: z.date(),
    updatedDate: z.date().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string().optional(),
    publishedDate: z.date(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string().optional(),
    price: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    order: z.number().default(10),
  }),
});

export const collections = {
  products,
  categories,
  brands,
  articles,
  news,
  services,
  pages,
};
```

---

## 4. Настройка Decap CMS

### public/admin/index.html

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Motodok — CMS</title>
  <link rel="icon" href="/favicon.ico" />
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```

### public/admin/config.yml

```yaml
backend:
  name: github
  repo: username/motodok.com          # Заменить на реальный репозиторий
  branch: main
  base_url: https://motodok.com       # Production URL
  site_domain: motodok.com
  auth_endpoint: /api/auth            # Cloudflare Pages auth endpoint

publish_mode: editorial_workflow      # Pull Request workflow

media_folder: "public/images"
public_folder: "/images"

collections:
  - name: "products"
    label: "Товары"
    label_singular: "Товар"
    folder: "src/content/products"
    create: true
    format: "frontmatter"
    slug: "{{slug}}"
    summary: "{{title}} — {{price}}$"
    sort: "order:asc"
    fields:
      - { label: "Название", name: "title", widget: "string" }
      - { label: "URL (slug)", name: "slug", widget: "string", hint: "Автоматически из названия" }
      - label: "Категория"
        name: "category"
        widget: "select"
        options:
          - { label: "Диагностика", value: "diagnosis" }
          - { label: "Измерение", value: "measure" }
          - { label: "Иммобилайзеры", value: "immobilizer" }
          - { label: "Одометры", value: "odometers" }
          - { label: "Базы данных", value: "databases" }
      - { label: "Бренд", name: "brand", widget: "relation", collection: "brands", searchFields: ["title"], valueField: "slug", displayFields: ["title"], required: false }
      - { label: "Артикул", name: "article", widget: "string", required: false }
      - { label: "Цена ($)", name: "price", widget: "number", valueType: "float", min: 0, required: false }
      - { label: "В наличии", name: "inStock", widget: "boolean", default: true }
      - { label: "Изображения", name: "images", widget: "list", field: { label: "Изображение", name: "image", widget: "image" }, required: false }
      - { label: "PDF-файлы", name: "pdfFiles", widget: "list", field: { label: "Файл", name: "file", widget: "file" }, required: false }
      - { label: "Описание", name: "body", widget: "markdown" }
      - { label: "Характеристики", name: "features", widget: "list", field: { label: "Характеристика", name: "feature", widget: "text" }, required: false }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        fields:
          - { label: "Meta Title", name: "metaTitle", widget: "string", required: false, hint: "Оставьте пустым для автогенерации" }
          - { label: "Meta Description", name: "metaDescription", widget: "text", required: false }
          - { label: "OG Image", name: "ogImage", widget: "image", required: false }
      - { label: "Порядок сортировки", name: "order", widget: "number", valueType: "int", required: false }
      - { label: "Рекомендуемый", name: "featured", widget: "boolean", default: false, required: false }

  - name: "categories"
    label: "Категории"
    label_singular: "Категория"
    folder: "src/content/categories"
    create: false
    format: "yml"
    slug: "{{slug}}"
    fields:
      - { label: "Название", name: "title", widget: "string" }
      - { label: "URL (slug)", name: "slug", widget: "string" }
      - { label: "Описание", name: "description", widget: "text" }
      - { label: "Изображение", name: "image", widget: "image", required: false }
      - { label: "Порядок", name: "order", widget: "number", valueType: "int" }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        fields:
          - { label: "Meta Title", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta Description", name: "metaDescription", widget: "text", required: false }

  - name: "brands"
    label: "Бренды"
    label_singular: "Бренд"
    folder: "src/content/brands"
    create: true
    format: "yml"
    slug: "{{slug}}"
    fields:
      - { label: "Название", name: "title", widget: "string" }
      - { label: "URL (slug)", name: "slug", widget: "string" }
      - { label: "Логотип", name: "logo", widget: "image" }
      - { label: "Описание", name: "description", widget: "text", required: false }
      - { label: "Страна", name: "country", widget: "string", required: false }
      - { label: "Веб-сайт", name: "website", widget: "string", required: false }

  - name: "articles"
    label: "Статьи"
    label_singular: "Статья"
    folder: "src/content/articles"
    create: true
    format: "frontmatter"
    slug: "{{slug}}"
    summary: "{{title}} — {{publishedDate}}"
    sort: "publishedDate:desc"
    fields:
      - { label: "Заголовок", name: "title", widget: "string" }
      - { label: "URL (slug)", name: "slug", widget: "string" }
      - { label: "Описание", name: "description", widget: "text" }
      - { label: "Изображение", name: "image", widget: "image", required: false }
      - { label: "Автор", name: "author", widget: "string", default: "Motodok" }
      - { label: "Дата публикации", name: "publishedDate", widget: "datetime" }
      - { label: "Содержание", name: "body", widget: "markdown" }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        fields:
          - { label: "Meta Title", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta Description", name: "metaDescription", widget: "text", required: false }

  - name: "news"
    label: "Новости"
    label_singular: "Новость"
    folder: "src/content/news"
    create: true
    format: "frontmatter"
    slug: "{{slug}}"
    summary: "{{title}} — {{publishedDate}}"
    sort: "publishedDate:desc"
    fields:
      - { label: "Заголовок", name: "title", widget: "string" }
      - { label: "URL (slug)", name: "slug", widget: "string" }
      - { label: "Описание", name: "description", widget: "text" }
      - { label: "Изображение", name: "image", widget: "image", required: false }
      - { label: "Дата публикации", name: "publishedDate", widget: "datetime" }
      - { label: "Содержание", name: "body", widget: "markdown" }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        fields:
          - { label: "Meta Title", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta Description", name: "metaDescription", widget: "text", required: false }

  - name: "services"
    label: "Услуги"
    label_singular: "Услуга"
    folder: "src/content/services"
    create: true
    format: "frontmatter"
    slug: "{{slug}}"
    fields:
      - { label: "Название", name: "title", widget: "string" }
      - { label: "URL (slug)", name: "slug", widget: "string" }
      - { label: "Описание", name: "description", widget: "text" }
      - { label: "Изображение", name: "image", widget: "image", required: false }
      - { label: "Цена", name: "price", widget: "string", required: false }
      - { label: "Содержание", name: "body", widget: "markdown" }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        fields:
          - { label: "Meta Title", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta Description", name: "metaDescription", widget: "text", required: false }

  - name: "pages"
    label: "Страницы"
    label_singular: "Страница"
    folder: "src/content/pages"
    create: false
    format: "frontmatter"
    slug: "{{slug}}"
    fields:
      - { label: "Заголовок", name: "title", widget: "string" }
      - { label: "URL (slug)", name: "slug", widget: "string" }
      - { label: "Описание", name: "description", widget: "text", required: false }
      - { label: "Содержание", name: "body", widget: "markdown" }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        fields:
          - { label: "Meta Title", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta Description", name: "metaDescription", widget: "text", required: false }
```

### Аутентификация Decap CMS через Cloudflare

Decap CMS использует OAuth через GitHub. Для Cloudflare Pages потребуется серверная функция для аутентификации.

Создать файл `functions/api/auth.js`:

```js
// Cloudflare Pages Function для OAuth
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === '/api/auth') {
    // Редирект на GitHub OAuth
    const githubUrl = new URL('https://github.com/login/oauth/authorize');
    githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    githubUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth/callback`);
    githubUrl.searchParams.set('scope', 'repo');
    githubUrl.searchParams.set('state', crypto.randomUUID());
    return Response.redirect(githubUrl.toString(), 302);
  }

  if (url.pathname === '/api/auth/callback') {
    // Обмен code на токен
    const code = url.searchParams.get('code');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenResponse.json();
    // Редирект обратно в Decap CMS с токеном
    return Response.redirect(`${url.origin}/admin/#access_token=${tokenData.access_token}`, 302);
  }
}
```

---

## 5. Шаблоны страниц

### src/layouts/BaseLayout.astro

```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import Sidebar from '../components/Sidebar.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import SEO from '../components/SEO.astro';

export interface Props {
  title: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonical?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const { title, description, metaTitle, metaDescription, ogImage, canonical, breadcrumbs } = Astro.props;
---

<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <SEO
    title={metaTitle || title}
    description={metaDescription || description}
    ogImage={ogImage || '/images/og-default.jpg'}
    canonical={canonical}
  />
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div class="layout">
    <Header />
    <nav class="main-nav">
      <!-- Main menu component -->
    </nav>
    <div class="page-wrapper">
      <Sidebar />
      <main class="content">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <slot />
      </main>
    </div>
    <Footer />
  </div>
</body>
</html>
```

### src/components/SEO.astro

```astro
---
export interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

const { title, description, ogImage, canonical, noIndex } = Astro.props;
const siteUrl = 'https://motodok.com';
---

<title>{title} | Motodok</title>
<meta name="description" content={description || ''} />
<link rel="canonical" href={canonical || Astro.url.href} />

<!-- Open Graph -->
<meta property="og:title" content={title} />
<meta property="og:description" content={description || ''} />
<meta property="og:type" content="website" />
<meta property="og:url" content={canonical || Astro.url.href} />
<meta property="og:image" content={ogImage ? `${siteUrl}${ogImage}` : `${siteUrl}/images/og-default.jpg`} />
<meta property="og:site_name" content="Motodok" />
<meta property="og:locale" content="ru_RU" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description || ''} />
<meta name="twitter:image" content={ogImage ? `${siteUrl}${ogImage}` : `${siteUrl}/images/og-default.jpg`} />

<!-- JSON-LD Organization -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Motodok",
  "url": "https://motodok.com",
  "logo": "https://motodok.com/favicon.ico",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+996-772-553-731",
    "contactType": "sales",
    "availableLanguage": ["Russian"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "KG"
  }
}
</script>

{noIndex && <meta name="robots" content="noindex, nofollow" />}
```

### src/pages/Diagnosis/[slug].astro (пример товара)

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProductCard from '../../components/ProductCard.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const products = await getCollection('products');
  return products
    .filter(p => p.data.category === 'diagnosis')
    .map(p => ({
      params: { slug: p.data.slug },
      props: { entry: p },
    }));
}

const { entry } = Astro.props;
const { data, body } = entry;
---

<BaseLayout
  title={data.metaTitle || data.title}
  description={data.metaDescription || `${data.title} — ${data.price}$ — оборудование для автодиагностики`}
  ogImage={data.ogImage || data.images?.[0]}
  breadcrumbs={[
    { label: 'Главная', href: '/' },
    { label: 'Диагностика', href: '/Diagnosis/' },
    { label: data.title },
  ]}
>
  <article class="product-detail">
    <h1>{data.title}</h1>
    {data.price && <div class="price">{data.price} $</div>}
    {data.images.length > 0 && (
      <div class="product-gallery">
        {data.images.map(img => <img src={img} alt={data.title} loading="lazy" />)}
      </div>
    )}
    <div class="product-body">{body}</div>
    {data.features.length > 0 && (
      <ul class="features">
        {data.features.map(f => <li>{f}</li>)}
      </ul>
    )}
    {data.pdfFiles.length > 0 && (
      <div class="files">
        <h3>Файлы для скачивания</h3>
        {data.pdfFiles.map(f => <a href={f} target="_blank">Скачать PDF</a>)}
      </div>
    )}
  </article>
</BaseLayout>
```

---

## 6. Настройка GitHub

### Создание репозитория

```bash
# Новый репозиторий на GitHub
# 1. Зайти на github.com/new
# 2. Название: motodok.com
# 3. Приватный или публичный — на выбор
# 4. Не добавлять README, .gitignore, лицензию

cd motodok-astro

# Инициализация Git
git init
git add .
git commit -m "feat: initial Astro + Decap CMS project"

# Подключение удалённого репозитория
git remote add origin git@github.com:username/motodok.com.git
git branch -M main
git push -u origin main
```

### Структура веток

```
main              # Production-ready код
├── preview/*     # Preview-ветки для Decap CMS editorial workflow
└── develop       # Разработка (опционально)
```

### Настройка доступа для редакторов

1. Добавить редакторов в GitHub-репозиторий как Collaborators
2. Редакторы авторизуются через GitHub OAuth в /admin
3. Decap CMS создаёт Pull Request при каждой публикации
4. Cloudflare Pages Preview Deployments позволяют просмотреть изменения до публикации

### GitHub Actions (опционально — для дополнительных проверок)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: pages deploy dist --project-name=motodok
```

---

## 7. Настройка Cloudflare Pages

### Создание проекта

1. Войти в панель Cloudflare
2. Workers & Pages → Create → Pages → Connect to Git
3. Выбрать GitHub-репозиторий `motodok.com`
4. Настройки сборки:

| Параметр | Значение |
|----------|---------|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output | `dist/` |
| Root directory | `/` |
| Node.js version | 18 |

### Environment variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `GITHUB_CLIENT_ID` | `your_github_oauth_app_id` | Decap CMS OAuth |
| `GITHUB_CLIENT_SECRET` | `your_github_oauth_secret` | Decap CMS OAuth |

### GitHub OAuth App

1. Settings → Developer settings → OAuth Apps → New OAuth App
2. Application name: Motodok CMS
3. Homepage URL: `https://motodok.com`
4. Authorization callback URL: `https://motodok.com/api/auth/callback`

### Подключение домена

1. Cloudflare Pages → motodok → Custom domains → Set up a custom domain
2. Ввести `motodok.com`
3. Cloudflare автоматически настроит DNS и HTTPS

### DNS-записи

| Тип | Имя | Значение |
|-----|-----|----------|
| CNAME | `@` | `motodok.pages.dev` |
| CNAME | `www` | `motodok.pages.dev` |

### Правила редиректов

В файле `_redirects` в корне проекта (Cloudflare Pages автоматически читает его):

```
# Сохранение старых URL
/Diagnosis/Diagnosis-2.html /Diagnosis/ 301
/Measure/Autoscope-USB.html /Measure/USB-Autoscope-IV.html 301
/Measure/USB-Osciloscope.html /Measure/USB-Autoscope-IV.html 301
/Databases/Mitchel-On-Demand-5.html /Databases/Mitchel-On-Demand-2014.html 301
/Databases/AutoData-2.12.html /Databases/AutoData-3.38.html 301
/News/Free-Delivery.html /News/ 301

# HTTP → HTTPS
http://motodok.com/* https://motodok.com/:splat 301
http://www.motodok.com/* https://motodok.com/:splat 301

# motodok.ru → motodok.com (если домен принадлежит вам)
http://motodok.ru/* https://motodok.com/:splat 301
https://motodok.ru/* https://motodok.com/:splat 301

# 404 страница
/* /404.html 404
```

### _headers (в корне)

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

/images/*
  Cache-Control: public, max-age=31536000, immutable

/pdfs/*
  Cache-Control: public, max-age=31536000, immutable

/style.css
  Cache-Control: public, max-age=31536000, immutable

/admin/*
  Cache-Control: no-cache, no-store, must-revalidate
```

### Планы Cloudflare

**Бесплатный план** включает:
- Неограниченное количество запросов
- 500 сборок в месяц
- 1 GB storage
- Неограниченное количество preview-развёртываний
- Бесплатный SSL/TLS
- Бесплатная CDN
- До 3 правил Page Rules

---

## 8. Миграция контента

### Стратегия миграции

Сейчас есть `source/` (CityDesk export) и `dist/` (собранный build.py сайт).
Рекомендуется использовать `dist/` как источник, т. к. build.py уже очистил HTML от CityDesk-мусора.

### Скрипт миграции src/scripts/migrate.ts

```typescript
import { readFileSync, readdirSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, basename, extname, dirname } from 'path';

const DIST_DIR = '/Users/mnusurov/Documents/Code/personal/motodok.com/dist';
const ASTRO_DIR = process.cwd();
const CONTENT_DIR = join(ASTRO_DIR, 'src/content');
const IMAGES_DIR = join(ASTRO_DIR, 'public/images');
const PDF_DIR = join(ASTRO_DIR, 'public/pdf');

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

// 1. Парсинг HTML и извлечение контента
function parseHtml(filePath: string) {
  const html = readFileSync(filePath, 'utf-8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.split(' - ')[0]?.trim();
  const metaDesc = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  let body = bodyMatch?.[1] || '';

  // Очистка HTML → Markdown (упрощённо)
  body = body
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/g, '')  // Удалить h1 (это заголовок страницы)
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p[^>]*>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<[^>]+>/g, '')  // Удалить оставшиеся теги
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, metaDescription: metaDesc, body };
}

// 2. Извлечение характеристик
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

// 3. Извлечение цены из HTML
function extractPrice(html: string): number | undefined {
  const match = html.match(/(\d+)\s*\$/);
  return match ? parseInt(match[1]) : undefined;
}

// 4. Сбор изображений для продукта
function collectImages(section: string, slug: string): string[] {
  const images: string[] = [];
  const srcDir = join(DIST_DIR, section, 'Images');
  try {
    const files = readdirSync(srcDir);
    const productImages = files.filter(f =>
      f.includes(slug) &&
      (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.gif'))
    );
    productImages.forEach(f => {
      copyFileSync(join(srcDir, f), join(IMAGES_DIR, f));
      images.push(`/images/${f}`);
    });
  } catch {}
  return images;
}

// 5. Генерация MDX для товара
function generateProductMdx(product: Product): string {
  const frontmatter = [
    '---',
    `title: "${product.title}"`,
    `slug: "${product.slug}"`,
    `category: "${product.category}"`,
    product.price ? `price: ${product.price}` : '',
    product.metaDescription ? `metaDescription: "${product.metaDescription}"` : '',
    'images:',
    ...product.images.map(i => `  - "${i}"`),
    'features:',
    ...product.features.map(f => `  - "${f}"`),
    '---',
    '',
    product.body,
  ].filter(line => line !== '').join('\n');
  return frontmatter;
}

// 6. Запуск миграции
async function migrate() {
  console.log('Starting migration...');

  // Создание директорий
  const collections = ['products', 'categories', 'brands', 'articles', 'news', 'services', 'pages'];
  collections.forEach(c => mkdirSync(join(CONTENT_DIR, c), { recursive: true }));
  mkdirSync(IMAGES_DIR, { recursive: true });
  mkdirSync(PDF_DIR, { recursive: true });

  // Копирование статических файлов
  console.log('Copying images...');
  // Рекурсивно копировать все изображения из dist в public/images

  console.log('Copying PDFs...');
  // Рекурсивно копировать все PDF из dist в public/pdf

  console.log('Migration complete!');
}

migrate();
```

### Пошаговый план миграции контента

#### Шаг 1: Копирование статических файлов

```bash
# Копирование изображений
cp -r dist/Diagnosis/Images/* src/content/images/diagnosis/
cp -r dist/Measure/Images/* src/content/images/measure/
cp -r dist/Immobilizer/Images/* src/content/images/immobilizer/
cp -r dist/Odometers/Images/* src/content/images/odometers/
cp -r dist/Databases/Images/* src/content/images/databases/
cp -r dist/Articles/Images/* src/content/images/articles/
cp -r dist/Services/Images/* src/content/images/services/

# Копирование PDF
cp -r dist/Documentation/Files/* src/content/pdf/

# Копирование favicon и Google verification
cp dist/favicon.ico public/
cp dist/favicon.gif public/
cp dist/google4eb0e64fbd842662.html public/
```

#### Шаг 2: Создание категорий (YAML)

`src/content/categories/diagnosis.yml`:
```yaml
title: "Диагностика"
slug: "Diagnosis"
description: "Профессиональное диагностическое оборудование для автосервисов и мастерских"
order: 1
metaTitle: "Диагностическое оборудование — Motodok"
metaDescription: "Купить диагностическое оборудование для автомобилей. BMW GT1, Launch X-431, Mercedes Star Diagnosis, VAG-COM и другие сканеры."
```

`src/content/categories/measure.yml`:
```yaml
title: "Измерение"
slug: "Measure"
description: "Измерительные приборы для автомобильной диагностики: осциллографы, компрессометры, мультиметры"
order: 2
metaTitle: "Измерительное оборудование — Motodok"
metaDescription: "Купить измерительные приборы для автодиагностики. USB-осциллографы, компрессометры, тестеры."
```

#### Шаг 3: Перенос товаров (пример)

`src/content/products/bmw-gt1.mdx`:
```mdx
---
title: "BMW GT1 Group Tester One"
slug: "BMW-GT1"
category: "diagnosis"
brand: "bmw"
price: 650
images:
  - "/images/BMW-GT1.jpg"
features:
  - "Полная диагностика всех систем BMW/MINI"
  - "Поддержка EWS, CAS, DME, EGS, ABS, SRS, IHKA, EDC и других блоков"
  - "Работа с K-line, CAN-bus, MOST-bus"
  - "Программирование ключей и блоков управления"
metaTitle: "BMW GT1 — диагностический сканер для BMW — Motodok"
metaDescription: "Купить BMW GT1 Diagnosis Group Tester One. Профессиональная диагностика всех систем BMW. Программирование ключей и блоков управления."
---

Полный комплект BMW GT1 (Group Tester One) для профессиональной диагностики автомобилей BMW и MINI.

## Комплектация
- Основной блок GT1
- Интерфейсные адаптеры
- Кабели для подключения
- Программное обеспечение на CD
- Руководство пользователя

## Возможности
- Диагностика двигателя, трансмиссии, ABS, SRS, климат-контроля
- Чтение и сброс ошибок
- Просмотр данных в реальном времени
- Адаптации и кодирование блоков
- Программирование ключей
```

#### Шаг 4: Перенос статей

`src/content/articles/autodiagnosis.mdx`:
```mdx
---
title: "Современная автодиагностика"
slug: "Autodiagnosis"
description: "Обзор современных методов компьютерной диагностики автомобилей"
author: "Motodok"
publishedDate: 2024-01-15
metaTitle: "Современная автодиагностика — статьи Motodok"
---

Содержание статьи в Markdown...
```

#### Шаг 5: robots.txt

```
User-agent: *
Allow: /

Sitemap: https://motodok.com/sitemap-index.xml

# Legacy crawlers
User-agent: Googlebot
Allow: /

User-agent: Yandex
Allow: /
Host: https://motodok.com
```

---

## 9. Поисковая оптимизация после миграции

### Что улучшится

| Аспект | Было | Стало |
|--------|------|-------|
| Canonical | Только на 6 страницах | На всех страницах |
| Open Graph | Отсутствует | На всех страницах |
| Twitter Cards | Отсутствует | На всех страницах |
| JSON-LD | Отсутствует | Organization + WebSite + BreadcrumbList |
| Sitemap | http://motodok.ru, устаревший | https://motodok.com, автоматический |
| Скорость | Собственный сервер | Cloudflare CDN |
| HTTPS | Нет данных | Автоматически |
| Изображения | GIF/JPEG без lazy loading | WebP + lazy loading + srcset |

### Проверка после миграции

```bash
# 1. Проверка битых ссылок
npx broken-link-checker https://motodok.com --recursive

# 2. Проверка sitemap
curl https://motodok.com/sitemap-index.xml

# 3. Проверка robots.txt
curl https://motodok.com/robots.txt

# 4. Проверка заголовков
curl -I https://motodok.com/

# 5. PageSpeed Insights
# Открыть: https://pagespeed.web.dev/ → motodok.com

# 6. Schema.org валидация
# Открыть: https://validator.schema.org/ → motodok.com

# 7. Open Graph валидация
# https://www.opengraph.xyz/
```

---

## 10. Deploy

### Первый deploy

```bash
# Сборка проекта
npm run build

# Deploy через wrangler
npx wrangler pages deploy dist --project-name motodok

# Или через GitHub → Cloudflare Pages автоматически
# Достаточно сделать push в main
git add .
git commit -m "feat: initial migration"
git push origin main
```

### Production Deploy

После настройки Cloudflare Pages:

1. Push в main → автоматическая сборка и деплой
2. Preview Deployments для каждой ветки
3. Decap CMS создаёт PR → Preview → Merge в main → Production Deploy

### Проверка production

```bash
# Убедиться, что сайт отвечает
curl -s -o /dev/null -w "%{http_code}" https://motodok.com
# Должен вернуть 200

# Проверка редиректов
curl -s -o /dev/null -w "%{http_code}" https://motodok.com/Diagnosis/Diagnosis-2.html
# Должен вернуть 301 (редирект на /Diagnosis/)

# Проверка HTTPS
curl -sI https://motodok.com/ | grep -i strict-transport
# Должен показать HSTS
```

---

## 11. Работа редакторов после запуска

### Как редактировать контент

1. Открыть `https://motodok.com/admin/`
2. Авторизоваться через GitHub
3. Выбрать тип контента (Товары, Статьи, Новости)
4. Внести изменения в редакторе
5. Нажать Publish → Decap CMS создаст Pull Request
6. Cloudflare Pages соберёт preview-версию
7. После подтверждения → merge в main → автоматический деплой

### Резервное копирование

GitHub — это и есть резервная копия. Всё хранится в Git:
- Контент — в `src/content/`
- Изображения — в `public/images/`
- PDF — в `public/pdf/`
- Конфигурация — в корне

Для дополнительной безопасности:

```bash
# Создать бэкап репозитория
git clone git@github.com:username/motodok.com.git motodok-backup-$(date +%Y%m%d)

# Или настроить GitHub Actions для автоматического бэкапа на внешнее хранилище
```

### Восстановление сайта

```bash
# Клонировать репозиторий
git clone git@github.com:username/motodok.com.git

# Установить зависимости
cd motodok.com
npm ci

# Собрать и задеплоить
npm run build
npx wrangler pages deploy dist --project-name motodok
```

---

## 12. Рекомендации по дальнейшему развитию

### Краткосрочные улучшения (1-3 месяца)

1. **Главная страница**: Заменить "Домашняя страница сайта" на качественное описание
2. **Изображения товаров**: Конвертировать GIF → WebP, добавить alt-тексты
3. **Хлебные крошки**: Улучшить навигацию (уже в плане)
4. **Поиск**: Настроить Cloudflare Search или Pagefind для клиентского поиска
5. **Аналитика**: Cloudflare Web Analytics (бесплатно, без cookies)

### Среднесрочные (3-6 месяцев)

1. **Корзина / E-commerce**: Добавить простую форму заказа или интеграцию с платёжной системой
2. **Мультиязычность**: Если требуется английская версия
3. **API товаров**: Для интеграции с торговыми площадками
4. **Форма обратной связи**: Cloudflare Pages Functions для отправки email

### Технический долг

1. **ВagCom Manual**: 28 HTML-страниц в Documentation/ — можно оставить как статику или перенести в Astro
2. **Старые ссылки в контенте**: Могут вести на несуществующие страницы
3. **Teleport Pro артефакты**: В VagCom manual есть `tppabs` атрибуты

### Что делать, если разработчик больше не участвует

Архитектура выбрана так, чтобы сайт работал без разработчика:

1. **Редактирование** — через Decap CMS (не требует знаний кода)
2. **Хостинг** — Cloudflare Pages (не требует администрирования сервера)
3. **Бэкапы** — GitHub (не требует настройки)
4. **SSL** — автоматический (не требует обновления)
5. **Домен** — продлевается один раз в год

Любой человек с базовым знанием Markdown может:
- Добавлять новые товары
- Редактировать существующие
- Публиковать новости и статьи
- Менять фотографии и файлы

---

## Приложение A: Сопоставление URL

| Старый URL | Новый URL | Тип |
|------------|-----------|-----|
| `/index.html` | `/` | Главная |
| `/Diagnosis/index.html` | `/Diagnosis/` | Категория |
| `/Diagnosis/BMW-GT1.html` | `/Diagnosis/BMW-GT1/` | Товар |
| `/Diagnosis/Manufacturers/Bmw.html` | `/Diagnosis/Manufacturers/Bmw/` | Бренд |
| `/Measure/index.html` | `/Measure/` | Категория |
| `/Measure/DigitalTester.html` | `/Measure/DigitalTester/` | Товар |
| `/Immobilizer/index.html` | `/Immobilizer/` | Категория |
| `/Immobilizer/CarProg.html` | `/Immobilizer/CarProg/` | Товар |
| `/Odometers/index.html` | `/Odometers/` | Категория |
| `/Databases/index.html` | `/Databases/` | Категория |
| `/Services/index.html` | `/Services/` | Услуги |
| `/News/index.html` | `/News/` | Новости |
| `/News/Autodata.html` | `/News/Autodata/` | Новость |
| `/Articles/index.html` | `/Articles/` | Статьи |
| `/Articles/Autodiagnosis.html` | `/Articles/Autodiagnosis/` | Статья |
| `/Documentation/index.html` | `/Documentation/` | Документация |
| `/Contacts.html` | `/Contacts/` | Страница |
| `/How-to-buy.html` | `/How-to-buy/` | Страница |
| `/Prices.html` | `/Prices/` | Страница |
| `/404.html` | `/404/` | 404 |

**Важно**: В Cloudflare Pages через Astro с `output: 'static'` и дефолтным роутингом, `/Diagnosis/BMW-GT1` и `/Diagnosis/BMW-GT1.html` — разные URL. Чтобы сохранить совместимость:

1. В Astro использовать `permalink: '/Diagnosis/BMW-GT1.html'` для товаров (через функцию `getStaticPaths`)
2. Или настроить редиректы в `_redirects`:
   ```
   /Diagnosis/BMW-GT1 /Diagnosis/BMW-GT1.html 301
   ```

**Рекомендуемый подход**: Использовать `.html`-расширения в URL, так как:
- Старый сайт имеет все URL с `.html`
- Google проиндексировал их именно так
- Astro может генерировать статические файлы с `.html` расширением

```js
// astro.config.mjs
export default defineConfig({
  // ...
  build: {
    format: 'file',  // Генерировать /Diagnosis/BMW-GT1.html вместо /Diagnosis/BMW-GT1/index.html
  },
});
```

А для страниц категорий, где нужен `/Diagnosis/index.html` → `/Diagnosis/`:
```js
trailingSlash: 'always',  // Категории с / на конце
```

---

## Приложение B: План работ по дням

| День | Задачи |
|------|--------|
| 1 | Подготовка: Node.js, Git, аккаунты, клонирование старого сайта |
| 2-3 | Создание проекта Astro, шаблоны, компоненты |
| 4-5 | Перенос контента: категории, товары, статьи, новости |
| 6 | Перенос статических файлов: изображения, PDF, favicon |
| 7 | Настройка Decap CMS, Cloudflare OAuth |
| 8 | Настройка Cloudflare Pages, домен, HTTPS, DNS |
| 9 | Редиректы, SEO-теги, sitemap, robots.txt |
| 10 | Тестирование: битые ссылки, SSL, PageSpeed, Schema |
| 11-12 | Исправление ошибок, полировка |
| 13 | Production Deploy |
| 14 | Мониторинг, проверка индексации Google |

---

## Приложение C: Чеклист перед запуском

- [ ] Все товары перенесены и отображаются корректно
- [ ] Все категории работают
- [ ] Все изображения загружены
- [ ] Все PDF-файлы доступны для скачивания
- [ ] Статьи и новости перенесены
- [ ] Контакты, Как купить, Цены — обновлены
- [ ] Google verification файл на месте
- [ ] Sitemap.xml генерируется и содержит все URL
- [ ] robots.txt настроен
- [ ] Canonical tags на всех страницах
- [ ] Open Graph / Twitter Cards работают
- [ ] JSON-LD Schema.org добавлен
- [ ] 404 страница работает
- [ ] Редиректы со старых URL настроены
- [ ] SSL/HTTPS работает
- [ ] HTTP → HTTPS редирект
- [ ] www → без www редирект
- [ ] motodok.ru → motodok.com редирект
- [ ] Decap CMS /admin доступен
- [ ] OAuth аутентификация работает
- [ ] Preview Deployments работают
- [ ] Cloudflare Pages сборка проходит успешно
- [ ] PageSpeed Score > 90
- [ ] Google Search Console: сайт добавлен
- [ ] Аналитика (Cloudflare Web Analytics) настроена
- [ ] Контактная информация актуальна
- [ ] Прайс-лист актуален
- [ ] Нет битых ссылок
- [ ] Нет JavaScript-ошибок
- [ ] Мобильная версия работает

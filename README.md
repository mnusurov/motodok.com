# motodok.com

Интернет-магазин диагностического оборудования для автосервисов. Astro 5, статика, Cloudflare Pages.

---

## Редактору

### 1. Создать аккаунт на GitHub

Если нет аккаунта:
1. Зайти на https://github.com/signup
2. Ввести email, придумать пароль, подтвердить email
3. **Запомнить username** — он понадобится

Гайды: [GitHub для начинающих](https://blog.skillfactory.ru/github-dlya-nachinayuschih/) · [Git и GitHub (Tproger)](https://tproger.ru/articles/chto-takoe-git-i-github--rukovodstvo-dlya-nachinayushhih)

### 2. Сообщить владельцу свой username

Написать: «Мой GitHub: username»

Владелец добавит вас в Collaborators (роль Write). На почту придёт приглашение — принять.

### 3. Войти в CMS

https://motodok.com/admin/ → **Login with GitHub**

### 4. Коллекции

| Раздел | Что редактирует |
|--------|----------------|
| **Products** | Название, категория, цена, старая цена, валюта, описание, характеристики, спецификации (key→value), изображения, PDF, SEO, даты |
| **Categories** | Категории (Diagnosis, Measure, Immobilizer, Odometers, Databases) |
| **Brands** | Бренды-производители — название, логотип, страна, сайт |
| **Articles** | Заголовок, даты, автор, теги, изображение, SEO |
| **News** | Заголовок, дата, изображение, SEO |
| **Services** | Название, цена, описание, SEO |
| **Pages** | Заголовок, описание, порядок, SEO |

### 5. Как создать/редактировать

- **Создать**: выбрать коллекцию → **New** → заполнить поля → **Publish**
- **Редактировать**: кликнуть запись → изменить → **Publish**
- **Поиск**: кнопка 🔍 в хедере → `/search/` — полнотекстовый поиск по всем страницам
- **Загрузить фото**: поле Image → **Choose an image** → выбрать файл (сохраняются в `public/images/`)

### 6. Важно

- Изменения применяются через ~2–3 мин (GitHub Actions собирает сайт)
- Не удаляй товары без необходимости (сломаются ссылки)
- Не редактируй файлы через CMS одновременно с Git — возможны конфликты
- Цена указывается в долларах США (поля: цена, старая цена, валюта)
- Для товаров без цены оставь поля пустыми
- Спецификации — формат key→value (например: Интерфейс → USB 2.0)
- Meta Title / Meta Description — оставь пустыми, если нужно автозаполнение из заголовка

### Полезные ссылки

- [Decap CMS + Astro (документация)](https://docs.astro.build/ru/guides/cms/decap-cms/)
- [Decap CMS — установка и настройка](https://truetech.dev/websites-development/services/cms-other/decap-cms-git-based-installation-setup.html)

---

## Разработчику

### Локальный запуск

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # сборка в dist/
npm run preview    # просмотр собранного
```

### Технический стек

- **Astro 5** — генератор статики
- **MDX** — контент товаров и статей
- **Decap CMS** (CDN, standalone) — управление контентом
- **Pagefind** — полнотекстовый поиск по сайту (без сервера)
- **Cloudflare Pages** — хостинг + деплой (GitHub Actions)
- **Cloudflare Functions** — OAuth proxy для Decap CMS
- **JSON-LD** — микроразметка (Product, Article, BreadcrumbList, LocalBusiness)

### Домены

| Домен | Назначение |
|-------|-----------|
| `motodok.com` | Основной сайт |
| `www.motodok.com` | Редирект 301 → motodok.com |

### Структура

```
src/
  content/            # MDX/YML контент (7 коллекций)
    products/         # 66 товаров (MDX)
    categories/       # 5 категорий (YML)
    brands/           # 25 брендов (YML)
    articles/         # 14 статей (MDX)
    news/             # 7 новостей (MDX)
    services/         # 3 услуги (MDX)
    pages/            # 4 статические страницы (MDX)
  components/         # .astro компоненты (SEO, ProductCard, JSON-LD)
  layouts/            # BaseLayout
  pages/              # Страницы и динамические маршруты
  styles/             # global.css
public/
  images/             # 486 изображений товаров
  admin/              # Decap CMS (config.yml + index.html)
  pdf/                # PDF-файлы
  _redirects          # 44 правила редиректов
  _headers            # Заголовки кеширования и безопасности
scripts/
  postbuild.mjs       # Постобработка sitemap.xml
```

# Brand Guide — Motodok

## Brand Essence

Motodok — профессиональное оборудование для диагностики и ремонта автосервисов.
B2B, технический, экспертный тон. Dark industrial aesthetic.

---

## Logo

**Лого-марка:** `public/images/logo-mark.svg` — буква «M» в `#ff6b35` на чёрном фоне, срезанный угол. Используется в хедере слева от текста.

**Текстовый логотип:** встроен в `public/og-image.png` (1200×630) — «MOTODOK» + «АВТОДИАГНОСТИКА» оранжевым на чёрном. Используется как OG Image и в JSON-LD (schema.org).

**Использование в хедере:** `[logo-mark.svg] Motodok` — inline-flex с gap 0.5rem.

**Правила:**
- Цвет «M» — только `#ff6b35`
- Не искажать пропорции
- Минимальный размер хедера: 120px

---

## Color Palette

| Роль | Цвет | HEX | Назначение |
|------|------|-----|-----------|
| Background | Чёрный | `#0d0d0d` | Основной фон страниц |
| Surface | Тёмно-серый | `#1f1f1f` | Карточки, dropdown, модалки |
| Surface alt | Серый | `#1a1a1a` | Header, footer |
| Border | Тёмный бордер | `#2a2a2a` | Границы, разделители |
| Text Primary | Белый | `#e8e8e8` | Основной текст |
| Text Secondary | Серый | `#888888` | Подписи, втор. текст |
| **Accent** | **Оранжевый** | **`#ff6b35`** | Ссылки, CTA, акценты, цены |
| Accent Hover | Светло-оранж. | `#ff8c5a` | Hover-состояния |

**Текст на оранжевом:** всегда чёрный (`#000000`).

---

## Typography

### Web (CSS)

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif;
```

System font stack — быстрая загрузка, хорошая читаемость.

### Логотип SVG

```css
font-family: Arial, sans-serif;
```

### Размеры

- H1: `2rem` (`clamp(2rem, 5vw, 3.5rem)` в hero)
- H2: `1.3–1.4rem`
- H3: `1–1.1rem`
- Body: `0.85–1rem`
- Мелкий: `0.78–0.82rem` (цены, теги времени)

### Насыщенность

- H1–H3: `font-weight: 700–800`
- Навигация: `500`
- Цены: `700`
- Body: `400`

---

## Tone of Voice

- **Профессиональный, технический.** Аудитория — владельцы СТО и механики.
- **Русский язык** (основной). Термины: английские названия оборудования (Launch, Autel) без перевода.
- **Без «воды».** Факты, характеристики, цена.
- **В новостях и статьях** — экспертный, но доступный.

**Не использовать:**
- Сленг, панибратство
- Восклицательные знаки в копи
- Излишние эмоции

---

## Iconography

Иконки: `svg` inline, `stroke-width="2"`, `stroke="currentColor"`.
Размер: 18×18px (навигация), `2rem` (категории, кастомные emoji).

---

## Buttons / CTAs

| Тип | CSS-класс | Стиль |
|-----|-----------|-------|
| Primary | `.btn-primary` | `background: #ff6b35; color: #000` |
| Secondary | `.btn-secondary` | `transparent bg; border: 1px solid #2a2a2a; color: #e8e8e8` |

Ховер: первичные — `#ff8c5a`, вторичные — `border-color: #ff6b35`.

---

## Spacing & Layout

- Max width контейнера: `1200px`
- Padding контейнера: `0 1.5rem`
- Border radius: `10px` (глобальный), `6–8px` (мелкие элементы)
- Gap в сетках: `0.75–1rem`
- Высота header: `64px`

---

## Favicon

Набор: `public/favicon.svg`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/favicon-48x48.png`, `public/favicon.gif` (анимированный).

Дизайн: буква «M» в `#ff6b35` на чёрном фоне. SVG — приоритетный формат (современные браузеры). `.ico` оставлен как legacy-фолбэк.

**Apple Touch Icon:** `public/apple-touch-icon.png` (180×180).

**OG Image:** `public/og-image.png` (1200×630).

---

## Images

- Растровые изображения: `public/images/<collection>/<filename>.jpg`
- Формат: JPEG (фото), SVG (графика/логотип)
- Без водяных знаков

---

## Cloudflare Pages

- Домен: `motodok.com`
- SSL: Auto (Full)

---

## Зависимости

Brand-цвета и CSS-переменные определены в:
- `src/styles/global.css` — `:root { --accent: #ff6b35; ... }`
- `public/images/logo.svg` — логотип
- `src/components/Header.astro` — текстовый логотип в хедере

При изменении цветов бренда менять в `global.css` (источник истины).

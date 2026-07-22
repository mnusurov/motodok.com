Status: ready-for-human

# Подключить Google Search Console и Яндекс.Вебмастер

## Контекст
GA4 (`G-8KFSGR4BFQ`) и Яндекс.Метрика (`110876860`) уже стоят в `src/layouts/BaseLayout.astro` — дают трафик/поведение, но не дают query-level данных (по каким запросам находят, какая позиция). Search Console/Вебмастер не верифицированы (нет verification-файлов в `public/`). Это блокер для keyword-level SEO-ревью (см. `.scratch/seo-strategy/spec.md`).

## Что нужно сделать (владелец сайта)
1. Верифицировать домен motodok.com в Google Search Console (DNS TXT или meta-тег в `BaseLayout.astro`).
2. Верифицировать в Яндекс.Вебмастер аналогично.
3. Дать агенту знать, когда сделано — тогда можно приступать к keyword-level ревью карточек (см. spec).

## Не блокирует
Цикл №1 (сигнал спроса по `inStock: false` товарам через GA4/Метрику) уже работает без этого шага.

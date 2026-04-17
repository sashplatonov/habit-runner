# SEO Backlog — Habbit Runner PWA

> **Назначение:** Детальный бэклог для AI-агента. Каждая задача содержит точные файлы, acceptance criteria, зависимости, риски и критические моменты.
> **Дата аудита:** April 2026  
> **Стек:** SvelteKit 5 + Vite PWA + Quarkus + PostgreSQL

---

## Текущий статус (аудит)

### ✅ Уже реализовано

| Что | Где |
|---|---|
| SSR + prerender для `/`, `/habit-tracker`, `/streak-tracker`, `/daily-routine-planner` | `apps/web/src/routes/*/+page.ts` |
| Protected routes `ssr = false` + auth guard | `apps/web/src/routes/(protected)/+layout.ts` |
| `<title>`, `<meta description>`, OG, Twitter Card | `apps/web/src/lib/components/PublicSeoHead.svelte` |
| Schema.org: SoftwareApplication, Organization, WebSite, FAQPage | `apps/web/src/lib/seo/publicPages.ts` |
| Canonical URL на всех публичных страницах | `PublicSeoHead.svelte` |
| FAQ-секция на всех публичных страницах | `publicPages.ts` → `PublicSeoPage.svelte` |
| `sitemap.xml` статический (4 URL) | `apps/web/static/sitemap.xml` |
| `robots.txt` базовый | `apps/web/static/robots.txt` |
| OG-изображение `/og-image.svg` | `apps/web/static/og-image.svg` |
| PWA manifest через `vite.config.ts` | `apps/web/vite.config.ts` manifest section |

### ❌ Критические пробелы

1. `robots.txt` не блокирует `/dashboard`, `/habit/`, `/stats/` — Google будет индексировать авторизованные страницы
2. Нет `llms.txt` — AI-агенты (ChatGPT, Perplexity) не знают о продукте
3. Нет `/blog` — нет органического трафика по информационным запросам
4. Нет страниц сравнения `/vs/[competitor]` — упускается горячий трафик
5. Нет GA4 / GSC — нет данных о позициях и поведении
6. Нет `hreflang` — нет сигналов для мультиязычного ранжирования
7. Нет `beforeinstallprompt` оптимизации — низкий PWA install rate
8. Нет `screenshots` в PWA manifest — нет Google Play install banner
9. Нет страниц About/Privacy — слабые E-E-A-T сигналы
10. `sitemap.xml` статический — при добавлении блога нужна динамическая генерация

---

## Таблица приоритетов

| ID | Задача | Приоритет | Сложность | Зависимости | Спринт |
|---|---|---|---|---|---|
| SEO-01 | ✅ Исправить robots.txt | P0-CRITICAL | XS | — | 1 |
| SEO-02 | ✅ Создать llms.txt | P0-CRITICAL | XS | — | 1 |
| SEO-03 | ✅ Расширить FAQ на главной | P1-HIGH | S | — | 1 |
| SEO-04 | ✅ Добавить hreflang meta | P1-HIGH | S | — | 1 |
| SEO-05 | ✅ Страница /about | P1-HIGH | M | — | 1 |
| SEO-06 | ✅ Страница /privacy-policy | P1-HIGH | M | — | 1 |
| SEO-07 | ✅ GSC verification meta tag | P1-HIGH | XS | SEO-05 | 1 |
| SEO-08 | ✅ Динамический sitemap.xml | P1-HIGH | M | — | 2 |
| SEO-09 | ✅ Страница /features | P1-HIGH | M | SEO-08 | 2 |
| SEO-10 | ✅ Web Vitals reporting | P1-HIGH | M | — | 2 |
| SEO-11 | ⏭️ AggregateRating в schema | P2-MEDIUM | S | — | 2 |
| SEO-12 | ✅ PWA screenshots в manifest | P2-MEDIUM | S | — | 2 |
| SEO-13 | ✅ beforeinstallprompt оптимизация | P2-MEDIUM | M | — | 2 |
| SEO-14 | ✅ Инфраструктура блога | P2-MEDIUM | L | SEO-08 | 3 |
| SEO-15 | ✅ Первый блог-пост: "best offline habit tracker" | P2-MEDIUM | M | SEO-14 | 3 |
| SEO-16 | ✅ Первый блог-пост: технический dev.to | P2-MEDIUM | M | SEO-14 | 3 |
| SEO-17 | ✅ Страницы сравнения /vs/[competitor] × 3 | P2-MEDIUM | L | SEO-09, SEO-14 | 3 |
| SEO-18 | ✅ ProductHunt + AlternativeTo листинг | P2-MEDIUM | S | SEO-05 | 3 |
| SEO-19 | ✅ GA4 интеграция | P3-LOW | M | — | 4 |
| SEO-20 | ⏭️ TWA Google Play через Bubblewrap | P3-LOW | L | SEO-12 | 4 |
| SEO-21 | ✅ Lighthouse CI в GitHub Actions | P3-LOW | M | SEO-10 | 4 |

---

## Спринт 1 — Критические исправления (Неделя 1)

### ✅ SEO-01 — Исправить robots.txt

**Приоритет:** P0-CRITICAL  
**Сложность:** XS (5 мин)  
**Файл:** `apps/web/static/robots.txt`

**Проблема:** Текущий `robots.txt` содержит только `Allow: /` — Google будет индексировать `/dashboard`, `/habit/[id]`, `/stats/` (авторизованные страницы без SEO-содержимого). Это тратит crawl budget и может ухудшить позиции главной страницы.

**Acceptance criteria:**
- `Disallow` добавлен для всех protected-путей
- `Disallow` добавлен для API-путей
- `Sitemap` указывает на правильный origin

**Изменение:**
```
User-agent: *
Allow: /

Disallow: /dashboard
Disallow: /habit/
Disallow: /stats/
Disallow: /api/
Disallow: /sync/
Disallow: /auth/

Sitemap: https://habbit-runner.app/sitemap.xml
```

**⚠️ Риск для AI-агента:**
- Не блокировать `/auth/callback` если это страница OAuth — но Google не должен её индексировать
- Маршруты `(protected)` в SvelteKit — group route, но реальные URL не содержат слово `protected`. Проверь актуальные пути через `apps/web/src/routes/(protected)/*/` → реальные пути `/dashboard`, `/habit/[id]`, `/stats/`

---

### ✅ SEO-02 — Создать llms.txt

**Приоритет:** P0-CRITICAL  
**Сложность:** XS  
**Файл:** `apps/web/static/llms.txt` (новый файл)

**Проблема:** AI-агенты (ChatGPT, Perplexity, Claude) не имеют верифицированных данных о продукте. Это стандарт 2025 года — аналог `robots.txt` для LLM-краулеров.

**Acceptance criteria:**
- Файл доступен по URL `https://habbit-runner.app/llms.txt`
- Содержит продуктовое описание, ключевые фичи, структуру сайта
- Используется английский язык

**⚠️ Риск для AI-агента:**
- Файл не должен содержать конфиденциальных данных (API ключи, пути к секретам)
- Не включать технические детали инфраструктуры (DB connections и т.п.)

---

### ✅ SEO-03 — Расширить FAQ на главной

**Приоритет:** P1-HIGH  
**Сложность:** S  
**Файл:** `apps/web/src/lib/seo/publicPages.ts` → секция `PUBLIC_LANDING_SEO.faq`

**Проблема:** На главной странице только 3 FAQ-вопроса. Google требует минимум 5–8 для формирования rich snippet. Целевая аудитория ищет "offline habit tracker", "habit tracker without internet" — этих вопросов нет в FAQ.

**Acceptance criteria:**
- FAQ содержит минимум 8 вопросов
- Покрыты кластеры: offline, PWA, бесплатность, приватность, синхронизация, уведомления
- FAQPage schema автоматически обновляется (логика уже в `PublicSeoHead.svelte`)

**Новые вопросы для добавления:**
```
Q: Does Habbit Runner work without an internet connection?
A: Yes. Habbit Runner stores all data locally using IndexedDB. You can track habits, log completions, and review stats offline. Changes sync automatically when you reconnect.

Q: Is my habit data private?
A: Your data is stored locally on your device first. Sync uses secure JWT tokens over HTTPS. No habit data is shared with third parties or used for advertising.

Q: Do I need to download an app from an app store?
A: No. Habbit Runner is a Progressive Web App (PWA). You can install it directly from your browser — no App Store required.

Q: Does it send push notifications without a native app installed?
A: Yes. Web push notifications work through your browser. You can enable reminders for individual habits from the habit settings screen.

Q: How does background sync work?
A: Habbit Runner uses a pull-push-pull sync cycle. When you come back online, it pulls server changes, pushes local changes, then pulls again to resolve conflicts.
```

**⚠️ Риск для AI-агента:**
- FAQ-вопросы должны звучать естественно, не как keyword stuffing
- Ответы не должны содержать markdown-форматирование (они идут в JSON-LD, не в HTML)
- Следи за дублированием вопросов с SEO-подстраницами (habit-tracker, streak-tracker)

---

### ✅ SEO-04 — Добавить hreflang meta

**Приоритет:** P1-HIGH  
**Сложность:** S  
**Файл:** `apps/web/src/lib/components/PublicSeoHead.svelte`

**Проблема:** Без `hreflang` Google не знает, что сайт ориентирован на EN-рынок. При добавлении DE/FR в будущем без этого фундамента придётся переделывать структуру.

**Acceptance criteria:**
- `<link rel="alternate" hreflang="en" href="..." />` добавлен для всех публичных страниц
- `<link rel="alternate" hreflang="x-default" href="https://habbit-runner.app/" />` на главной
- Значения берутся из `pathname` prop

**⚠️ Риск для AI-агента:**
- `hreflang="en"` без региона (не `en-US`) — более широкий охват, правильно для MVP
- Значение `href` должно быть **абсолютным URL**, не относительным
- `x-default` ставить ТОЛЬКО на главной странице `/`

---

### ✅ SEO-05 — Страница /about

**Приоритет:** P1-HIGH  
**Сложность:** M  
**Файлы:**
- `apps/web/src/routes/about/+page.svelte` (новый)
- `apps/web/src/routes/about/+page.ts` (новый, `export const prerender = true`)
- `apps/web/src/lib/seo/publicPages.ts` — добавить конфиг `PUBLIC_ABOUT_SEO`
- `apps/web/static/sitemap.xml` — добавить URL (или см. SEO-08 для динамики)

**Проблема:** Без About-страницы Google понижает E-E-A-T сигнал сайта. Пользователи с опасениями по приватности (48% аудитории) не находят информацию о команде.

**Acceptance criteria:**
- Страница SSR-рендерится с title/meta
- Содержит: кто создал продукт, миссия, технологии
- Ссылки на Privacy Policy и Contact
- Schema.org `Organization` с адресом и контактом
- Добавлена в навигацию footer PublicLanding и PublicSeoPage

**⚠️ Риск для AI-агента:**
- Не раскрывать личные данные без явного разрешения пользователя
- Страница должна быть доступна без авторизации (не в `(protected)` group)

---

### ✅ SEO-06 — Страница /privacy-policy

**Приоритет:** P1-HIGH  
**Сложность:** M  
**Файлы:**
- `apps/web/src/routes/privacy-policy/+page.svelte` (новый)
- `apps/web/src/routes/privacy-policy/+page.ts` (новый, `export const prerender = true`)

**Проблема:** Отсутствие Privacy Policy — нарушение GDPR/CCPA и сигнал недоверия для Google. Chrome показывает предупреждение для PWA без Privacy Policy при установке.

**Acceptance criteria:**
- Покрывает: данные которые собираются, Google OAuth, IndexedDB, sync, push notifications
- Содержит контактный email
- Дата последнего обновления
- Ссылка из footer на всех публичных страницах

**⚠️ Риск для AI-агента:**
- Не генерировать юридически обязывающий текст без проверки юристом — использовать шаблон с явным `[REVIEW REQUIRED]` маркером
- Privacy Policy должна быть написана на **английском** языке (согласно политике репозитория)

---

### ✅ SEO-07 — Google Search Console verification

**Приоритет:** P1-HIGH  
**Сложность:** XS  
**Файл:** `apps/web/src/app.html`

**Проблема:** Без верификации в GSC нет данных о позициях, кликах, индексировании. Это слепое пятно для всей SEO-стратегии.

**Acceptance criteria:**
- `<meta name="google-site-verification" content="..." />` добавлен в `<head>`
- Значение вынесено в environment variable `VITE_GSC_VERIFICATION_TOKEN`
- Fallback: если переменная не задана, тег не рендерится

**⚠️ Риск для AI-агента:**
- Не hardcode verification token в исходном коде (секрет)
- В `.env.example` добавить `VITE_GSC_VERIFICATION_TOKEN=` без значения
- Аналогично добавить для Bing: `<meta name="msvalidate.01" content="..." />`

---

## Спринт 2 — SEO-фундамент (Неделя 2–3)

### ✅ SEO-08 — Динамический sitemap.xml

**Приоритет:** P1-HIGH  
**Сложность:** M  
**Файлы:**
- `apps/web/src/routes/sitemap.xml/+server.ts` (новый)
- Удалить `apps/web/static/sitemap.xml` (или оставить как fallback)

**Проблема:** Текущий `sitemap.xml` статический. При добавлении блога (SEO-14) его нельзя будет поддерживать вручную. SvelteKit server routes позволяют генерировать его динамически.

**Acceptance criteria:**
- `GET /sitemap.xml` возвращает корректный XML с правильным `Content-Type`
- Включает все публичные страницы: `/`, `/habit-tracker`, `/streak-tracker`, `/daily-routine-planner`, `/about`, `/privacy-policy`, `/features`
- При наличии блога — включает все пути `/blog/[slug]` (из файловой системы или CMS)
- `lastmod` проставляется актуальной датой

**Техническая реализация:**
```typescript
// apps/web/src/routes/sitemap.xml/+server.ts
import { PUBLIC_SITE_ORIGIN } from '$lib/seo/publicPages';

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/habit-tracker', priority: '0.9', changefreq: 'monthly' },
  // ...
];

export async function GET() {
  const xml = buildSitemap(STATIC_PAGES);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
```

**⚠️ Риск для AI-агента:**
- SvelteKit server routes не поддерживают `prerender = true` при динамическом контенте — нужно проверить совместимость с `adapter-static`
- Если используется `adapter-static`, маршрут `/sitemap.xml/+server.ts` должен быть в `prerender.entries` конфиге
- Статический файл `apps/web/static/sitemap.xml` будет иметь приоритет над server route — **удалить его** до деплоя

---

### ✅ SEO-09 — Страница /features

**Приоритет:** P1-HIGH  
**Сложность:** M  
**Файлы:**
- `apps/web/src/routes/features/+page.svelte` (новый)
- `apps/web/src/routes/features/+page.ts` (новый, `export const prerender = true`)
- `apps/web/src/lib/seo/publicPages.ts` — добавить `PUBLIC_FEATURES_SEO`

**Проблема:** Страница `/features` — hub-страница для всей семантики второго уровня. Без неё нет централизованного узла для внутренней перелинковки. Конкуренты имеют `/features` с detail списком.

**Acceptance criteria:**
- Покрывает все функции: offline, sync, streaks, push notifications, OAuth, stats
- Структура: H1 → H2 для каждого feature → описание + скриншот/иконка
- Internal links к `/habit-tracker`, `/streak-tracker`, `/daily-routine-planner`
- CTA на авторизацию
- Schema.org `SoftwareApplication` с `featureList` property

**⚠️ Риск для AI-агента:**
- Описание фич должно точно отражать текущую реализацию — сверяться с `CLAUDE.md` архитектурными секциями
- Не упоминать push notifications для iOS если PWA на Safari всё ещё ограничен (проверить актуальность)

---

### ✅ SEO-10 — Web Vitals reporting

**Приоритет:** P1-HIGH  
**Сложность:** M  
**Файлы:**
- `apps/web/src/hooks.client.ts` (изменить)
- `apps/web/package.json` — добавить `web-vitals` package

**Проблема:** Core Web Vitals (LCP, INP, CLS) являются ranking factor с 2021 года. Без мониторинга нет возможности обнаружить регрессии.

**Acceptance criteria:**
- `web-vitals` package установлен
- LCP, INP, CLS, FCP, TTFB отправляются в `console.debug` для dev + в `navigator.sendBeacon` для prod
- Endpoint для prod: `/api/vitals` (или внешний, например Vercel Analytics endpoint)
- Данные включают: метрика, значение, URL, устройство
- Не блокирует основной поток

**⚠️ Риск для AI-агента:**
- `web-vitals` v3+ изменил API — использовать именно `onLCP`, `onINP`, `onCLS` (не `getLCP` старого API)
- `sendBeacon` не гарантирует доставку при закрытии таба — это нормально для витальных метрик
- Не собирать PII (IP-адреса, user IDs) без явного согласия — отправлять только техническую метрику

---

### ⏭️ SEO-11 — AggregateRating в schema

**Приоритет:** P2-MEDIUM  
**Сложность:** S  
**Файл:** `apps/web/src/lib/seo/publicPages.ts` → `buildSoftwareSchema()`

**Проблема:** `SoftwareApplication` schema без `aggregateRating` не генерирует star rating rich snippet в SERP. Это значительно снижает CTR по сравнению с конкурентами.

**Acceptance criteria:**
- `aggregateRating` добавлен с реальными или начальными данными
- Значения должны быть **честными** и обновляться по мере роста
- Если отзывов ещё нет — не добавлять (Google может пенализировать фейковые rating)

**⚠️ Риск для AI-агента:**
- НЕ добавлять `aggregateRating` с фиктивными данными — это нарушение Google Search Quality Guidelines
- Добавлять только когда есть реальные отзывы (ProductHunt, G2 и т.п.)
- Альтернатива: добавить `review` property с одним реальным отзывом

---

### ✅ SEO-12 — PWA screenshots в manifest

**Приоритет:** P2-MEDIUM  
**Сложность:** S  
**Файл:** `apps/web/vite.config.ts` → manifest section

**Проблема:** Без `screenshots` в manifest.webmanifest Google Play не показывает preview при установке PWA через TWA. Также Chrome не показывает enhanced install dialog.

**Acceptance criteria:**
- 2 screenshot добавлены: desktop (1280×720) и mobile (390×844)
- Файлы созданы в `apps/web/static/screenshots/`
- `form_factor: "narrow"` для мобильного screenshot

**⚠️ Риск для AI-агента:**
- Screenshots должны быть реальными — снять через Chrome DevTools
- Формат PNG, максимум 3 screenshots рекомендует Google
- `form_factor` доступен только в Chrome 109+ — для широкой совместимости добавить оба

---

### ✅ SEO-13 — beforeinstallprompt оптимизация

**Приоритет:** P2-MEDIUM  
**Сложность:** M  
**Файлы:**
- `apps/web/src/lib/stores/installPrompt.ts` (новый)
- `apps/web/src/routes/(protected)/dashboard/+page.svelte` (изменить)

**Проблема:** По умолчанию Chrome показывает install prompt сразу при первом посещении. Это раздражает новых пользователей и снижает конверсию. Правильная стратегия — показывать после первого значимого действия.

**Acceptance criteria:**
- `beforeinstallprompt` event перехватывается и откладывается
- Prompt показывается после создания первой привычки (или после 3-й сессии)
- Используется Svelte store для хранения `deferredPrompt`
- Кнопка "Install App" добавлена в dashboard navbar (показывается только если prompt доступен)

**⚠️ Риск для AI-агента:**
- `beforeinstallprompt` недоступен в Safari/iOS — условие `if (deferredPrompt)` обязательно
- Store должен очищать prompt после использования (вызова `.prompt()`)
- Не показывать install banner если приложение уже установлено (`window.matchMedia('(display-mode: standalone)').matches`)

---

## Спринт 3 — Контент-инфраструктура (Месяц 2)

### ✅ SEO-14 — Инфраструктура блога

**Приоритет:** P2-MEDIUM  
**Сложность:** L  
**Файлы:**
- `apps/web/src/routes/blog/+page.svelte` (новый — блог-индекс)
- `apps/web/src/routes/blog/+page.ts` (новый)
- `apps/web/src/routes/blog/[slug]/+page.svelte` (новый)
- `apps/web/src/routes/blog/[slug]/+page.ts` (новый)
- `apps/web/src/lib/blog/` (новая директория для markdown-постов или data-файлов)
- `apps/web/src/lib/blog/posts.ts` (новый — манифест постов)

**Проблема:** Без блога нет входной точки для информационного трафика (top-of-funnel). Конкуренты имеют десятки posts по запросам "how to build habits", "best habit tracker 2025".

**Acceptance criteria:**
- `/blog` — индекс со списком постов (SSR + prerender)
- `/blog/[slug]` — individual post page (SSR + prerender при статическом контенте)
- Поддержка: заголовки H1-H4, списки, код
- Schema.org `Article` с `datePublished`, `author`, `headline`
- `BreadcrumbList` schema: Home → Blog → Post
- Open Graph type `article` для постов
- Автоматическое добавление в sitemap.xml (интеграция с SEO-08)

**Варианты реализации контента:**
1. **Markdown + mdsvex** (простейший вариант) — файлы `.md` в `apps/web/src/lib/blog/content/`
2. **JSON-файлы** — структурированный контент в TypeScript
3. **Headless CMS** (Contentful, Sanity) — сложнее, нужно на будущее

**⚠️ Риск для AI-агента:**
- `mdsvex` — отдельный пресет для SvelteKit. Требует изменения `svelte.config.js`
- При использовании `adapter-static` + prerender: все slug'и должны быть известны при build-time
- Не путать SvelteKit `+page.ts` load с server-only `+page.server.ts` — для статического блога использовать `+page.ts`
- Проверить совместимость `mdsvex` с Svelte 5 runes mode (может быть проблемы)

---

### ✅ SEO-15 — Пост: "Best Offline Habit Tracker 2025"

**Приоритет:** P2-MEDIUM  
**Сложность:** M  
**Зависимость:** SEO-14

**Целевые ключевые слова:** `offline habit tracker`, `habit tracker without internet`, `best habit tracker 2025`

**Структура:**
```
H1: Best Offline Habit Tracker Apps in 2025
H2: Why Offline Support Matters for Habit Tracking
H2: Top Offline Habit Tracker Options
  H3: Habbit Runner (PWA, IndexedDB, background sync)
  H3: ...competitors
H2: How to Choose an Offline Habit Tracker
H2: Frequently Asked Questions
```

**Acceptance criteria:**
- 1500+ слов
- Минимум 3 внутренних ссылки на `/habit-tracker`, `/features`, `/`
- FAQPage schema с 4+ вопросами про offline
- Дата публикации в schema

**⚠️ Риск для AI-агента:**
- Не делать пост просто рекламой Habbit Runner — нужен реальный обзор альтернатив
- Не упоминать несуществующие фичи конкурентов — проверять актуальность
- Избегать keyword stuffing — `offline habit tracker` не более 8–10 раз на 1500 слов

---

### ✅ SEO-16 — Технический пост на Dev.to

**Приоритет:** P2-MEDIUM  
**Сложность:** M  
**Зависимость:** SEO-14

**Тема:** "Building an Offline-First PWA with SvelteKit and Dexie"

**Цель:** Backlink с Dev.to (DA 90+), dev-аудитория, демонстрация экспертизы

**Acceptance criteria:**
- Пост опубликован на `dev.to` с canonical URL на `habbit-runner.app/blog/[slug]`
- Содержит: архитектуру sync engine, IndexedDB схему, service worker конфиг
- Ссылка на live demo и GitHub (если open source)
- Перекрёстно опубликован в блоге (с canonical на dev.to ИЛИ на сайте — один источник истины)

**⚠️ Риск для AI-агента:**
- Dev.to canonical link должен указывать на оригинальный источник публикации
- Не раскрывать секреты конфигурации в примерах кода
- Пост должен быть актуальным — сверять с текущей архитектурой в `apps/web/src/lib/syncEngine.ts`

---

### ✅ SEO-17 — Страницы сравнения /vs/[competitor]

**Приоритет:** P2-MEDIUM  
**Сложность:** L  
**Зависимости:** SEO-09, SEO-08

**Целевые страницы:**
1. `/vs/habitica` — `habitica vs habbit runner`
2. `/vs/streaks-app` — `streaks app alternative offline`
3. `/vs/beeminder` — `beeminder alternative without commitment contracts`

**Структура каждой страницы:**
```
H1: Habbit Runner vs [Competitor] — [UTP angle]
H2: Overview
H2: Comparison Table
H2: [Competitor] Strengths
H2: Why Choose Habbit Runner?
H2: Verdict
```

**Acceptance criteria:**
- Общий layout-компонент `ComparisonPage.svelte`
- Данные компаратора в `apps/web/src/lib/seo/competitors.ts`
- Schema.org — не стандартный тип для сравнений, использовать `Article`
- Internal links от `/features` к каждой comparison странице

**⚠️ Риск для AI-агента:**
- **Не делать ложных заявлений** о конкурентах — только факты
- Не копировать торговые знаки конкурентов без атрибуции
- Регулярно обновлять (конкуренты меняют фичи)

---

### ✅ SEO-18 — ProductHunt + AlternativeTo листинг

**Приоритет:** P2-MEDIUM  
**Сложность:** S  
**Зависимость:** SEO-05 (нужна About страница)

**Не требует изменений в коде** — это операционная задача.

**Acceptance criteria для ProductHunt:**
- Tagline: "Offline-first habit tracker — no app store, works without internet"
- Description: покрывает offline, PWA, push notifications, Google sync
- Скриншоты: desktop + mobile
- Первый comment от maker объясняет техническую архитектуру (dev-аудитория ProductHunt ценит)

**Acceptance criteria для AlternativeTo:**
- Страница продукта с категорией "Habit Tracker"
- Помечен как PWA, Free, Open Source (если применимо)

**⚠️ Риск для AI-агента:**
- ProductHunt launch — manual operation, агент не может создавать аккаунты
- Задача для: создать **подготовительный контент** (tagline, description, скриншоты) → сохранить в `docs/marketing/producthunt-launch.md`

---

## Спринт 4 — Аналитика и масштаб (Месяц 3+)

### ✅ SEO-19 — GA4 интеграция

**Приоритет:** P3-LOW  
**Сложность:** M  
**Файлы:**
- `apps/web/src/app.html` (добавить gtag script)
- `apps/web/src/lib/analytics/` (новая директория)
- `apps/web/src/lib/analytics/events.ts` (новый — typed event helpers)

**Acceptance criteria:**
- GA4 measurement ID в env var `VITE_GA4_MEASUREMENT_ID`
- Кастомные события: `habit_created`, `habit_completed`, `pwa_installed`, `sync_completed`
- Pageview tracking для SvelteKit navigation (использовать `afterNavigate` hook)
- Cookie consent banner перед активацией (GDPR)

**⚠️ Риск для AI-агента:**
- SvelteKit SPA navigation не вызывает pageview автоматически — нужен `afterNavigate` хук
- GA4 gtag script должен загружаться **после** cookie consent
- Protected страницы (`/dashboard` и т.п.) не должны передавать habit-content данные в GA4 (только type событий без PII)
- Не добавлять GA4 скрипт жёстко в app.html — использовать условный рендеринг по env var

---

### ⏭️ SEO-20 — TWA Google Play через Bubblewrap

**Приоритет:** P3-LOW  
**Сложность:** L  
**Зависимость:** SEO-12 (screenshots)

**Команда:** `npx @bubblewrap/cli init --manifest https://habbit-runner.app/manifest.webmanifest`

**Acceptance criteria:**
- TWA проект создан в отдельном репозитории или в `apps/android-twa/`
- `assetlinks.json` создан и размещён по пути `https://habbit-runner.app/.well-known/assetlinks.json`
- Сборка APK проходит успешно
- Минимальный Lighthouse PWA score: 92

**⚠️ Риск для AI-агента:**
- Требует Android SDK и Java — не выполнять в sandbox окружении
- `assetlinks.json` должен содержать правильный SHA-256 fingerprint APK signing key
- Google Play требует Privacy Policy URL — убедиться что SEO-06 выполнен

---

### ✅ SEO-21 — Lighthouse CI в GitHub Actions

**Приоритет:** P3-LOW  
**Сложность:** M  
**Зависимость:** SEO-10

**Файлы:**
- `.github/workflows/lighthouse.yml` (новый)
- `lighthouserc.json` (новый)

**Acceptance criteria:**
- Запускается при каждом PR на main
- Проверяет: Performance ≥ 85, SEO = 100, Accessibility ≥ 90, PWA ≥ 80
- Использует `lhci` (Lighthouse CI)
- PR блокируется при регрессии > 10 баллов

**⚠️ Риск для AI-агента:**
- Lighthouse CI требует deployment URL — для PR нужен preview deployment или статический serve
- Использовать `--chrome-flags="--no-sandbox"` в CI окружении
- Не запускать против `localhost` — Lighthouse даёт неверные результаты без реального HTTP

---

## Архитектурные зависимости (граф)

```
SEO-01 (robots) ──────────────────────────────────┐
SEO-02 (llms.txt) ────────────────────────────────┤
SEO-03 (FAQ) ────────────────────────────────────┤
SEO-04 (hreflang) ───────────────────────────────┤
SEO-05 (about) ───────────────────────────────── ├──► SEO-07 (GSC)
SEO-06 (privacy) ────────────────────────────────┘         │
                                                           ▼
SEO-08 (dynamic sitemap) ◄──────────────────────── SEO-14 (blog)
         │                                                  │
         ▼                                                  ▼
SEO-09 (features) ──────────────────────────► SEO-17 (vs pages)
                                                           │
SEO-10 (web vitals) ───────────────────────► SEO-21 (Lighthouse CI)
SEO-12 (screenshots) ──────────────────────► SEO-20 (TWA)
SEO-13 (install prompt) ───────────────────► standalone
SEO-15, SEO-16 (blog posts) ◄─────────────── SEO-14 (blog infra)
SEO-18 (ProductHunt) ◄──────────────────────── SEO-05 (about)
SEO-19 (GA4) ──────────────────────────────── standalone
SEO-11 (AggregateRating) ──────────────────── standalone (needs real reviews)
```

---

## Глобальные риски для AI-агента

### 1. SvelteKit adapter-static constraints
- **Риск:** `adapter-static` требует все пути быть известными при build-time
- **Признак проблемы:** ошибки при `npm run build` вида "route cannot be prerendered"
- **Решение:** проверять `svelte.config.js` перед добавлением новых routes. Dynamic routes `/blog/[slug]` требуют `prerender.entries` в config
- **Файл для проверки:** `apps/web/svelte.config.js`

### 2. Конфликт статических файлов и server routes
- **Риск:** файл в `apps/web/static/sitemap.xml` перекрывает server route `/sitemap.xml/+server.ts`
- **Правило:** любой server route должен не иметь одноимённого файла в `static/`
- **Файлы под риском:** `sitemap.xml`, `robots.txt`

### 3. SvelteKit Svelte 5 runes mode
- **Риск:** проект использует Svelte 5 runes (`$state`, `$derived`, `$props`) — legacy компоненты могут не работать
- **Правило:** при создании новых `.svelte` файлов использовать runes API, не Options API
- **Проверка:** `<script lang="ts">` с `$props()`, `$state()`, `$derived()`

### 4. `prerender = true` на server routes
- **Риск:** server routes (`+server.ts`) не могут быть prerendered при динамическом контенте
- **Исключение:** `/sitemap.xml/+server.ts` может быть prerendered если контент статический
- **Добавить в `svelte.config.js`:** `prerender: { entries: ['/sitemap.xml'] }`

### 5. Секреты и environment variables
- **Риск:** случайный commit GSC verification token, GA4 ID в исходный код
- **Правило:** все SEO tokens → `VITE_*` env vars → только через `.env` файл (в .gitignore)
- **Файл для обновления:** `apps/web/.env.example` при добавлении каждой новой переменной

### 6. Schema.org JSON-LD injection
- **Риск:** XSS через `JSON.stringify` в `<script type="application/ld+json">`
- **Текущая защита:** `PublicSeoHead.svelte` уже экранирует `<` как `\u003c`
- **Правило:** не изменять этот escaping при редактировании `publicPages.ts`

### 7. Protected routes в sitemap
- **Риск:** случайное добавление `/dashboard`, `/habit/[id]` в sitemap
- **Правило:** whitelist-подход — явно перечислять публичные страницы, не использовать glob

### 8. Google Fonts и LCP
- **Риск:** fonts.googleapis.com загрузка блокирует LCP (First Contentful Paint)
- **Текущее состояние:** `<link rel="preconnect">` есть в `app.html`, но нет `font-display: swap`
- **Улучшение для SEO-10:** добавить `&display=swap` в Google Fonts URL (уже есть) + `font-display: swap` в CSS

### 9. Конкурентные страницы /vs/[competitor]
- **Риск:** юридические претензии от конкурентов при некорректных сравнениях
- **Правило:** только факты, со ссылками на официальные источники. Не использовать trademark в мета-тегах (только в human-readable content)

### 10. Privacy Policy как юридический документ
- **Риск:** неправильно составленная Privacy Policy = GDPR violation
- **Правило для агента:** создать шаблон с маркером `[HUMAN REVIEW REQUIRED]` в критических секциях. Не публиковать без ревью.

---

## Чеклист для каждого SEO-изменения

Перед merge любого SEO-PR проверять:

```
□ prerender = true (или ssr + prerender setup) в +page.ts
□ PublicSeoHead с корректным title, description, pathname
□ Страница добавлена в sitemap (static или dynamic)
□ Canonical URL установлен
□ robots.txt не блокирует новую страницу
□ Schema.org валиден (https://validator.schema.org/)
□ OG image указан
□ Нет hardcoded секретов
□ Lighthouse score не деградировал (если CI настроен)
□ Внутренняя перелинковка: страница ссылается на связанные страницы
□ Footer обновлён со ссылкой на новую страницу
```

---

## Ключевые метрики для отслеживания прогресса

| Метрика | Инструмент | Цель | Когда проверять |
|---|---|---|---|
| GSC impressions | Google Search Console | +20%/месяц | Еженедельно |
| GSC clicks | Google Search Console | CTR > 3% | Еженедельно |
| Core Web Vitals (LCP) | PageSpeed Insights | < 2.5s | После каждого деплоя |
| Indexed pages | GSC Coverage | 100% публичных страниц | Еженедельно |
| Backlinks | Ahrefs/manual | +5/месяц | Ежемесячно |
| PWA install rate | GA4 | > 5% MAU | Ежемесячно |
| Blog organic traffic | GA4 | +15%/месяц | Ежемесячно |

---

*Последнее обновление: April 2026 — по результатам аудита кодовой базы*

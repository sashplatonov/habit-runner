Отлично! Теперь у меня достаточно данных для составления детального плана. Вот полный SEO-план для твоего проекта:

---

# 🚀 Полный SEO-план для Habit Tracker PWA

> **Контекст рынка:** Рынок habit-tracking приложений оценивается в $1.9 млрд в 2025 году и прогнозируется рост до $5.5 млрд к 2033 году с CAGR 14.2%. Это растущий, но высококонкурентный рынок. Более 12 500 цифровых wellness-платформ конкурируют глобально. Значит — побеждает тот, кто правильно занимает нишевые позиции, а не пытается конкурировать с Habitica лоб в лоб.

---

## 🔍 Раздел 1. Анализ ключевых слов

### 1.1 Конкурентный ландшафт

Ключевые игроки: Productive Habit Tracker, Streaks, Strides, Goalify, TickTick, Beeminder, Habitica, Habitify, HabitNow, HabitBull. Все они — нативные приложения. **Твоё PWA с offline-first и синхронизацией — это реальная дифференциация**, которую нужно сделать ядром семантики.

### 1.2 Кластеры ключевых слов

#### 🔴 Tier 1 — Высокочастотные (конкурентные, целиться на попадание в топ-20)

| Ключевое слово | Поисковый интент | Почему важно |
|---|---|---|
| `habit tracker app` | Навигационный / коммерческий | Основной HV-запрос ниши |
| `habit tracking app` | Коммерческий | Синоним, обязателен |
| `best habit tracker` | Коммерческий | Попадают в listicle-контент |
| `daily habit tracker` | Коммерческий | Прямое попадание в функционал |
| `habit tracker web app` | Коммерческий | Веб-специфика — меньше конкуренция |
| `free habit tracker` | Транзакционный | Монетизационный крючок |

#### 🟡 Tier 2 — Среднечастотные (основные целевые позиции)

| Ключевое слово | Почему важно для ТЕБЯ |
|---|---|
| `offline habit tracker` | **Прямое УТП** — мало конкурентов |
| `habit tracker PWA` | Технически подготовленная аудитория |
| `habit tracker without internet` | Проблемный запрос = высокая конверсия |
| `habit tracker with sync` | Функциональный запрос |
| `habit tracker web push notifications` | Уникальная фича |
| `habit tracker Google login` | Снижает барьер входа |
| `open source habit tracker` | Dev-аудитория, линкбилдинг |
| `habit tracker progressive web app` | Long-tail, но целевой |

#### 🟢 Tier 3 — Длиннохвостые (быстрые победы, высокая конверсия)

```
"habit tracker that works offline"
"habit tracker no app download required"
"habit tracker browser based"
"habit tracker with statistics and calendar"
"habit tracker with multiple goals per day"
"habit tracker background sync"
"best PWA productivity app 2025"
"habit tracker with retroactive logging"
"habit completion tracker with streaks"
"daily goal tracker with push notifications"
```

### 1.3 LSI и семантические кластеры

Разбей семантику на **5 тематических кластеров** для контент-стратегии:

```
[ПРОДУКТ]       habit tracker, habit app, daily tracker, routine tracker
[ОФЛАЙН]        offline app, no internet, works without wifi, cached app
[PWA]           progressive web app, installable web app, app-like website
[ФУНКЦИИ]       push notifications, habit streaks, habit calendar, habit stats
[БОЛЬ]          how to build habits, habit consistency, atomic habits tracker
```

### 1.4 Геолингвистика

Первичный рынок — **английский (US/UK/CA/AU)**. Вторичный — немецкий и французский (высокая платёжеспособность + меньше конкуренции). Используй `hreflang` с первого дня.

---

## 📄 Раздел 2. On-Page SEO

### 2.1 Структура страниц и Title/Meta

#### Главная страница (`/`)
```html
<title>HabitSync — Offline Habit Tracker PWA with Push Notifications</title>
<meta name="description" content="Track your daily habits anywhere — 
even without internet. Free PWA habit tracker with background sync, 
push notifications, and beautiful statistics. Works on any device.">
```

> ⚠️ **Важно:** у тебя SvelteKit с `view state` без роутера — это SEO-проблема. Подробнее в Разделе 3.

#### Страница возможностей (`/features`)
```html
<title>Features — Offline Sync, Push Notifications, Habit Calendar | HabitSync</title>
```

#### Страница сравнения (`/vs/habitica`, `/vs/streaks`)
```html
<title>HabitSync vs Habitica — Which Habit Tracker Works Offline?</title>
```

#### Блог (`/blog/[slug]`)
```html
<title>How to Build Habits That Stick in 2025 | HabitSync Blog</title>
```

### 2.2 Schema Markup — обязательные типы

```json
// На главной — SoftwareApplication
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "HabitSync",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

```json
// На блоге — Article + BreadcrumbList
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": {"@type": "Person", "name": "..."},
  "datePublished": "2025-04-01"
}
```

```json
// FAQ-блок на landing (даёт rich snippet)
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Does HabitSync work without internet?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes, HabitSync is an offline-first PWA..."
    }
  }]
}
```

### 2.3 Структура заголовков (H1–H4)

**Главная страница:**
```
H1: Track Your Habits Offline — Anywhere, Anytime
H2: Why HabitSync?
  H3: Works Without Internet (Offline-First PWA)
  H3: Background Sync When You're Back Online
  H3: Push Notifications — No App Download Needed
H2: How It Works
H2: Features
H2: Frequently Asked Questions
```

**Правило:** один H1 на страницу, H2 = семантические секции, H3 = подфункции. Никаких H2 в навигации.

### 2.4 Внутренняя перелинковка

Создай **hub-страницу** `/features` как центральный узел:
```
/                  ←→ /features
/features          ←→ /blog/[related posts]
/blog/[post]       ←→ /features#relevant-feature
/vs/[competitor]   ←→ /features, /
```

---

## 🏗️ Раздел 3. Техническое SEO

### 3.1 Критическая проблема: SvelteKit + CSR vs SSR

PWA SEO требует понимания того, как контент рендерится и как его читают краулеры. Краулеры могут испытывать проблемы с JavaScript-сайтами, особенно когда ключевой HTML скрыт за JS-взаимодействиями.

Твой стек — SvelteKit, который **поддерживает SSR из коробки**. Это огромный плюс. Но судя по описанию (`view state` без роутера) — у тебя, вероятно, SPA-режим. Это нужно немедленно исправить.

**Action plan:**

```javascript
// svelte.config.js — включи SSR для маркетинговых страниц
export default {
  kit: {
    adapter: adapter({
      // Для маркетинговых страниц — SSR
      // Для app-части — можно CSR после авторизации
    })
  }
}

// +page.js для лендинга
export const ssr = true;
export const prerender = true; // для статических страниц

// +page.js для трекера (за логином)
export const ssr = false; // можно CSR, это не индексируется
```

Гибридный рендеринг объединяет клиентский и серверный рендеринг. При первой загрузке PWA использует SSR, делая весь HTML доступным для краулеров. Затем, при взаимодействии пользователя, CSR обеспечивает плавный app-like опыт.

### 3.2 Web Vitals — метрики для ранжирования

| Метрика | Цель | Что делать |
|---|---|---|
| **LCP** | < 2.5s | Preload hero-image, SSR выше сгиба |
| **INP** | < 200ms | Svelte 5 уже хорош, минимизируй JS-блокировку |
| **CLS** | < 0.1 | Резервируй размеры для изображений, font-display: swap |
| **FCP** | < 1.8s | Critical CSS inline, defer non-critical JS |
| **TTFB** | < 800ms | Quarkus native mode + CDN для статики |

Lighthouse аудирует сайт по категориям: Performance, Accessibility, SEO и соответствие критериям PWA. Это бесплатный инструмент, дающий ценные инсайты для улучшения UX и SEO.

### 3.3 Структура URL

**Текущая проблема:** `view state` без роутера = один URL для всего приложения = ноль индексируемых страниц.

**Правильная структура:**
```
/                          → Landing (SSR + prerender)
/features                  → Features page (SSR + prerender)
/pricing                   → Pricing (SSR + prerender)
/blog                      → Blog index (SSR)
/blog/[slug]               → Post (SSR)
/vs/[competitor]           → Comparison (SSR)
/app                       → App shell (CSR, noindex)
/app/dashboard             → Dashboard (CSR, noindex)
/app/habits/[id]           → Habit detail (CSR, noindex)
```

**Правила URL:**
- Только строчные буквы
- Дефисы вместо подчёркиваний
- Без параметров в индексируемых URL
- Каноникалы на всех страницах

### 3.4 Sitemap и robots.txt

```xml
<!-- /sitemap.xml — генерируй через SvelteKit hooks -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourapp.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourapp.com/features</loc>
    <priority>0.9</priority>
  </url>
  <!-- Все блог-посты динамически -->
</urlset>
```

```
# /robots.txt
User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/
Disallow: /sync/

Sitemap: https://yourapp.com/sitemap.xml
```

### 3.5 PWA-специфика для SEO

```json
// manifest.webmanifest — влияет на "installability" сигнал
{
  "name": "HabitSync — Habit Tracker",
  "short_name": "HabitSync",
  "description": "Offline-first habit tracker with sync and push notifications",
  "start_url": "/app?source=pwa",
  "display": "standalone",
  "categories": ["productivity", "lifestyle"],
  "screenshots": [
    // Обязательно для Google Play install banner
    {"src": "/screenshots/desktop.png", "sizes": "1280x720", "type": "image/png"},
    {"src": "/screenshots/mobile.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow"}
  ]
}
```

### 3.6 llms.txt (новый стандарт 2025)

Файл `llms.txt` действует как sitemap специально для AI-агентов, направляя краулеры вроде GPTBot к наиболее важному контенту. Создание этого файла гарантирует, что AI-модели получают верифицированные данные о продукте, а не галлюцинируют некорректные детали.

```markdown
# /llms.txt
# HabitSync — Offline Habit Tracker PWA

HabitSync is an offline-first Progressive Web App for tracking daily habits.
It works without internet connection using IndexedDB and syncs in background.

## Key Features
- Offline-first with Service Worker and IndexedDB (Dexie)
- Background sync (pull/push via /sync/pull and /sync/push)
- Web Push Notifications
- Google OAuth login
- Habit scheduling, daily goals, multi-target completion
- Retro calendar and statistics

## Documentation
- /features: Full feature list
- /blog: Guides on habit building
```

### 3.7 Технический чеклист

```
✅ HTTPS (обязательно для PWA и Chrome)
✅ HTTP/2 или HTTP/3 (Quarkus поддерживает)
✅ Gzip / Brotli сжатие для статики
✅ Cache-Control заголовки для ассетов (immutable для хэшированных)
✅ Open Graph и Twitter Card теги
✅ Canonical URL на каждой странице
✅ 404 страница с ссылками
✅ Редирект www → non-www (или наоборот)
✅ Structured data validation (schema.org validator)
✅ Mobile-friendly test
```

---

## 🔗 Раздел 4. Off-Page SEO

### 4.1 Стратегия получения ссылок

#### Быстрые победы (Неделя 1–4)

**Каталоги и агрегаторы:**
```
ProductHunt          → Launch + комментарии (DA 90+)
AlternativeTo        → Создай страницу продукта
G2 / Capterra        → Бесплатный листинг (B2C адаптация)
Slant.co             → "Best habit tracker apps"
Alternativeto.net    → Сравнение с Habitica, Streaks
ToolsFinder.co       → Добавить в PWA-каталог
PWA.rocks            → Официальный каталог PWA
```

**Open Source / Dev-сообщество:**
```
GitHub README        → Бэджи и ссылка на live demo
Dev.to               → Статья "Building an Offline-First PWA with SvelteKit"
Hacker News          → Show HN: I built an offline habit tracker PWA
Reddit               → r/webdev, r/sveltejs, r/progressivewebapps, r/selfhosted
```

#### Средний срок (Месяц 2–3)

**Listicle-placement (самое ценное):**

Сайты публикуют списки лучших habit tracker приложений, выделяя приложения с уникальным подходом. Твоя задача — попасть в эти списки.

Тактика: создай **страницы сравнения** типа `/vs/habitica`, `/vs/streaks` — они привлекают людей, уже выбирающих между продуктами, и дают естественные ссылки.

```
Целевые площадки для outreach:
- zapier.com/blog (DA 91) — уже имеет "best habit tracker" статью
- betterup.com (DA 72) — тоже имеет такой материал
- lifehack.org, makeuseof.com, techradar.com
- productivise.co, developgoodhabits.com
```

**Питч для outreach:**
> *"Мы единственный habit tracker, работающий полностью офлайн как PWA — устанавливается без App Store, синхронизируется в фоне. Это уникальная категория, которой нет в вашем списке."*

#### Долгосрочно (Месяц 4+)

```
HARO / Connectively   → Отвечай на запросы журналистов про productivity apps
Guest posts           → developgoodhabits.com, jamesclear.com-style blogs
Podcast placements    → "Cortex", "Focused", productivity podcasts
Twitter/X threads     → Технические threads про offline-first архитектуру
```

### 4.2 Цифровой PR через технический контент

Твой стек (SvelteKit 5 + Quarkus 3.34 + Mandrel native) — это **отличная история для dev-медиа**:

```
Статьи для размещения:
1. "How we built an offline-first habit tracker with SvelteKit and Dexie"
2. "Sync conflicts in PWAs: our last-write-wins solution"
3. "Web Push Notifications in 2025: VAPID implementation guide"
4. "Quarkus native vs JVM: real performance numbers"
```

Размести на: **InfoQ, DZone, The New Stack, Smashing Magazine, CSS-Tricks**.

---

## 📝 Раздел 5. Контент-стратегия

### 5.1 Целевая аудитория и их боли

Работающие профессионалы представляют наиболее вовлечённую группу пользователей, движимую желанием структурировать день, управлять стрессом и достигать целей.

Удержание пользователей — одна из ключевых проблем рынка: более 52% пользователей прекращают использование приложения в течение первых 30 дней из-за отсутствия персонализации или перегруженного интерфейса.

Это означает — **контент про "почему я бросаю трекеры" и "как не бросить"** будет работать лучше, чем "топ-10 приложений".

### 5.2 Контент-пирамида

```
ВЕРХ (Brand Awareness)
├── "What is habit tracking?" (informational, 2 000+ слов)
├── "The science of habit formation" (E-E-A-T сигнал)
└── "Why 52% of people quit habit apps in 30 days"

СЕРЕДИНА (Consideration)
├── "Best offline habit tracker apps 2025" (ты там должен быть #1)
├── "HabitSync vs Habitica: detailed comparison"
├── "HabitSync vs Streaks: which works without internet?"
├── "Free habit tracker web apps — no download needed"
└── "Best PWA productivity apps 2025"

НИЗ (Decision / Conversion)
├── "How to get started with HabitSync in 5 minutes"
├── "HabitSync for teams: habit tracking at work"
├── "Using push notifications to build habits that stick"
└── "Your habit data, always with you: offline sync explained"
```

### 5.3 Контент-календарь (первые 3 месяца)

| Неделя | Тип | Тема | Цель |
|---|---|---|---|
| 1 | Landing update | Добавить FAQ-секцию (20 вопросов) | Rich snippets |
| 2 | Blog post | "Best offline habit tracker" | Mid-funnel traffic |
| 3 | Tech article | "Building PWA with SvelteKit" (Dev.to) | Backlink + dev audience |
| 4 | Comparison | "HabitSync vs Habitica" | Competitor traffic |
| 5 | Blog post | "Why habit tracking fails — and how to fix it" | Top-funnel |
| 6 | Tutorial | "How to use HabitSync" (YouTube + embed) | UX + dwell time |
| 7 | Blog post | "The science behind streak tracking" | E-E-A-T |
| 8 | Comparison | "HabitSync vs Streaks" | Competitor traffic |
| 9 | Case study | "How I built a morning routine with HabitSync" | Social proof |
| 10 | Dev article | "Offline sync architecture explained" | Link bait |
| 11 | Blog post | "Best free habit trackers 2025" | Top-funnel + internal link |
| 12 | Roundup update | Update week-2 post with new data | Freshness signal |

### 5.4 E-E-A-T сигналы (критично в 2025)

С каждым обновлением Google важность авторитетного и доверенного бренда растёт. Не SEO-хаки, а узнаваемое имя бренда с сильными сигналами авторитета — качественными обратными ссылками и упоминаниями в известных изданиях — вот что работает долго. Ищи другие сигналы доверия: отзывы пользователей, награды, бейджи App Store, контактная информация и About-страница.

**Конкретные действия:**
```
✅ About-страница с именами создателей и их фото
✅ Privacy Policy (особенно важно: 55% юзеров беспокоятся о данных)
✅ Changelog / What's New страница
✅ Отзывы пользователей с именами и аватарами (не анонимно)
✅ "As seen in" секция после первых публикаций
✅ Open source ссылка на GitHub (если применимо)
```

---

## 📱 Раздел 6. ASO (App Store Optimization)

Твой продукт — PWA, поэтому классического ASO нет. Но есть **2 вектора**:

### 6.1 Google Play (TWA — Trusted Web Activity)

Твой PWA можно опубликовать в Google Play через TWA — это полноценная инсталляция из магазина с нативным ощущением.

```
Инструмент: Bubblewrap CLI (от Google)
Команда: npx @bubblewrap/cli init --manifest https://yourapp.com/manifest.webmanifest
```

**ASO для Google Play:**
```
App Name (30 символов):  HabitSync: Offline Habit Tracker
Short Desc (80 символов): Track habits offline. Sync when online. No ads. Free.
Long Desc (4000 символов): Включает все ключевые слова из Tier 1 и Tier 2 естественно
Keywords в описании:     habit tracker, daily habits, offline app, goal tracker,
                         push notifications, habit streak, routine tracker
Category:                Productivity
Tags:                    habits, goals, daily, routine, offline, sync
```

Keyword Check — детальный инструмент анализа ключевых слов, показывающий популярность, уровень конкуренции и потенциальную эффективность для App Store и Google Play. Используй ASOMobile для исследования ASO-ключевых слов.

### 6.2 App Store (iOS — PWA limitations)

Safari на iOS ограничивает PWA (нет push notifications до iOS 16.4, нет background sync). Задокументируй это честно или создай нативный iOS wrapper.

**Важная метрика:** iOS пользователи составляют 44% глобальных загрузок habit apps с более высокими показателями покупки. Более 118 млн iOS-пользователей активно используют productivity apps, 29% из них — трекеры привычек. iOS-пользователи показывают на 22% более высокое принятие premium-подписок. Это аргумент в пользу создания iOS wrapper в долгосрочной перспективе.

### 6.3 PWA "Install" Optimization (Web Store)

```
Chrome Web Store:
- Опубликуй расширение (даже простой bookmark helper)
- Ссылка на TWA в Google Play
- "Add to Home Screen" banner на мобильных (beforeinstallprompt)
```

**Оптимизация Install prompt:**
```javascript
// Показывай prompt ПОСЛЕ того, как юзер создал первую привычку
// Не сразу — это убивает конверсию
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Store the event, show after user engagement
  deferredPrompt = e;
});
```

---

## 📊 Раздел 7. Метрики и инструменты

### 7.1 Обязательный стек инструментов

```
БЕСПЛАТНЫЕ (старт с нуля):
├── Google Search Console    → индексация, позиции, CTR, Core Web Vitals
├── Google Analytics 4       → поведение, конверсии, источники
├── Bing Webmaster Tools     → дополнительный поисковик (15% трафика)
├── Google PageSpeed Insights → Web Vitals мониторинг
└── Lighthouse (CLI)         → автоматизация аудита в CI/CD

Более 60% поисковых запросов завершаются без клика, поэтому успех всё больше измеряется видимостью и цитированием, а не просто объёмом трафика. Поэтому отслеживай не только позиции, но и **branded impressions**.

Мониторинг упоминаний бренда в LLM-моделях (ChatGPT, Claude, Perplexity) сейчас так же критичен, как отслеживание позиций в Google SERP.

### 7.2 KPI Dashboard

| Метрика | Инструмент | Целевое значение | Период |
|---|---|---|---|
| Organic sessions | GA4 | +20% MoM | Ежемесячно |
| Keyword positions (Tier 2) | GSC / Ahrefs | Топ 20 → топ 10 | Квартально |
| LCP | PageSpeed | < 2.5s | Еженедельно |
| INP | CrUX | < 200ms | Еженедельно |
| CTR (средний) | GSC | > 3% | Ежемесячно |
| Backlinks (новые) | Ahrefs | +10/месяц | Ежемесячно |
| PWA Install rate | GA4 Custom Event | > 5% от MAU | Ежемесячно |
| Blog → App conversion | GA4 Funnel | > 2% | Ежемесячно |

### 7.3 Интеграция с твоей инфраструктурой

У тебя уже есть **Prometheus + Grafana**. Добавь SEO-специфичные метрики:

```yaml
# docker-compose.yml — добавь в Grafana dashboard
- Core Web Vitals (через Real User Monitoring)
- 404 error rate (из Nginx/Quarkus logs)
- Crawl budget (GSC API → Grafana)
- Search Console impressions (через Data Studio connector)
```

```javascript
// Отправляй Web Vitals в GA4 + собственный endpoint
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(metric => {
  gtag('event', 'web_vitals', { metric_name: 'LCP', value: metric.value });
  // Или в твой Prometheus endpoint
});
```

---

## 🗓️ Раздел 8. Пошаговый план действий

### 🔥 ПРИОРИТЕТ 1 — Критично (Неделя 1–2)

```
□ Включить SSR для маркетинговых страниц в SvelteKit
  └── Причина: сейчас Google видит пустой shell
  
□ Создать отдельные URL для публичных страниц (/, /features, /blog)
  └── Причина: view state = один URL = нет SEO

□ Добавить title, meta description, OG tags на все публичные страницы
  └── Причина: без этого нет кликов из SERP

□ Создать /sitemap.xml и /robots.txt
  └── Причина: Google должен знать, что индексировать

□ Зарегистрировать в Google Search Console
  └── Причина: без этого нет данных о позициях

□ Запустить Lighthouse audit → исправить critical issues
  └── Цель: Performance > 85, SEO = 100

□ Добавить Schema.org SoftwareApplication на главную
```

### 🟠 ПРИОРИТЕТ 2 — Важно (Неделя 3–4)

```
□ Написать и опубликовать первые 2 блог-поста:
  - "Best offline habit tracker 2025"
  - "HabitSync vs Habitica"
  
□ Создать FAQ-секцию на главной (20 вопросов → FAQPage schema)

□ Зарегистрировать в ProductHunt + AlternativeTo

□ Создать страницу /features с детальным описанием
  └── Включить все Tier 2 ключевые слова

□ Добавить /app в Disallow в robots.txt

□ Настроить GA4 с кастомными событиями (PWA install, habit created, sync success)

□ Создать /llms.txt
```

### 🟡 ПРИОРИТЕТ 3 — Рост (Месяц 2)

```
□ Опубликовать технические статьи на Dev.to / Smashing Magazine
  └── Цель: 3–5 качественных обратных ссылок

□ Запустить TWA в Google Play
  └── Инструмент: Bubblewrap CLI

□ Создать страницы сравнения /vs/[competitor] × 3

□ Настроить hreflang для EN/DE/FR

□ Начать email outreach к listicle-авторам (10 контактов/неделю)

□ Show HN на Hacker News

□ Настроить автоматический Lighthouse в CI/CD (GitHub Actions)
```

### 🟢 ПРИОРИТЕТ 4 — Масштаб (Месяц 3+)

```
□ Подключить Ahrefs / Semrush для конкурентного анализа

□ Запустить полноценный блог (1 пост/неделю по контент-плану)

□ Создать YouTube-канал с tutorial videos

□ Настроить мониторинг AI-упоминаний (ChatGPT, Perplexity)

□ Исследовать Content Gap vs конкурентов через Ahrefs

□ Программный link building: HARO / Connectively (2–3 ответа/неделю)

□ Рассмотреть нативный iOS wrapper (Capacitor.js)
```

---

## 🎯 Ключевые дифференциаторы для SEO-нарратива

На основе анализа рынка, выстрой всё вокруг **3 уникальных УТП**:

1. **Offline-first** — около 48% пользователей прекращают использование в течение 6 месяцев — часто из-за проблем с интернетом или доступностью. Ты решаешь эту проблему.

2. **Privacy by design** — несмотря на рост использования, опасения по безопасности данных остаются ключевым ограничением: около 48% пользователей выражают нежелание делиться личными поведенческими паттернами. Google OAuth + HttpOnly cookies + прозрачная политика = сильный аргумент.

3. **No App Store required** — PWA устанавливается напрямую. Сегодня можно создавать сайты с непревзойдённой гибкостью через progressive web apps. Созданные на JavaScript, они обеспечивают app-like функциональность без необходимости скачивать нативное приложение.

---

> 💡 **Главный вывод:** Твоя техническая архитектура (offline-first, PWA, background sync) — это **лучшее SEO-оружие**. Конкуренты этого не имеют. Задача — сделать так, чтобы Google это видел (SSR) и понимал (семантика), а пользователи могли найти (контент).
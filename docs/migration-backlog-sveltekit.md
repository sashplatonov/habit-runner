# Migration Backlog: React → SvelteKit

> **Проект:** Habbit Runner — offline-first PWA habit tracker  
> **Текущий стек:** React 19 + Vite + Tailwind CSS 3 + Dexie (IndexedDB) + Recharts + Custom Router  
> **Целевой стек:** SvelteKit + Tailwind CSS 4 + Dexie + LayerChart (Recharts-аналог) + SvelteKit Router  
> **Дата создания:** 2026-04-13  

---

## 1. Executive Summary

### Масштаб миграции
- **~90+ TypeScript/TSX файлов** в `apps/web/src/`
- **6 пакетных файлов** в `apps/web/packages/shared/src/`
- **4 страницы** (Dashboard, HabitDetail, AddEditHabit, Stats)
- **~20 компонентов** UI (навигация, хит-мэпы, графики, модалки, тосты)
- **7 хуков** (состояние, синхронизация, жесты, темы)
- **~25 утилит и сервисов** (sync engine, auth, API, DB, PWA, SEO, логирование)
- **10+ тем** с CSS-переменными
- **Полный PWA-стек** (service worker, push notifications, offline caching)

### Основные блоки системы
1. **Auth** — Google OAuth через бэкенд, localStorage-сессия, JWT refresh
2. **State/DB** — Dexie IndexedDB (habits, checkins, outbox, sync_meta, tombstones)
3. **Sync Engine** — pull-push-pull цикл с outbox queue, conflict resolution, exponential backoff
4. **Routing** — кастомный мини-роутер (BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useParams)
5. **UI** — Tailwind + CSS-переменные темы, Recharts для графиков, lucide-react для иконок, canvas-confetti для эффектов
6. **PWA** — Workbox precaching, Web Push API, runtime caching strategies
7. **Observability** — Grafana Faro RUM + client-side logger

### Ключевые сложности
- Кастомный роутер с параметризованными путями → SvelteKit file-based routing
- Dexie `useLiveQuery` (Observable-адаптер для React) → нужен Svelte-совместимый reactive wrapper
- Recharts (React-only) → LayerChart или другой Svelte-совместимый chart lib
- lucide-react → lucide-svelte (1:1 замена)
- React Error Boundary (class component) → SvelteKit `+error.svelte`
- React Context (UndoProvider, RouterContext) → Svelte context/stores
- canvas-confetti — работает напрямую с DOM, портируется без изменений
- Pull-to-refresh gesture → требует Svelte action/use-directive

### Основные риски потери идентичности UI/UX
- **Charts** — Recharts → LayerChart: API и визуал отличаются; требуется ручная калибровка
- **Animations** — CSS animations портируются 1:1, но React-specific `animate-check-pulse` на state toggle нужно адаптировать через Svelte transitions
- **Heatmap** — кастомный SVG/CSS-компонент, порт 1:1 возможен
- **Retro Calendar** — сложный интерактивный UI с popover-редактором; требует пристального внимания

### Общий подход к миграции
Инкрементальная миграция по волнам: сначала инфраструктура (SvelteKit scaffold, Tailwind, DB), затем shared UI, потом страницы, в конце — polish и parity-проверка. Бэкенд (Quarkus) не затрагивается.

---

## 2. Migration Principles

1. **UI и UX сохранять максимально идентичными** — пиксельная точность темы, spacing, typography
2. **Не упрощать без необходимости** — каждое упрощение документировать с обоснованием
3. **Не менять пользовательские сценарии** — flow: OAuth → Dashboard → Detail → Stats сохранить
4. **Не менять визуальную иерархию** — sidebar/bottom-nav layout, card system, heatmap, completion ring
5. **Не менять spacing/layout/interaction patterns без причины**
6. **Accessibility не ухудшать** — focus-visible, skip-to-content, ARIA-атрибуты
7. **Производительность не ухудшать** — code splitting, lazy loading, chunk isolation
8. **Если библиотека меняется, UX должен остаться максимально тем же**
9. **CSS-переменные и Tailwind classes переносить 1:1** — никаких CSS-регрессий
10. **Shared пакет (`@habbit-runner/shared`) остаётся на TypeScript** и подключается через SvelteKit aliases

---

## 3. Library Mapping

| React/Vite Library | SvelteKit Equivalent | Причина замены | Близость к оригиналу | Риск UI/UX-отклонения |
|---|---|---|---|---|
| `react` + `react-dom` (19.x) | Svelte 5 (runes) | Целевой фреймворк | N/A — другая парадигма | Low (UI via HTML/CSS) |
| Custom `@/lib/router.tsx` (BrowserRouter/Routes/Route) | SvelteKit file-based routing (`+page.svelte`, `+layout.svelte`) | Нативный роутинг SvelteKit | 95% — file-based vs code-based | Low |
| `recharts` (3.8) | `layerchart` (Svelte) или `pancake` + raw SVG | Recharts — React-only | 70–80% — API различается, визуал калибруется | **High** |
| `lucide-react` (0.577) | `lucide-svelte` (0.577+) | React-only обёртка | 99% — те же SVG-иконки | Very Low |
| `dexie` (4.3) | `dexie` (4.3) — без изменений | Dexie framework-agnostic | 100% | None |
| `dexie` `useLiveQuery` → React hook | Custom Svelte readable store wrapper over `Dexie.liveQuery` | React hook → Svelte store | 95% — observable → store | Low |
| `canvas-confetti` (1.9) | `canvas-confetti` (1.9) — без изменений | DOM API, framework-agnostic | 100% | None |
| `@grafana/faro-web-sdk` | `@grafana/faro-web-sdk` — без изменений | Framework-agnostic | 100% | None |
| `nanoid` (5.x) | `nanoid` (5.x) — без изменений | Framework-agnostic | 100% | None |
| `@sindresorhus/slugify` | `@sindresorhus/slugify` — без изменений | Framework-agnostic | 100% | None |
| `vite` + `@vitejs/plugin-react` | SvelteKit (Vite-based) + `@sveltejs/adapter-static` | SvelteKit includes Vite | 100% | None |
| `vite-plugin-pwa` | `@vite-pwa/sveltekit` | SvelteKit-specific PWA plugin | 95% | Low |
| `workbox-precaching` | `workbox-precaching` — через `@vite-pwa/sveltekit` | Те же стратегии | 100% | None |
| Tailwind CSS 3.4 | Tailwind CSS 4 (или 3.4 для совместимости) | Экосистема та же | 98% | Very Low |
| `vitest` (4.x) | `vitest` (4.x) + `@testing-library/svelte` | Та же test runner | 95% | None (testing) |
| React Context (UndoProvider) | Svelte `setContext`/`getContext` + writable store | Другая парадигма контекстов | 90% | Low |
| React `useState`/`useEffect`/`useCallback`/`useMemo` | Svelte 5 `$state`, `$derived`, `$effect` runes | Другая парадигма реактивности | 90% | Low |

---

## 4. Architecture Mapping

### Routes / Pages

| React (custom router) | SvelteKit |
|---|---|
| `<Route path="/" element={<Dashboard />} />` | `src/routes/(protected)/dashboard/+page.svelte` |
| `<Route path="/habit/new" element={<AddEditHabit />} />` | `src/routes/(protected)/habit/new/+page.svelte` |
| `<Route path="/habit/:id" element={<HabitDetail />} />` | `src/routes/(protected)/habit/[id]/+page.svelte` |
| `<Route path="/habit/:id/edit" element={<AddEditHabit />} />` | `src/routes/(protected)/habit/[id]/edit/+page.svelte` |
| `<Route path="/stats" element={<Stats />} />` | `src/routes/(protected)/stats/+page.svelte` |
| `<Route path="/auth/callback" ...>` | `src/routes/auth/callback/+page.svelte` |
| `PublicLanding` (unauthenticated `/`) | `src/routes/+page.svelte` (conditional) или `src/routes/(public)/+page.svelte` |
| `PublicSeoPage` (habit-tracker, streak-tracker, etc.) | `src/routes/(public)/habit-tracker/+page.svelte`, etc. |
| `<Navigate to="/" replace />` (catch-all) | `src/routes/[...catchall]/+page.svelte` → redirect |

### Layouts

| React Layout | SvelteKit Layout |
|---|---|
| `<AppLayout>` (sidebar + bottomnav + main) | `src/routes/(protected)/+layout.svelte` |
| `<UndoProvider>` | `src/routes/+layout.svelte` (root) — context + store |
| `<ErrorBoundary>` | `src/routes/+error.svelte` + `src/routes/(protected)/+error.svelte` |
| `<PullToRefresh>` wrapper | Svelte action `use:pullToRefresh` в layout |
| `<BrowserRouter>` | SvelteKit built-in |
| `<RouteFocusManager>` | `afterNavigate` в `+layout.svelte` |

### State

| React Pattern | Svelte Pattern |
|---|---|
| `useState` | `$state` rune (Svelte 5) |
| `useMemo` / `useCallback` | `$derived` rune |
| `useEffect` | `$effect` rune |
| `useContext` (UndoProvider) | `setContext` / `getContext` + writable store |
| `useLiveQuery(db)` | Custom `dexieLiveQuery` readable store |
| `useHabits()` hook → CRUD | `createHabitsStore()` → Svelte store with methods |

### Data Fetching

| React Pattern | SvelteKit Pattern |
|---|---|
| Client-side `authenticatedFetch` | Client-side `authenticatedFetch` (без изменений) |
| `syncEngine.ts` pull-push-pull | `syncEngine.ts` (без изменений, framework-agnostic) |
| `useSyncEngine()` React hook | `createSyncEngineStore()` Svelte store + `$effect` в layout |
| `useTheme()` React hook | Svelte writable store + `$effect` |

### Styling

Переносится **1:1**:
- `index.css` → `src/app.css` (SvelteKit convention)
- Tailwind config → `tailwind.config.js` (или v4 CSS config)
- CSS-переменные для тем → без изменений
- `data-theme` attribute on `<html>` → без изменений
- Google Fonts (Sora, JetBrains Mono) → `app.html`

---

## 5. File-by-File Backlog

---

### F-001. `apps/web/src/index.tsx`

**Тип:** entry point  
**Текущая роль:** React DOM entry — `createRoot().render(<App />)`, Faro init  
**Целевой аналог в SvelteKit:** Удаляется. SvelteKit entry через `src/routes/+layout.svelte` и `src/hooks.client.ts`  
**Стратегия миграции:** Faro init → `src/hooks.client.ts`. App render → SvelteKit auto.  
**Зависимости:** `faro.ts`, `App.tsx`  
**Связанные файлы:** F-002, F-065  
**UI-critical:** no  
**Functionality-critical:** yes (entry point)  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `src/hooks.client.ts` с Faro init
- [ ] Убедиться, что `app.html` содержит `<div id="svelte">` (стандарт SvelteKit)
- [ ] Удалить React-specific entry

#### Acceptance Criteria
- Faro инициализируется при загрузке клиента
- Нет регрессии в observability

---

### F-002. `apps/web/src/App.tsx`

**Тип:** root component  
**Текущая роль:** Главный компонент: auth gate, routing (custom), sync lifecycle, theme init, PWA push, undo provider, error boundary, pull-to-refresh  
**Целевой аналог в SvelteKit:** Разбивается на:
- `src/routes/+layout.svelte` (root layout: undo context, error boundary, theme, global logging)
- `src/routes/(protected)/+layout.svelte` (auth gate, sync engine, pull-to-refresh, sidebar/bottomnav)
- `src/routes/(public)/+layout.svelte` (public pages)
- `src/routes/auth/callback/+page.svelte`  

**Стратегия миграции:** Декомпозировать App.tsx на SvelteKit layouts. Auth guard — через `+layout.ts` load function + redirect. Sync/theme — stores в protected layout.  
**Зависимости:** Все дочерние страницы, все хуки, auth session, sync engine  
**Связанные файлы:** F-001, F-003, F-004, F-005, F-006, F-030, F-032, F-033, F-036, F-040  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** high  
**Сложность:** XL  
**Оценка усилий:** 8 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `src/routes/+layout.svelte` — UndoContext, ErrorBoundary, global CSS
- [ ] Создать `src/routes/(protected)/+layout.svelte` — auth check, AppLayout, sync engine, pull-to-refresh, push subscribe
- [ ] Перенести `useAuthSessionBootstrap` → `$effect` в protected layout
- [ ] Перенести `AUTH_SESSION_CLEARED_EVENT` listener → `$effect`
- [ ] Перенести `installGlobalClientLogging()` → `$effect` в root layout
- [ ] Перенести auth routing logic (callback path handling) → `src/routes/auth/callback/+page.svelte`
- [ ] Перенести `PublicRouter` → маршруты `(public)/` group
- [ ] Перенести `RouteFocusManager` → `afterNavigate` callback
- [ ] Проверить skip-to-content link
- [ ] Сравнить UI с оригиналом
- [ ] Сравнить поведение с оригиналом (auth flow, logout, session expire)

#### Acceptance Criteria
- Auth gate work identically (redirect to login, callback handling)
- Sync engine starts/stops correctly
- Theme persists across refreshes
- Pull-to-refresh works on mobile
- Undo toast works globally
- Error boundary catches render errors

#### Notes
- Самый сложный файл для миграции — содержит всю "wiring" логику приложения
- SvelteKit layouts заменяют большинство React-provider паттернов

---

### F-003. `apps/web/src/components/AppLayout.tsx`

**Тип:** layout component  
**Текущая роль:** Главный layout wrapper — sidebar (desktop), bottom nav (mobile), main content area, sync status display  
**Целевой аналог в SvelteKit:** `src/lib/components/AppLayout.svelte` + встраивается в `src/routes/(protected)/+layout.svelte`  
**Стратегия миграции:** JSX → Svelte template. Props → `$props()` rune. Responsive layout (sidebar/bottomnav) через тот же Tailwind responsive.  
**Зависимости:** SidebarNav, BottomNav, SyncStatus  
**Связанные файлы:** F-004, F-005, F-006  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** M  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести JSX → Svelte template с сохранением всех Tailwind classes
- [ ] Перенести props (theme, onThemeChange, onLogout, syncState) → `$props()`
- [ ] Встроить `<slot />` вместо `{children}`
- [ ] Проверить responsive breakpoints (sidebar desktop / bottomnav mobile)
- [ ] Сравнить layout визуально с оригиналом

#### Acceptance Criteria
- Sidebar видна на desktop (>= md), bottom nav на mobile
- Main content area корректно занимает оставшееся пространство
- SyncStatus отображается

---

### F-004. `apps/web/src/components/SidebarNav.tsx`

**Тип:** component  
**Текущая роль:** Desktop sidebar — nav links (Dashboard, Stats), theme switcher dropdown, logout button  
**Целевой аналог в SvelteKit:** `src/lib/components/SidebarNav.svelte`  
**Стратегия миграции:** JSX → Svelte template. `useNavigate`/`useLocation` → SvelteKit `$page`, `goto`. Theme list (THEMES constant) сохранить. lucide-react → lucide-svelte.  
**Зависимости:** lucide icons, THEMES constant, router  
**Связанные файлы:** F-003, F-036  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести JSX → Svelte template
- [ ] Заменить `useNavigate()` → `goto()` (from `$app/navigation`)
- [ ] Заменить `useLocation()` → `$page.url.pathname` (from `$app/stores`)
- [ ] Заменить lucide-react icons → lucide-svelte
- [ ] Перенести theme switcher dropdown logic
- [ ] Перенести logout handler (prop-based callback)
- [ ] Проверить active link highlighting
- [ ] Сравнить UI

#### Acceptance Criteria
- Nav links правильно подсвечиваются на активном маршруте
- Theme switcher работает
- Logout вызывается

---

### F-005. `apps/web/src/components/BottomNav.tsx`

**Тип:** component  
**Текущая роль:** Mobile bottom nav — Dashboard, Search(?), Add, Stats, Settings/Theme panel  
**Целевой аналог в SvelteKit:** `src/lib/components/BottomNav.svelte`  
**Стратегия миграции:** Аналогично SidebarNav. Touch-friendly design сохранить. safe-area-inset-bottom CSS-переменные сохранить.  
**Зависимости:** lucide icons, router, theme state  
**Связанные файлы:** F-003, F-004  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести JSX → Svelte template
- [ ] Заменить router hooks → SvelteKit navigation
- [ ] Заменить lucide-react → lucide-svelte
- [ ] Перенести theme panel toggle logic
- [ ] Перенести safe-area-inset-bottom padding
- [ ] Проверить touch interactions
- [ ] Сравнить UI на мобильных размерах

#### Acceptance Criteria
- Bottom nav видна только на мобильных устройствах
- Active tab подсвечивается
- safe-area padding работает на iOS

---

### F-006. `apps/web/src/components/SyncStatus.tsx`

**Тип:** component  
**Текущая роль:** Индикатор статуса синхронизации (idle, syncing, error) + viewer клиентских логов  
**Целевой аналог в SvelteKit:** `src/lib/components/SyncStatus.svelte`  
**Стратегия миграции:** JSX → Svelte. State (log viewer toggle) → `$state`. Client log reading через ту же функцию `readStoredClientLogs`.  
**Зависимости:** clientLogger  
**Связанные файлы:** F-003, F-063  
**UI-critical:** yes  
**Functionality-critical:** no (informational)  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести JSX → Svelte template
- [ ] Перенести toggle state → `$state`
- [ ] Перенести log viewer panel
- [ ] Сравнить UI

#### Acceptance Criteria
- Статус корректно отображает idle/syncing/error
- Лог-панель открывается/закрывается

---

### F-007. `apps/web/src/components/AuthGate.tsx`

**Тип:** component  
**Текущая роль:** Auth screen для неаутентифицированных пользователей — кнопка "Login with Google"  
**Целевой аналог в SvelteKit:** Не нужен как отдельный компонент. Auth gate logic переносится в `+layout.ts` (server load) или `+layout.svelte` (client check). Визуальная часть → `src/routes/(public)/+page.svelte` или `PublicLanding`.  
**Стратегия миграции:** Убрать отдельный компонент. Redirect logic → SvelteKit load function. Visual → PublicLanding.  
**Зависимости:** oauth.startOAuthLogin  
**Связанные файлы:** F-002, F-010  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести OAuth login button визуал в PublicLanding или отдельный auth page
- [ ] Auth guard → SvelteKit layout load redirect
- [ ] Убедиться в идентичном визуале

#### Acceptance Criteria
- Неавторизованные пользователи видят landing/login
- OAuth flow работает идентично

---

### F-008. `apps/web/src/components/ErrorBoundary.tsx`

**Тип:** component (React class component)  
**Текущая роль:** Error boundary — ловит render errors, логирует в clientLogger, показывает fallback UI  
**Целевой аналог в SvelteKit:** `src/routes/+error.svelte` + `src/hooks.client.ts` (`handleError`)  
**Стратегия миграции:** SvelteKit имеет встроенный error boundary через `+error.svelte` файлы. Client-side error logging → `handleError` hook. Fallback UI → `+error.svelte`.  
**Зависимости:** clientLogger  
**Связанные файлы:** F-002, F-063  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `src/routes/+error.svelte` с идентичным fallback UI
- [ ] Добавить `handleError` в `src/hooks.client.ts`
- [ ] Перенести визуал fallback без изменений
- [ ] Тестировать error catching

#### Acceptance Criteria
- Ошибки рендеринга перехватываются
- Fallback UI идентичен

---

### F-009. `apps/web/src/components/AsyncStateUI.tsx`

**Тип:** component  
**Текущая роль:** Reusable loading spinner, error banner, empty state  
**Целевой аналог в SvelteKit:** `src/lib/components/AsyncStateUI.svelte`  
**Стратегия миграции:** JSX → Svelte. Простой компонент без state.  
**Зависимости:** нет (чистый UI)  
**Связанные файлы:** Используется во многих страницах  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести JSX → Svelte
- [ ] Перенести Tailwind classes без изменений
- [ ] Проверить spinner animation

#### Acceptance Criteria
- Визуально идентичен

---

### F-010. `apps/web/src/components/PublicLanding.tsx`

**Тип:** component  
**Текущая роль:** Marketing landing page — feature highlights, CTA, screenshot carousel, auth error display  
**Целевой аналог в SvelteKit:** `src/routes/(public)/+page.svelte` или `src/lib/components/PublicLanding.svelte`  
**Стратегия миграции:** JSX → Svelte. OAuth CTA → `startOAuthLogin`. Carousel → local state.  
**Зависимости:** oauth.startOAuthLogin, PublicPreviewCarousel  
**Связанные файлы:** F-011, F-057  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести JSX → Svelte template
- [ ] Перенести feature highlights, CTA
- [ ] Перенести auth error display
- [ ] Перенести carousel integration
- [ ] Проверить responsive layout
- [ ] Сравнить визуал

#### Acceptance Criteria
- Landing page визуально идентичен
- OAuth CTA работает
- Carousel работает

---

### F-011. `apps/web/src/components/PublicPreviewCarousel.tsx`

**Тип:** component  
**Текущая роль:** Screenshot carousel на landing page  
**Целевой аналог в SvelteKit:** `src/lib/components/PublicPreviewCarousel.svelte`  
**Стратегия миграции:** JSX → Svelte. State (current slide index) → `$state`.  
**Зависимости:** нет (standalone)  
**Связанные файлы:** F-010  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [x] Перенести карусель → Svelte с `$state` для индекса
- [x] Перенести slide transitions
- [x] Сравнить анимации

#### Acceptance Criteria
- Carousel визуально и функционально идентичен

---

### F-012. `apps/web/src/components/PublicSeoPage.tsx`

**Тип:** component  
**Текущая роль:** SEO-страница для intent-based landing'ов (habit-tracker, streak-tracker, etc.) с JSON-LD  
**Целевой аналог в SvelteKit:** `src/routes/(public)/habit-tracker/+page.svelte`, `src/routes/(public)/streak-tracker/+page.svelte`, etc. + `+page.ts` для SEO meta  
**Стратегия миграции:** Каждый intent → отдельный `+page.svelte`. SEO meta → `+page.ts` с `export const load` + `<svelte:head>`. JSON-LD → `<svelte:head>`.  
**Зависимости:** publicSeo.ts  
**Связанные файлы:** F-064  
**UI-critical:** yes  
**Functionality-critical:** yes (SEO)  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [x] Создать `+page.svelte` для каждого intent
- [x] Перенести JSON-LD → `<svelte:head>`
- [x] Перенести meta tags → `<svelte:head>`
- [x] Проверить SEO output (meta, JSON-LD)

#### Acceptance Criteria
- SEO meta и JSON-LD идентичны
- Страницы рендерятся корректно

---

### F-013. `apps/web/src/components/CompletionRing.tsx`

**Тип:** component  
**Текущая роль:** SVG progress ring (круговая прогресс-полоса) с цветовой темой привычки  
**Целевой аналог в SvelteKit:** `src/lib/components/CompletionRing.svelte`  
**Стратегия миграции:** SVG markup переносится 1:1. Props → `$props()`. CSS class based color → CSS переменные.  
**Зависимости:** HABIT_COLOR_THEMES  
**Связанные файлы:** F-022  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести SVG markup → Svelte template
- [ ] Перенести color logic
- [ ] Проверить ring-celebrate animation
- [ ] Сравнить визуал

#### Acceptance Criteria
- Ring визуально идентичен на всех стадиях заполнения
- Celebration animation работает при 100%

---

### F-014. `apps/web/src/components/HabitHeatmap.tsx`

**Тип:** component  
**Текущая роль:** 90-day completion heatmap grid с 5 уровнями интенсивности (0–4 opacity)  
**Целевой аналог в SvelteKit:** `src/lib/components/HabitHeatmap.svelte`  
**Стратегия миграции:** Grid-based layout → Svelte template. Intensity calculation logic → сохранить. Color theming → CSS-переменные.  
**Зависимости:** HABIT_COLOR_THEMES, completions data  
**Связанные файлы:** F-015, F-016  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести grid rendering → Svelte `{#each}`
- [ ] Перенести intensity level calculation
- [ ] Перенести tooltip on hover
- [ ] Перенести color theme support
- [ ] Сравнить визуал (pixel-level)

#### Acceptance Criteria
- 90-day grid визуально идентичен
- Интенсивность цветов корректна
- Tooltip работает

---

### F-015. `apps/web/src/components/MiniHeatmap.tsx`

**Тип:** component  
**Текущая роль:** Компактная версия heatmap для карточек привычек на dashboard  
**Целевой аналог в SvelteKit:** `src/lib/components/MiniHeatmap.svelte`  
**Стратегия миграции:** Обёртка над HabitHeatmap с compact props. JSX → Svelte.  
**Зависимости:** HabitHeatmap  
**Связанные файлы:** F-014  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Сравнить визуал

#### Acceptance Criteria
- Визуально идентичен

---

### F-016. `apps/web/src/components/HeatmapGrid.tsx`

**Тип:** component  
**Текущая роль:** Shared grid rendering logic для heatmaps  
**Целевой аналог в SvelteKit:** `src/lib/components/HeatmapGrid.svelte`  
**Стратегия миграции:** JSX → Svelte.  
**Зависимости:** day colors, intensity levels  
**Связанные файлы:** F-014, F-015  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Сравнить визуал

#### Acceptance Criteria
- Grid рендерится идентично

---

### F-017. `apps/web/src/components/Onboarding.tsx`

**Тип:** component  
**Текущая роль:** Template selector для новых пользователей (предустановленные привычки: Walking, Reading, etc.)  
**Целевой аналог в SvelteKit:** `src/lib/components/Onboarding.svelte`  
**Стратегия миграции:** JSX → Svelte. Callback props → event dispatchers или `$props()`.  
**Зависимости:** OnboardingTemplate type, lucide icons  
**Связанные файлы:** F-020  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести template cards → Svelte
- [ ] Перенести selection logic
- [ ] Перенести lucide icons → lucide-svelte
- [ ] Сравнить визуал

#### Acceptance Criteria
- Template selector работает идентично
- Визуал сохранён

---

### F-018. `apps/web/src/components/ChartGuideTooltip.tsx`

**Тип:** component  
**Текущая роль:** Tooltip с пояснением chart метрик  
**Целевой аналог в SvelteKit:** `src/lib/components/ChartGuideTooltip.svelte`  
**Стратегия миграции:** JSX → Svelte.  
**Зависимости:** clsx, lucide icons  
**Связанные файлы:** F-029  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

---

### F-019. `apps/web/src/components/DescriptionTooltip.tsx`

**Тип:** component  
**Текущая роль:** Tooltip с description text + HelpCircle icon  
**Целевой аналог в SvelteKit:** `src/lib/components/DescriptionTooltip.svelte`  
**Стратегия миграции:** JSX → Svelte. Прямой перенос.  
**Зависимости:** lucide HelpCircleIcon  
**Связанные файлы:** нет  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [x] Перенести → Svelte

#### Acceptance Criteria
- Визуально идентичен

---

### F-020. `apps/web/src/components/UndoToast.tsx`

**Тип:** component  
**Текущая роль:** Toast notification с кнопкой Undo action  
**Целевой аналог в SvelteKit:** `src/lib/components/UndoToast.svelte`  
**Стратегия миграции:** JSX → Svelte. Context (UndoContext) → Svelte context/store.  
**Зависимости:** UndoContext (lib/undo.tsx)  
**Связанные файлы:** F-061  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Привязать к Svelte undo store
- [ ] Перенести animation (slide-in/out)
- [ ] Сравнить визуал

#### Acceptance Criteria
- Toast появляется при undo-событиях
- Кнопка Undo работает
- Animation идентична

---

### F-021. `apps/web/src/components/PullToRefresh.tsx`

**Тип:** component  
**Текущая роль:** Pull-to-refresh gesture handler для мобильных (72px threshold), показывает spinner  
**Целевой аналог в SvelteKit:** `src/lib/actions/pullToRefresh.ts` (Svelte action `use:pullToRefresh`) + `src/lib/components/PullToRefreshIndicator.svelte`  
**Стратегия миграции:** React wrapper с touch event listeners → Svelte action (use-directive). Визуальный индикатор → отдельный Svelte component.  
**Зависимости:** usePullGesture hook (or inline logic)  
**Связанные файлы:** F-002  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** M  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать Svelte action `use:pullToRefresh`
- [ ] Перенести touch gesture detection (touchstart/touchmove/touchend, 72px threshold)
- [ ] Создать indicator component
- [ ] Тестировать на мобильных устройствах
- [ ] Сравнить поведение с оригиналом

#### Acceptance Criteria
- Pull gesture работает на мобильных
- 72px threshold сохранён
- Spinner анимация идентична

#### Notes
- Svelte actions — идиоматический способ для DOM-манипуляций
- Touch events API одинаковый, логика переносится

---

### F-022. `apps/web/src/pages/Dashboard.tsx`

**Тип:** page  
**Текущая роль:** Dashboard home screen wrapper — делегирует в DashboardView через useDashboardModel hook  
**Целевой аналог в SvelteKit:** `src/routes/(protected)/dashboard/+page.svelte`  
**Стратегия миграции:** Page shell → `+page.svelte`. useDashboardModel → Svelte store composition.  
**Зависимости:** useDashboardModel, DashboardView  
**Связанные файлы:** F-023, F-038  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `+page.svelte`
- [ ] Перенести useDashboardModel logic → Svelte stores
- [ ] Интегрировать DashboardView.svelte
- [ ] Проверить responsive layout
- [ ] Сравнить UI с оригиналом

#### Acceptance Criteria
- Dashboard рендерится корректно
- Habits загружаются из IndexedDB
- Onboarding показывается для новых пользователей

---

### F-023. `apps/web/src/pages/components/DashboardView.tsx`

**Тип:** component  
**Текущая роль:** Main dashboard layout — hero, reminders panel, filter bar, habit list section  
**Целевой аналог в SvelteKit:** `src/lib/components/dashboard/DashboardView.svelte`  
**Стратегия миграции:** JSX → Svelte. Composition of child components.  
**Зависимости:** DashboardHero, RemindersPanel, FilterBar, HabitListSection, Onboarding  
**Связанные файлы:** F-024, F-025, F-026, F-027, F-017  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** M  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Перенести conditional rendering (onboarding vs habit list)
- [ ] Перенести all Tailwind classes
- [ ] Сравнить layout

#### Acceptance Criteria
- Layout идентичен

---

### F-024. `apps/web/src/pages/components/DashboardHero.tsx`

**Тип:** component  
**Текущая роль:** Dashboard header с greeting и "Add Habit" button  
**Целевой аналог в SvelteKit:** `src/lib/components/dashboard/DashboardHero.svelte`  
**Стратегия миграции:** Прямой перенос JSX → Svelte.  
**Зависимости:** нет  
**Связанные файлы:** F-023  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Сравнить визуал

#### Acceptance Criteria
- Визуально идентичен

---

### F-025. `apps/web/src/pages/components/DashboardHabitTile.tsx`

**Тип:** component  
**Текущая роль:** Карточка привычки на dashboard — completion ring, name, streak, mini heatmap, tap to navigate  
**Целевой аналог в SvelteKit:** `src/lib/components/dashboard/DashboardHabitTile.svelte`  
**Стратегия миграции:** JSX → Svelte. Navigate → `goto()`. CompletionRing → Svelte component. Animation (check-pulse, glow-burst) → Svelte `class:` directive.  
**Зависимости:** CompletionRing, navigate, formatHabitLabel, habit-colors  
**Связанные файлы:** F-013, F-015, F-025h  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести JSX → Svelte template
- [ ] Перенести completion toggle handler
- [ ] Перенести check-pulse / glow-burst animation triggers
- [ ] Перенести `navigate` → `goto`
- [ ] Интегрировать CompletionRing.svelte и MiniHeatmap.svelte
- [ ] Перенести formatHabitLabel usage
- [ ] Сравнить UI детально

#### Acceptance Criteria
- Карточка визуально идентична
- Tap-to-navigate работает
- Animations работают при toggle

---

### F-025h. `apps/web/src/pages/components/DashboardHabitTile.helpers.ts`

**Тип:** utility  
**Текущая роль:** Card calculation helpers  
**Целевой аналог в SvelteKit:** `src/lib/utils/dashboard/DashboardHabitTile.helpers.ts` (без изменений)  
**Стратегия миграции:** Копировать 1:1 — pure TS functions.  
**Зависимости:** нет  
**Связанные файлы:** F-025  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 0.5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Скопировать файл
- [ ] Обновить import paths

#### Acceptance Criteria
- Функции работают идентично

---

### F-026. `apps/web/src/pages/components/FilterBar.tsx`

**Тип:** component  
**Текущая роль:** Filter/search bar для привычек (status, search text)  
**Целевой аналог в SvelteKit:** `src/lib/components/dashboard/FilterBar.svelte`  
**Стратегия миграции:** JSX → Svelte.  
**Зависимости:** lucide SearchIcon  
**Связанные файлы:** F-023  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte с `bind:value`
- [ ] Перенести filter change callbacks → event dispatchers
- [ ] Сравнить визуал

#### Acceptance Criteria
- Filter работает корректно
- Search input debounce сохранён

---

### F-027. `apps/web/src/pages/components/HabitListSection.tsx`

**Тип:** component  
**Текущая роль:** Scrollable list привычек на dashboard, поддержка drag-to-reorder  
**Целевой аналог в SvelteKit:** `src/lib/components/dashboard/HabitListSection.svelte`  
**Стратегия миграции:** JSX → Svelte. Drag handlers → Svelte actions или native drag event handlers.  
**Зависимости:** DashboardHabitTile, drag handlers  
**Связанные файлы:** F-025, F-041  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести list rendering → Svelte `{#each}`
- [ ] Перенести drag-to-reorder → HTML5 Drag and Drop или Svelte action
- [ ] Перенести scroll behavior
- [ ] Перенести empty state
- [ ] Сравнить визуал и drag behavior

#### Acceptance Criteria
- Список привычек отображается корректно
- Drag-to-reorder работает
- Scroll smooth

#### Notes
- Drag-and-drop — одно из рискованных мест. Если используется HTML5 DnD API напрямую, перенос простой. Если React-specific library — может потребоваться `svelte-sortable-list` или аналог.

---

### F-028. `apps/web/src/pages/components/RemindersPanel.tsx`

**Тип:** component  
**Текущая роль:** Панель подписки на push notifications (opt-in)  
**Целевой аналог в SvelteKit:** `src/lib/components/dashboard/RemindersPanel.svelte`  
**Стратегия миграции:** JSX → Svelte.  
**Зависимости:** subscribeToPush, isPushNotificationSupported  
**Связанные файлы:** F-066  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [x] Перенести → Svelte
- [x] Перенести push subscription flow
- [x] Сравнить визуал

#### Acceptance Criteria
- Push notification opt-in работает

---

### F-029. `apps/web/src/pages/Stats.tsx`

**Тип:** page  
**Текущая роль:** Stats analytics page — aggregates habit metrics, filters, period selector, charts, heatmap  
**Целевой аналог в SvelteKit:** `src/routes/(protected)/stats/+page.svelte`  
**Стратегия миграции:** Page → `+page.svelte`. buildStatsInsights, filterStatsHabits → import utils. Charts → LayerChart components.  
**Зависимости:** useHabits, buildStatsInsights, filterStatsHabits, StatsView  
**Связанные файлы:** F-030, F-031, F-032, F-033, F-034, F-035  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** **high**  
**Сложность:** XL  
**Оценка усилий:** 8 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `+page.svelte`
- [ ] Перенести stats calculation logic
- [ ] Перенести period selector state
- [ ] Перенести filter state
- [ ] Интегрировать StatsView components
- [ ] **Портировать Recharts → LayerChart** (critical)
- [ ] Сравнить каждый chart визуально
- [ ] Сравнить tooltip behaviour
- [ ] Сравнить responsive behaviour

#### Acceptance Criteria
- Все charts визуально максимально близки к Recharts-оригиналу
- Period selector работает
- Filters работают
- Heatmap идентичен

#### Notes
- **Наиболее рискованный раздел миграции** из-за замены chart library
- Может потребоваться fallback на raw SVG + D3 для точного воспроизведения

---

### F-030. `apps/web/src/pages/components/StatsView.tsx`

**Тип:** component  
**Текущая роль:** Stats page layout — filters, period selector, chart panels, heatmap  
**Целевой аналог в SvelteKit:** `src/lib/components/stats/StatsView.svelte`  
**Стратегия миграции:** JSX → Svelte.  
**Зависимости:** StatsViewPanels, ChartGuideTooltip, StatsViewFilters  
**Связанные файлы:** F-031, F-032, F-018  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** high  
**Сложность:** L  
**Оценка усилий:** 5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Перенести state (period, filters, selected habits)
- [ ] Сравнить layout

#### Acceptance Criteria
- Layout идентичен

---

### F-031. `apps/web/src/pages/components/StatsViewCharts.tsx`

**Тип:** component  
**Текущая роль:** Chart rendering — DailyRateChart (LineChart), TrendChart, WeeklyChart (BarChart). Использует `recharts` (LineChart, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid).  
**Целевой аналог в SvelteKit:** `src/lib/components/stats/StatsViewCharts.svelte`  
**Стратегия миграции:** **Ключевая сложность миграции.** Recharts → LayerChart (или Pancake + raw SVG). Custom tooltips (CustomTooltip, DailyTooltip) → LayerChart tooltip slot. Responsive containers → LayerChart responsive. Все chart configurations (colors, axes, grids) перевести.  
**Зависимости:** recharts, HABIT_COLOR_THEMES, formatHabitLabel  
**Связанные файлы:** F-029, F-030  
**UI-critical:** **yes — critical**  
**Functionality-critical:** yes  
**Риск:** **high**  
**Сложность:** XL  
**Оценка усилий:** 8 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Исследовать LayerChart API и capabilities
- [ ] Перенести DailyRateChart (LineChart → LayerChart Line)
- [ ] Перенести TrendChart (multi-line → LayerChart)
- [ ] Перенести WeeklyChart (BarChart → LayerChart Bar)
- [ ] Перенести CustomTooltip → LayerChart tooltip slot
- [ ] Перенести DailyTooltip → LayerChart tooltip slot
- [ ] Перенести ResponsiveContainer behavior
- [ ] Перенести CartesianGrid styling
- [ ] Перенести XAxis/YAxis formatting
- [ ] **Калибровать визуал** — line thickness, colors, padding, font sizes
- [ ] Проверить hover/touch interactions
- [ ] Проверить responsive behavior
- [ ] Документировать визуальные отклонения

#### Acceptance Criteria
- Charts визуально максимально близки к оригиналу (допустимо ±5% отклонение по spacing)
- Tooltips показывают ту же информацию
- Responsive поведение сохранено
- Interactions (hover, touch) работают

#### Known Differences (ожидаемые)
- LayerChart может иметь другие стандартные стили осей и сетки — требуется ручная кастомизация
- Tooltip positioning может незначительно отличаться
- Animation transitions при загрузке данных могут отличаться

---

### F-032. `apps/web/src/pages/components/StatsViewFilters.tsx`

**Тип:** component  
**Текущая роль:** Filter UI для stats — status, tags, search  
**Целевой аналог в SvelteKit:** `src/lib/components/stats/StatsViewFilters.svelte`  
**Стратегия миграции:** JSX → Svelte. Bind inputs.  
**Зависимости:** lucide FilterIcon  
**Связанные файлы:** F-030  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Сравнить визуал

#### Acceptance Criteria
- Filters работают идентично

---

### F-033. `apps/web/src/pages/components/StatsViewPanels.tsx`

**Тип:** component  
**Текущая роль:** Stats panels — insights, daily rate chart, trend chart, weekly chart, habit list  
**Целевой аналог в SvelteKit:** `src/lib/components/stats/StatsViewPanels.svelte`  
**Стратегия миграции:** JSX → Svelte. Composition компонентов.  
**Зависимости:** recharts-based charts, StatsViewCharts  
**Связанные файлы:** F-031  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium (depends on chart migration)  
**Сложность:** M  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Перенести insights panel
- [ ] Перенести chart panel wrappers
- [ ] Сравнить layout

#### Acceptance Criteria
- Panels layout идентичен

---

### F-034. `apps/web/src/pages/components/StatsViewHeatmap.tsx`

**Тип:** component  
**Текущая роль:** Heatmap within stats page context  
**Целевой аналог в SvelteKit:** `src/lib/components/stats/StatsViewHeatmap.svelte`  
**Стратегия миграции:** JSX → Svelte. Uses HabitHeatmap.svelte.  
**Зависимости:** HabitHeatmap  
**Связанные файлы:** F-014  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte

#### Acceptance Criteria
- Heatmap идентичен

---

### F-035. `apps/web/src/pages/components/StatCardGrid.tsx`

**Тип:** component  
**Текущая роль:** Grid stat cards (completion rate, streaks, etc.)  
**Целевой аналог в SvelteKit:** `src/lib/components/stats/StatCardGrid.svelte`  
**Стратегия миграции:** JSX → Svelte.  
**Зависимости:** нет (pure UI)  
**Связанные файлы:** F-030  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Сравнить визуал

#### Acceptance Criteria
- Grid визуально идентичен

---

### F-036. `apps/web/src/pages/HabitDetail.tsx`

**Тип:** page  
**Текущая роль:** Habit detail view wrapper — handles edit/delete/freeze operations  
**Целевой аналог в SvelteKit:** `src/routes/(protected)/habit/[id]/+page.svelte`  
**Стратегия миграции:** Page → `+page.svelte`. Params → `$page.params.id`. useHabits → Svelte store. Navigation → `goto()`.  
**Зависимости:** useHabits, useNavigate, useUndo, HabitDetailView  
**Связанные файлы:** F-037, F-038, F-039, F-040  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `+page.svelte`
- [ ] Перенести habit loading by id → Dexie store query
- [ ] Перенести edit/delete/freeze handlers
- [ ] Перенести undo integration
- [ ] Интегрировать HabitDetailView.svelte
- [ ] Сравнить UI + behavior

#### Acceptance Criteria
- Detail page показывает привычку по id
- Edit/delete/freeze работают
- Undo работает  

---

### F-037. `apps/web/src/pages/components/HabitDetailView.tsx`

**Тип:** component  
**Текущая роль:** Habit detail layout — heatmap, retro calendar, stats block, actions  
**Целевой аналог в SvelteKit:** `src/lib/components/habit/HabitDetailView.svelte`  
**Стратегия миграции:** JSX → Svelte.  
**Зависимости:** HabitHeatmap, HabitRetroCalendar, helper functions  
**Связанные файлы:** F-014, F-039  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 4 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Перенести all sections (hero, today block, heatmap, retro calendar, stats, actions)
- [ ] Сравнить layout

#### Acceptance Criteria
- Layout идентичен

---

### F-038. `apps/web/src/pages/components/HabitDetailTodayBlock.tsx`

**Тип:** component  
**Текущая роль:** Today's completion section — toggle/increment с animation  
**Целевой аналог в SvelteKit:** `src/lib/components/habit/HabitDetailTodayBlock.svelte`  
**Стратегия миграции:** JSX → Svelte. Animation triggers → `class:` directives.  
**Зависимости:** lucide CheckCircle2Icon  
**Связанные файлы:** F-037  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium (animations)  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести → Svelte
- [ ] Перенести toggle/increment logic
- [ ] Перенести check-pulse animation trigger
- [ ] Перенести confetti effect (canvas-confetti)
- [ ] Сравнить interaction behavior

#### Acceptance Criteria
- Toggle/increment работает идентично
- Animations work

---

### F-039. `apps/web/src/pages/components/HabitRetroCalendar.tsx` + связанные файлы

**Тип:** component (complex)  
**Текущая роль:** Interactive calendar для редактирования прошлых/будущих completions. Включает:
- `HabitRetroCalendar.tsx` — основной компонент
- `HabitRetroCalendarDayCell.tsx` — ячейка дня
- `HabitRetroCalendarEditorPopover.tsx` — popover для редактирования count
- `HabitRetroCalendarNavigation.tsx` — месяц/год навигация
- `HabitRetroCalendar.constants.ts` — конфигурация  

**Целевой аналог в SvelteKit:** `src/lib/components/habit/retro-calendar/` directory  
**Стратегия миграции:** JSX → Svelte. Popover → native `<dialog>` или Svelte portal. Navigation state → `$state`.  
**Зависимости:** day cell logic, completion editing  
**Связанные файлы:** F-037  
**UI-critical:** **yes — critical**  
**Functionality-critical:** **yes — critical**  
**Риск:** **high**  
**Сложность:** XL  
**Оценка усилий:** 8 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести HabitRetroCalendar.svelte (main)
- [ ] Перенести DayCell.svelte
- [ ] Перенести EditorPopover.svelte — popover logic (positioning, outside click)
- [ ] Перенести Navigation.svelte
- [ ] Перенести constants
- [ ] Перенести calendar grid rendering (days of month, padding)
- [ ] Перенести completion count editing logic
- [ ] Перенести date navigation (prev/next month)
- [ ] Проверить popover positioning on mobile
- [ ] Проверить outside-click dismiss
- [ ] Сравнить визуал (calendar grid, cell colors, active/inactive states)
- [ ] Сравнить interaction (tap cell → popover → edit → save)

#### Acceptance Criteria
- Calendar grid визуально идентичен
- Popover editor работает на mobile и desktop
- Navigation работает
- Completion editing saves correctly

#### Notes
- Popover positioning — потенциально проблемное место при переносе
- Рассмотреть `@floating-ui/dom` для Svelte-compatible positioning

---

### F-040. `apps/web/src/pages/AddEditHabit.tsx` + add-edit-habit/ components

**Тип:** page + form components  
**Текущая роль:** Add/Edit habit form — name, icon, color, schedule, daily target, type, tags, reminders. Включает:
- `AddEditHabit.tsx` — page wrapper
- `AddEditHabitPage.tsx` — full form layout
- `AddEditHabitHeader.tsx` — header (back, save, delete)
- `AddEditHabitFormSections.tsx` — icon selector, color picker, target, type
- `AddEditHabitSchedule.tsx` — schedule frequency picker + day selector
- `AddEditHabitAuxSections.tsx` — reminders + soft-limit warning modal
- `AddEditHabitTagsSection.tsx` — tags input
- `add-edit-habit.constants.ts`, `blockGuideTooltips.ts`  

**Целевой аналог в SvelteKit:**
- `src/routes/(protected)/habit/new/+page.svelte`
- `src/routes/(protected)/habit/[id]/edit/+page.svelte`
- `src/lib/components/add-edit-habit/` directory  

**Стратегия миграции:** Page + form → `+page.svelte`. useAddEditHabitModel → Svelte store. Form components → Svelte components with `bind:`. Color picker, icon selector, schedule picker — all Svelte components.  
**Зависимости:** useAddEditHabitModel, useHabits, useNavigate  
**Связанные файлы:** F-039h  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** XL  
**Оценка усилий:** 8 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `+page.svelte` для new и edit
- [ ] Перенести useAddEditHabitModel → Svelte store
- [ ] Перенести AddEditHabitPage.svelte
- [ ] Перенести AddEditHabitHeader.svelte
- [ ] Перенести AddEditHabitFormSections.svelte (icon, color, target, type)
- [ ] Перенести AddEditHabitSchedule.svelte (frequency, custom days)
- [ ] Перенести AddEditHabitAuxSections.svelte (reminders, warning modal)
- [ ] Перенести AddEditHabitTagsSection.svelte
- [ ] Перенести constants + tooltips
- [ ] Проверить form validation
- [ ] Проверить submission flow
- [ ] Сравнить UI каждой секции

#### Acceptance Criteria
- Add и Edit habit формы визуально идентичны
- Все поля работают (name, icon, color picker, schedule, target, type, tags, reminders)
- Save/delete работают
- Navigation back/forward work

---

### F-041. `apps/web/src/pages/hooks/useDashboardModel.ts`

**Тип:** hook  
**Текущая роль:** Dashboard data model — habits loading, reminders state, template selection, filter state  
**Целевой аналог в SvelteKit:** `src/lib/stores/dashboardModel.ts` (Svelte store composition)  
**Стратегия миграции:** React hook → Svelte store factory function. `useState` → `$state`. `useCallback` → plain functions. `useLiveQuery` → dexieLiveQuery store.  
**Зависимости:** useHabits, useLiveQuery  
**Связанные файлы:** F-022, F-042, F-043, F-044, F-045, F-046  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать dashboardModel store
- [ ] Перенести habits data fetching logic
- [ ] Перенести filter state
- [ ] Перенести reminders tracking
- [ ] Перенести template selection callbacks

#### Acceptance Criteria
- Dashboard data loads correctly
- Filters work
- Reminders banner shows/hides correctly

---

### F-042–046. Dashboard Sub-Hooks Group

Группа хуков `apps/web/src/pages/hooks/dashboard/`:

| ID | File | Purpose | SvelteKit Target |
|---|---|---|---|
| F-042 | `useDashboardData.ts` | Loads/filters dashboard habit data | Part of `dashboardModel.ts` store |
| F-043 | `useDashboardHandlers.ts` | Event handlers (add, delete, archive) | Part of `dashboardModel.ts` store |
| F-044 | `useDragHandlers.ts` | Drag-to-reorder handlers | `src/lib/actions/dragReorder.ts` |
| F-045 | `useHabitOrderingCallbacks.ts` | Habit reordering logic | Part of habits store |
| F-046 | `useReminderTracker.ts` | Reminder subscription state | Part of `dashboardModel.ts` store |

**Стратегия миграции:** React hooks → Svelte stores/actions. Logic stays the same, wrapping changes.  
**Общий риск:** medium (drag-and-drop)  
**Общая сложность:** L  
**Общая оценка:** 5 SP  
**Статус:** ✅ done

---

### F-047. `apps/web/src/pages/hooks/useAddEditHabitModel.ts`

**Тип:** hook  
**Текущая роль:** Add/edit form state and submission logic  
**Целевой аналог в SvelteKit:** `src/lib/stores/addEditHabitModel.ts`  
**Стратегия миграции:** React hook → Svelte store. Form state → `$state` runes.  
**Зависимости:** useHabits, useNavigate  
**Связанные файлы:** F-040  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 4 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать store
- [ ] Перенести form state initialization (new vs edit mode)
- [ ] Перенести validation logic
- [ ] Перенести submission (create/update)
- [ ] Перенести navigation after save

#### Acceptance Criteria
- Form state management identical
- Submission creates/updates correctly

---

### F-048. `apps/web/src/hooks/useHabits.ts` + `useHabits.helpers.ts`

**Тип:** hook (main data layer)  
**Текущая роль:** Primary habits hook — reads from IndexedDB via Dexie, exposes CRUD, completion toggle, search, stats. Центральный data hook всего приложения.  
**Целевой аналог в SvelteKit:** `src/lib/stores/habits.ts` (Svelte store)  
**Стратегия миграции:** React hook → Svelte store factory. `useLiveQuery` → custom dexieLiveQuery readable store. All CRUD methods stay the same (framework-agnostic DB calls). Expose as store with derived values.  
**Зависимости:** db.ts, syncEngine, useLiveQuery, habitStats  
**Связанные файлы:** F-049, F-050, F-051  
**UI-critical:** no  
**Functionality-critical:** **yes — critical**  
**Риск:** medium  
**Сложность:** XL  
**Оценка усилий:** 8 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `dexieLiveQuery` — Svelte readable store wrapping Dexie.liveQuery Observable
- [ ] Создать habits store exposing habits list, CRUD, toggle, advance, delete, archive
- [ ] Перенести completion mutation queue logic
- [ ] Перенести freeze days logic
- [ ] Перенести search/filter logic
- [ ] Перенести stats computation (streaks, rates)
- [ ] Перенести helper functions (buildCompletionsByHabitId)
- [ ] Тестировать все CRUD operations

#### Acceptance Criteria
- All CRUD operations work identically
- Live query updates UI reactively
- Completion toggle/advance work
- Stats compute correctly

#### Notes
- Это самый критичный store — от него зависит всё приложение
- Dexie API framework-agnostic, основная работа — реактивная обёртка

---

### F-049. `apps/web/src/hooks/useSyncEngine.ts`

**Тип:** hook  
**Текущая роль:** Sync orchestration hook — runs sync on mount, every 30s, on `online` events  
**Целевой аналог в SvelteKit:** `src/lib/stores/syncEngine.ts` (Svelte store + `$effect` в layout)  
**Стратегия миграции:** Hook → store. Intervals/listeners → `$effect` lifecycle. Core sync logic (syncEngine.ts) — framework-agnostic.  
**Зависимости:** syncEngine.ts, clientLogger  
**Связанные файлы:** F-055  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** medium  
**Сложность:** M  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать sync engine store
- [ ] Прикрепить sync cycle в `(protected)/+layout.svelte` через `$effect`
- [ ] Перенести 30s interval
- [ ] Перенести `online` event listener
- [ ] Перенести status state (idle/syncing/error)

#### Acceptance Criteria
- Sync runs on mount, every 30s, on `online`
- Status updates correctly

---

### F-050. `apps/web/src/hooks/useTheme.ts`

**Тип:** hook  
**Текущая роль:** Theme persistence (API + localStorage), timezone handling, data-theme attribute  
**Целевой аналог в SvelteKit:** `src/lib/stores/theme.ts` (Svelte writable store)  
**Стратегия миграции:** Hook → writable store + `$effect` для side effects (API save, DOM attribute, timezone).  
**Зависимости:** API theme, userTimezone  
**Связанные файлы:** F-058, F-060  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать theme store
- [ ] Перенести API fetch/save logic
- [ ] Перенести `data-theme` DOM update
- [ ] Перенести timezone sync

#### Acceptance Criteria
- Theme persists across sessions
- DOM theme attribute updates correctly

---

### F-051. `apps/web/src/hooks/useLiveQuery.ts`

**Тип:** hook  
**Текущая роль:** Dexie Observable → React state adapter  
**Целевой аналог в SvelteKit:** `src/lib/stores/dexieLiveQuery.ts` — Svelte readable store wrapping Dexie.liveQuery  
**Стратегия миграции:** Complete rewrite. `Dexie.liveQuery()` returns an Observable. Create Svelte `readable()` store that subscribes to it.  
**Зависимости:** Dexie  
**Связанные файлы:** F-048  
**UI-critical:** no  
**Functionality-critical:** **yes — critical**  
**Риск:** medium  
**Сложность:** M  
**Оценка усилий:** 3 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Implement `dexieLiveQuery<T>(querier: () => T | Promise<T>): Readable<T>`
- [ ] Handle subscription/unsubscription lifecycle
- [ ] Handle initial value (undefined) state
- [ ] Test with habits and checkins queries

#### Acceptance Criteria
- Store updates reactively when DB changes
- No memory leaks (proper unsubscription)

#### Notes
- Key implementation detail:
```typescript
import { readable } from 'svelte/store';
import { liveQuery } from 'dexie';

export function dexieLiveQuery<T>(querier: () => T | Promise<T>) {
  return readable<T | undefined>(undefined, (set) => {
    const observable = liveQuery(querier);
    const subscription = observable.subscribe(
      (value) => set(value),
      (error) => console.error('LiveQuery error:', error)
    );
    return () => subscription.unsubscribe();
  });
}
```

---

### F-052. `apps/web/src/hooks/useAsyncState.ts`

**Тип:** hook  
**Текущая роль:** Generic async operation state management (loading, success, error)  
**Целевой аналог в SvelteKit:** `src/lib/stores/asyncState.ts` (Svelte store)  
**Стратегия миграции:** Hook → store factory.  
**Зависимости:** нет  
**Связанные файлы:** нет  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Переписать как Svelte writable store
- [ ] Test

#### Acceptance Criteria
- Async state management identical

---

### F-053. `apps/web/src/hooks/useSwipeGesture.ts`

**Тип:** hook  
**Текущая роль:** Touch swipe detection (left/right) для мобильной навигации  
**Целевой аналог в SvelteKit:** `src/lib/actions/swipeGesture.ts` (Svelte action `use:swipeGesture`)  
**Стратегия миграции:** React hook → Svelte action. Touch event listeners остаются те же.  
**Зависимости:** нет  
**Связанные файлы:** нет  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [x] Создать Svelte action
- [x] Перенести touch event handling
- [ ] Тестировать на мобильных

#### Acceptance Criteria
- Swipe detection works identically

---

### F-054–F-068. Library / Utility Files (Framework-Agnostic)

Файлы из `apps/web/src/lib/`, которые **не зависят от React** и переносятся **1:1** (copy + update imports):

| ID | Path | Purpose | Migration Note |
|---|---|---|---|
| F-054 | `lib/core/config.ts` | Env vars (API_BASE_URL, etc.) | Copy. SvelteKit: `$env/static/public` вместо `import.meta.env.VITE_*` |
| F-055 | `lib/sync/syncEngine.ts` | Pull-push-pull cycle | Copy 1:1 — framework-agnostic |
| F-056 | `lib/sync/writeThrough.ts` | Write-through mutation layer | Copy 1:1 |
| F-057 | `lib/auth/session.ts` | Auth session (localStorage) | Copy 1:1 |
| F-058 | `lib/auth/oauth.ts` | OAuth flow initiator | Copy 1:1, update buildApiUrl import |
| F-059 | `lib/api/sync.ts` | Push/pull HTTP endpoints | Copy 1:1 |
| F-060 | `lib/api/url.ts` | API URL builder | Copy 1:1 |
| F-061 | `lib/api/theme.ts` | User preferences API | Copy 1:1 |
| F-062 | `lib/api/devProxy.ts` | Dev proxy resolver | SvelteKit `vite.config.ts` proxy or removed |
| F-063 | `lib/logging/clientLogger.ts` | Client-side logger | Copy 1:1 |
| F-064 | `lib/observability/faro.ts` | Grafana Faro init | Copy → `hooks.client.ts` |
| F-065 | `lib/seo/publicSeo.ts` | SEO meta/JSON-LD upsert | Replace with `<svelte:head>` in pages |
| F-066 | `lib/pwa/pushSubscription.ts` | Web Push API | Copy 1:1 |
| F-067 | `lib/pwa/runtimeCaching.ts` | Workbox strategies | Adapt for `@vite-pwa/sveltekit` |
| F-068 | `lib/storage/db.ts` | Dexie schema & operations | Copy 1:1 — framework-agnostic |

**Общий риск:** low  
**Общая сложность:** M  
**Общая оценка:** 5 SP  
**Статус:** ✅ done

#### Единственная заметная разница:
- **F-054 (config.ts):** В SvelteKit env vars доступны через `$env/static/public` (`PUBLIC_API_BASE_URL` вместо `VITE_API_BASE_URL`). Либо сохранить Vite-compatible переменные через `vite.config.ts` define.
- **F-062 (devProxy.ts):** SvelteKit имеет свои proxy настройки через `vite.config.ts` — файл может быть адаптирован или удалён.
- **F-065 (publicSeo.ts):** Прямые DOM-манипуляции для meta → `<svelte:head>` декларативный подход. Функции переписать.

---

### F-069–F-076. Pure Utility Files (Zero Framework Dependency)

Копируются **без изменений**:

| ID | Path | Purpose |
|---|---|---|
| F-069 | `lib/core/id.ts` | ID generation |
| F-070 | `lib/core/habit-id.ts` | Semantic habit ID |
| F-071 | `lib/habits/formatHabitLabel.ts` | Habit label with emoji |
| F-072 | `lib/habits/habitStats.ts` | Streak/rate calculations |
| F-073 | `lib/habits/schedule.ts` | Schedule logic |
| F-074 | `lib/habits/phases.ts` | Habit phases |
| F-075 | `lib/time/userTimezone.ts` | Timezone detection/storage |
| F-076 | `lib/completionKey.ts` | Completion key format |
| F-077 | `lib/theme/habit-colors.ts` | Color themes config |
| F-078 | `lib/i18n.ts` | Date formatting |
| F-079 | `lib/callback.ts` | Invoke-if-function |
| F-080 | `lib/constants/stats.ts` | Period day ranges |
| F-081 | `lib/stats/StatsView.helpers.ts` | Stats calculations |
| F-082 | `lib/dashboard/DashboardView.helpers.tsx` | Dashboard helpers (JSX → `.ts` or `.svelte`) |
| F-083 | `lib/storage/dbSync.ts` | DB sync apply |

**Общий риск:** none  
**Общая сложность:** S  
**Общая оценка:** 2 SP  
**Статус:** ✅ done

**Заметка для F-082:** `DashboardView.helpers.tsx` может содержать JSX — если да, JSX-части конвертировать в Svelte snippets или вынести в компоненты.

---

### F-084. `apps/web/src/lib/undo.tsx`

**Тип:** context provider  
**Текущая роль:** UndoProvider — React Context + state для undo toasts  
**Целевой аналог в SvelteKit:** `src/lib/stores/undo.ts` (Svelte writable store + context)  
**Стратегия миграции:** React Context → Svelte `setContext`/`getContext` + writable store. UndoToast → Svelte component subscribed to store.  
**Зависимости:** React.Context, React.FC  
**Связанные файлы:** F-020  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать writable undo store
- [ ] Перенести undo timer/queue logic
- [ ] Привязать в root layout через setContext
- [ ] Тестировать undo flow

#### Acceptance Criteria
- Undo toast показывается
- Undo action выполняется
- Timer auto-dismiss работает

---

### F-085. `apps/web/src/lib/router.tsx`

**Тип:** library (custom router)  
**Текущая роль:** Custom BrowserRouter / Routes / Route / Navigate / Link / useLocation / useNavigate / useParams — полный мини-роутер на React Context  
**Целевой аналог в SvelteKit:** **Удаляется полностью.** SvelteKit file-based routing заменяет весь этот файл.  
**Стратегия миграции:** Удалить. Все usages заменить:
- `useNavigate()` → `goto()` from `$app/navigation`
- `useLocation()` → `$page.url` from `$app/stores`
- `useParams()` → `$page.params` from `$app/stores`
- `<Link to="...">` → `<a href="...">` (SvelteKit native)
- `<Navigate to="...">` → `redirect()` in load or `goto()` client-side  

**Зависимости:** React.Context  
**Связанные файлы:** F-002 и все компоненты с navigation  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP (поиск и замена всех usages)  
**Статус:** ✅ done

#### Подзадачи
- [ ] Заменить все `import { ... } from '@/lib/router'` usages
- [ ] Удалить файл

#### Acceptance Criteria
- Все navigation работает через SvelteKit native

---

### F-086. `apps/web/src/types/habit.ts` + `types/sync.ts`

**Тип:** types  
**Текущая роль:** Local domain types and re-exports from shared  
**Целевой аналог в SvelteKit:** `src/lib/types/habit.ts` + `src/lib/types/sync.ts`  
**Стратегия миграции:** Копировать 1:1. Обновить import paths.  
**Зависимости:** @habbit-runner/shared  
**Связанные файлы:** все компоненты  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 0.5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Скопировать
- [ ] Обновить imports

#### Acceptance Criteria
- Типы корректно разрешаются

---

### F-087. `apps/web/packages/shared/` (6 файлов)

**Тип:** shared package  
**Текущая роль:** DTOs, sync types, schedule utils, time utils, auth types  
**Целевой аналог в SvelteKit:** **Сохранить как есть.** `packages/shared/` остаётся отдельным workspace пакетом. SvelteKit config добавляет alias.  
**Стратегия миграции:** Не трогать. Только убедиться, что SvelteKit `svelte.config.js` резолвит `@habbit-runner/shared`.  
**Зависимости:** нет  
**Связанные файлы:** все  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 0.5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Настроить alias в `svelte.config.js` или `vite.config.ts`
- [ ] Проверить что все imports работают

#### Acceptance Criteria
- Shared types importируются корректно

---

### F-088. `apps/web/index.html`

**Тип:** config  
**Текущая роль:** HTML shell — meta tags, fonts, JSON-LD, PWA manifest, viewport  
**Целевой аналог в SvelteKit:** `src/app.html`  
**Стратегия миграции:** Перенести meta tags, font links, PWA link, JSON-LD. SvelteKit template: `%sveltekit.head%`, `%sveltekit.body%`.  
**Зависимости:** нет  
**Связанные файлы:** F-001  
**UI-critical:** yes  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 1 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `src/app.html` с SvelteKit template
- [ ] Перенести все `<head>` tags
- [ ] Перенести Google Fonts links
- [ ] Перенести PWA manifest link
- [ ] Перенести JSON-LD schema

#### Acceptance Criteria
- HTML head идентичен (meta, fonts, PWA, JSON-LD)

---

### F-089. `apps/web/src/index.css`

**Тип:** style  
**Текущая роль:** Global CSS — Tailwind directives, 10+ theme CSS variables (data-theme), global resets, scrollbar, glow utilities, micro-animations (check-pulse, glow-burst, ring-celebrate, confetti-pop, slide-down-fade, comeback)  
**Целевой аналог в SvelteKit:** `src/app.css`  
**Стратегия миграции:** Копировать **1:1**. Tailwind directives остаются. CSS-переменные остаются. Animations остаются.  
**Зависимости:** нет  
**Связанные файлы:** все компоненты  
**UI-critical:** **yes — critical**  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 0.5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Скопировать в `src/app.css`
- [ ] Проверить что Tailwind directives работают в SvelteKit
- [ ] Проверить все темы

#### Acceptance Criteria
- Все 10+ тем рендерятся идентично
- Все CSS animations работают
- Scrollbar styling сохранён

---

### F-090. `apps/web/tailwind.config.js`

**Тип:** config  
**Текущая роль:** Tailwind configuration — custom colors (CSS vars), fonts (Sora, JetBrains Mono), box shadows (glow), animations (pulse-slow)  
**Целевой аналог в SvelteKit:** `tailwind.config.js` (или Tailwind v4 CSS config)  
**Стратегия миграции:** Копировать 1:1. Обновить `content` paths для SvelteKit (`./src/**/*.{svelte,js,ts}`).  
**Зависимости:** нет  
**Связанные файлы:** F-089  
**UI-critical:** yes  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 0.5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Скопировать config
- [ ] Обновить content paths
- [ ] Убедиться что custom colors, fonts, shadows, animations работают

#### Acceptance Criteria
- Tailwind classes рендерятся корректно
- Custom utilities (glow, pulse-slow) работают

---

### F-091. `apps/web/vite.config.ts`

**Тип:** config  
**Текущая роль:** Vite config — React plugin, PWA plugin, proxy, aliases, build chunks  
**Целевой аналог в SvelteKit:** `vite.config.ts` в корне SvelteKit project (+ `svelte.config.js`)  
**Стратегия миграции:** Заменить React plugin → SvelteKit handled. PWA → `@vite-pwa/sveltekit`. Proxy → SvelteKit vite config. Aliases → svelte.config.js. Chunk splitting → SvelteKit defaults.  
**Зависимости:** нет  
**Связанные файлы:** F-062  
**UI-critical:** no  
**Functionality-critical:** yes  
**Риск:** low  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Создать `svelte.config.js`
- [ ] Настроить `vite.config.ts` (proxy, aliases)
- [ ] Настроить `@vite-pwa/sveltekit`
- [ ] Настроить chunk splitting (если нужно)

#### Acceptance Criteria
- Dev server working with proxy
- PWA build generates service worker
- Aliases resolve correctly

---

### F-092. `apps/web/src/sw-custom.ts`

**Тип:** service worker  
**Текущая роль:** PWA service worker — precache, push notifications handling  
**Целевой аналог в SvelteKit:** `src/service-worker.ts` (SvelteKit convention) или через PWA plugin  
**Стратегия миграции:** Адаптировать для SvelteKit PWA plugin. Push notification handling переносится 1:1.  
**Зависимости:** workbox-precaching  
**Связанные файлы:** F-067, F-091  
**UI-critical:** no  
**Functionality-critical:** yes (PWA, push)  
**Риск:** medium  
**Сложность:** M  
**Оценка усилий:** 2 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Адаптировать service worker для SvelteKit
- [ ] Перенести push notification handling
- [ ] Тестировать PWA install flow
- [ ] Тестировать push notifications

#### Acceptance Criteria
- PWA installs correctly
- Push notifications work
- Offline caching works

---

### F-093. `apps/web/src/globals.d.ts`

**Тип:** type declaration  
**Текущая роль:** `__BUILD_TIME__` ambient type  
**Целевой аналог в SvelteKit:** `src/app.d.ts` (SvelteKit standard)  
**Стратегия миграции:** Merge into SvelteKit app.d.ts.  
**Зависимости:** нет  
**Связанные файлы:** F-091  
**UI-critical:** no  
**Functionality-critical:** no  
**Риск:** low  
**Сложность:** S  
**Оценка усилий:** 0.5 SP  
**Статус:** ✅ done

---

### F-094. Config Files Group

| File | Migration |
|---|---|
| `postcss.config.js` | Copy/adapt for SvelteKit |
| `tsconfig.json` / `tsconfig.base.json` / `tsconfig.node.json` | Replace with SvelteKit tsconfig |
| `eslint.config.cjs` | Adapt: eslint-plugin-svelte вместо react-hooks/react-refresh |
| `vitest.config.ts` / `tsconfig.test.json` | Adapt for Svelte testing |
| `turbo.json` | Adapt if workspace structure changes |
| `package.json` | New SvelteKit dependencies |
| `Dockerfile` | Adapt build commands for SvelteKit |
| `nginx.conf` | Может остаться если SPA mode, или adapter-node |
| `docker-entrypoint.sh` | Adapt if needed |

**Общий риск:** low  
**Общая сложность:** M  
**Общая оценка:** 3 SP  
**Статус:** ✅ done

---

### F-095. Test Files Migration

**Тип:** tests  
**Текущая роль:** Vitest unit tests в `apps/web/tests/unit/`  
**Целевой аналог в SvelteKit:** `src/tests/` или `tests/` — Vitest + `@testing-library/svelte`  
**Стратегия миграции:** Перенести тесты. React Testing Library → Svelte Testing Library. Pure utility tests — 1:1.  
**Зависимости:** vitest, testing-library  
**Связанные файлы:** все компоненты/utils/stores  
**UI-critical:** no  
**Functionality-critical:** yes (quality gate)  
**Риск:** medium  
**Сложность:** L  
**Оценка усилий:** 5 SP  
**Статус:** ✅ done

#### Подзадачи
- [ ] Перенести utility tests (pure TS) — 1:1
- [ ] Переписать component tests: React Testing Library → Svelte Testing Library
- [ ] Адаптировать test setup
- [ ] Все тесты проходят

#### Acceptance Criteria
- All existing tests have equivalents
- All tests pass

---

## 6. Dependency Waves

### Wave 1: Foundation / Config (Prereqs)
**Задачи:** F-088, F-089, F-090, F-091, F-093, F-094  
**Цель:** SvelteKit project scaffold, Tailwind, CSS variables, PWA config, aliases  
**Блокирует:** Всё остальное  
**Оценка:** 7 SP

### Wave 2: Shared Package + Types + Core Utils
**Задачи:** F-087, F-086, F-069–F-083 (pure utils)  
**Цель:** Все framework-agnostic модули перенесены и работают  
**Блокирует:** Wave 3+  
**Оценка:** 3 SP

### Wave 3: Reactive Layer (Stores)
**Задачи:** F-051 (dexieLiveQuery), F-048 (habits store), F-049 (sync engine store), F-050 (theme store), F-052 (async state), F-084 (undo store)  
**Цель:** Все Svelte stores работают, DB reactive, sync running  
**Блокирует:** Wave 4+  
**Оценка:** 19 SP

### Wave 4: Routing + Layouts
**Задачи:** F-002 (App → layouts), F-003 (AppLayout), F-004 (SidebarNav), F-005 (BottomNav), F-006 (SyncStatus), F-085 (remove router), F-008 (ErrorBoundary)  
**Цель:** Skeleton app navigable with auth gate  
**Блокирует:** Wave 5  
**Оценка:** 14 SP

### Wave 5: Shared UI Components
**Задачи:** F-009, F-013, F-014, F-015, F-016, F-017, F-018, F-019, F-020, F-021, F-053  
**Цель:** All shared components available  
**Блокирует:** Wave 6  
**Оценка:** 13 SP

### Wave 6: Pages + Features
**Задачи:**
- Dashboard: F-022, F-023, F-024, F-025, F-025h, F-026, F-027, F-028, F-041–F-046
- HabitDetail: F-036, F-037, F-038, F-039
- AddEditHabit: F-040, F-047
- Stats: F-029, F-030, F-031, F-032, F-033, F-034, F-035
- Public: F-007, F-010, F-011, F-012  

**Цель:** All pages working  
**Блокирует:** Wave 7  
**Оценка:** 65 SP

### Wave 7: PWA + Observability
**Задачи:** F-092, F-064 (Faro), F-001  
**Цель:** PWA, push notifications, observability  
**Оценка:** 4 SP

### Wave 8: Tests + Polish + Parity Check
**Задачи:** F-095, final integration testing, visual parity audit  
**Цель:** All tests pass, UI parity confirmed  
**Оценка:** 10 SP

### **Итого: ~135 SP**

---

## 7. Critical Path

```
Wave 1 (Foundation)
  └─→ Wave 2 (Utils/Types)
       └─→ Wave 3 (Stores — especially F-051 dexieLiveQuery + F-048 habits store)
            └─→ Wave 4 (Routing/Layouts)
                 └─→ Wave 5 (Shared UI)
                      └─→ Wave 6 (Pages — F-031 StatsViewCharts + F-039 RetroCalendar most critical)
                           └─→ Wave 7 (PWA)
                                └─→ Wave 8 (Tests/Parity)
```

**Blocking items:**
- F-051 (`dexieLiveQuery`) — блокирует все stores
- F-048 (`useHabits` → habits store) — блокирует все pages
- F-002 (App.tsx → layouts) — блокирует visually navigable app
- F-031 (StatsViewCharts — Recharts migration) — longest lead time in Wave 6

---

## 8. High-Risk Items

| ID | Item | Risk Level | Reason |
|---|---|---|---|
| **F-031** | StatsViewCharts (Recharts → LayerChart) | **Critical** | Library change; visual calibration needed; tooltip/interaction parity uncertain |
| **F-039** | HabitRetroCalendar (complex interactive calendar with popover) | **High** | Complex state, positioning, mobile UX |
| **F-027** | HabitListSection (drag-to-reorder) | **High** | DnD implementation differs between React and Svelte ecosystems |
| **F-048** | useHabits → habits store (reactive data layer) | **High** | Core data store; any bug affects entire app |
| **F-002** | App.tsx decomposition into SvelteKit layouts | **High** | Lots of wiring logic to redistribute |
| **F-021** | PullToRefresh gesture | **Medium** | Touch interaction, threshold calibration |
| **F-092** | Service Worker (PWA) | **Medium** | SvelteKit PWA tooling may differ from Vite PWA |
| **F-040** | AddEditHabit form (complex multi-section form) | **Medium** | Many form fields, validation, submission flow |

---

## 9. Parity Checklist

### Visual Parity
- [ ] All 10+ themes render identically (midnight, ember, violet, matrix, arctic, sakura, lavender, mint, peach, cloud)
- [ ] Typography (Sora, JetBrains Mono) matches
- [ ] Spacing/padding/margin identical across all pages
- [ ] Colors (CSS variables) identical
- [ ] Box shadows and glow effects identical
- [ ] Scrollbar styling identical
- [ ] SVG CompletionRing identical
- [ ] Heatmap grid colors/intensity identical
- [ ] Charts: axes, lines, bars, tooltips calibrated
- [ ] Cards: border, radius, background identical
- [ ] Forms: input styling, color picker, icon selector identical

### Interaction Parity
- [ ] Habit toggle animation (check-pulse, glow-burst, confetti)
- [ ] Ring celebrate animation at 100%
- [ ] Pull-to-refresh gesture (72px threshold)
- [ ] Swipe navigation
- [ ] Drag-to-reorder habit list
- [ ] Retro calendar: tap day → popover → edit count → save
- [ ] Filter/search interactivity
- [ ] Theme switching instant
- [ ] Undo toast + timer + action

### Responsive Parity
- [ ] Mobile: bottom nav visible, sidebar hidden
- [ ] Desktop: sidebar visible, bottom nav hidden
- [ ] Tablet: correct breakpoint behavior
- [ ] Safe-area-inset-bottom on iOS
- [ ] Charts: responsive container behavior
- [ ] Retro calendar: mobile-friendly popover positioning

### Accessibility Parity
- [ ] Skip-to-content link
- [ ] Focus-visible outlines (2px accent)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation (tab through nav, forms)
- [ ] Screen reader announcements on state change

### Loading / Error Parity
- [ ] Loading spinner (AsyncStateUI)
- [ ] Error boundary fallback UI
- [ ] 404 redirect to dashboard
- [ ] Auth loading state ("Finishing login…")
- [ ] Sync status indicator states

### State Parity
- [ ] IndexedDB data persists across reloads
- [ ] Sync cursor persists
- [ ] Theme persists
- [ ] Auth session persists (localStorage)
- [ ] Outbox queue persists across offline periods

### Routing Parity
- [ ] `/` → Dashboard (authenticated) or Landing (unauthenticated)
- [ ] `/habit/new` → AddEditHabit
- [ ] `/habit/:id` → HabitDetail
- [ ] `/habit/:id/edit` → AddEditHabit (edit mode)
- [ ] `/stats` → Stats
- [ ] `/auth/callback` → OAuth callback handler
- [ ] `/habit-tracker`, `/streak-tracker`, `/daily-routine-planner` → SEO pages
- [ ] Unknown paths → redirect to `/`
- [ ] Browser back/forward navigation

### SEO Parity
- [ ] Meta tags (title, description, keywords, OG, Twitter)
- [ ] JSON-LD structured data
- [ ] Canonical URL
- [ ] Robots meta

---

## 10. SvelteKit Target File Structure

```
apps/web-svelte/
├── src/
│   ├── app.html                          # F-088
│   ├── app.css                           # F-089
│   ├── app.d.ts                          # F-093
│   ├── hooks.client.ts                   # F-001 (Faro), F-008 (handleError)
│   ├── service-worker.ts                 # F-092
│   ├── routes/
│   │   ├── +layout.svelte                # Root layout: UndoProvider, global CSS
│   │   ├── +error.svelte                 # F-008
│   │   ├── +page.svelte                  # Public landing / auth check redirect
│   │   ├── (public)/
│   │   │   ├── +layout.svelte
│   │   │   ├── habit-tracker/+page.svelte    # F-012
│   │   │   ├── streak-tracker/+page.svelte   # F-012
│   │   │   └── daily-routine-planner/+page.svelte # F-012
│   │   ├── (protected)/
│   │   │   ├── +layout.svelte            # F-002, F-003 (AppLayout, sync, auth)
│   │   │   ├── +layout.ts               # Auth guard load
│   │   │   ├── dashboard/
│   │   │   │   └── +page.svelte          # F-022
│   │   │   ├── habit/
│   │   │   │   ├── new/+page.svelte      # F-040
│   │   │   │   └── [id]/
│   │   │   │       ├── +page.svelte      # F-036
│   │   │   │       └── edit/+page.svelte # F-040
│   │   │   └── stats/
│   │   │       └── +page.svelte          # F-029
│   │   ├── auth/
│   │   │   └── callback/+page.svelte     # F-002
│   │   └── [...catchall]/
│   │       └── +page.ts                  # Redirect to /
│   ├── lib/
│   │   ├── components/
│   │   │   ├── AppLayout.svelte          # F-003
│   │   │   ├── SidebarNav.svelte         # F-004
│   │   │   ├── BottomNav.svelte          # F-005
│   │   │   ├── SyncStatus.svelte         # F-006
│   │   │   ├── AsyncStateUI.svelte       # F-009
│   │   │   ├── CompletionRing.svelte     # F-013
│   │   │   ├── HabitHeatmap.svelte       # F-014
│   │   │   ├── MiniHeatmap.svelte        # F-015
│   │   │   ├── HeatmapGrid.svelte        # F-016
│   │   │   ├── Onboarding.svelte         # F-017
│   │   │   ├── ChartGuideTooltip.svelte  # F-018
│   │   │   ├── DescriptionTooltip.svelte # F-019
│   │   │   ├── UndoToast.svelte          # F-020
│   │   │   ├── PublicLanding.svelte       # F-010
│   │   │   ├── PublicPreviewCarousel.svelte # F-011
│   │   │   ├── PullToRefreshIndicator.svelte # F-021
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardView.svelte
│   │   │   │   ├── DashboardHero.svelte
│   │   │   │   ├── DashboardHabitTile.svelte
│   │   │   │   ├── FilterBar.svelte
│   │   │   │   ├── HabitListSection.svelte
│   │   │   │   └── RemindersPanel.svelte
│   │   │   ├── habit/
│   │   │   │   ├── HabitDetailView.svelte
│   │   │   │   ├── HabitDetailTodayBlock.svelte
│   │   │   │   └── retro-calendar/
│   │   │   │       ├── HabitRetroCalendar.svelte
│   │   │   │       ├── DayCell.svelte
│   │   │   │       ├── EditorPopover.svelte
│   │   │   │       └── Navigation.svelte
│   │   │   ├── add-edit-habit/
│   │   │   │   ├── AddEditHabitPage.svelte
│   │   │   │   ├── AddEditHabitHeader.svelte
│   │   │   │   ├── AddEditHabitFormSections.svelte
│   │   │   │   ├── AddEditHabitSchedule.svelte
│   │   │   │   ├── AddEditHabitAuxSections.svelte
│   │   │   │   └── AddEditHabitTagsSection.svelte
│   │   │   └── stats/
│   │   │       ├── StatsView.svelte
│   │   │       ├── StatsViewCharts.svelte
│   │   │       ├── StatsViewFilters.svelte
│   │   │       ├── StatsViewPanels.svelte
│   │   │       ├── StatsViewHeatmap.svelte
│   │   │       └── StatCardGrid.svelte
│   │   ├── stores/
│   │   │   ├── habits.ts                 # F-048
│   │   │   ├── dexieLiveQuery.ts         # F-051
│   │   │   ├── syncEngine.ts             # F-049
│   │   │   ├── theme.ts                  # F-050
│   │   │   ├── asyncState.ts             # F-052
│   │   │   ├── undo.ts                   # F-084
│   │   │   ├── dashboardModel.ts         # F-041
│   │   │   └── addEditHabitModel.ts      # F-047
│   │   ├── actions/
│   │   │   ├── pullToRefresh.ts          # F-021
│   │   │   ├── swipeGesture.ts           # F-053
│   │   │   └── dragReorder.ts            # F-044
│   │   ├── api/                          # F-059, F-060, F-061, F-062
│   │   │   ├── sync.ts
│   │   │   ├── url.ts
│   │   │   └── theme.ts
│   │   ├── auth/                         # F-057, F-058
│   │   │   ├── session.ts
│   │   │   └── oauth.ts
│   │   ├── core/                         # F-054, F-069, F-070
│   │   │   ├── config.ts
│   │   │   ├── id.ts
│   │   │   └── habit-id.ts
│   │   ├── habits/                       # F-071–F-074
│   │   │   ├── formatHabitLabel.ts
│   │   │   ├── habitStats.ts
│   │   │   ├── schedule.ts
│   │   │   └── phases.ts
│   │   ├── logging/                      # F-063
│   │   │   └── clientLogger.ts
│   │   ├── observability/                # F-064
│   │   │   └── faro.ts
│   │   ├── pwa/                          # F-066, F-067
│   │   │   ├── pushSubscription.ts
│   │   │   └── runtimeCaching.ts
│   │   ├── seo/                          # F-065 (deprecated, use <svelte:head>)
│   │   ├── storage/                      # F-068, F-083
│   │   │   ├── db.ts
│   │   │   └── dbSync.ts
│   │   ├── sync/                         # F-055, F-056
│   │   │   ├── syncEngine.ts
│   │   │   └── writeThrough.ts
│   │   ├── theme/                        # F-077
│   │   │   └── habit-colors.ts
│   │   ├── time/                         # F-075
│   │   │   └── userTimezone.ts
│   │   ├── types/                        # F-086
│   │   │   ├── habit.ts
│   │   │   └── sync.ts
│   │   ├── utils/                        # F-076, F-078, F-079, F-080, F-081, F-082
│   │   │   ├── completionKey.ts
│   │   │   ├── i18n.ts
│   │   │   ├── callback.ts
│   │   │   ├── constants/stats.ts
│   │   │   ├── stats/StatsView.helpers.ts
│   │   │   └── dashboard/DashboardView.helpers.ts
│   ├── tests/
│   │   └── unit/                         # F-095
├── packages/
│   └── shared/                           # F-087 (unchanged)
├── static/                               # public assets
├── svelte.config.js
├── vite.config.ts                        # F-091
├── tailwind.config.js                    # F-090
├── postcss.config.js
├── tsconfig.json
├── package.json
└── Dockerfile
```

---

## 11. Summary Table

| Wave | Tasks | SP | Blocking? |
|---|---|---|---|
| 1. Foundation | F-088, F-089, F-090, F-091, F-093, F-094 | 7 | Yes — all |
| 2. Utils/Types | F-087, F-086, F-069–F-083 | 3 | Yes — Wave 3+ |
| 3. Stores | F-051, F-048, F-049, F-050, F-052, F-084 | 19 | Yes — Wave 4+ |
| 4. Routing/Layouts | F-002, F-003, F-004, F-005, F-006, F-085, F-008 | 14 | Yes — Wave 5+ |
| 5. Shared UI | F-009, F-013–F-021, F-053 | 13 | Yes — Wave 6 |
| 6. Pages | F-022–F-047 (dashboard, detail, edit, stats, public) | 65 | Yes — Wave 7 |
| 7. PWA/Observability | F-092, F-064, F-001 | 4 | No |
| 8. Tests/Polish | F-095, parity audit | 10 | No |
| **Total** | **95 tasks** | **~135 SP** | |

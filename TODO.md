# План задач для ИИ агента: Миграция фронтенда с React на SvelteKit

## Ключевое требование

```
⚠️ КРИТИЧЕСКОЕ ПРАВИЛО: 
Миграция — это ПЕРЕНОС, а не переписывание с упрощением.
Каждый UI экран в SvelteKit версии должен быть ФУНКЦИОНАЛЬНО ИДЕНТИЧЕН 
React версии: те же поля, те же состояния, те же сообщения об ошибках,
та же последовательность действий пользователя.

ЗАПРЕЩЕНО:
- Убирать поля форм
- Упрощать логику валидации
- Заменять компоненты на заглушки
- Опускать edge case обработку ошибок
- Пропускать loading/empty/error состояния
- Менять UX flow (порядок шагов, редиректы)
- Удалять анимации и переходы если они есть в React версии
- Импортировать React, ReactDOM, или любые react-* пакеты в SvelteKit проекте
- Оборачивать React компоненты для использования в SvelteKit

ПРАВИЛО ВЫБОРА БИБЛИОТЕК:
Всегда использовать нативные Svelte библиотеки.
Оборачивать React компоненты для использования в SvelteKit ЗАПРЕЩЕНО.

Для графиков (recharts → layerchart или svelte-chartjs):
- Использовать нативную Svelte библиотеку
- Визуальный результат должен быть максимально близким к React версии
  (те же типы графиков, те же цвета, те же метрики, те же tooltips)
- Допускается незначительное визуальное отличие в деталях рендеринга
  при условии что функционал полностью сохранён

Это правило применяется ко ВСЕМ внешним библиотекам, не только к графикам:
- Если React версия использует react-query → использовать нативные Svelte stores
- Если React версия использует react-hook-form → использовать bind:value
- Если React версия использует react-spring → использовать svelte/transition и svelte/animate
- Любой react-* пакет заменяется на svelte-аналог или реализуется нативными средствами SvelteKit

ОБЯЗАТЕЛЬНО перед реализацией каждого компонента/страницы:
1. Открыть соответствующий React файл
2. Зафиксировать ВСЕ состояния, пропсы, обработчики событий
3. Перенести в Svelte БЕЗ потери ни одного из них
```

---

## Принципы приоритизации

**P0** — Блокирует всё остальное (инфраструктура)
**P1** — Критический функционал (offline-first, auth, sync)
**P2** — Основные страницы и компоненты
**P3** — Полировка, оптимизация, тесты

---

## ФАЗА 0: Подготовка и инфраструктура (P0)

### Задача 0.1 — Инициализация SvelteKit проекта в монорепо

```
Приоритет: P0 | Блокирует: всё
Сложность: средняя
```

**Что сделать:**
- Создать новый пакет `apps/web-svelte` в монорепо рядом с существующим `apps/web`
- Инициализировать SvelteKit через `npm create svelte@latest` с опциями:
  - TypeScript: yes
  - ESLint: yes
  - Vitest: yes
- Настроить `package.json` нового пакета (name, scripts, workspace-совместимость)
- Добавить новый пакет в корневой `package.json` workspaces

**Файлы на создание:**
```
apps/web-svelte/
  package.json
  svelte.config.js
  vite.config.ts
  tsconfig.json
  src/
    app.html
    app.css (перенести стили из index.css)
```

**Критические настройки `svelte.config.js`:**
```javascript
// SPA режим обязателен из-за localStorage auth и offline-first
// adapter-static с fallback: 'index.html'
// Причина: localStorage недоступен на сервере;
// SSR потребует рефакторинга всей auth-логики
```

**Критерий готовности:** `npm run dev` запускает пустой SvelteKit проект на новом порту

---

### Задача 0.2 — Настройка TypeScript (strict mode + shared types)

```
Приоритет: P0 | Блокирует: все задачи с типами
Сложность: низкая
```

**Что сделать:**
- Создать `tsconfig.json` с extends от `tsconfig.base.json` монорепо
- Добавить `@habbit-runner/shared` в зависимости нового пакета
- Проверить что DTOs импортируются без ошибок

**`tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "$lib/*": ["./src/lib/*"],
      "@habbit-runner/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", ".svelte-kit/types/**"]
}
```

**Критерий готовности:** импорт `import type { HabitDTO } from '@habbit-runner/shared'` работает без ошибок

---

### Задача 0.3 — Настройка Tailwind CSS + PostCSS

```
Приоритет: P0 | Блокирует: все UI задачи
Сложность: низкая
```

**Что сделать:**
- Установить `tailwindcss`, `postcss`, `autoprefixer`
- Скопировать `tailwind.config.js` из старого проекта ПОЛНОСТЬЮ, включая:
  - кастомные цвета, spacing, fonts
  - кастомные плагины
  - `darkMode` настройку
- Обновить только `content`:
```javascript
content: ['./src/**/*.{html,svelte,ts}']
// Было: ['./src/**/*.{tsx,ts,html}']
```
- Добавить директивы Tailwind в `app.css`
- Перенести ВСЕ глобальные CSS стили из `index.css` React проекта, включая кастомные CSS переменные и анимации
- Установить `svelte-preprocess` для обработки PostCSS внутри `<style>` блоков

**⚠️ Обязательно проверить:** все кастомные CSS классы, которые используются в React компонентах, должны быть доступны в Svelte версии

**Критерий готовности:** класс `bg-blue-500` применяется к элементу на тестовой странице; все кастомные утилиты из React версии работают

---

### Задача 0.4 — Настройка PWA (vite-plugin-pwa)

```
Приоритет: P0 | Блокирует: offline функционал
Сложность: средняя
```

**Что сделать:**
- Установить `vite-plugin-pwa`
- Перенести конфигурацию PWA из старого `vite.config.ts` **полностью**, включая:
  - `manifest` (name, short_name, icons, theme_color, background_color, display, все поля)
  - `workbox` стратегии кэширования
  - `registerType` настройку
  - `includeAssets`
- Адаптировать `sw-custom.ts` для SvelteKit:

```typescript
// sw-custom.ts — изменения минимальны
// workbox-precaching API идентичен
// Изменить: путь к манифесту если изменился
// Добавить: SvelteKit генерирует свой список precache
```

- Настроить регистрацию SW в `src/app.html` или через хук `+layout.ts`
- Перенести **все иконки и ассеты** из старого `public/` в новый `static/`

**Риск:** SvelteKit строит файлы в `.svelte-kit/output` — проверить что `globDirectory` в workbox указывает правильно

**Критерий готовности:** SW зарегистрирован в DevTools, precache список не пустой, PWA устанавливается идентично React версии

---

### Задача 0.5 — Настройка Vitest для Svelte

```
Приоритет: P0 | Блокирует: написание тестов
Сложность: низкая
```

**Что сделать:**
- Установить `@testing-library/svelte`, `@testing-library/jest-dom`
- Обновить `vitest.config.ts`:

```typescript
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.ts']
  }
})
```

**Критерий готовности:** `npm run test` запускается без ошибок конфигурации

---

## ФАЗА 1: Хранилище данных и синхронизация (P1)

### Задача 1.1 — Перенос IndexedDB / Dexie (db.ts)

```
Приоритет: P1 | Блокирует: sync, все страницы с данными
Сложность: средняя
Риск: инициализация только на клиенте
```

**Что сделать:**
- Скопировать `db.ts` в `apps/web-svelte/src/lib/storage/db.ts` **без изменения схемы**
- Сохранить все версии миграций Dexie без изменений — это критично для существующих пользователей
- Обернуть инициализацию Dexie в guard для SSR:

```typescript
// src/lib/storage/db.ts

import { browser } from '$app/environment'

let _db: AppDatabase | null = null

export function getDb(): AppDatabase {
  if (!browser) {
    throw new Error('DB доступна только на клиенте')
  }
  if (!_db) {
    _db = new AppDatabase()
  }
  return _db
}

// Экспортировать как геттер, не как синглтон верхнего уровня
// Причина: SvelteKit может импортировать модуль во время SSR
// даже при adapter-static
```

- Все функции-хелперы (`getHabits`, `saveOutboxItem` и т.д.) обновить на использование `getDb()`
- Сохранить **все** схемы (Outbox, tombstone, sync_meta) без изменений
- Сохранить **все** индексы Dexie без изменений

**Критерий готовности:** тест — создание записи в Dexie работает в jsdom окружении; структура БД идентична React версии

---

### Задача 1.2 — Перенос Auth (session.ts + oauth.ts)

```
Приоритет: P1 | Блокирует: sync, все защищённые страницы
Сложность: средняя
Архитектурное решение: остаёмся на localStorage (SPA режим)
```

**Что сделать:**
- Скопировать `session.ts` → `src/lib/auth/session.ts` с полным сохранением:
  - всех полей Session типа
  - всех функций (включая refresh token логику если есть)
  - всех констант (ключи localStorage и т.д.)
- Скопировать `oauth.ts` → `src/lib/auth/oauth.ts` с полным сохранением:
  - PKCE flow если используется
  - state/nonce параметров
  - всех эндпоинтов
- Добавить `browser` guard:

```typescript
import { browser } from '$app/environment'

export function getSession(): Session | null {
  if (!browser) return null
  const raw = localStorage.getItem('session')
  return raw ? JSON.parse(raw) : null
}

export function saveSession(session: Session): void {
  if (!browser) return
  localStorage.setItem('session', JSON.stringify(session))
}
```

- Создать **Svelte store** для реактивного состояния сессии:

```typescript
// src/lib/auth/sessionStore.ts
import { writable, derived } from 'svelte/store'
import { getSession } from './session'

function createSessionStore() {
  const { subscribe, set, update } = writable<Session | null>(null)
  
  return {
    subscribe,
    init: () => set(getSession()),
    login: (s: Session) => {
      saveSession(s)
      set(s)
    },
    logout: () => {
      clearSession()
      set(null)
    },
    // Перенести ВСЕ методы из React версии (refresh, update и т.д.)
  }
}

export const sessionStore = createSessionStore()
export const isAuthenticated = derived(
  sessionStore,
  ($session) => $session !== null
)
```

**Критерий готовности:** все методы из React auth логики доступны; `sessionStore` обновляется при логине; `isAuthenticated` реактивно меняется

---

### Задача 1.3 — Перенос Sync Engine (syncEngine.ts + sync.ts)

```
Приоритет: P1 | Блокирует: работу приложения offline-first
Сложность: высокая
Риск: browser APIs (navigator.onLine, visibilitychange, setInterval)
```

**Что сделать:**
- Скопировать `syncEngine.ts` → `src/lib/sync/syncEngine.ts` **полностью**, включая:
  - всю логику retry с backoff
  - обработку конфликтов
  - очередь outbox
  - все состояния (idle, syncing, error, offline и любые другие)
- Скопировать `sync.ts` → `src/lib/sync/sync.ts` без изменений
- Все browser-специфичные API обернуть в проверки:

```typescript
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', handler)
}
```

- Создать Svelte store для статуса синхронизации — **перенести все состояния из React версии**:

```typescript
// src/lib/sync/syncStatusStore.ts
import { writable } from 'svelte/store'

// Тип должен включать ВСЕ состояния из React версии, не только эти четыре
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

export const syncStatus = writable<SyncStatus>('idle')
export const lastSyncTime = writable<Date | null>(null)
export const syncError = writable<string | null>(null)
// Добавить все дополнительные поля которые были в React версии
```

- Обновить `syncEngine.ts` — вместо колбэков React использовать запись в stores

**HTTP адаптеры (`sync.ts`):** изменений не требуют — это чистый fetch, работает без изменений

**Критерий готовности:** вся логика синхронизации перенесена без упрощений; все состояния синка работают идентично React версии

---

### Задача 1.4 — Создание хука инициализации синка (замена useSyncEngine.ts)

```
Приоритет: P1 | Зависит от: 1.2, 1.3
Сложность: низкая
```

**Что сделать:**
- Открыть `useSyncEngine.ts` и зафиксировать ВСЕ эффекты, подписки, cleanup логику
- Создать `src/lib/sync/initSync.ts`:

```typescript
// src/lib/sync/initSync.ts
import { browser } from '$app/environment'
import { syncEngine } from './syncEngine'
import { sessionStore } from '$lib/auth/sessionStore'
import { get } from 'svelte/store'

export function initSyncEngine() {
  if (!browser) return () => {}
  
  const session = get(sessionStore)
  if (!session) return () => {}
  
  syncEngine.start()
  
  // Возвращаем cleanup для onDestroy
  return () => syncEngine.stop()
}
```

- Перенести **все** side-эффекты из `useSyncEngine.ts` (обработчики online/offline, visibility и т.д.)

**Критерий готовности:** поведение при старте/остановке синка идентично React версии

---

## ФАЗА 2: Роутинг и Layout (P1-P2)

### Задача 2.1 — Маппинг маршрутов React → SvelteKit файловая структура

```
Приоритет: P1 | Блокирует: все страницы
Сложность: низкая (механическая работа)
```

**Маппинг маршрутов:**

| React Router путь | SvelteKit файл |
|---|---|
| `/` | `src/routes/+page.svelte` |
| `/dashboard` | `src/routes/dashboard/+page.svelte` |
| `/habit/new` | `src/routes/habit/new/+page.svelte` |
| `/habit/:id` | `src/routes/habit/[id]/+page.svelte` |
| `/habit/:id/edit` | `src/routes/habit/[id]/edit/+page.svelte` |
| `/stats` | `src/routes/stats/+page.svelte` |
| `*` (404) | `src/routes/+error.svelte` |

**⚠️ Проверить React Router конфиг на дополнительные маршруты** — перенести все, включая редиректы и вложенные роуты

**Что создать:**
- Все директории и пустые `+page.svelte` файлы (заглушки)
- `src/routes/+layout.svelte` — корневой layout

**Критерий готовности:** все маршруты из React версии присутствуют; навигация работает

---

### Задача 2.2 — Корневой Layout (+layout.svelte)

```
Приоритет: P1 | Зависит от: 1.2, 1.3, 1.4
Сложность: средняя
```

**Что сделать:**
- Открыть React `App.tsx` (или корневой layout компонент) и зафиксировать ВСЕ:
  - провайдеры (Context providers)
  - глобальные обработчики событий
  - глобальные состояния
  - мета-теги и head настройки
- Создать `src/routes/+layout.svelte`, перенеся весь этот функционал:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { sessionStore } from '$lib/auth/sessionStore'
  import { initSyncEngine } from '$lib/sync/initSync'
  import '../app.css'

  let cleanupSync: () => void

  onMount(() => {
    // 1. Инициализировать сессию из localStorage
    sessionStore.init()
    
    // 2. Запустить sync engine
    cleanupSync = initSyncEngine()
    
    // Перенести ВСЕ остальные onMount эффекты из React App.tsx
  })

  onDestroy(() => {
    cleanupSync?.()
  })
</script>

<slot />
```

- Создать `src/routes/+layout.ts` для SPA режима:

```typescript
// Отключить SSR для всего приложения
export const ssr = false
export const prerender = false
```

**Критерий готовности:** все глобальные провайдеры и эффекты из React App.tsx воспроизведены

---

### Задача 2.3 — AuthGate компонент (замена AuthGate.tsx)

```
Приоритет: P1 | Зависит от: 1.2, 2.2
Сложность: низкая
```

**Что сделать:**
- Открыть `AuthGate.tsx` и зафиксировать полную логику:
  - условия показа/скрытия
  - редиректы
  - loading состояние пока сессия инициализируется (если есть)
- Создать `src/lib/components/AuthGate.svelte` с полным воспроизведением логики:

```svelte
<script lang="ts">
  import { isAuthenticated } from '$lib/auth/sessionStore'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe((auth) => {
      if (!auth) goto('/login')
    })
    return unsubscribe
  })
</script>

{#if $isAuthenticated}
  <slot />
{/if}
```

- Создать `src/routes/(protected)/+layout.svelte` — группа защищённых маршрутов:

```svelte
<script>
  import AuthGate from '$lib/components/AuthGate.svelte'
</script>

<AuthGate>
  <slot />
</AuthGate>
```

- Переместить dashboard, habit, stats маршруты в `(protected)` группу

**Критерий готовности:** поведение AuthGate идентично React версии (включая loading состояния если они есть); неавторизованный пользователь редиректится на `/login`

---

## ФАЗА 3: UI Компоненты (P2)

### Правило миграции компонентов (применять к каждому)

```
Перед началом реализации каждого компонента:

1. АУДИТ React компонента:
   - Перечислить все props (включая опциональные)
   - Перечислить все внутренние состояния (useState)
   - Перечислить все side-эффекты (useEffect)
   - Перечислить все обработчики событий
   - Описать все визуальные состояния (loading, error, empty, success)
   - Зафиксировать все условные рендеры
   - Зафиксировать анимации и переходы

2. РЕАЛИЗАЦИЯ в Svelte (только нативные средства):
   - props → export let (все, без исключений)
   - useState → let (реактивные переменные)
   - useEffect → onMount / $: реактивные выражения
   - children → <slot />
   - className → class
   - onClick → on:click
   - Условный рендер → {#if} / {#each}
   - Анимации → svelte/transition или svelte/animate (не react-spring)
   - Формы → bind:value (не react-hook-form)
   - Любой react-* пакет → нативный svelte аналог

3. ПРОВЕРКА:
   - Сравнить количество состояний: React === Svelte
   - Сравнить все пропсы: React === Svelte
   - Сравнить визуально: каждый пиксель на месте
```

**Компоненты для миграции (в порядке приоритета):**

| Компонент | Откуда | Куда | Сложность |
|---|---|---|---|
| AppLayout | components/AppLayout.tsx | lib/components/AppLayout.svelte | низкая |
| SidebarNav | components/SidebarNav.tsx | lib/components/SidebarNav.svelte | низкая |
| SyncStatus | components/SyncStatus.tsx | lib/components/SyncStatus.svelte | низкая |
| HabitCard | components/HabitCard.tsx | lib/components/HabitCard.svelte | средняя |
| HabitForm | components/HabitForm.tsx | lib/components/HabitForm.svelte | высокая |

---

### Задача 3.1 — AppLayout и SidebarNav

```
Приоритет: P2 | Зависит от: 2.2, 2.3
Сложность: средняя
```

**Обязательно перенести из React версии:**
- Все варианты layout (если есть collapsed sidebar, mobile view и т.д.)
- Активное состояние пунктов навигации (подсветка текущего маршрута)
- Все иконки в навигации (не заменять на другие)
- Поведение при разных размерах экрана (responsive)
- Любые анимации (раскрытие меню и т.д.) — реализовать через `svelte/transition`

**Ключевые замены синтаксиса:**
```
className → class
children → <slot />
onClick={handler} → on:click={handler}
useState → let (локальное реактивное состояние)
props.value → export let value
```

**Критерий готовности:** компонент визуально идентичен React версии на всех breakpoint'ах; навигация подсвечивает активный раздел

---

### Задача 3.2 — SyncStatus компонент

```
Приоритет: P2 | Зависит от: 1.3, 3.1
Сложность: низкая
```

**Обязательно перенести:**
- Все состояния отображения (idle, syncing, error, offline — и любые другие из React версии)
- Точные тексты сообщений (не перефразировать)
- Иконки и их анимации (спиннер при syncing и т.д.) — реализовать через CSS или `svelte/transition`
- Tooltip или дополнительную информацию если есть
- Обработчик ручного запуска синка если есть

```svelte
<!-- src/lib/components/SyncStatus.svelte -->
<script lang="ts">
  import { syncStatus, lastSyncTime, syncError } from '$lib/sync/syncStatusStore'
  // Импортировать все поля которые использует React версия
</script>

<div class="sync-status">
  {#if $syncStatus === 'syncing'}
    <span class="text-blue-500">Синхронизация...</span>
  {:else if $syncStatus === 'error'}
    <span class="text-red-500">Ошибка синхронизации</span>
  {:else if $syncStatus === 'offline'}
    <span class="text-yellow-500">Офлайн</span>
  {:else}
    <span class="text-green-500">
      Синхронизировано {$lastSyncTime?.toLocaleTimeString() ?? ''}
    </span>
  {/if}
</div>
```

**Критерий готовности:** компонент отображает все те же состояния что и React версия; тексты идентичны

---

### Задача 3.3 — HabitForm (самый сложный компонент)

```
Приоритет: P2 | Зависит от: 1.1, 3.1
Сложность: высокая
```

**Обязательно перенести из React `HabitForm.tsx`:**
- **Все поля формы** (не выбрасывать "необязательные")
- **Все правила валидации** (минимальная длина, формат, обязательность)
- **Все сообщения об ошибках** (дословно, не перефразировать)
- **Порядок полей** в форме (не менять)
- **Поведение Submit кнопки** (disabled пока невалидна, loading state при отправке)
- **Поведение Cancel** (подтверждение если форма изменена)
- **Предзаполнение при редактировании**
- **Все типы привычек** если есть (daily, weekly и т.д.)
- **Дополнительные настройки** (напоминания, цвет, иконка и т.д.)

**Замена controlled inputs (react-hook-form не используется — только нативный Svelte):**
```svelte
<!-- React: value={name} onChange={e => setName(e.target.value)} -->
<!-- Svelte: -->
<input bind:value={name} />
```

**Замена callbacks на events:**
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { HabitDTO } from '@habbit-runner/shared'
  
  export let initialData: Partial<HabitDTO> = {}
  
  const dispatch = createEventDispatcher<{
    submit: HabitDTO
    cancel: void
  }>()
  
  let name = initialData.name ?? ''
  // ... все остальные поля из React версии
  
  function handleSubmit(e: Event) {
    e.preventDefault()
    dispatch('submit', { name, /* все поля */ } as HabitDTO)
  }
</script>

<form on:submit={handleSubmit}>
  <input bind:value={name} />
  <!-- все остальные поля -->
  <button type="submit">Сохранить</button>
  <button type="button" on:click={() => dispatch('cancel')}>
    Отмена
  </button>
</form>
```

**Критерий готовности:** форма содержит все поля, все валидации, все сообщения об ошибках идентично React версии; UX flow не изменён; форма создаёт/обновляет запись в Dexie

---

## ФАЗА 4: Страницы (P2)

### Задача 4.1 — Страница Login / OAuth

```
Приоритет: P2 | Зависит от: 1.2
Сложность: низкая
```

**Обязательно перенести:**
- Точную вёрстку (логотип, заголовки, описание)
- Все кнопки входа (Google, GitHub и любые другие провайдеры)
- Loading состояние кнопки при инициации OAuth
- Сообщение об ошибке если OAuth вернул ошибку
- Редирект если уже авторизован
- Footer / legal links если есть

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { initiateOAuthLogin } from '$lib/auth/oauth'
  import { isAuthenticated } from '$lib/auth/sessionStore'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  
  onMount(() => {
    return isAuthenticated.subscribe((auth) => {
      if (auth) goto('/dashboard')
    })
  })
</script>

<!-- Полная копия Login страницы из React, без упрощений -->
```

- Создать `src/routes/auth/callback/+page.svelte` с полным воспроизведением callback обработки:
  - обработка `code` параметра
  - обработка `state` параметра (PKCE/CSRF)
  - отображение loading во время обмена code на token
  - обработка ошибок OAuth (access_denied и т.д.)
  - редирект после успешного логина

**Критерий готовности:** весь OAuth flow работает end-to-end; UI идентичен React версии включая состояния ошибок

---

### Задача 4.2 — Dashboard страница

```
Приоритет: P2 | Зависит от: 1.1, 3.1, 4.1
Сложность: средняя
```

**Обязательно перенести из React Dashboard:**
- **Заголовок страницы** (точный текст)
- **Все фильтры** если есть (по дате, статусу, тегу)
- **Сортировку** если есть
- **Empty state** (точный текст и иллюстрацию когда нет привычек)
- **Loading state** (скелетон или спиннер — тот же что в React)
- **Error state** (если загрузка из Dexie вернула ошибку)
- **Кнопку "Добавить привычку"** (её расположение и вид)
- **Статистику на дашборде** если есть (streak, completion rate и т.д.)
- **HabitCard** — все действия (complete, edit, delete) с теми же confirmation диалогами

**Создать Svelte store для хабитов:**
```typescript
// src/lib/stores/habitsStore.ts
import { writable } from 'svelte/store'
import { getDb } from '$lib/storage/db'
import { browser } from '$app/environment'

function createHabitsStore() {
  const { subscribe, set, update } = writable<Habit[]>([])
  
  return {
    subscribe,
    
    async load() {
      if (!browser) return
      const db = getDb()
      const habits = await db.habits.toArray()
      set(habits)
    },
    
    async add(habit: Omit<Habit, 'id'>) {
      const db = getDb()
      const id = await db.habits.add({
        ...habit,
        id: crypto.randomUUID(),
        syncStatus: 'pending'
      })
      update(habits => [...habits, { ...habit, id }])
      await db.outbox.add({ operation: 'create', entity: 'habit', payload: habit })
    },
    
    // Перенести ВСЕ операции из React hooks (useHabits, useHabitActions и т.д.)
    // Включая оптимистичные обновления если они есть
  }
}

export const habitsStore = createHabitsStore()
```

```svelte
<!-- src/routes/(protected)/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { habitsStore } from '$lib/stores/habitsStore'
  import HabitCard from '$lib/components/HabitCard.svelte'
  import AppLayout from '$lib/components/AppLayout.svelte'
  
  onMount(async () => {
    await habitsStore.load()
  })
</script>

<AppLayout title="Дашборд">
  {#each $habitsStore as habit (habit.id)}
    <HabitCard {habit} />
  {:else}
    <p>Нет привычек. Создайте первую!</p>
  {/each}
</AppLayout>
```

**Критерий готовности:** дашборд визуально и функционально идентичен React версии во всех состояниях

---

### Задача 4.3 — HabitDetail страница (динамический маршрут)

```
Приоритет: P2 | Зависит от: 4.2
Сложность: средняя
```

**Обязательно перенести:**
- **Все секции страницы** (информация о привычке, история, статистика и т.д.)
- **Все действия** (редактировать, удалить, отметить и т.д.)
- **Confirmation диалог** при удалении (тот же текст)
- **Loading state** пока данные загружаются
- **404 состояние** если привычка не найдена (тот же текст и кнопка "назад")
- **Навигацию** (breadcrumbs или кнопка назад)
- **Историю выполнения** (календарь или список — перенести точно)

```svelte
<!-- src/routes/(protected)/habit/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { getDb } from '$lib/storage/db'
  import type { Habit } from '$lib/types'
  
  let habit: Habit | null = null
  let loading = true
  
  $: habitId = $page.params.id
  
  onMount(async () => {
    const db = getDb()
    habit = await db.habits.get(habitId) ?? null
    loading = false
  })
</script>

{#if loading}
  <!-- loading state из React версии -->
{:else if habit}
  <!-- все секции из React версии -->
{:else}
  <!-- 404 state из React версии -->
{/if}
```

**Критерий готовности:** страница полностью воспроизводит React версию включая все секции и состояния

---

### Задача 4.4 — AddEditHabit страница

```
Приоритет: P2 | Зависит от: 3.3, 4.3
Сложность: средняя
```

**Обязательно перенести:**
- **Заголовок страницы** (разный для создания и редактирования)
- **Breadcrumbs или навигация** наверху
- **Loading state** при загрузке существующего хабита для редактирования
- **404 если хабит не найден** при редактировании
- **Поведение Cancel** (редирект на detail или dashboard — тот же что в React)
- **Поведение Submit** (оптимистичный апдейт + outbox + редирект)
- **Loading состояние кнопки Submit** во время сохранения
- **Сообщения об ошибке** при неудачном сохранении

```svelte
<!-- src/routes/(protected)/habit/new/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation'
  import HabitForm from '$lib/components/HabitForm.svelte'
  import { habitsStore } from '$lib/stores/habitsStore'
  
  async function handleSubmit(event: CustomEvent<HabitDTO>) {
    await habitsStore.add(event.detail)
    goto('/dashboard')
  }
</script>

<HabitForm
  on:submit={handleSubmit}
  on:cancel={() => goto('/dashboard')}
/>
```

**Критерий готовности:** создание и редактирование работают идентично React версии; UX flow не изменён

---

### Задача 4.5 — Stats страница

```
Приоритет: P2 | Зависит от: 4.2
Сложность: высокая (charts)
```

**Обязательно перенести:**
- **Все виды графиков** (не убирать ни один)
- **Все периоды** (неделя, месяц, год и т.д.)
- **Все метрики** (streak, completion rate, best streak и т.д.)
- **Цветовую схему** графиков (идентичную React версии)
- **Tooltips** на графиках
- **Легенду** графиков
- **Empty state** когда нет данных
- **Loading state**
- **Фильтры по привычкам** если есть

**Правило выбора библиотеки графиков:**
```
Использовать нативную Svelte библиотеку (layerchart или svelte-chartjs).
Оборачивать recharts или любые другие React библиотеки ЗАПРЕЩЕНО.

Требования к результату:
- Те же типы графиков что в React версии (bar, line, pie и т.д.)
- Те же цвета и цветовая схема
- Те же метрики и данные
- Те же tooltips (содержание, не обязательно точный стиль)
- Те же периоды фильтрации
- Допускается незначительное визуальное отличие в деталях рендеринга
  при условии что весь функционал полностью сохранён
```

- Настроить `manualChunks` в `vite.config.ts` для chart-библиотеки:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'charts': ['layerchart', 'd3'],
        'dexie': ['dexie'],
      }
    }
  }
}
```

**Критерий готовности:** все графики и метрики из React версии присутствуют; данные агрегируются идентично; ни один тип графика не пропущен

---

## ФАЗА 5: Финализация и оптимизация (P3)

### Задача 5.1 — Тема (useTheme → themeStore)

```
Приоритет: P3 | Сложность: низкая
```

**Обязательно перенести:**
- Все поддерживаемые темы (light, dark, system — перенести полный список)
- Логику определения системной темы если есть
- Хранение предпочтения пользователя
- Применение темы (CSS переменные, data-theme атрибут — тот же механизм)
- Переключатель темы в UI (его расположение и вид)

```typescript
// src/lib/stores/themeStore.ts
import { writable } from 'svelte/store'
import { browser } from '$app/environment'

type Theme = 'light' | 'dark'

function createThemeStore() {
  const initial: Theme = browser
    ? (localStorage.getItem('theme') as Theme ?? 'light')
    : 'light'
    
  const { subscribe, set } = writable<Theme>(initial)
  
  return {
    subscribe,
    toggle() {
      set(current => {
        const next = current === 'light' ? 'dark' : 'light'
        if (browser) localStorage.setItem('theme', next)
        return next
      })
    }
    // Перенести все методы из useTheme.ts
  }
}

export const themeStore = createThemeStore()
```

**Критерий готовности:** переключение темы работает идентично React версии

---

### Задача 5.2 — Настройка manualChunks и оптимизация бандла

```
Приоритет: P3 | Сложность: низкая
```

**Воспроизвести из старого vite.config.ts:**

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'dexie': ['dexie'],
        'charts': ['layerchart'],
        'shared': ['@habbit-runner/shared'],
      }
    }
  }
}
```

**Цель:** итоговый размер бандла не должен значительно превышать React версию

---

### Задача 5.3 — Error границы и +error.svelte

```
Приоритет: P3 | Сложность: низкая
```

**Обязательно перенести:**
- Точный текст сообщений об ошибках из React ErrorBoundary
- Кнопку "Попробовать снова" если есть
- Кнопку "На главную"
- Репортинг ошибок (Sentry или аналог) если настроен в React версии — подключить нативный Sentry SDK для Svelte

```svelte
<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/stores'
</script>

<div class="error-page">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message}</p>
  <a href="/dashboard">На главную</a>
  <!-- все элементы из React ErrorBoundary -->
</div>
```

- Создать `src/routes/(protected)/+error.svelte` для ошибок в защищённых роутах

---

### Задача 5.4 — Написание тестов для критических путей

```
Приоритет: P3 | Зависит от: все предыдущие задачи
Сложность: средняя
```

**Тесты по приоритету:**

| Тест | Файл | Приоритет |
|---|---|---|
| sessionStore — login/logout | `session.test.ts` | высокий |
| habitsStore — CRUD операции | `habitsStore.test.ts` | высокий |
| syncEngine — outbox flush | `syncEngine.test.ts` | высокий |
| OAuth callback — success и error сценарии | `callback.test.ts` | высокий |
| AuthGate — редирект | `AuthGate.test.ts` | средний |
| HabitForm — валидация всех полей | `HabitForm.test.ts` | средний |
| Dashboard — все состояния (loading/empty/list/error) | `dashboard.test.ts` | средний |
| Stats — рендер всех типов графиков | `stats.test.ts` | средний |

---

### Задача 5.5 — QA: Сравнение React и Svelte версий

```
Приоритет: P3 | Зависит от: 5.4
Сложность: средняя
ОБЯЗАТЕЛЬНА перед удалением React версии
```

**Что сделать:**
- Запустить обе версии параллельно (React на одном порту, Svelte на другом)
- Пройти каждый сценарий в обеих версиях и сравнить:

| Сценарий | React | Svelte | Статус |
|---|---|---|---|
| Регистрация/Логин | ✓ | ? | |
| OAuth callback success | ✓ | ? | |
| OAuth callback error | ✓ | ? | |
| Создание привычки (все поля) | ✓ | ? | |
| Валидация формы (все ошибки) | ✓ | ? | |
| Редактирование привычки | ✓ | ? | |
| Удаление привычки (с confirm) | ✓ | ? | |
| Отметка выполнения | ✓ | ? | |
| Dashboard фильтры/сортировка | ✓ | ? | |
| Dashboard empty state | ✓ | ? | |
| Dashboard loading state | ✓ | ? | |
| HabitDetail все секции | ✓ | ? | |
| Stats все графики | ✓ | ? | |
| Stats все периоды | ✓ | ? | |
| Stats все метрики | ✓ | ? | |
| Offline режим | ✓ | ? | |
| Синхронизация после offline | ✓ | ? | |
| PWA установка | ✓ | ? | |
| Смена темы | ✓ | ? | |
| Мобильный вид | ✓ | ? | |
| 404 страница | ✓ | ? | |
| Error boundary | ✓ | ? | |

**Критерий:** все строки таблицы имеют статус ✓ в колонке Svelte

---

### Задача 5.6 — Удаление старого React приложения

```
Приоритет: P3 | Зависит от: 5.5 (QA пройден полностью)
Сложность: низкая
ВНИМАНИЕ: необратимое действие
```

**Checklist перед удалением:**
- [ ] QA таблица из 5.5 полностью заполнена статусом ✓
- [ ] Все маршруты доступны в SvelteKit версии
- [ ] Offline режим работает (SW зарегистрирован)
- [ ] Sync pull/push работает с реальным бэкендом
- [ ] OAuth flow работает end-to-end
- [ ] Тесты зелёные
- [ ] Проверено на мобильном (PWA install)
- [ ] Проверена тема (light/dark)
- [ ] Проверены все поля форм и валидации
- [ ] Проверены все типы графиков на Stats странице

---

## Сводная таблица задач

| ID | Задача | Приоритет | Зависит от | Сложность |
|---|---|---|---|---|
| 0.1 | Инициализация SvelteKit проекта | P0 | — | средняя |
| 0.2 | TypeScript + shared types | P0 | 0.1 | низкая |
| 0.3 | Tailwind CSS + PostCSS (полный перенос стилей) | P0 | 0.1 | низкая |
| 0.4 | PWA + Service Worker (полный перенос конфига) | P0 | 0.1 | средняя |
| 0.5 | Vitest для Svelte | P0 | 0.1 | низкая |
| 1.1 | Перенос Dexie / db.ts (схема без изменений) | P1 | 0.2 | средняя |
| 1.2 | Перенос Auth (все методы session + oauth) | P1 | 0.2 | средняя |
| 1.3 | Перенос Sync Engine (все состояния) | P1 | 1.1, 1.2 | высокая |
| 1.4 | initSync (все side-эффекты из useSyncEngine) | P1 | 1.3 | низкая |
| 2.1 | Маппинг всех маршрутов | P1 | 0.1 | низкая |
| 2.2 | Корневой Layout (все провайдеры) | P1 | 1.2, 1.4 | средняя |
| 2.3 | AuthGate (полная логика) | P1 | 1.2, 2.2 | низкая |
| 3.1 | AppLayout + SidebarNav (все состояния) | P2 | 2.2 | средняя |
| 3.2 | SyncStatus (все состояния, точные тексты) | P2 | 1.3, 3.1 | низкая |
| 3.3 | HabitForm (все поля, все валидации) | P2 | 1.1, 3.1 | высокая |
| 4.1 | Login + OAuth callback (все состояния) | P2 | 1.2 | низкая |
| 4.2 | Dashboard (все фильтры, все состояния) | P2 | 1.1, 3.1 | средняя |
| 4.3 | HabitDetail (все секции, все действия) | P2 | 4.2 | средняя |
| 4.4 | AddEditHabit (все состояния, UX flow) | P2 | 3.3, 4.3 | средняя |
| 4.5 | Stats (все графики, все метрики, нативная Svelte библиотека) | P2 | 4.2 | высокая |
| 5.1 | themeStore (все темы, тот же механизм) | P3 | 2.2 | низкая |
| 5.2 | manualChunks оптимизация | P3 | 4.5 | низкая |
| 5.3 | Error boundaries (точные тексты, репортинг) | P3 | 2.1 | низкая |
| 5.4 | Тесты критических путей | P3 | все | средняя |
| 5.5 | QA: попарное сравнение React и Svelte | P3 | 5.4 | средняя |
| 5.6 | Удаление React приложения | P3 | 5.5 | низкая |

---

## Ключевые риски и решения

```
РИСК 1: SSR + localStorage/IndexedDB
РЕШЕНИЕ: export const ssr = false в +layout.ts
         + browser guard везде где нужен DOM

РИСК 2: React hooks → Svelte lifecycle несовместимы
РЕШЕНИЕ: useEffect(fn, []) → onMount(fn)
         useState → let (реактивная переменная)
         useCallback/useMemo → $: (реактивные выражения)
         useContext → Svelte stores (writable/readable)
         useRef → bind:this или let переменная

РИСК 3: React библиотеки (recharts, react-hook-form, react-spring и др.)
РЕШЕНИЕ: Заменить на нативные Svelte аналоги:
         recharts → layerchart или svelte-chartjs
         react-hook-form → нативный bind:value
         react-spring → svelte/transition и svelte/animate
         Любой react-* пакет → нативный svelte аналог или
         реализация нативными средствами SvelteKit
         ЗАПРЕЩЕНО: импортировать React или оборачивать React компоненты

РИСК 4: Outbox sync может потерять данные при миграции
РЕШЕНИЕ: НЕ трогать структуру IndexedDB — Dexie схема
         остаётся идентичной, данные пользователя сохраняются

РИСК 5: Упрощение при портировании
РЕШЕНИЕ: Обязательный аудит каждого React компонента перед
         началом его реализации в Svelte. Чек-лист всех состояний,
         пропсов, валидаций — документировать перед кодингом.
         Ни один элемент функционала не считается "необязательным"
         без явного согласования.
         Обязательное QA сравнение (задача 5.5) перед удалением
         React версии.
```
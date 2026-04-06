# План задач для ИИ агента: Миграция фронтенда с React на SvelteKit

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
- Скопировать `tailwind.config.js` из старого проекта, обновить `content`:
```javascript
content: ['./src/**/*.{html,svelte,ts}']
// Было: ['./src/**/*.{tsx,ts,html}']
```
- Добавить директивы Tailwind в `app.css`
- Установить `svelte-preprocess` для обработки PostCSS внутри `<style>` блоков

**Критерий готовности:** класс `bg-blue-500` применяется к элементу на тестовой странице

---

### Задача 0.4 — Настройка PWA (vite-plugin-pwa)

```
Приоритет: P0 | Блокирует: offline функционал
Сложность: средняя
```

**Что сделать:**
- Установить `vite-plugin-pwa`
- Перенести конфигурацию PWA из старого `vite.config.ts`
- Адаптировать `sw-custom.ts` для SvelteKit:

```typescript
// sw-custom.ts — изменения минимальны
// workbox-precaching API идентичен
// Изменить: путь к манифесту если изменился
// Добавить: SvelteKit генерирует свой список precache
```

- Настроить регистрацию SW в `src/app.html` или через хук `+layout.ts`

**Риск:** SvelteKit строит файлы в `.svelte-kit/output` — проверить что `globDirectory` в workbox указывает правильно

**Критерий готовности:** SW регистрируется в DevTools, precache список не пустой

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
- Скопировать `db.ts` в `apps/web-svelte/src/lib/storage/db.ts`
- Обернуть инициализацию Dexie в guard для SSR (хотя SPA режим, но на всякий случай):

```typescript
// src/lib/storage/db.ts

import { browser } from '$app/environment'
// browser === true только на клиенте

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
- Сохранить все схемы (Outbox, tombstone, sync_meta) без изменений

**Критерий готовности:** тест — создание записи в Dexie работает в jsdom окружении

---

### Задача 1.2 — Перенос Auth (session.ts + oauth.ts)

```
Приоритет: P1 | Блокирует: sync, все защищённые страницы
Сложность: средняя
Архитектурное решение: остаёмся на localStorage (SPA режим)
```

**Что сделать:**
- Скопировать `session.ts` → `src/lib/auth/session.ts`
- Скопировать `oauth.ts` → `src/lib/auth/oauth.ts`
- Добавить `browser` guard аналогично db.ts:

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
  const { subscribe, set, update } = writable<Session | null>(
    // Инициализация: null (browser guard внутри getSession)
    null
  )
  
  return {
    subscribe,
    init: () => set(getSession()),    // вызывать в onMount
    login: (s: Session) => {
      saveSession(s)
      set(s)
    },
    logout: () => {
      clearSession()
      set(null)
    }
  }
}

export const sessionStore = createSessionStore()
export const isAuthenticated = derived(
  sessionStore,
  ($session) => $session !== null
)
```

**Критерий готовности:** `sessionStore` обновляется при логине, `isAuthenticated` реактивно меняется

---

### Задача 1.3 — Перенос Sync Engine (syncEngine.ts + sync.ts)

```
Приоритет: P1 | Блокирует: работу приложения offline-first
Сложность: высокая
Риск: browser APIs (navigator.onLine, visibilitychange, setInterval)
```

**Что сделать:**
- Скопировать `syncEngine.ts` → `src/lib/sync/syncEngine.ts`
- Скопировать `sync.ts` → `src/lib/sync/sync.ts`
- Все browser-специфичные API обернуть в проверки:

```typescript
// Плохо (сломается при SSR или тестах):
window.addEventListener('visibilitychange', handler)

// Хорошо:
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', handler)
}
```

- Создать Svelte store для статуса синхронизации:

```typescript
// src/lib/sync/syncStatusStore.ts
import { writable } from 'svelte/store'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

export const syncStatus = writable<SyncStatus>('idle')
export const lastSyncTime = writable<Date | null>(null)
export const syncError = writable<string | null>(null)
```

- Обновить `syncEngine.ts` — вместо колбэков React использовать запись в stores

**HTTP адаптеры (`sync.ts`):** изменений не требуют — это чистый fetch, работает без изменений

**Критерий готовности:** вызов `syncEngine.startSync()` в браузере не бросает ошибок, статус обновляется в store

---

### Задача 1.4 — Создание хука инициализации синка (замена useSyncEngine.ts)

```
Приоритет: P1 | Зависит от: 1.2, 1.3
Сложность: низкая
```

**Что сделать:**
- Создать `src/lib/sync/initSync.ts` — функцию для вызова в `onMount` корневого layout:

```typescript
// src/lib/sync/initSync.ts
import { browser } from '$app/environment'
import { syncEngine } from './syncEngine'
import { sessionStore } from '$lib/auth/sessionStore'
import { get } from 'svelte/store'

export function initSyncEngine() {
  if (!browser) return () => {}   // noop для SSR
  
  const session = get(sessionStore)
  if (!session) return () => {}
  
  syncEngine.start()
  
  // Возвращаем cleanup для onDestroy
  return () => syncEngine.stop()
}
```

**Критерий готовности:** синк запускается при монтировании layout и останавливается при размонтировании

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

**Что создать:**
- Все директории и пустые `+page.svelte` файлы (заглушки)
- `src/routes/+layout.svelte` — корневой layout

**Критерий готовности:** навигация между страницами-заглушками работает без ошибок

---

### Задача 2.2 — Корневой Layout (+layout.svelte)

```
Приоритет: P1 | Зависит от: 1.2, 1.3, 1.4
Сложность: средняя
```

**Что сделать:**
- Создать `src/routes/+layout.svelte`:

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

**Критерий готовности:** при загрузке приложения сессия читается из localStorage, sync стартует

---

### Задача 2.3 — AuthGate компонент (замена AuthGate.tsx)

```
Приоритет: P1 | Зависит от: 1.2, 2.2
Сложность: низкая
```

**Что сделать:**
- Создать `src/lib/components/AuthGate.svelte`:

```svelte
<script lang="ts">
  import { isAuthenticated } from '$lib/auth/sessionStore'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    // Реактивная подписка — редирект если не авторизован
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

**Критерий готовности:** неавторизованный пользователь редиректится на `/login`

---

## ФАЗА 3: UI Компоненты (P2)

### Задача 3.1 — AppLayout и SidebarNav

```
Приоритет: P2 | Зависит от: 2.2, 2.3
Сложность: средняя
```

**Миграционный шаблон React → Svelte:**

```
// React (AppLayout.tsx):                    // Svelte (AppLayout.svelte):
interface Props {                            <script lang="ts">
  children: ReactNode                          export let title: string = ''
  title?: string                             </script>
}
export function AppLayout({                  <div class="app-layout">
  children, title                              <SidebarNav />
}: Props) {                                    <main>
  return (                                       <slot />
    <div className="app-layout">             </main>
      <SidebarNav />                         </div>
      <main>{children}</main>
    </div>
  )
}
```

**Ключевые замены:**
- `children` → `<slot />`
- `className` → `class`
- `onClick={handler}` → `on:click={handler}`
- `useState` → `let` (локальное реактивное состояние)
- `props.value` → `export let value`

**Компоненты для миграции (в порядке приоритета):**

| Компонент | Откуда | Куда | Сложность |
|---|---|---|---|
| AppLayout | components/AppLayout.tsx | lib/components/AppLayout.svelte | низкая |
| SidebarNav | components/SidebarNav.tsx | lib/components/SidebarNav.svelte | низкая |
| SyncStatus | components/SyncStatus.tsx | lib/components/SyncStatus.svelte | низкая |
| HabitCard | components/HabitCard.tsx | lib/components/HabitCard.svelte | средняя |
| HabitForm | components/HabitForm.tsx | lib/components/HabitForm.svelte | высокая |

**Критерий готовности:** компонент рендерится, Tailwind стили применяются, события работают

---

### Задача 3.2 — Миграция SyncStatus компонента

```
Приоритет: P2 | Зависит от: 1.3, 3.1
Сложность: низкая
```

**Что сделать:**

```svelte
<!-- src/lib/components/SyncStatus.svelte -->
<script lang="ts">
  import { syncStatus, lastSyncTime } from '$lib/sync/syncStatusStore'
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

**Критерий готовности:** статус меняется реактивно при изменении syncStatus store

---

### Задача 3.3 — HabitForm (самый сложный компонент)

```
Приоритет: P2 | Зависит от: 1.1, 3.1
Сложность: высокая
```

**Ключевые отличия при миграции форм:**

```
// React (useState + onChange):              // Svelte (bind:value):
const [name, setName] = useState('')         let name = ''
<input                                       <input
  value={name}                                 bind:value={name}
  onChange={e => setName(e.target.value)}      class="..."
  className="..."                            />
/>

// React (useCallback submit):               // Svelte (on:submit):
const handleSubmit = useCallback(async      async function handleSubmit(e: Event) {
  (e) => {                                     e.preventDefault()
    e.preventDefault()                         // логика
  }, [deps])                               }
<form onSubmit={handleSubmit}>              <form on:submit={handleSubmit}>
```

**Что сделать:**
- Перенести всю валидационную логику (без изменений — чистый TS)
- Заменить controlled inputs на `bind:value`
- Заменить `onSubmit` callback props на `createEventDispatcher`:

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
  // ... другие поля
  
  function handleSubmit(e: Event) {
    e.preventDefault()
    dispatch('submit', { name, /* ... */ } as HabitDTO)
  }
</script>

<form on:submit={handleSubmit}>
  <input bind:value={name} />
  <button type="submit">Сохранить</button>
  <button type="button" on:click={() => dispatch('cancel')}>
    Отмена
  </button>
</form>
```

**Критерий готовности:** форма создаёт/обновляет запись в Dexie

---

## ФАЗА 4: Страницы (P2)

### Задача 4.1 — Страница Login / OAuth

```
Приоритет: P2 | Зависит от: 1.2
Сложность: низкая
```

**Что сделать:**
- Создать `src/routes/login/+page.svelte`
- Перенести логику из `oauth.ts` без изменений
- Кнопка логина вызывает `initiateOAuthLogin()` из oauth.ts

```svelte
<script lang="ts">
  import { initiateOAuthLogin } from '$lib/auth/oauth'
  import { isAuthenticated } from '$lib/auth/sessionStore'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  
  onMount(() => {
    // Если уже авторизован — редиректим
    return isAuthenticated.subscribe((auth) => {
      if (auth) goto('/dashboard')
    })
  })
</script>

<div class="login-page">
  <button on:click={initiateOAuthLogin} class="btn-google">
    Войти через Google
  </button>
</div>
```

- Создать `src/routes/auth/callback/+page.svelte` для обработки OAuth redirect

**Критерий готовности:** клик по кнопке инициирует OAuth flow, после редиректа сессия сохраняется

---

### Задача 4.2 — Dashboard страница

```
Приоритет: P2 | Зависит от: 1.1, 3.1, 4.1
Сложность: средняя
```

**Что сделать:**
- Создать `src/routes/(protected)/dashboard/+page.svelte`
- Создать **Svelte store** для хабитов (замена `useHabits` hook):

```typescript
// src/lib/stores/habitsStore.ts
import { writable, derived } from 'svelte/store'
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
      // Добавить в outbox
      await db.outbox.add({ operation: 'create', entity: 'habit', payload: habit })
    },
    
    // ... update, delete, complete
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

**Критерий готовности:** список хабитов загружается из Dexie и отображается

---

### Задача 4.3 — HabitDetail страница (динамический маршрут)

```
Приоритет: P2 | Зависит от: 4.2
Сложность: средняя
```

**Что сделать:**
- Создать `src/routes/(protected)/habit/[id]/+page.svelte`
- Получить параметр маршрута через `page` store:

```svelte
<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { getDb } from '$lib/storage/db'
  import type { Habit } from '$lib/types'
  
  let habit: Habit | null = null
  let loading = true
  
  // $page.params.id — реактивный параметр маршрута
  $: habitId = $page.params.id
  
  onMount(async () => {
    const db = getDb()
    habit = await db.habits.get(habitId) ?? null
    loading = false
  })
</script>

{#if loading}
  <p>Загрузка...</p>
{:else if habit}
  <!-- детали хабита -->
{:else}
  <p>Хабит не найден</p>
{/if}
```

**Критерий готовности:** страница корректно загружает данные по ID из URL

---

### Задача 4.4 — AddEditHabit страница

```
Приоритет: P2 | Зависит от: 3.3, 4.3
Сложность: средняя
```

**Что сделать:**
- Создать `src/routes/(protected)/habit/new/+page.svelte`
- Создать `src/routes/(protected)/habit/[id]/edit/+page.svelte`
- Использовать HabitForm компонент с `on:submit` и `on:cancel`

```svelte
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

**Критерий готовности:** создание и редактирование хабита сохраняется в Dexie, пользователь редиректируется

---

### Задача 4.5 — Stats страница

```
Приоритет: P2 | Зависит от: 4.2
Сложность: высокая (charts)
```

**Что сделать:**
- Создать `src/routes/(protected)/stats/+page.svelte`
- Перенести recharts/d3 логику:

```
Вариант A: оставить recharts через svelte-wrap (сложнее)
Вариант B: заменить на chart библиотеку для Svelte:
  - layerchart (рекомендуется, D3-based, Svelte-native)
  - svelte-chartjs
  
Рекомендация: Вариант B — меньше технического долга
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

**Критерий готовности:** графики отображаются, данные из Dexie корректно агрегируются

---

## ФАЗА 5: Финализация и оптимизация (P3)

### Задача 5.1 — Тема (useTheme → themeStore)

```
Приоритет: P3 | Сложность: низкая
```

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
  }
}

export const themeStore = createThemeStore()
```

---

### Задача 5.2 — Настройка manualChunks и оптимизация бандла

```
Приоритет: P3 | Сложность: низкая
```

**Воспроизвести из старого vite.config.ts:**

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'dexie': ['dexie'],
        'charts': ['layerchart'],  // или recharts
        'shared': ['@habbit-runner/shared'],
      }
    }
  }
}
```

---

### Задача 5.3 — Error границы и +error.svelte

```
Приоритет: P3 | Сложность: низкая
```

- Создать `src/routes/+error.svelte` (глобальный обработчик ошибок)
- Создать `src/routes/(protected)/+error.svelte` (ошибки в защищённых роутах)

```svelte
<script>
  import { page } from '$app/stores'
</script>

<div class="error-page">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message}</p>
  <a href="/dashboard">На главную</a>
</div>
```

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
| AuthGate — редирект | `AuthGate.test.ts` | средний |
| HabitForm — валидация | `HabitForm.test.ts` | средний |
| Dashboard — рендер списка | `dashboard.test.ts` | низкий |

---

### Задача 5.5 — Удаление старого React приложения

```
Приоритет: P3 | Зависит от: все тесты зелёные
Сложность: низкая
ВНИМАНИЕ: необратимое действие
```

**Checklist перед удалением:**
- [ ] Все маршруты доступны в SvelteKit версии
- [ ] Offline режим работает (SW зарегистрирован)
- [ ] Sync pull/push работает с реальным бэкендом
- [ ] OAuth flow работает end-to-end
- [ ] Тесты зелёные
- [ ] Проверить на мобильном (PWA install)

---

## Сводная таблица задач

| ID | Задача | Приоритет | Зависит от | Сложность |
|---|---|---|---|---|
| 0.1 | Инициализация SvelteKit проекта | P0 | — | средняя |
| 0.2 | TypeScript + shared types | P0 | 0.1 | низкая |
| 0.3 | Tailwind CSS + PostCSS | P0 | 0.1 | низкая |
| 0.4 | PWA + Service Worker | P0 | 0.1 | средняя |
| 0.5 | Vitest для Svelte | P0 | 0.1 | низкая |
| 1.1 | Перенос Dexie / db.ts | P1 | 0.2 | средняя |
| 1.2 | Перенос Auth (session + store) | P1 | 0.2 | средняя |
| 1.3 | Перенос Sync Engine | P1 | 1.1, 1.2 | высокая |
| 1.4 | initSync (замена useSyncEngine) | P1 | 1.3 | низкая |
| 2.1 | Маппинг маршрутов | P1 | 0.1 | низкая |
| 2.2 | Корневой Layout | P1 | 1.2, 1.4 | средняя |
| 2.3 | AuthGate компонент | P1 | 1.2, 2.2 | низкая |
| 3.1 | AppLayout + SidebarNav | P2 | 2.2 | средняя |
| 3.2 | SyncStatus компонент | P2 | 1.3, 3.1 | низкая |
| 3.3 | HabitForm компонент | P2 | 1.1, 3.1 | высокая |
| 4.1 | Login / OAuth страница | P2 | 1.2 | низкая |
| 4.2 | Dashboard страница | P2 | 1.1, 3.1 | средняя |
| 4.3 | HabitDetail страница | P2 | 4.2 | средняя |
| 4.4 | AddEditHabit страница | P2 | 3.3, 4.3 | средняя |
| 4.5 | Stats страница | P2 | 4.2 | высокая |
| 5.1 | themeStore | P3 | 2.2 | низкая |
| 5.2 | manualChunks оптимизация | P3 | 4.5 | низкая |
| 5.3 | Error boundaries | P3 | 2.1 | низкая |
| 5.4 | Тесты критических путей | P3 | все | средняя |
| 5.5 | Удаление React приложения | P3 | 5.4 | низкая |

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

РИСК 3: recharts не имеет Svelte версии
РЕШЕНИЕ: layerchart или svelte-chartjs

РИСК 4: Outbox sync может потерять данные при миграции
РЕШЕНИЕ: НЕ трогать структуру IndexedDB — Dexie схема
         остаётся идентичной, данные пользователя сохраняются
```
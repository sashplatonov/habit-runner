# ЗАДАЧА

У тебя есть доступ к существующему веб-проекту на **React + Next.js**.  
Твоя цель: **создать отдельный файл с подробным backlog-планом миграции проекта на SvelteKit**, где перенос будет расписан **по каждому текущему файлу и модулю**.

---

# ГЛАВНОЕ ТРЕБОВАНИЕ

Миграция должна быть спланирована так, чтобы:

- **внешний вид UI был сохранен максимально идентично**
- **поведение интерфейса и функционал были сохранены максимально идентично**
- **не было упрощений без явного обоснования**
- **не было “примерной” реализации вместо точной**
- любые отличия должны быть:
    - явно перечислены
    - минимальны
    - технически обоснованы
- **допускается замена UI-элементов только на максимально близкие аналоги в экосистеме Svelte/SvelteKit**
- особенно это касается:
    - charts / graph libraries
    - table/grid libraries
    - date pickers
    - modal/dialog/toast/popover components
    - form libraries
    - drag-and-drop
    - animation libraries

Если точный перенос невозможен 1-в-1 из-за различий React/Next.js и SvelteKit, это нужно:
1. явно указать
2. объяснить причину
3. предложить **наиболее близкий эквивалент**
4. отметить уровень риска для идентичности UI/UX

---

# ЧТО НУЖНО СДЕЛАТЬ

1. Проанализируй текущий проект целиком:
    - структуру папок
    - роутинг
    - layout-слои
    - страницы
    - shared components
    - hooks
    - context/providers
    - stores/state management
    - utils
    - services/api
    - стили
    - assets
    - конфиги
    - middleware
    - SSR/CSR/SSG/ISR особенности
    - auth
    - forms
    - charts
    - data fetching
    - SEO/meta
    - i18n
    - env usage
    - tests

2. Составь **подробный backlog миграции** в отдельном файле.

3. Backlog должен быть **декомпозирован по текущим файлам**, чтобы было понятно:
    - какой файл существует сейчас
    - во что он должен превратиться в SvelteKit
    - какой новый файл/файлы появятся
    - какие есть зависимости
    - какие риски
    - какие критерии готовности

---

# ФОРМАТ РЕЗУЛЬТАТА

Создай файл примерно такого типа:

- `migration-backlog-sveltekit.md`

или, если уместнее по проекту:

- `docs/migration-backlog-sveltekit.md`

---

# ТРЕБОВАНИЯ К СТРУКТУРЕ BACKLOG

В начале файла должны быть разделы:

## 1. Executive Summary
Кратко опиши:
- масштаб миграции
- основные блоки системы
- ключевые сложности
- основные риски потери идентичности UI/UX
- общий подход к миграции

## 2. Migration Principles
Зафиксируй правила миграции:
- UI и UX сохранять максимально идентичными
- не упрощать без необходимости
- не менять пользовательские сценарии
- не менять визуальную иерархию
- не менять spacing/layout/interaction patterns без причины
- accessibility не ухудшать
- производительность не ухудшать без причины
- если библиотека меняется, UX должен остаться максимально тем же

## 3. Library Mapping
Сделай таблицу соответствия:
- текущая библиотека в React/Next.js
- целевая библиотека в SvelteKit
- причина замены
- степень близости к оригиналу
- риск отклонения UI/UX

Например:
- React Query → TanStack Query for Svelte / native load + custom strategy
- Zustand/Redux/Context → Svelte stores
- Next Router → SvelteKit routing
- Next Image → SvelteKit-compatible image strategy
- chart lib → nearest Svelte-compatible analog
- headless UI libs → nearest Svelte equivalents

## 4. Architecture Mapping
Опиши:
- как текущая архитектура React/Next.js маппится на SvelteKit
- как будут перенесены routes/layouts/providers/hooks/state/data-fetching/styles

---

# ОСНОВНАЯ ЧАСТЬ: FILE-BY-FILE BACKLOG

Сделай backlog **по каждому релевантному текущему файлу**.

Для каждого файла используй такой шаблон:

## [ID] <путь к текущему файлу>

**Тип:** page / layout / component / hook / context / util / service / style / config / middleware / test / asset-related  
**Текущая роль:** краткое описание назначения файла  
**Целевой аналог в SvelteKit:** путь и тип нового файла  
**Стратегия миграции:** как именно переносить  
**Зависимости:** от чего зависит этот файл  
**Связанные файлы:** список связанных файлов  
**UI-critical:** yes/no  
**Functionality-critical:** yes/no  
**Риск:** low / medium / high  
**Сложность:** S / M / L / XL  
**Оценка усилий:** в условных единицах или story points  
**Статус:** todo

### Подзадачи
- [ ] Проанализировать текущую реализацию
- [ ] Определить SvelteKit-аналог
- [ ] Перенести markup
- [ ] Перенести styling без визуальных отклонений
- [ ] Перенести state/logic
- [ ] Перенести events/interactions
- [ ] Перенести data fetching
- [ ] Проверить responsive behavior
- [ ] Проверить accessibility
- [ ] Сравнить UI с оригиналом
- [ ] Сравнить поведение с оригиналом
- [ ] Описать известные отличия

### Acceptance Criteria
- UI визуально максимально идентичен оригиналу
- Поведение идентично оригиналу
- Нет необоснованных упрощений
- Все сценарии файла работают
- Нет регрессии в связанных частях

### Notes
- Особые замечания по миграции
- Потенциальные несовместимости
- Что потребует ручной проверки

---

# ОСОБЫЕ ИНСТРУКЦИИ ПО АНАЛИЗУ

При составлении backlog обязательно отдельно выяви и включи:

## Pages / Routes
- Next.js pages/app routes
- dynamic routes
- nested routes
- layouts
- loading/error states
- metadata/SEO handling

## Shared UI Components
- buttons
- inputs
- selects
- dialogs
- dropdowns
- tabs
- cards
- tables
- charts
- navigation
- sidebars
- headers
- footers

## Styling
Определи, что используется:
- CSS Modules
- SCSS
- Tailwind
- styled-components
- emotion
- inline styles
- design tokens
- theme providers

И опиши точную стратегию переноса стилей без визуальной деградации.

## State Management
Выяви и распиши перенос:
- React hooks state
- Context API
- Redux / Zustand / MobX / Recoil / etc.
- server state
- derived state
- memoized logic

## Data Fetching
Отдельно распиши:
- SSR
- SSG
- ISR
- client-side fetching
- React Query/SWR
- loaders/api routes equivalents in SvelteKit

## Forms
Проверь:
- validation
- controlled/uncontrolled inputs
- submission flows
- error states
- async validation

## Auth / Session
Если есть:
- middleware
- protected routes
- session handling
- token refresh
- cookies
- guards

## Charts / Visual Components
Очень важно:
- для графиков и визуализаций найди **максимально похожий аналог**
- опиши, какие визуальные или интерактивные расхождения возможны
- не допускай упрощения визуализации без явного указания

## Animations / Motion
Проверь:
- page transitions
- hover/focus/press effects
- modal animations
- list animations
- chart animations

И зафиксируй, как сохранить максимально близкое поведение.

---

# ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ К BACKLOG

В конце файла обязательно добавь:

## Dependency Waves
Сгруппируй задачи по волнам миграции:
1. foundation/config
2. routing/layout
3. shared UI
4. state/data layer
5. pages/features
6. polish/testing/parity check

## Critical Path
Выдели задачи, которые блокируют остальные.

## High-Risk Items
Список наиболее рискованных мест:
- сложные UI-компоненты
- charts
- SSR/CSR edge cases
- auth/session
- hydration-sensitive logic
- DOM-dependent React code
- portal/modal behavior
- virtualization
- drag-and-drop

## Parity Checklist
Сделай финальный чеклист проверки идентичности:
- visual parity
- interaction parity
- responsive parity
- accessibility parity
- loading/error parity
- state parity
- routing parity
- SEO parity

---

# ВАЖНО

Не ограничивайся общими словами.  
Нужен **реальный рабочий backlog**, пригодный для выполнения командой или ИИ агентом.

Нельзя писать абстрактно в стиле:
- “перенести компоненты”
- “адаптировать страницы”
- “заменить хуки”

Нужно писать **конкретно по файлам и по задачам**.

Если в проекте очень много файлов:
- включи все важные файлы
- мелкие однотипные файлы можно группировать только там, где это действительно безопасно
- но pages, layouts, critical shared components, state, services, styles, charts, forms, auth должны быть расписаны подробно

---

# РЕЖИМ РАБОТЫ

Сначала:
1. исследуй текущий код проекта
2. определи фактическую архитектуру
3. только после этого создай backlog-файл

Не придумывай несуществующую структуру.  
Опирайся только на реально найденные файлы и зависимости в проекте.

Если чего-то не хватает для точного вывода:
- явно помечай это как assumption
- не скрывай неопределенность

---

# ЦЕЛЬ РЕЗУЛЬТАТА

На выходе должен получиться такой backlog, по которому можно:
- пошагово мигрировать проект на SvelteKit
- не потерять текущий UI/UX
- контролировать риски
- проверять эквивалентность реализации
- использовать backlog как основу для дальнейшего execution plan

# ДОПОЛНИТЕЛЬНОЕ СТРОГОЕ ТРЕБОВАНИЕ

Считай, что приоритеты миграции такие:

1. **Максимальная визуальная идентичность**
2. **Максимальная функциональная идентичность**
3. **Минимум отклонений в UX**
4. **Только потом чистота Svelte-реализации**

То есть нельзя жертвовать точностью переноса ради “более идиоматичного Svelte-подхода”, если это меняет поведение, структуру UI или пользовательский опыт.

Если придется выбирать:
- предпочтение отдается **поведению и внешнему виду, максимально близким к оригиналу**,
- а не “красивой” переписанной архитектуре.

Любое отклонение от текущей реализации должно быть явно задокументировано в backlog.
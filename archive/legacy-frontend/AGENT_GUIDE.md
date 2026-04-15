<a name="top"></a>
# Legacy frontend — руководство для ИИ‑агента 🧭

Краткая цель: помочь автоматизированным агентам быстро найти и понять ключевые файлы старого React‑фронтенда, находящегося в архиве, чтобы ускорить исследования, восстановление или миграцию.

<a name="table-of-contents"></a>
## Содержание
- [Обзор](#overview)
- [Карта файлов (быстрый справочник)](#file-map)
- [Точки входа и маршруты](#entrypoints)
- [Как восстановить файл в рабочую копию](#how-to-restore)
- [Типовые задачи для агента](#common-tasks)
- [Внесённые комментарии в код](#inline-comments)
- [Как быстро искать в репозитории](#how-to-search)
- [Предположения и режимы отказа](#assumptions-failures)
- [Контакты / следующий шаг](#contact)

[↑ Back to top](#top)

<a name="overview"></a>
## Обзор 📝
- Папка: `archive/legacy-frontend` — заархивированный старый React фронтенд (перенесён из `apps/web`).
- Назначение этого файла: краткий машинно‑дружественный справочник с якорями и командами, чтобы агент мог быстро перейти к нужному файлу или задаче.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="file-map"></a>
## Карта файлов — быстрый справочник ✅
Ниже — ключевые места и краткие описания. Используй эти пути как отправные точки.

- `archive/legacy-frontend/README.md` — общий мета‑README об архиве.
- `archive/legacy-frontend/apps/web/src/index.tsx` — старый entrypoint (рендер `App` в `#root`).
- `archive/legacy-frontend/apps/web/src/App.tsx` — основной shell приложения; здесь объявлены маршруты `<Routes>`.
- `archive/legacy-frontend/apps/web/src/pages/` — page‑компоненты: `Dashboard.tsx`, `AddEditHabit.tsx`, `HabitDetail.tsx`, `Stats.tsx`.
- `archive/legacy-frontend/apps/web/src/components/` — UI‑блоки (например, `AppLayout.tsx`, `PullToRefresh.tsx`, `PublicLanding.tsx`, `ErrorBoundary.tsx`).
- `archive/legacy-frontend/apps/web/src/lib/` — вспомогательные модули: `router.tsx`, `undo.tsx`, `dashboard/`.
- `archive/legacy-frontend/apps/web/tests/` — unit‑тесты, полезны для понимания контрактов и ожиданий компонентов.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="entrypoints"></a>
## Точки входа и маршруты 🧭
- `index.tsx` — импортирует глобальные стили и запускает `createRoot(...).render(<App />)`.
- `App.tsx` — содержит обёртки провайдеров (UndoProvider, ErrorBoundary), и объявление маршрутов внутри `<Routes>`:
  - Основные маршруты: `/`, `/habit/new`, `/habit/:id`, `/stats`, `/auth/callback`.
  - Хуки интереса: `useSyncEngine`, `useTheme`, функции работы с сессией в `src/lib/auth/session`.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="how-to-restore"></a>
## Как восстановить файл в рабочую копию 🛠️
Пример — перенести один файл обратно в `apps/web`:

```bash
git mv archive/legacy-frontend/apps/web/src/pages/Dashboard.tsx apps/web/src/pages/Dashboard.tsx
git commit -m "restore(legacy): restore Dashboard from archive"
```

Если нужно восстановить много файлов, сделай ветку, применяй `git mv` по частям и тестируй сборку/линт:

```bash
git checkout -b restore/legacy-frontend
# затем mv по каталогам и локальная проверка
cd apps/web && npm install && npm run build
```

Отмена восстановления: либо `git reset --hard HEAD~1` если это локальный коммит, либо `git revert <commit>`.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="common-tasks"></a>
## Типовые задачи для агента — где смотреть и что открыть 🔎
- Найти определение маршрута: открыть `App.tsx` и найти `<Route path=...>` блок.
- Понять, как работает синхронизация: искать `useSyncEngine` в `src/`.
- Найти авторизацию/сессии: `src/lib/auth/session` (функции `ensureAuthSession`, `readAuthSession`).
- Найти UI‑блок, который нужно изменить: `src/components/*`.
- Тесты базы знаний: читаем `archive/legacy-frontend/apps/web/tests` — они показывают ожидаемое поведение.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="inline-comments"></a>
## Внесённые комментарии в код 📝
Я добавил небольшие ориентиры‑комментарии в ключевые файлы, чтобы агент видел сразу назначение файла:

- `archive/legacy-frontend/apps/web/src/index.tsx` — пометка: "Legacy React entrypoint".
- `archive/legacy-frontend/apps/web/src/App.tsx` — пометка: "Legacy app shell / routes".

Эти комментарии — ненавязчивые подсказки, которые помогают агенту быстро понять контекст.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="how-to-search"></a>
## Как быстро искать в репозитории ⚡
Рекомендуемые команды (используй в корне репозитория):

```bash
# найти объявления маршрутов
rg "<Route path=|Route path=" archive/legacy-frontend -n

# найти обращения к ключевым хукам/сессии
rg "useSyncEngine|ensureAuthSession|readAuthSession" archive/legacy-frontend -n

# найти файлы-компоненты по имени
rg "export (default )?function|const [A-Z]" archive/legacy-frontend -n
```

Если `rg` (ripgrep) недоступен, используй `grep -R "pattern" archive/legacy-frontend`.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="assumptions-failures"></a>
## Предположения, режимы отказа и откат ⚠️
- Предполагается, что `archive/legacy-frontend` — архив: файлы не используются в текущей сборке.
- Если агент восстановит файлы в `apps/web`, нужно запускать сборку и тесты (`cd apps/web && npm install && npm run build`) — возможны конфликты с текущим Svelte‑кодом.
- Откат: избегай `git push --force`. Лучше вернуть изменения через `git revert` или отдельную ветку с `git reset` локально.

[↩ Back to toc](#table-of-contents) • [↑ Back to top](#top)

<a name="contact"></a>
## Контакты / следующий шаг ✅
- Если нужно — могу пометить дополнительные файлы комментариями (укажи список файлов).
- Предлагаю как следующий шаг: разреши аннотировать ещё 2–3 файла (например, `router.tsx`, `src/lib/auth/session.ts`) — это ускорит автоматический анализ.

[↑ Back to top](#top)

***
_Сгенерировано автоматически: краткий справочник для агентов — минимум текста, максимум якорей и репозитарных команд._

<a name="top"></a>

# 🧭 Backlog модернизации фронтенд-стека

## 📋 Table of Contents

- [Контекст и целевые версии](#context)
- [Архитектурные решения](#decisions)
- [Backlog задач](#backlog)
- [Общие правила выполнения](#rules)
- [Источники](#sources)

---

## 🎯 Контекст и целевые версии <a name="context"></a>

Документ фиксирует план перевода `apps/web` на современные мажорные версии фронтенд-инструментов без "массового обновления всего сразу". Очерёдность выбрана так, чтобы сначала стабилизировать runtime и совместимость инструментов, а затем переносить конфиги и исходники.

Проверено 2026-07-08 по текущему checkout и npm registry:

| Инструмент | Текущее состояние в репозитории | Целевой коридор |
|---|---|---|
| Vite | `vite@^6.4.3` | `vite@^8` |
| Svelte | `svelte@^5.56.4` | оставить `Svelte 5`, обновить до актуального совместимого набора |
| SvelteKit | `@sveltejs/kit@^2.69.2` | оставить `SvelteKit 2`, синхронизировать с целевым Vite |
| vite-plugin-svelte | `@sveltejs/vite-plugin-svelte@^5.1.1` | `^7` после проверки совместимости |
| Tailwind CSS | `tailwindcss@3.4.17` | `tailwindcss@^4` |
| ESLint | `eslint@^9.39.4` | `eslint@^10` только после проверки экосистемной совместимости |
| TypeScript | `typescript@^5.9.3` | `typescript@^6` только после совместимости `svelte-check` и Svelte toolchain |

Критичный вывод по текущему состоянию:
- Связка `Svelte 5` и `SvelteKit 2` уже на актуальном мажоре, поэтому здесь нужен не "replatform", а совместимое доведение toolchain до нового `Vite`.
- Наибольший объём миграции кода ожидается в `Tailwind 3 -> 4`, потому что проект использует JS-конфиг, кастомный PostCSS bridge и CSS-переменные в `apps/web/src/index.css`.
- `ESLint 10` и `TypeScript 6` надо вводить отдельной волной после подтверждения поддержки со стороны `@typescript-eslint`, `eslint-plugin-svelte`, `svelte-check` и `@sveltejs/vite-plugin-svelte`.

[↑ Back to top](#top)

---

## 🏗️ Архитектурные решения <a name="decisions"></a>

### ADR-FE-01. Мигрировать по волнам совместимости, а не одним коммитом

Решение:
- Разбить работу на 5 волн: runtime baseline, Vite/Svelte toolchain, Tailwind 4, ESLint 10, TypeScript 6.

Почему:
- `Vite 8`, `Tailwind 4`, `ESLint 10` и `TypeScript 6` меняют разные слои: bundler, CSS pipeline, lint runtime, типизацию и IDE/tooling.
- Единый big bang upgrade затруднит локализацию regressions в `npm run check`, `vite build` и `svelte-check`.

Последствие:
- Каждая волна должна завершаться зелёным `cd apps/web && npm run check`.

### ADR-FE-02. SvelteKit остаётся системной границей фронтенда

Решение:
- Не выносить маршрутизацию и build orchestration за пределы `SvelteKit`.
- Все изменения Vite и Svelte проводить вокруг существующих файлов `apps/web/svelte.config.js`, `apps/web/vite.config.ts`, `apps/web/src/routes/**` и `.svelte-kit`-generated tsconfig.

Почему:
- Текущий фронтенд уже использует `SvelteKit`, PWA, static adapter и route-based структуру.
- Основной риск лежит не в framework choice, а в совместимости плагинов и generated config.

Последствие:
- Любая миграция, требующая обхода SvelteKit conventions, считается smell и должна быть отдельно обоснована.

### ADR-FE-03. Tailwind 4 внедрять через CSS-first токены

Решение:
- Переносить тему и дизайн-токены из `apps/web/tailwind.config.js` в CSS-first слой поверх `apps/web/src/index.css`.
- Сохранять существующие CSS custom properties как первичный контракт темы.

Почему:
- Tailwind 4 уходит от старой схемы с `@tailwind base/components/utilities` и смещает конфигурацию в CSS.
- В проекте уже есть богатый набор токенов `--bg-*`, `--text-*`, `--accent*`, которые лучше оставить source of truth.

Последствие:
- Цель не в полном отказе от utility-классов, а в сокращении JS-конфигурации и упрощении PostCSS chain.

### ADR-FE-04. ESLint 10 и TypeScript 6 внедрять только после gate совместимости

Решение:
- Не обновлять `eslint` до `10.x` и `typescript` до `6.x`, пока локально не подтверждена совместимость:
  - `@typescript-eslint/eslint-plugin`
  - `@typescript-eslint/parser`
  - `eslint-plugin-svelte`
  - `svelte-check`
  - `@sveltejs/vite-plugin-svelte`

Почему:
- Эти пакеты формируют единый frontend quality gate.
- Формально "последняя версия" без поддержки всей цепочки даст ложный прогресс и нестабильный `npm run check`.

Последствие:
- Для `ESLint 10` и `TypeScript 6` допустим промежуточный backlog-статус `blocked by ecosystem compatibility`.

### ADR-FE-05. Не использовать suppressions как способ пройти миграцию

Решение:
- Не добавлять `ignoreDeprecations`, `eslint-disable`, смягчение `strict`, выключение правил или исключения файлов как постоянный обход миграционных ошибок.

Почему:
- Такой подход скрывает несовместимость и переносит долг в IDE и CI.
- В этом репозитории уже зафиксировано требование не маскировать quality issues suppressions.

Последствие:
- Любой временный обход должен быть либо удалён в той же задаче, либо оформлен как отдельный backlog risk.

[↑ Back to top](#top)

---

## 🧩 Backlog задач <a name="backlog"></a>

### ✅ FE-UPG-001. Подготовить runtime baseline для современных мажоров

Приоритет: `P0`

Цель:
- Зафиксировать минимальную поддерживаемую версию Node.js для нового toolchain и выровнять локальные/CI команды вокруг неё.

Файлы:
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `.github/workflows/quality.yml`
- `docs/setup/getting-started.md`
- `docs/project/frontend-major-upgrade-backlog.md`

Архитектурное решение:
- `Vite 7+` требует современный Node runtime; baseline должен быть поднят до версии, совместимой с целевым `Vite 8`.

Что сделать:
- Добавить явный runtime contract для Node.js в `apps/web/package.json` и CI.
- Проверить, нет ли локальных helper-скриптов и workflow, завязанных на старое поведение Node/CJS.
- Синхронизировать инструкции запуска и проверки в документации.

Критерии проверки:
- `node -v` соответствует целевому baseline на локальной машине и в CI.
- `cd apps/web && npm install`
- `cd apps/web && npm run check`

### ✅ FE-UPG-002. Перевести Vite toolchain на `vite@^8`

Приоритет: `P0`

Цель:
- Обновить bundler и dev/build pipeline без регресса в PWA, proxy и custom build plugin.

Файлы:
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `apps/web/vite.config.ts`
- `apps/web/vitest.config.ts`
- `apps/web/svelte.config.js`
- `apps/web/src/lib/api/devProxy.ts`
- `apps/web/src/sw-custom.ts`

Архитектурное решение:
- Переход выполнять после runtime baseline и до Tailwind/TS cleanup, чтобы отделить build-system regressions от типовых и CSS regressions.

Что сделать:
- Обновить `vite` и совместимые с ним плагины.
- Проверить кастомный плагин `prepareInjectManifestServiceWorker` на deprecated/changed Vite hook API.
- Проверить `define`, `build.rollupOptions`, SSR/client ветвление и поведение PWA plugin на целевом Vite.
- При необходимости адаптировать логику, если плагины ожидают старый `options.ssr` или Rollup-specific метаданные.

Критерии проверки:
- `cd apps/web && npm run sync:svelte`
- `cd apps/web && npm run build`
- `cd apps/web && npm run test`
- `cd apps/web && npm run check`

### ✅ FE-UPG-003. Довести связку Svelte 5 / SvelteKit 2 / vite-plugin-svelte до актуального совместимого состояния

Приоритет: `P0`

Цель:
- Синхронизировать framework layer с целевым Vite без частичного расхождения версий внутри Svelte toolchain.

Файлы:
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `apps/web/svelte.config.js`
- `apps/web/tsconfig.json`
- `apps/web/tsconfig.base.json`
- `apps/web/tsconfig.node.json`
- `apps/web/src/routes/**/*.svelte`
- `apps/web/src/lib/components/**/*.svelte`

Архитектурное решение:
- Так как `Svelte 5` уже внедрён, задача фокусируется на совместимости и cleanup, а не на повторной миграции синтаксиса "ради новой версии".

Что сделать:
- Обновить `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte` и связанные пакеты до набора, совместимого с `vite@^8`.
- Проверить `vitePreprocess()`, static adapter, service worker wiring и generated `.svelte-kit/tsconfig.json` assumptions.
- Перепроверить компоненты и страницы, где используются `$props()`, `$derived`, typed navigation и новые Svelte 5 patterns.
- Не восстанавливать `ignoreDeprecations`; исправлять реальные предупреждения в коде и tsconfig.

Критерии проверки:
- `cd apps/web && npm run check:types`
- `cd apps/web && npm run build`
- `cd apps/web && npm run check`

### ✅ FE-UPG-004. Перевести Tailwind pipeline с `3.x` на `4.x`

Приоритет: `P1`

Цель:
- Упростить CSS pipeline и убрать legacy-слой совместимости вокруг Tailwind 3.

Файлы:
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `apps/web/tailwind.config.js`
- `apps/web/postcss.config.js`
- `apps/web/postcss/plugins/tailwind-postcss.mjs`
- `apps/web/src/index.css`
- `apps/web/src/lib/components/**/*.svelte`
- `apps/web/src/routes/**/*.svelte`

Архитектурное решение:
- Сначала перенести источники темы в CSS-first contract, затем только убирать JS-конфиг и кастомный PostCSS bridge.

Что сделать:
- Заменить старые `@tailwind` directives в `apps/web/src/index.css` на v4-compatible import/config pattern.
- Убрать самописный compatibility-плагин `apps/web/postcss/plugins/tailwind-postcss.mjs`, если целевой plugin chain больше его не требует.
- Перенести расширения темы из `tailwind.config.js` в CSS tokens или в минимально необходимую конфигурацию v4.
- Проверить компоненты на классы и utility combinations, которые могли измениться или перестать генерироваться.

Критерии проверки:
- `cd apps/web && npm run build`
- `cd apps/web && npm run check`
- Ручная проверка публичных страниц и защищённых экранов:
  - `src/routes/+page.svelte`
  - `src/routes/app/(protected)/dashboard/+page.svelte`
  - `src/routes/app/(protected)/stats/+page.svelte`

### ✅ FE-UPG-005. Подготовить конфиг и кодовую базу к `ESLint 10`

Приоритет: `P1`

Цель:
- Перевести quality gate на современный major ESLint без регресса правил для `.ts` и `.svelte`.

Файлы:
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `apps/web/eslint.config.cjs`
- `apps/web/packages/shared/eslint.config.cjs`
- `apps/web/src/**/*.ts`
- `apps/web/src/**/*.svelte`
- `apps/web/tests/**/*.ts`

Архитектурное решение:
- Сначала зафиксировать flat config и plugin compatibility, только потом поднимать major `eslint`.

Что сделать:
- Проверить поддержку `eslint@10` со стороны `@typescript-eslint` и `eslint-plugin-svelte`.
- Убедиться, что проект не зависит от устаревшего `eslintrc`-поведения или старых API.
- Пересмотреть локальные overrides и parser options на предмет новых требований ESLint 10.
- При необходимости вынести общие части flat config в переиспользуемый factory между `apps/web` и `apps/web/packages/shared`.

Критерии проверки:
- `cd apps/web && npm run lint`
- `cd apps/web/packages/shared && npm run lint`
- `cd apps/web && npm run check`

### ✅ FE-UPG-006. Перевести TypeScript toolchain на `6.x`

Приоритет: `P1`

Цель:
- Поднять compiler/tooling до актуального major без деградации `svelte-check`, workspace build и shared package types.

Файлы:
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `apps/web/tsconfig.json`
- `apps/web/tsconfig.base.json`
- `apps/web/tsconfig.node.json`
- `apps/web/tsconfig.test.json`
- `apps/web/packages/shared/package.json`
- `apps/web/packages/shared/tsconfig.json`
- `apps/web/packages/shared/src/**/*.ts`
- `apps/web/src/**/*.ts`
- `apps/web/src/**/*.svelte`

Архитектурное решение:
- Миграцию TypeScript выполнять после стабилизации Vite/Svelte, потому что большая часть ошибок проявится как типовые и generated-types regressions.

Что сделать:
- Обновить `typescript`, `@types/node`, `svelte-check` и связанные инструменты до совместимого набора.
- Проверить все tsconfig на deprecated/removed options.
- Перепроверить `moduleResolution: "bundler"` и generated SvelteKit tsconfig assumptions после обновления.
- Убрать legacy-обходы и привести shared package к тем же правилам, что и основное приложение.

Критерии проверки:
- `cd apps/web && npm run check:types`
- `cd apps/web && npm run build -w @habbit-runner/shared`
- `cd apps/web && npm run check`

### ✅ FE-UPG-007. Провести прикладную миграцию компонентного кода после обновления toolchain

Приоритет: `P2`

Цель:
- Закрыть исходниковые regressions, которые проявятся только после реального обновления major-версий.

Файлы:
- `apps/web/src/lib/components/**/*.svelte`
- `apps/web/src/lib/**/*.ts`
- `apps/web/src/routes/**/*.svelte`
- `apps/web/tests/unit/**/*.ts`

Архитектурное решение:
- Кодовый cleanup не должен смешиваться с инфраструктурным upgrade, но должен идти сразу после каждой волны, где появились новые ошибки.

Что сделать:
- Исправить несовместимости в typed navigation, props typing, derived state и Svelte 5 idioms.
- Перепроверить публичные маркетинговые страницы, stats screens и формы привычек, потому что они уже были источником `svelte-check` ошибок.
- Добавить или актуализировать unit tests там, где миграция затрагивает ветвления и форматирование данных.

Критерии проверки:
- `cd apps/web && npm run test`
- `cd apps/web && npm run check`
- Ручная smoke-проверка сценариев:
  - создание привычки;
  - dashboard reorder/filters;
  - stats tabs and filters;
  - публичные landing pages.

[↑ Back to top](#top)

---

## ✅ Общие правила выполнения <a name="rules"></a>

- Не отмечать задачи как завершённые, пока не пройдён релевантный verification gate.
- После каждой волны обновлять этот backlog фактическим статусом, а не ожиданием.
- Любой blocker уровня ecosystem compatibility фиксировать прямо в строке задачи, а не обходить suppressions.
- Если обновление одного major тянет за собой изменение CI/runtime contract, сначала менять baseline, затем код.

[↑ Back to top](#top)

---

## 🔎 Источники <a name="sources"></a>

- Context7: SvelteKit docs, разделы про generated tsconfig, service worker и migration to SvelteKit 2.
- Context7: Vite 8 docs и changelog, включая Node runtime requirements, ESM-only distribution и plugin migration notes.
- Context7: Tailwind CSS upgrade guide для перехода `v3 -> v4`, включая `@import "tailwindcss"` и CSS-first theme configuration.
- Официальные документы ESLint:
  - `https://eslint.org/docs/latest/use/migrate-to-10.0.0`
  - `https://eslint.org/docs/latest/use/configure/migration-guide`
- Официальные release notes TypeScript:
  - `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html`

[↑ Back to top](#top)

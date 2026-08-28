# Компактная аналитика во вкладке Progress — исполнимый бэклог

## Цель

Переработать вкладку Progress в компактный тёмный экран аналитики привычек. За несколько секунд пользователь должен видеть текущее выполнение выбранного периода, ухудшающиеся и сильные привычки, а также отличать краткосрочную проблему от паттерна последних 12 недель.

## Архитектурные решения

- Единственный источник данных остаётся на клиенте: активные `Habit` из `runtime.habitsStore`, их расписания, freeze-дни и `completions`. Новый API, таблица, миграция или сохранённый пользовательский фильтр не требуются.
- `apps/web/src/lib/stats/opportunities.ts` остаётся единственным местом, где из расписания получаются scheduled opportunities; `modernStats.ts` агрегирует только эти точки. Нельзя вычислять проценты, дельты или пропуски повторно в компонентах Svelte.
- Добавляется период `1w` (7 календарных дней до сегодняшнего дня включительно); `4w` и `12w` остаются 28 и 84 днями. Предыдущий эквивалентный период заканчивается днём перед текущим периодом. Дельта равна разности completion rate в процентных пунктах и отсутствует, если в одном из окон нет scheduled opportunities.
- Completion rate во всех блоках — `completed scheduled opportunities / all scheduled opportunities` выбранного окна. Даты до создания привычки и freeze-дни не входят в знаменатель; существующая семантика positive/negative habit и `dailyTarget` сохраняется.
- History всегда строится отдельным 84-дневным запросом к тому же селектору, а не из выбранного периода. Это предотвращает смену истории при нажатии табов.
- Использовать существующий `ChartGuideTooltip.svelte` и overlay-инфраструктуру для интерактивных подсказок; не заменять их нативным `title`. Визуальные значки — только inline SVG из `lucide-svelte`, имя привычки выводится через `formatHabitLabel`.
- Новые визуальные модели и компоненты не должны параллельно реализовывать расписание, локальные даты или ключи completion: они принимают уже рассчитанные точки/модели. Существующий showcase повторно использует тот же `stats/+page.svelte`.

## Рекомендуемый порядок выполнения

| Порядок | Задача | Приоритет | Зависит от | Причина |
| ---: | --- | --- | --- | --- |
| 1 | PROG-AN-001 | P1 | — | Создаёт единые модели окон, секций и 12-недельной истории. |
| 2 | PROG-AN-002 | P1 | PROG-AN-001 | Добавляет доступные компактные визуализации поверх рассчитанных моделей. |
| 3 | PROG-AN-003 | P1 | PROG-AN-001, PROG-AN-002 | Собирает новый экран и связывает переключатель периодов с аналитикой. |
| 4 | PROG-AN-004 | P2 | PROG-AN-003 | Доказывает математику, доступность и геометрию в браузере. |

## PROG-AN-001: Единая модель аналитики периодов и классификации привычек

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

Расширить расчёт статистики для периодов 1, 4 и 12 недель и заменить текущую модель `focusHabits` на явные, детерминированно отсортированные модели `needsAttention`, `strong` и неизменяемую 12-недельную history.

**Files:**

- Modify `apps/web/src/lib/stats/opportunities.ts` — `StatsWindowId`, длины и построение эквивалентных окон.
- Modify `apps/web/src/lib/stats/modernStats.ts` — `buildModernStatsSnapshot`, агрегаты, классификация, линии тренда и heatmap-модели.
- Modify `apps/web/tests/unit/modernStats.test.ts` — контракт расчёта.

**Goal:**

Вернуть из одного чистого селектора все данные, которые нужны экрану: summary выбранного периода, дельту, строки двух секций и history последних 84 дней.

### Outcome

При переключении 1w/4w/12w все зависящие блоки получают согласованные проценты, числители, знаменатели, дельты, инсайты, тренды и ровно 7/28/84 heatmap-ячеек. History остаётся последними 84 днями.

### Architectural decision

`opportunities.ts` владеет календарными scheduled opportunities, а `modernStats.ts` — производной аналитической моделью. Компоненты получают готовые DTO-подобные структуры и не знают о `Habit.completions`, timezone или правилах расписания.

### Required changes

1. Добавить `1w` к `StatsWindowId`, label и длину 7 дней; для каждого выбора строить current и непосредственно предыдущий эквивалентный календарный диапазон в timezone пользователя.
2. Для summary вернуть `completionRate`, `completed`, `scheduled`, `delta` в pp и нейтральное состояние при нулевом знаменателе; не применять прежний порог из пяти opportunities для сокрытия математически определённой дельты.
3. Для каждой активной привычки построить модель выбранного периода: completion rate, completed/scheduled, delta, последовательность результатов для sparkline и одномерные ячейки heatmap с датой, `scheduled|completed|missed` и относительной интенсивностью. Для unscheduled всегда вернуть тёмное нейтральное состояние.
4. Сформулировать короткий детерминированный insight и reason из наблюдаемых сигналов: низкий rate, отрицательная дельта, серия пропусков или сохраняющаяся слабость для Needs attention; высокий rate, положительная дельта, восстановление после серии пропусков или стабильная сила для Strong. Одна привычка не может попасть в обе секции.
5. Отсортировать Needs attention от худшего к лучшему и Strong от лучшего к худшему стабильным tie-breaker по нормализованному имени и `id`; вернуть пустые состояния, когда подходящих привычек нет.
6. Отдельно строить aggregate-day heatmap и current-week strip для последних 84 дней независимо от `window`; включить семантические легендные уровни: более яркий completion, более яркий miss/problem, тёмный not scheduled.
7. Обновить unit-тесты с фиксированными датой и timezone: знаменатель только scheduled opportunities, 1w/4w/12w и предыдущие эквивалентные окна, delta в pp, freeze/`createdAt`, классификация и порядок, точные длины 7/28/84, а также независимость history от выбранного периода.

### Out of scope

- Изменение контрактов check-in, расписаний, `dailyTarget`, negative habit, базы данных или backend.
- Мотивационные цели, milestones, quests и рекомендации следующего действия.
- Изменение 30-дневных heatmap на Dashboard.

### Acceptance criteria

- Выбранный период всегда содержит соответственно 7, 28 или 84 календарных дня до today включительно, а сравнение — ровно столько же непосредственно предшествующих дней.
- Summary и каждая строка считают completion rate только из scheduled opportunities; отсутствие scheduled opportunities не делит на ноль и отображается как отсутствие значения, а не как 0% выполнения.
- Любая отображаемая дельта — разность current и previous rate в pp; при отсутствии opportunities в одном окне она явно unavailable, а не подменена нулём.
- Needs attention включает только привычки с подтверждённым неблагоприятным сигналом и отсортирован worst first; Strong включает только благоприятный сигнал и отсортирован best first; одинаковый вход всегда даёт одинаковый порядок.
- Каждая habit-модель содержит ровно одну одномерную heatmap нужной длины и состояния completed/missed/not scheduled без переноса в календарную сетку.
- `history` всегда охватывает последние 84 дня и current-week strip — текущую календарную неделю, независимо от `window`.

### Targeted validation

```bash
cd apps/web && npm run test -- modernStats
```

### Commit

```bash
git add apps/web/src/lib/stats/opportunities.ts apps/web/src/lib/stats/modernStats.ts apps/web/tests/unit/modernStats.test.ts
git commit -m "feat(stats): model compact progress analytics"
```

## PROG-AN-002: Доступные компактные визуализации аналитики

**Status:** DONE
**Priority:** P1
**Depends on:** PROG-AN-001

**Exact scope:**

Создать переиспользуемые отображающие компоненты для sparkline, строковой heatmap и 12-недельной aggregate history, принимающие аналитическую модель из `modernStats`.

**Files:**

- Create `apps/web/src/lib/components/stats/ProgressHabitRow.svelte` — строка привычки для обеих секций.
- Create `apps/web/src/lib/components/stats/ProgressHeatmapStrip.svelte` — всегда однорядковая heatmap.
- Create `apps/web/src/lib/components/stats/ProgressSparkline.svelte` — inline SVG линия тренда.
- Create `apps/web/src/lib/components/stats/ProgressHistory.svelte` — fixed 12-week history, legend и current-week strip.
- Modify `apps/web/src/lib/components/ChartGuideTooltip.svelte` only if его публичный Props-контракт не позволяет дать отдельные подсказки для metric, delta, heatmap, trend и смысла секции.
- Create `apps/web/tests/unit/ProgressHeatmapStrip.test.ts` and `apps/web/tests/unit/ProgressHabitRow.test.ts`.

**Goal:**

Показать плотные, интерпретируемые сигналы без emoji, горизонтальной прокрутки и дублирования бизнес-математики в Svelte.

### Outcome

Каждая строка привычки показывает SVG-иконку, label, процент, insight, sparkline и heatmap в одну строку. History показывает фиксированные 12 недель, подписи границ, легенду и текущую неделю в стилистике Today.

### Architectural decision

Компоненты являются presentation-only: принимают готовые ячейки/значения и только определяют SVG, семантику, compact CSS grid и overlay-подсказки. Для всплывающих подсказок переиспользуется существующий `ChartGuideTooltip`, чтобы не появилось второго менеджера фокуса или портала.

### Required changes

1. Реализовать `ProgressHeatmapStrip` как `grid` с `repeat(cellCount, minmax(0, 1fr))`, `min-width: 0` и без wrap/overflow-x; для 7, 28 и 84 ячеек высота и gap адаптируются, но все клетки имеют доступное имя даты и состояния.
2. Выбрать семантическую тёмную палитру, согласованную с tokens Today: ярче акцент означает более сильное completion, ярче danger — более сильный miss/problem, тёмный secondary/border — not scheduled. Не кодировать смысл только цветом: добавить `aria-label`, текст legend и tooltip.
3. Реализовать `ProgressSparkline` реальным inline SVG (`path`, `viewBox`, `aria-label`/скрытый текст) из переданных точек; нулевые/неполные данные получают нейтральное состояние, а не фиктивный положительный тренд.
4. Реализовать habit-row с минимальным набором: inline SVG status icon, `formatHabitLabel`, tabular percent, единственная короткая insight-строка, sparkline и strip. Ссылка на detail привычки сохраняет доступную клавиатурную навигацию и видимый focus.
5. Реализовать `ProgressHistory`: aggregate 84-cell strip, метки «12 недель назад» и «Сегодня», доступную легенду, процент current week и её strip. В него не передаётся selected period.
6. Добавить отдельные custom tooltips для определения completion metric, delta, heatmap-состояний, sparkline и каждого смысла секции; trigger доступен мышью, клавиатурой и touch, Escape закрывает overlay и возвращает фокус.
7. Покрыть компоненты тестами на точное число ячеек, отсутствие emoji в icon slots, SVG trend, семантические имена/legend, focusable tooltip triggers и fixed history props.

### Out of scope

- Вёрстка маршрута stats, переключатель периодов и загрузочные/пустые состояния страницы.
- Новая библиотека графиков, canvas, emoji или растровые иконки.
- Переиспользование `MiniHeatmap.svelte`: он имеет фиксированные 30 дней и не содержит scheduled/missed-семантики.

### Acceptance criteria

- При любой ширине от 320px до desktop каждая habit heatmap остаётся одной строкой с ровно 7/28/84 клетками, не выходит за card и не создаёт горизонтальный scroll страницы.
- Клетка not scheduled визуально темнее completed/missed и имеет читаемое текстовое описание; усиление completion и miss заметно яркостью внутри соответствующего цвета.
- Строка содержит именно SVG-значок, имя с привычной иконкой через `formatHabitLabel`, процент, insight, sparkline и strip; она не содержит motivational copy, quest или milestone.
- Все пять классов объяснений (metric, delta, heatmap, trend, section) открываются собственными custom tooltips, доступны с клавиатуры и корректно закрываются Escape.
- History всегда рендерит 84 дня, две крайние подписи, legend, current-week percentage и strip, не завися от длины selected period.

### Targeted validation

```bash
cd apps/web && npm run test -- ProgressHeatmapStrip ProgressHabitRow
```

### Commit

```bash
git add apps/web/src/lib/components/stats/ apps/web/src/lib/components/ChartGuideTooltip.svelte apps/web/tests/unit/ProgressHeatmapStrip.test.ts apps/web/tests/unit/ProgressHabitRow.test.ts
git commit -m "feat(stats): add compact analytics visualizations"
```

## PROG-AN-003: Собрать компактный экран Progress

**Status:** DONE
**Priority:** P1
**Depends on:** PROG-AN-001, PROG-AN-002

**Exact scope:**

Заменить текущие Momentum, Weekly quest, milestone, Pattern, Recovery и grid карточек history в защищённом маршруте Progress на экран из скриншота и требований: summary, Needs attention, Strong и fixed History.

**Files:**

- Modify `apps/web/src/routes/app/(protected)/stats/+page.svelte` — layout, state period tabs, empty/error data states и связь с новыми stats-компонентами.
- Modify `apps/web/src/routes/showcase/stats/+page.svelte` only if потребуется прокинуть fixture/runtime для нового обязательного состояния; иначе переиспользовать текущий `StatsScreen` без развилки.

**Goal:**

Дать один компактный ответ на вопросы «как сейчас», «что ухудшается», «что работает» и «краткосрочная ли это проблема».

### Outcome

По умолчанию открыт This week, рядом видны 4 weeks и 12 weeks. Переключение обновляет summary и обе секции в рамках одного экрана; History неизменно остаётся 12-недельной.

### Architectural decision

Маршрут владеет только ephemeral `$state` выбранного таба и компоновкой. Он вызывает единственный `$derived` `buildModernStatsSnapshot(activeHabits, windowId)` и передаёт результат презентационным компонентам; не создавать второй store, query parameter или localStorage для периода.

### Required changes

1. Установить стартовый период `1w`; передать в существующий `SegmentedControl` ровно три доступные кнопки This week, 4 weeks и 12 weeks с touch target минимум 44×44px.
2. Заменить hero и все исключённые мотивирующие блоки на компактный summary-card: название периода, custom tooltip metric, completion %, signed delta с tooltip, completed/scheduled, slim progress bar и краткие totals для habits/attention/best. Текст copy держать нейтральным и информационным.
3. Добавить минимальные card/section Needs attention и Strong с inline SVG заголовками, tooltip о критерии секции, counts/ordering label и соответствующими `ProgressHabitRow`; отобразить короткое нейтральное empty state, когда секция пуста.
4. Добавить `ProgressHistory` после секций, всегда передавая fixed history из snapshot. Не прятать его при This week и не изменять его содержимое при переключении tab.
5. Сохранить current пустой state для отсутствия активных привычек, но заменить обещание «new progress screen» на нейтральный текст о том, что появится после scheduled history; сохранить работающую ссылку Add habit.
6. Использовать уже определённые theme tokens, `Surface`, `ProgressBar`, `SegmentedControl` и `formatHabitLabel`; никаких emoji, градиентного hero, CTA Back to today, quests, milestones или redundant explanatory paragraphs.
7. На 320px избежать horizontal overflow, сохранить визуальную плотность Today и кликабельность строк/detail links; на desktop сохранить компактную колонку/ширину вместо раскладывания history в 12 крупных карточек.

### Out of scope

- Модификация Dashboard/Today, habits API, чек-инов, пользовательских настроек или навигационной оболочки.
- Персональные цели, streak achievements, quests, пуши и экспорт аналитики.
- Локализация всего приложения: copy нового экрана следует существующему языку UI до отдельной i18n-задачи.

### Acceptance criteria

- Вкладка Progress имеет только три period tabs, активный tab семантически объявлен и переключается keyboard/touch; по умолчанию выбран This week.
- Смена tab обновляет selected-period summary, Needs attention и Strong без перезагрузки и без изменения 12-week History.
- Summary показывает процент, signed pp delta (или clearly unavailable), completed/scheduled и тонкий progress indicator на основе единого snapshot.
- Needs attention/Strong соответствуют модели и порядку `modernStats`; каждая отображённая привычка ведёт на свой detail route и имеет все обязательные поля строки.
- Нет прежних блоков Momentum, Weekly quest, Next milestone, Pattern, Recovery и карточной сетки недель, а также нет motivational copy или emoji-иконок.
- При 320px, 390px и desktop нет горизонтальной прокрутки; кнопки и tooltip triggers имеют видимый focus и минимум 44×44px там, где они интерактивны.
- `/showcase/stats` использует тот же экран и не имеет отдельной реализации аналитики.

### Targeted validation

```bash
cd apps/web && npm run check:types && npm run lint
```

### Commit

```bash
git add apps/web/src/routes/app/'(protected)'/stats/+page.svelte apps/web/src/routes/showcase/stats/+page.svelte
git commit -m "feat(progress): redesign compact analytics screen"
```

## PROG-AN-004: Регрессии математики и адаптивной аналитики Progress

**Status:** DONE
**Priority:** P2
**Depends on:** PROG-AN-003

**Exact scope:**

Расширить тестовые fixtures и browser-проверки так, чтобы они доказывали новый контракт данных и видимую компактную геометрию во всех трёх периодах.

**Files:**

- Modify `apps/web/tests/unit/modernStats.test.ts` — добавить недостающие пограничные сценарии, если они не были добавлены в PROG-AN-001.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts` — authenticated Progress flow и семантика analytics rows/history.
- Modify `apps/web/tests/e2e/mobile-ux.spec.ts` — 320px showcase regression.
- Modify `apps/web/tests/e2e/showcase-journey.spec.ts` only if его текущий Progress assertion обращается к удалённому заголовку/контролу.

**Goal:**

Предотвратить возврат старой математики, перенос heatmap, ложную смену history и недоступность мобильных контролов.

### Outcome

Набор test fixtures содержит и сильные, и ухудшающиеся привычки, а Playwright доказывает пользовательский результат на реальном маршруте и showcase.

### Architectural decision

Unit tests остаются владельцем расчётной точности, E2E — владельцем доступности, переключения и геометрии. Не проверять CSS-реализацию аналитики снапшотами исходного кода и не подменять browser-proof успешным build.

### Required changes

1. Зафиксировать fixture с scheduled и not-scheduled датами, completed/missed, прошлым эквивалентным периодом, recovery и достаточной history, чтобы в E2E одновременно существовали Need attention и Strong.
2. Проверить для 1w, 4w и 12w доступные имена tab, `aria-pressed`, изменение summary/section rows и неизменность подписей либо `aria-label` 84-cell history после каждого клика.
3. В 320px и desktop проверить по bounding boxes: каждая habit strip имеет 7/28/84 cells на одинаковой Y-координате, лежит внутри section/card, а `document.documentElement.scrollWidth <= innerWidth`.
4. Проверить доступность: ссылки привычек, tooltip triggers и кнопки period tabs доступны с клавиатуры; открыть по одному tooltip каждого типа и подтвердить закрытие Escape/возврат фокуса.
5. Обновить или удалить только те устаревшие assertions, которые ссылаются на намеренно удалённые тексты старого экрана; сохранить критический create/check-in/edit/delete journey.

### Out of scope

- Визуальные screenshot-baseline, remote CI, PWA/offline и physical-device proof.
- Ослабление селекторов, lint suppression или пропуск существующих tests.

### Acceptance criteria

- Unit tests явно доказывают scheduled-only denominator и pp delta для всех трёх периодов, включая отсутствие available delta при пустом окне.
- Browser tests проходят на authenticated `/app/stats` и `/showcase/stats`, обнаруживают два раздела при fixture-данных и 12-недельный History.
- На mobile и desktop проверены точные размеры strip, отсутствие переносов и horizontal overflow, а не только факт рендера DOM.
- Устаревшие проверки старого hero/quest/milestone заменены проверками нового наблюдаемого поведения; критический habit journey остаётся зелёным.

### Targeted validation

```bash
cd apps/web && npm run test -- modernStats ProgressHeatmapStrip ProgressHabitRow && npm run test:e2e -- habit-journey.spec.ts mobile-ux.spec.ts showcase-journey.spec.ts
```

### Commit

```bash
git add apps/web/tests/unit/modernStats.test.ts apps/web/tests/e2e/habit-journey.spec.ts apps/web/tests/e2e/mobile-ux.spec.ts apps/web/tests/e2e/showcase-journey.spec.ts
git commit -m "test(progress): cover compact analytics behavior"
```

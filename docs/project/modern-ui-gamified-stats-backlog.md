<a name="top"></a>

# Backlog современного интерфейса, плоской иконки и мотивирующей статистики

## Содержание

- [Цель и границы](#goal)
- [Текущее состояние](#current-state)
- [Целевое пользовательское впечатление](#experience)
- [Архитектурные решения](#decisions)
- [Метрики и временные паттерны пропусков](#metrics)
- [Backlog задач](#backlog)
- [Рекомендуемая очерёдность](#order)
- [Общий Definition of Done](#definition-of-done)
- [Риски и откат](#risks)
- [Открытые вопросы](#open-questions)

---

## 🎯 Цель и границы <a name="goal"></a>

Цель — сделать Habbit Runner визуально современным и узнаваемым, а раздел статистики превратить из набора сложных графиков в короткий мотивирующий ответ на три вопроса:

1. Как я двигаюсь сейчас?
2. Что изменилось по сравнению с прошлым периодом?
3. Что чаще всего мешает привычке и какое одно действие стоит попробовать дальше?

В объём входят:

- единое визуальное направление для защищённой части приложения и основных публичных страниц;
- обновление дизайн-токенов, повторно используемых UI-примитивов, навигации и ключевых экранов;
- новая плоская иконка приложения и полный комплект PWA/favicon-ресурсов;
- замена текущей страницы статистики на простой геймифицированный сценарий;
- выявление временных паттернов пропусков по существующим check-in и расписанию;
- удаление неиспользуемой legacy-статистики после появления новой страницы и тестов.

Не входят:

- социальные рейтинги, соревнования между пользователями и публичные профили;
- внутренняя валюта, магазин наград, аватары и сложная XP-экономика;
- опросы о причинах пропуска, self-reflection и пользовательские дневниковые заметки;
- психологическая диагностика и утверждения о причинах поведения пользователя;
- смена SvelteKit, Vite, Tailwind или текущей offline-first архитектуры;
- полный ребрендинг маркетинговых текстов и blog-контента.

[↑ Наверх](#top)

---

## 🔎 Текущее состояние <a name="current-state"></a>

- Фактический frontend — `Svelte 5 + SvelteKit 2 + Vite 8 + Tailwind CSS 4`, а не React, несмотря на устаревшее описание в части repo-инструкций.
- Глобальные цвета и темы находятся в `apps/web/src/index.css`; список из десяти тем — в `apps/web/src/lib/theme/themes.ts`.
- Защищённый shell построен вокруг `AppLayout.svelte`, `SidebarNav.svelte` и `BottomNav.svelte`.
- Dashboard и часть detail-экранов используют много локальных utility-комбинаций, крупных скруглений, glow/shadow-эффектов и mono-uppercase подписей. Визуальный контракт повторяется вручную и может расходиться между экранами.
- Текущая статистика имеет четыре вкладки (`Overview`, `Charts`, `Habits`, `Activity`), поиск, фильтры, сортировки, скрытие серий, несколько графиков, heatmap и поясняющие tooltips. Это создаёт высокую стоимость чтения для сценария «быстро понять прогресс».
- Существующих check-in и расписания достаточно для описательной статистики по дням недели, частям месяца, сериям пропусков и скорости восстановления; новая пользовательская анкета для этого не нужна.
- `apps/web/static/` является SvelteKit-каталогом статических ресурсов, но тот же комплект иконок продублирован в `apps/web/public/`. Перед удалением дублей нужно подтвердить build-контракт.
- Текущий `app-icon.svg` использует несколько градиентов, drop-shadow, букву `H` и отдельную линию тренда; на малом размере знак перегружен.

[↑ Наверх](#top)

---

## ✨ Целевое пользовательское впечатление <a name="experience"></a>

Рабочее название визуального направления: **Momentum Trail**.

- Характер: спокойный, энергичный, дружелюбный, без «киберпанк-панели управления» и без детской RPG-стилизации.
- Иерархия: один главный результат и одно следующее действие на экран; вторичные данные раскрываются по запросу.
- Цвет: нейтральная основа, один основной цвет прогресса и один тёплый цвет внимания. Красный не используется как наказание за обычный пропуск.
- Типографика: `Sora` остаётся основным шрифтом; `JetBrains Mono` используется только для компактных числовых данных, а не для большинства заголовков и кнопок.
- Формы: умеренные скругления, плоские поверхности и ясные границы; glow и backdrop blur остаются только там, где объясняют слой или состояние.
- Motion: короткая обратная связь после check-in, milestone и comeback; без постоянных пульсаций и декоративного движения.
- Mobile-first: главный action доступен большим пальцем, touch target не меньше `44x44 px`, данные не требуют горизонтального скролла.

### Целевая структура новой статистики

1. **Сейчас** — общий momentum, прогресс текущей недели и ближайший достижимый milestone.
2. **Тренд** — сравнение текущего и предыдущего сопоставимого окна с простым статусом «растёт / стабильно / снижается».
3. **Фокус-привычки** — не рейтинг всех привычек, а максимум три карточки: сильная, растущая и требующая поддержки.
4. **Когда чаще сбивается ритм** — дни недели, части месяца, серии пропусков и скорость восстановления, рассчитанные по фактическому расписанию.
5. **История** — компактная 12-недельная сетка или список недель, доступный ниже основного вывода, без отдельного «аналитического кабинета».

[↑ Наверх](#top)

---

## 🏗️ Архитектурные решения <a name="decisions"></a>

### ADR-UI-01. CSS custom properties остаются источником дизайн-токенов

Решение:

- сохранить `apps/web/src/index.css` источником semantic tokens;
- отделить семантику (`--surface-*`, `--text-*`, `--progress-*`, `--attention-*`, `--radius-*`, `--shadow-*`, `--motion-*`) от названий конкретных цветов;
- Tailwind utilities должны ссылаться на токены, а не размножать произвольные hex, radius и shadow по страницам.

Последствия:

- существующие темы сохраняют пользовательскую совместимость;
- `cloud` и `midnight` становятся эталонными для визуальной проверки, остальные темы обязаны реализовать тот же semantic contract;
- удаление тем не входит в этот backlog.

### ADR-UI-02. Общие визуальные контракты оформляются как небольшие примитивы

Решение:

- создать только повторяемые примитивы: поверхность, заголовок страницы, segmented control, progress bar, metric tile и status pill;
- не строить отдельную «design system platform» и не переносить в примитивы бизнес-логику привычек;
- визуальные варианты задавать ограниченными typed props, а не набором boolean-флагов.

Последствия:

- redesign ключевых экранов выполняется на единой основе;
- dashboard, habit detail и stats сохраняют собственные feature-компоненты.

### ADR-UI-03. Современность достигается иерархией, а не количеством эффектов

Решение:

- сократить вложенные карточки, чрезмерные `rounded-[1.5rem+]`, glow, blur и uppercase mono-подписи;
- оставить один визуально доминирующий блок на страницу;
- сохранить явные hover, pressed, disabled, loading и focus-visible состояния.

### ADR-ICON-01. Иконка — один плоский смысловой знак

Решение:

- знак: **движущийся вперёд маршрут, который заканчивается check-mark**;
- форма должна одновременно читатьcя как путь, прогресс и выполненный шаг, без буквы `H`, текста и мелких деталей;
- максимум два сплошных цвета, без градиентов, drop-shadow и внутренних тонких линий;
- master — SVG на сетке `512x512`; PNG и Apple Touch Icon генерируются из него, а не редактируются отдельно.

Критерий смысла: в размере `32x32` иконка должна восприниматься как «движение + выполненный шаг», а не как график финансового роста или логотип буквы.

### ADR-STATS-01. Статистика отвечает действием, а не каталогом графиков

Решение:

- заменить четыре вкладки одним вертикальным narrative-flow;
- оставить выбор окна `4 недели / 12 недель`, но не возвращать сложные фильтры, сортировки и управление сериями;
- подробности конкретной привычки открывать переходом на habit detail;
- каждый вывод должен иметь короткое объяснение «почему это показано» и, когда уместно, один CTA.

### ADR-STATS-02. Геймификация поддерживает восстановление, а не страх потери серии

Решение:

- использовать momentum, недельную цель, milestones и comeback-события;
- не вводить валюту, бесконечные уровни и наказания;
- milestone считается подтверждением прогресса, а не обязательством пользователя;
- broken streak не обнуляет исторический прогресс и не маркируется как проигрыш.

### ADR-STATS-03. Плановое выполнение — знаменатель всех сравнений

Решение:

- completion rate и trend считаются только по запланированным возможностям выполнения с учётом расписания, archive date и freeze days;
- сравниваются окна одинаковой длины по числу плановых возможностей, а не произвольные календарные суммы;
- trend не показывается при недостаточной выборке.

### ADR-STATS-04. Паттерны пропусков вычисляются из существующей истории

Решение:

- не добавлять self-reflection, новые формы, DTO, backend entities или таблицы;
- использовать существующие `Habit.completions`, schedule, daily target, freeze days, archive state и timezone;
- считать miss rate по дням недели и частям месяца только относительно запланированных возможностей выполнения;
- отдельно вычислять серии последовательных пропусков и recovery latency — сколько плановых возможностей проходит до следующего выполнения;
- строить выводы локально в чистых TypeScript domain-функциях: для этой функции не нужен новый backend API;
- не считать незапланированный или freeze day пропуском.

### ADR-STATS-05. Исследования направляют интерпретацию, но не диагностируют пользователя

Решение:

- исследования о стабильности контекста, повторении и временных рубежах задают набор проверяемых паттернов и осторожные рекомендации;
- продукт показывает только наблюдение уровня «по пятницам выполнено на 18 п.п. меньше», но не вывод «по пятницам у вас мало энергии»;
- начало недели или месяца рассматривается как возможная точка перезапуска, а не как универсальная гарантия мотивации;
- одиночный пропуск не драматизируется: исследования формирования привычек показывают, что одна пропущенная возможность сама по себе не разрушает процесс;
- любое сообщение использует вероятностную формулировку: «похоже», «в вашей истории», «можно попробовать»;
- при недостаточной выборке UI показывает low-data state, а не слабый или случайный паттерн.

[↑ Наверх](#top)

---

## 📊 Метрики и временные паттерны пропусков <a name="metrics"></a>

### Минимальный контракт метрик

| Метрика | Правило | Когда не показывать |
|---|---|---|
| Weekly progress | выполненные плановые возможности / все наступившие плановые возможности текущей недели | если ещё не наступило ни одной возможности |
| Momentum | взвешенный процент выполнения последних 14 плановых возможностей; более свежие имеют больший вес | меньше 5 наступивших возможностей |
| Trend | разница completion rate текущего и предыдущего сопоставимого окна | меньше 5 возможностей в любом окне |
| Milestone | ближайший порог `3 / 7 / 14 / 21 / 30 / 60 / 100` последовательных плановых выполнений | нет активной привычки |
| Comeback | выполнение после минимум двух пропущенных плановых возможностей | событие не наступило |
| Weekday pattern | miss rate каждого дня недели по запланированным возможностям | меньше 4 возможностей для сравниваемого дня или меньше 28 всего |
| Month phase pattern | miss rate в начале (`1–7`), середине и последних 7 днях месяца | меньше 3 полных наблюдаемых месяцев |
| Lapse cluster | число и длина серий из `2+` последовательных плановых пропусков | меньше 2 серий в окне |
| Recovery latency | медиана плановых возможностей от начала серии пропусков до comeback | нет минимум 3 завершённых серий |
| Temporal-landmark rebound | разница выполнения в первые 3 плановые возможности новой недели/месяца и перед рубежом | меньше 4 сопоставимых рубежей |

Порог trend:

- `растёт`: изменение не меньше `+8` процентных пунктов;
- `снижается`: изменение не больше `-8` процентных пунктов;
- `стабильно`: изменение между этими границами;
- UI всегда показывает размер выборки или понятную подпись окна.

### Правила интерпретации

- Weekday-pattern показывается, только если разница между самым сильным и слабым днём не меньше `15` процентных пунктов и оба дня проходят minimum sample.
- Month-phase pattern сравнивает начало (`1–7`), середину (`8` день — начало последних 7 дней) и последние 7 календарных дней; знаменатель учитывает только запланированные возможности.
- Для каждого вывода показываются окно и sample: например, `12 недель · 10 пятниц по расписанию`.
- Один необычный день, отпускной период или freeze series не превращается в устойчивый вывод.
- По умолчанию показывается один самый сильный и полезный паттерн, остальные доступны через раскрытие.
- Паттерн описывает **когда**, но не доказывает **почему**. Copy не использует слова «причина», «ленивый», «слабая воля» или «провал».
- Рекомендация следует наблюдаемому временному сигналу: изменить reminder для слабого дня, уменьшить minimum на этот день, подготовить контекст заранее или использовать начало недели/месяца как точку возобновления.

### Исследовательская основа

- Lally et al. наблюдали формирование повседневных привычек в стабильном контексте и показали большой индивидуальный разброс скорости автоматизации; одна пропущенная возможность не оказывала существенного влияния на процесс. Это поддерживает спокойный comeback вместо наказания за единичный пропуск ([European Journal of Social Psychology, DOI 10.1002/ejsp.674](https://doi.org/10.1002/ejsp.674)).
- Stojanovic et al. в двух longitudinal datasets обнаружили связь стабильности контекста с автоматичностью и достижением целей повторения. Поэтому временной паттерн можно использовать как повод предложить более устойчивый cue, но нельзя объявлять установленную личную причину ([Frontiers in Psychology, DOI 10.3389/fpsyg.2022.883795](https://doi.org/10.3389/fpsyg.2022.883795)).
- Dai, Milkman и Riis обнаружили рост aspirational behavior после временных рубежей — начала недели, месяца, года или семестра. Поэтому приложение может проверять собственные данные пользователя вокруг таких рубежей и предлагать их как точку перезапуска ([Management Science, DOI 10.1287/mnsc.2014.1901](https://doi.org/10.1287/mnsc.2014.1901)).
- Koo et al. показали и обратный риск: ожидаемый будущий рубеж может снизить текущие усилия, если человек переносит ответственность на «будущего себя». Поэтому приложение не предлагает ждать понедельника или нового месяца, а использует уже наступивший рубеж только как дополнительный comeback cue ([Organizational Behavior and Human Decision Processes, DOI 10.1016/j.obhdp.2020.06.002](https://doi.org/10.1016/j.obhdp.2020.06.002)).

Ограничение: эти исследования не означают, что у конкретного пользователя понедельник всегда сильнее пятницы или начало месяца всегда улучшает выполнение. Приоритет имеет его собственная нормализованная история, а исследование определяет только осторожную интерпретацию и возможное действие.

[↑ Наверх](#top)

---

## 🧩 Backlog задач <a name="backlog"></a>

Статусы при создании документа: все задачи `TODO`. Приоритеты: `P0` — обязательная основа новой статистики и визуального контракта, `P1` — основной redesign и иконка, `P2` — расширение и release polish.

### UI-001. Зафиксировать визуальный baseline и список экранов

Приоритет: `P0`  
Зависимости: нет

Что сделать:

- снять desktop `1440x900` и mobile `390x844` baseline для landing, dashboard, habit detail, habit form и stats;
- составить inventory повторяющихся surface/header/control patterns;
- зафиксировать contrast, overflow, touch-target и keyboard проблемы до изменения кода;
- выбрать по одному наполненному и пустому состоянию для visual regression.

Что именно зафиксировать в UI:

- **Landing:** header, hero, основной CTA, product preview, блок преимуществ, FAQ и footer; отдельно проверить открытую mobile navigation.
- **Dashboard:** today-summary, pending/completed filters, поиск, comfortable/compact habit presentation, открытое overflow-меню, archived view и celebration после check-in.
- **Stats:** текущие четыре вкладки, filters, chart legends, tooltip, habit ranking и 90-day activity, чтобы после удаления legacy было видно, что именно заменено.
- **Habit detail:** header привычки, основное действие, target/streak blocks, календарь, history и destructive actions.
- **Habit form:** пустая форма, заполненная форма, validation errors, custom schedule, reminders и mobile keyboard viewport.
- Для воспроизводимых данных создать fixture минимум из пяти привычек: daily pending, daily completed, weekly schedule, negative habit и archived habit; история должна содержать рост, спад, freeze day и comeback.
- Каждый screenshot подписать: route, fixture, theme, viewport, scroll position, opened overlay и ожидаемый focus target.

Файлы:

- `apps/web/static/screenshots/README.md`
- `apps/web/static/screenshots/` — baseline-файлы, если репозиторий хранит их после проверки размера
- новый `apps/web/tests/e2e/visual-baseline.spec.ts` либо существующий Playwright-каталог, если он будет обнаружен при выполнении

Критерии проверки:

- есть таблица «маршрут → viewport → состояние → screenshot»;
- baseline покрывает светлую `cloud` и тёмную `midnight` темы;
- для dashboard и stats есть состояния `empty / low-data / populated / filtered-empty`;
- для overlay и menu есть отдельные mobile screenshots, а не только закрытое состояние;
- ни один screenshot не требует ручной авторизации или случайных данных для повторения.

### UI-002. Ввести semantic design tokens

Приоритет: `P0`  
Зависимости: `UI-001`

Что сделать:

- добавить semantic surface, state, radius, elevation, spacing и motion tokens;
- перенести повторяющиеся literal shadow/radius/transition значения на токены;
- увеличить контраст muted-текста там, где он не проходит WCAG AA;
- добавить `prefers-reduced-motion` и исключить theme-transition при reduced motion;
- не удалять существующие темы и их сохранённые идентификаторы.

Что именно реализовать в UI-токенах:

- **Surface levels:** `canvas`, `surface`, `surface-raised`, `surface-interactive`, `surface-selected`; одна карточка не должна содержать больше двух дополнительных уровней вложенных поверхностей.
- **Text levels:** `text-primary`, `text-secondary`, `text-tertiary`, `text-on-accent`; muted text больше не используется для важной инструкции или статуса.
- **State colors:** `progress`, `positive`, `attention`, `danger`, `focus`; `danger` применяется только к destructive/error состояниям, не к обычному пропуску привычки.
- **Geometry:** базовые radii `12 / 16 / 24 px`; pill radius только для chips, segmented controls и компактных статусов; убрать произвольные `rounded-[1.4rem]`, `rounded-[1.5rem]`, `rounded-[1.75rem]` из feature-кода после миграции.
- **Spacing:** шкала `4 / 8 / 12 / 16 / 24 / 32 / 48 px`; mobile page gutter `16 px`, desktop `24–32 px`, вертикальный интервал между крупными секциями `24–32 px`.
- **Typography:** page title `28/34` mobile и `32/38` desktop; section title `18/24`; body `14/20` или `16/24`; metadata `12/16`; mono только для процентов, streak count, dates и sample size.
- **Elevation:** одна мягкая тень для raised surface и одна для overlay; glow не используется как постоянная рамка карточки.
- **Motion:** `120 ms` press/hover, `180 ms` disclosure, `240 ms` progress/celebration; translate-анимация не больше `4 px`; при reduced motion остаётся только мгновенная смена состояния.
- **Layout:** общий content max-width `1200 px`; reading blocks не шире `720 px`; sticky элементы имеют непрозрачный fallback и не ухудшают контраст.

Референсные значения для двух эталонных тем, которые надо проверить по contrast до фиксации:

| Semantic token | `cloud` | `midnight` |
|---|---|---|
| `canvas` | `#F4F6F1` | `#0B100D` |
| `surface` | `#FFFFFF` | `#121A15` |
| `surface-raised` | `#FBFCFA` | `#18211B` |
| `text-primary` | `#172019` | `#F3F7F4` |
| `text-secondary` | `#4F5F55` | `#B8C4BC` |
| `border` | `#D9E0DA` | `#2B382F` |
| `progress` | `#23835D` | `#65D6A0` |
| `accent` | `#4E63D8` | `#9AA8FF` |
| `attention` | `#B45F2A` | `#F2A36B` |
| `danger` | `#B42318` | `#FF8B85` |

Остальные темы не копируют эти hex, а отображают те же semantic roles через собственную палитру. Если пара не проходит WCAG AA в реальном размере текста, значение меняется до реализации компонентов, а не компенсируется font-weight или shadow.

Файлы:

- `apps/web/src/index.css`
- `apps/web/src/lib/theme/themes.ts`
- `apps/web/src/lib/stores/theme.ts`
- `apps/web/tests/unit/` — новый тест theme token contract при необходимости

Критерии проверки:

- `cloud` и `midnight` имеют полный одинаковый набор semantic tokens;
- остальные восемь тем не обращаются к отсутствующим CSS variables;
- focus-visible заметен на светлой и тёмной теме;
- page title, body, metadata и numeric styles визуально различимы без uppercase как единственного сигнала;
- surface levels различимы без blur/glow и не сливаются в high-contrast режиме;
- motion отключается системной настройкой;
- `cd apps/web && npm run check:web`.

### UI-003. Создать минимальный набор UI-примитивов

Приоритет: `P0`  
Зависимости: `UI-002`

Что сделать:

- реализовать surface, page header, segmented control, progress bar, metric tile и status pill;
- добавить единые primary/secondary/ghost/destructive button и icon button, чтобы CTA и toolbar actions не собирались заново на каждой странице;
- использовать typed variant props: `default / elevated / interactive`, `positive / neutral / attention`;
- предусмотреть slots/snippets для feature-контента без импорта store или API в примитивы.

Что именно реализовать в UI:

- **Surface:** `default / raised / selected`; optional header/footer snippets; сам компонент не становится кликабельным, если внутри есть другие интерактивные элементы.
- **PageHeader:** optional back action, eyebrow, title, description и actions; на mobile actions переносятся под title, не уменьшая его до одной строки.
- **Button:** размеры `sm / md / lg`, состояния `idle / hover / pressed / loading / disabled`; loading сохраняет ширину и доступное имя кнопки.
- **IconButton:** обязательный `aria-label`, минимум `44x44 px` для touch, tooltip только как дополнение к accessible name.
- **SegmentedControl:** один выбранный option, видимый selected indicator, arrow-key navigation, подписи без однобуквенных `W/M/Q/Y` там, где пользователь впервые видит выбор.
- **ProgressBar:** label, текущее/максимальное значение, optional value text; заполнение ограничивается диапазоном `0–100`, цвет не является единственным носителем результата.
- **MetricTile:** label, главное value, optional delta, supporting text и icon; tile не должен превращаться в самостоятельный dashboard внутри карточки.
- **StatusPill:** icon + текст для `positive / neutral / attention`; статус не интерактивен и не выглядит кнопкой.
- Примитивы должны поддерживать длинный английский текст и увеличение browser font size до `200%` без обрезания.

Файлы:

- новые `apps/web/src/lib/components/ui/Surface.svelte`
- новый `apps/web/src/lib/components/ui/PageHeader.svelte`
- новый `apps/web/src/lib/components/ui/SegmentedControl.svelte`
- новый `apps/web/src/lib/components/ui/ProgressBar.svelte`
- новый `apps/web/src/lib/components/ui/MetricTile.svelte`
- новый `apps/web/src/lib/components/ui/StatusPill.svelte`
- новый `apps/web/src/lib/components/ui/Button.svelte`
- новый `apps/web/src/lib/components/ui/IconButton.svelte`
- новый `apps/web/src/lib/components/ui/index.ts`
- новый `apps/web/tests/unit/uiPrimitives.test.ts`

Критерии проверки:

- примитивы не знают о Habit, Checkin или конкретном маршруте;
- все интерактивные элементы имеют keyboard и focus-visible состояния;
- progress bar имеет доступное имя и числовое значение;
- segmented control доступен с клавиатуры и сообщает выбранное значение;
- loading button не допускает повторную отправку и не меняет ширину;
- на ширине `320 px` actions из `PageHeader` переносятся без horizontal overflow;
- нет boolean-prop комбинаций, создающих противоречивые варианты;
- `cd apps/web && npm run test -- uiPrimitives`;
- `cd apps/web && npm run check:web`.

### ICON-001. Создать плоский master-icon «маршрут + выполненный шаг»

Приоритет: `P1`  
Зависимости: `UI-002`

Что сделать:

- подготовить 2–3 чёрно-белых силуэта и выбрать самый читаемый на `16`, `32`, `64` и `192 px`;
- собрать финальный SVG на сетке `512x512` с safe zone для maskable crop;
- использовать максимум два solid fill;
- проверить знак на светлом, тёмном и монохромном фоне.

Что именно реализовать визуально:

- Базовая форма — цельный squircle-фон с одним контрастным маршрутом; маршрут стартует в нижней левой части, делает один мягкий поворот и заканчивается check-mark в верхней правой части.
- Не использовать бегущего человечка, букву `H`, график с осями, flame, trophy или несколько мелких milestones: смысл должен читаться одним силуэтом.
- Основной вариант использует тёмный спокойный фон и светлый/зелёный progress-sign; монохромный вариант сохраняет тот же negative space.
- Толщина маршрута и расстояния между его частями должны переживать downscale до favicon; минимальная визуальная щель после rasterization — не меньше `2 px` на размере `32x32`.
- Для maskable-варианта весь смысловой знак помещается в центральную safe zone `80%`, фон заполняет весь canvas.
- Подготовить comparison sheet: варианты рядом на `16 / 32 / 64 / 192 px`, browser tab mock, mobile home screen и notification preview.

Файлы:

- `apps/web/static/app-icon.svg`
- новый `apps/web/static/icon-source/README.md` с правилами safe zone, палитрой и экспортом

Критерии проверки:

- SVG не содержит `linearGradient`, `radialGradient`, `filter`, `feDropShadow`, текста и raster image;
- знак не теряется в круглом и squircle mask;
- на `32x32` остаются различимы путь и check-mark;
- основная форма не зависит от темы приложения.
- comparison sheet позволяет выбрать вариант без просмотра SVG на увеличении;
- иконка не воспринимается как finance chart, delivery route или generic check-only app в тесте минимум на трёх людях.

### ICON-002. Сгенерировать и подключить полный комплект иконок

Приоритет: `P1`  
Зависимости: `ICON-001`

Что сделать:

- генерировать PNG из master SVG воспроизводимой командой;
- обновить favicon, `192x192`, `512x512`, Apple Touch Icon и отдельные maskable assets;
- не объявлять один и тот же PNG одновременно как `any` и `maskable`, если у них разные safe-zone требования;
- проверить, нужен ли `apps/web/public/`; удалить дубли только после доказательства, что SvelteKit/Vite build использует `apps/web/static/`;
- синхронизировать notification icon и PWA manifest.

Файлы:

- `apps/web/static/app-icon.svg`
- `apps/web/static/icon-192.png`
- `apps/web/static/icon-512.png`
- `apps/web/static/icon-maskable-192.png`
- `apps/web/static/icon-maskable-512.png`
- `apps/web/static/apple-touch-icon.png`
- `apps/web/src/app.html`
- `apps/web/vite.config.ts`
- `apps/web/src/sw-custom.ts`
- `apps/web/public/app-icon.svg` и PNG-дубли — удалить только если подтверждены как legacy
- новый `apps/web/scripts/generate-app-icons.mjs`
- `apps/web/package.json`

Критерии проверки:

- `npm run generate:icons` повторно создаёт одинаковые файлы;
- PWA manifest содержит существующие `any` и `maskable` assets с правильными размерами;
- favicon виден в browser tab, Apple Touch Icon — в metadata, notification icon — в service worker;
- `cd apps/web && npm run build`;
- собранный `build/manifest.webmanifest` проходит Chrome DevTools Application validation;
- отсутствуют `404` на icon URLs в preview.

### STATS-001. Вынести новый контракт метрик в чистый domain-модуль

Приоритет: `P0`  
Зависимости: `UI-001`

Что сделать:

- реализовать weekly progress, momentum, comparable-window trend, milestone, comeback и выбор focus-habits;
- учитывать schedule, daily target, negative habit, freeze days и archived habits;
- возвращать typed result с `status`, `sampleSize`, `reason` для unavailable-состояния;
- использовать `formatHabitLabel()` во всех готовых пользовательских подписях.

Файлы:

- новый `apps/web/src/lib/stats/momentum.ts`
- новый `apps/web/src/lib/stats/trends.ts`
- новый `apps/web/src/lib/stats/milestones.ts`
- новый `apps/web/src/lib/stats/focusHabits.ts`
- `apps/web/src/lib/habits/schedule.ts`
- новый `apps/web/tests/unit/momentum.test.ts`
- новый `apps/web/tests/unit/trends.test.ts`
- новый `apps/web/tests/unit/milestones.test.ts`
- новый `apps/web/tests/unit/focusHabits.test.ts`

Критерии проверки:

- одинаковые входные данные дают одинаковый результат независимо от timezone среды теста;
- незапланированные и freeze days не ухудшают rate или streak;
- trend не создаётся при недостаточной выборке;
- positive и negative habits имеют явные тестовые сценарии;
- нет зависимости domain-модулей от Svelte-компонентов или browser API;
- focused unit tests и `cd apps/web && npm run check:web` зелёные.

### STATS-002. Реализовать движок временных паттернов пропусков

Приоритет: `P0`  
Зависимости: `STATS-001`

Что сделать:

- агрегировать planned/completed/missed opportunities по локальному дню недели пользователя;
- сравнивать начало, середину и последние 7 дней календарного месяца;
- находить lapse clusters, comeback и recovery latency в единицах плановых возможностей, а не календарных дней;
- сравнивать выполнение перед и после начала недели/месяца без предположения, что fresh-start effect обязательно проявится;
- применять minimum sample и effect threshold из раздела «Правила интерпретации»;
- ранжировать выводы по силе наблюдаемой разницы и практической применимости;
- отделить расчёт фактов от copy/recommendation rules.

Файлы:

- новый `apps/web/src/lib/stats/temporalPatterns.ts`
- `apps/web/src/lib/habits/schedule.ts`
- `apps/web/src/lib/time/userTimezone.ts`
- новый `apps/web/tests/unit/temporalPatterns.test.ts`

Критерии проверки:

- weekday buckets соответствуют timezone пользователя и не зависят от timezone test runner;
- незапланированные, будущие и freeze days исключены из знаменателя;
- последний 7-дневный bucket месяца корректен для 28, 29, 30 и 31 дня;
- sparse data возвращает typed `insufficient-data`, а не случайный insight;
- разница ниже threshold не называется паттерном;
- рекомендация не утверждает личную психологическую причину;
- один пропуск не создаёт негативный warning;
- focused unit tests и `cd apps/web && npm run check:web` зелёные.

### STATS-003. Добавить исследовательски корректный слой интерпретаций

Приоритет: `P0`  
Зависимости: `STATS-002`

Что сделать:

- сопоставить типы temporal pattern с ограниченным набором нейтральных рекомендаций;
- использовать исследования только для выбора возможного действия: стабильный cue, изменение reminder, уменьшение minimum на слабый день или comeback после временного рубежа;
- всегда показывать конкретный факт, окно и sample перед рекомендацией;
- не использовать causal language и не присваивать пользователю эмоциональное или клиническое состояние;
- при равной силе выбирать позитивный или recovery-oriented insight вместо негативного;
- хранить research references и продуктовые ограничения рядом с правилами, чтобы copy не дрейфовал в псевдопсихологию.

Что именно вывести в UI:

| Pattern | Factual headline | Supporting action |
|---|---|---|
| Weak weekday | `Fridays are 18 pp below your average` | `Try an earlier reminder on Friday` |
| Month-end dip | `The last 7 days run 14 pp lower` | `Make the minimum smaller near month-end` |
| Long lapse | `Most breaks become 3 scheduled days long` | `Restart with the easiest habit today` |
| Fast recovery | `You usually return after one scheduled day` | `Your rhythm recovers quickly — keep going` |
| Fresh-start rebound | `Your first week after a new month is stronger` | `Use this week to lock in one stable cue` |
| No reliable pattern | UI не создаёт headline | Показать weekly progress без совета |

Copy contract:

- headline не длиннее `90` символов и начинается с наблюдаемого периода/дня, а не с оценки пользователя;
- supporting action не длиннее одной строки на desktop и двух строк на mobile;
- каждое процентное отличие использует `percentage points / pp`, если сравниваются два rate, а не знак `%` как относительный рост;
- research disclosure использует структуру `What we noticed → How it was calculated → What research suggests → Limitations`;
- CTA появляется только когда действие уже поддержано продуктом: нельзя советовать изменить reminder, если прямой переход к reminder settings не реализован.

Файлы:

- новый `apps/web/src/lib/stats/recommendations.ts`
- новый `apps/web/src/lib/stats/researchReferences.ts`
- `apps/web/src/lib/constants/stats.ts`
- новый `apps/web/tests/unit/recommendations.test.ts`

Критерии проверки:

- каждое сообщение содержит наблюдение и не выдаёт корреляцию за причину;
- research reference связан с правилом стабильным ID, но DOI/URL не обязан занимать основной UI;
- низкая выборка не приводит к совету;
- одиночный пропуск приводит максимум к спокойному comeback copy;
- snapshots/fixtures покрывают strong weekday, month-end dip, long lapse, fast recovery и no-pattern;
- `cd apps/web && npm run test -- recommendations`;
- `cd apps/web && npm run check:web`.

### STATS-004. Добавить компактный preview временного паттерна на dashboard

Приоритет: `P0`  
Зависимости: `STATS-001`, `STATS-003`, `UI-003`

Что сделать:

- показывать не больше одного сильного паттерна после главного today-блока;
- отдавать приоритет позитивному momentum, comeback или понятному слабому дню недели;
- показывать sample и ссылку на полную статистику;
- скрывать блок полностью, если история короткая или паттерн не проходит threshold;
- не конкурировать с главным check-in action и не добавлять форму ввода.

Что именно реализовать в UI:

- На desktop карточка располагается рядом с today-summary или в правой колонке; на mobile — после первого actionable habit либо ниже списка, чтобы не отодвигать check-in.
- Верхняя строка: semantic icon, короткий label `Your pattern` и sample `12 weeks`.
- Главное сообщение занимает максимум две строки: например, `Fridays are 18% harder than your weekly average` или `You usually recover within one scheduled day`.
- Supporting line раскрывает знаменатель: `Completed 5 of 10 scheduled Fridays`.
- Один neutral CTA `See progress` ведёт на statistics page и передаёт выбранное окно через URL только если stats route поддерживает этот contract.
- Для positive/comeback pattern использовать progress tone; для слабого периода — attention tone без красной рамки, warning icon и слова `failure`.
- На mobile карточка занимает одну колонку; icon не выталкивает текст, CTA остаётся не меньше `44 px` по высоте.
- Карточка не имеет carousel, close button, auto-rotation и hover-only пояснений.

Файлы:

- новый `apps/web/src/lib/components/stats/TemporalPatternPreview.svelte`
- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- новый `apps/web/tests/unit/TemporalPatternPreview.test.ts`

Критерии проверки:

- preview отсутствует при `insufficient-data` и `no-pattern`;
- наблюдение содержит период, sample и величину отличия;
- текст карточки укладывается в `3` смысловых уровня: label, факт, supporting sample;
- long weekday/month labels не обрезаются при `200%` zoom;
- CTA ведёт на новую statistics page;
- блок не сдвигает главный check-in ниже первого mobile viewport;
- preview доступен с клавиатуры и не зависит от hover;
- component test и `cd apps/web && npm run check:web` зелёные.

### STATS-005. Собрать новую одностраничную мотивирующую статистику

Приоритет: `P0`  
Зависимости: `UI-003`, `STATS-001`, `STATS-003`

Что сделать:

- заменить tabbed analytics на narrative-flow из раздела «Целевая структура»;
- создать hero momentum, weekly quest, ближайший milestone, trend summary, focus habits, temporal patterns и compact history;
- дать пользователю только выбор `4 недели / 12 недель`;
- использовать progressive disclosure для методики расчёта, а не постоянные chart guide tooltips;
- предусмотреть empty, low-data, all-complete, declining и comeback состояния;
- показывать один сильнейший temporal insight: например, слабый день недели, конец месяца, повторяющуюся серию пропусков или быстрое восстановление;
- рекомендации формулировать конкретно и нейтрально: изменить reminder для наблюдаемого дня, уменьшить minimum, подготовить стабильный cue или использовать временной рубеж для comeback.

Что именно реализовать в UI — порядок сверху вниз:

1. **Page header**
   - Заголовок `Progress`, supporting text `A clear view of what is working and what to adjust next`.
   - Segmented control с полными labels `4 weeks / 12 weeks`; выбранное окно сохраняется в URL и восстанавливается после reload/back navigation.
   - На mobile control находится под заголовком и занимает ширину контента; он не sticky и не закрывает результаты при scroll.

2. **Momentum hero**
   - Не показывать абстрактный score без расшифровки. Главный текст — качественный статус: `Momentum is building`, `Holding steady`, `Ready for a comeback`.
   - Рядом/ниже показать прозрачные основания: `18 of 24 scheduled check-ins` и изменение относительно прошлого окна.
   - Визуал — один progress arc или горизонтальная шкала, а не несколько competing rings.
   - Один contextual CTA: `Complete today’s habits`, `Keep the rhythm` либо `Restart with one habit`; CTA ведёт на dashboard с корректным filter.

3. **Weekly quest**
   - Показать прогресс текущей недели как конкретную достижимую цель: `2 check-ins to close the week`.
   - Использовать семь day markers только если расписание действительно можно корректно свести к дням; незапланированные дни выглядят neutral, freeze — отдельным snowflake state.
   - После выполнения заменить CTA на quiet completion state `Week complete` без бесконечной celebration-анимации.

4. **Next milestone**
   - Показать одну ближайшую цель для одной focus-habit: emoji + имя через `formatHabitLabel()`, текущая серия и расстояние до milestone.
   - Пример: `📚 Reading · 2 more scheduled days to reach 14`.
   - Карточка целиком не кликабельна при наличии CTA; использовать явную ссылку `Open habit`.

5. **Trend summary**
   - Два сопоставимых значения: `Current 68%` и `Previous 56%`, delta `+12 pp`, подписи периода и sample.
   - Допустим простой SVG sparkline без axis/legend/hover; каждая точка должна иметь доступный текст в скрытом summary или таблице.
   - Состояния: improving, stable, declining, insufficient-data. Declining использует attention, а не danger.

6. **Focus habits**
   - Максимум три строки/карточки: `Strongest`, `Improving`, `Needs support`; одна привычка не должна дублироваться в нескольких ролях.
   - Каждая строка: emoji + название, completion rate, короткий trend, scheduled sample и явная ссылка на detail.
   - На mobile это вертикальный список, на desktop — не более трёх равных колонок; карточки не выравниваются искусственно огромной пустотой.

7. **Temporal pattern**
   - Один главный паттерн с factual headline, sample и рекомендацией: `Fridays run 18 pp below your average · 10 scheduled Fridays`.
   - `Why am I seeing this?` раскрывает методику, minimum sample, период и research reference; disclosure закрыт по умолчанию.
   - Для month pattern явно назвать bucket: `Last 7 days of the month`, а не расплывчатое `late month`.
   - Если паттерна нет, блок не заменяется generic советом; показывается positive neutral state `No recurring weak period yet` только если это помогает композиции, иначе секция скрывается.

8. **Compact history**
   - Показать `12` недель как последовательность недельных cells/bars: completion rate, scheduled count и accessible label для каждой недели.
   - Последняя неделя визуально отделена; current partial week помечена `In progress` и не сравнивается как полная.
   - Не возвращать выбор отдельных chart series, legend toggles и горизонтальный scroll.

Desktop layout:

- `12`-column grid: momentum hero `7` колонок, weekly quest `5`; trend `7`, milestone `5`; focus habits и temporal pattern — full width или `7/5` в зависимости от длины copy; history — full width.
- Первый screenful должен содержать header, momentum и weekly quest; secondary analysis начинается ниже.
- Максимальная ширина страницы `1200 px`; карточки выравниваются по смысловым секциям, а не в одну dashboard-сетку одинаковой высоты.

Mobile layout:

- Одна колонка в порядке: header → momentum → weekly quest → milestone → trend → focus habits → temporal pattern → history.
- Page gutter `16 px`, section gap `24 px`; bottom padding учитывает `BottomNav` и safe area.
- Главный CTA не закрепляется поверх контента; все графические блоки помещаются на `320 px` без horizontal scroll.

UI states:

- **No habits:** icon, `Create your first habit`, объяснение пользы статистики и primary CTA на new habit.
- **No completions:** weekly progress `0`, спокойный текст `Your first check-in will start the story`, CTA на dashboard; temporal/trend blocks скрыты.
- **Low data:** реальный weekly progress показывается, а trend/pattern получают локальный placeholder с конкретным порогом: `3 more scheduled check-ins needed`.
- **All complete:** positive hero и milestone; confetti не запускается при каждом открытии stats.
- **Declining:** один attention insight и одно действие; не показывать несколько негативных карточек подряд.
- **Comeback:** подчеркнуть восстановление и сохранённый historical best, не обнулять визуально весь прогресс.
- **Archived-only filter result:** новая страница не имеет legacy-фильтра; archived habits доступны из detail/history, но не смешиваются с текущим momentum.

Файлы:

- `apps/web/src/routes/app/(protected)/stats/+page.svelte`
- новые `apps/web/src/lib/components/stats/MomentumHero.svelte`
- новый `apps/web/src/lib/components/stats/WeeklyQuest.svelte`
- новый `apps/web/src/lib/components/stats/NextMilestone.svelte`
- новый `apps/web/src/lib/components/stats/TrendSummary.svelte`
- новый `apps/web/src/lib/components/stats/FocusHabitCard.svelte`
- новый `apps/web/src/lib/components/stats/TemporalPatternCard.svelte`
- новый `apps/web/src/lib/components/stats/CompactHistory.svelte`
- `apps/web/src/lib/stats/recommendations.ts`, созданный в `STATS-003`
- новый `apps/web/src/lib/stats/urlState.ts`
- `apps/web/src/lib/constants/stats.ts` — сократить до нового контракта
- `apps/web/tests/unit/statsPage.test.ts` — переписать под новую композицию
- новый `apps/web/tests/unit/statsUrlState.test.ts`
- новые component tests `MomentumHero.test.ts`, `TemporalPatternCard.test.ts`, `CompactHistory.test.ts` и page-state fixtures

Критерии проверки:

- первый viewport отвечает «как я двигаюсь» без прокрутки на `390x844` и desktop;
- пользователь видит максимум одно главное рекомендуемое действие;
- trend показывает сравниваемые окна и sample state;
- temporal insight содержит наблюдаемый период, размер выборки и разницу, но не выдуманную причину;
- low-data state объясняет, сколько истории ещё нужно, и не показывает слабый вывод;
- весь экран работает без горизонтального скролла на `320 px`;
- `formatHabitLabel()` используется для всех названий привычек;
- нет обязательного hover для понимания данных;
- период `4 weeks / 12 weeks` восстанавливается из URL и не сбрасывается при возврате со страницы привычки;
- каждое число имеет label, окно и знаменатель либо доступное пояснение;
- первый mobile viewport содержит не больше одного primary CTA;
- consecutive attention blocks не создают «стену неудачи»;
- current incomplete week явно отличается от завершённых недель;
- page/component unit tests и `npm run check:web` зелёные.

### STATS-006. Удалить legacy-статистику и её мёртвые контракты

Приоритет: `P0`  
Зависимости: `STATS-005` принята визуально и функционально

Что сделать:

- удалить четыре legacy-вкладки, сложные filters/sorts/series visibility и старые chart-компоненты;
- удалить helpers, constants и tests, которые не используются новой статистикой;
- сохранить общие habit-detail компоненты, если они всё ещё имеют живых потребителей;
- пересмотреть chart tooltip documentation и удалить только статистические правила, которые больше не применимы;
- выполнить repo-wide grep по удалённым именам.

Файлы-кандидаты на удаление после проверки usages:

- `apps/web/src/lib/components/stats/StatsTabs.svelte`
- `apps/web/src/lib/components/stats/StatsFilters.svelte`
- `apps/web/src/lib/components/stats/OverviewSignals.svelte`
- `apps/web/src/lib/components/stats/InvestmentPanel.svelte`
- `apps/web/src/lib/components/stats/InsightsGrid.svelte`
- `apps/web/src/lib/components/stats/ChartPanel.svelte`
- `apps/web/src/lib/components/stats/HabitPerformanceList.svelte`
- `apps/web/src/lib/components/stats/StatsHeader.svelte` — уже не имеет живого импорта
- `apps/web/src/lib/components/StatsDailyRateChart.svelte`
- `apps/web/src/lib/components/StatsTrendChart.svelte`
- `apps/web/src/lib/stats/statsCharts.ts`
- legacy-части `apps/web/src/lib/stats/statsPage.ts`
- `apps/web/tests/unit/StatsCharts.test.ts`
- legacy-части `apps/web/tests/unit/statsPage.test.ts`
- `apps/web/src/lib/habits/blockGuideTooltips.ts` и `docs/features/chart-tooltips.md` — только после проверки оставшихся dashboard/detail consumers

Критерии проверки:

- `rg` не находит импортов удалённых компонентов;
- bundle не содержит старый charts UI;
- dashboard и habit detail не потеряли нужные общие блоки;
- `/app/stats` открывается напрямую и после client navigation;
- `cd apps/web && npm run test`;
- `cd apps/web && npm run check:web`.

### UI-004. Обновить shell и навигацию

Приоритет: `P1`  
Зависимости: `UI-003`, `ICON-002`

Что сделать:

- упростить sidebar и bottom navigation, усилить active state и сократить декоративный шум;
- использовать новую иконку как product mark;
- выровнять desktop content width и mobile safe-area;
- убрать визуально доминирующий build timestamp из footer или перенести его в вторичную область;
- сохранить skip link, logout и theme picker.

Что именно реализовать в UI:

- **Desktop sidebar (`>= 768 px`):** ширина `240 px`; brand row без отдельной карточки и тяжёлой тени; primary `New habit` button; два основных destination `Today` и `Progress`; appearance/logout в нижней secondary-zone.
- Переименовать пользовательские labels `Dashboard → Today`, `Stats → Progress`, сохранив существующие routes и page titles/SEO там, где это требуется.
- Active navigation: тональная подложка + left indicator + `aria-current`, а не белая карточка только на выбранном пункте.
- Theme picker открывается как один overlay с группами `Light / Dark`, цветными swatches, названием и check icon у текущей темы; outside click и `Escape` закрывают overlay, focus возвращается trigger.
- **Mobile bottom navigation:** четыре равных destination/action zones — `Today`, `Progress`, центральный `Add`, `More`; поиск переносится в dashboard toolbar, theme/logout — в `More` sheet.
- Центральный `Add` имеет label и размер не меньше `52x52 px`, но не выступает за safe-area и не перекрывает последний элемент страницы.
- `More` открывает bottom sheet с theme picker и logout; sheet имеет title, close action, focus trap, swipe-down только как дополнительный способ закрытия.
- Main content использует `padding-left: 240px` только на desktop; на mobile bottom padding равен nav height + safe area + `16 px`.
- Build timestamp убрать из постоянного pill-footer; оставить компактной строкой в `More/About` или внизу sidebar с tertiary contrast.

Файлы:

- `apps/web/src/lib/components/AppLayout.svelte`
- `apps/web/src/lib/components/SidebarNav.svelte`
- `apps/web/src/lib/components/BottomNav.svelte`
- новый `apps/web/src/lib/components/navigation/MobileMoreSheet.svelte`
- `apps/web/src/routes/app/(protected)/+layout.svelte`
- `apps/web/src/index.css`
- соответствующие overlay/navigation unit tests

Критерии проверки:

- active route различим не только цветом;
- sidebar и bottom nav используют один порядок и одинаковые названия destinations;
- mobile bottom nav содержит не больше четырёх верхнеуровневых действий;
- `Search` доступен из dashboard без отдельного global navigation item;
- theme overlay/sheet закрывается по `Escape`, возвращает focus и не остаётся за browser Back;
- route group страниц привычки сохраняет понятный active state `Today`;
- touch targets не меньше `44x44 px`;
- keyboard focus не скрывается под sticky navigation;
- на iPhone safe-area контент и CTA не перекрываются.

### UI-005. Переработать dashboard вокруг сегодняшнего действия

Приоритет: `P1`  
Зависимости: `UI-003`, `STATS-004`

Что сделать:

- сделать today's progress и следующий habit action главным блоком;
- сократить число одновременно видимых controls, перенести вторичные sort/density/filter действия в компактный disclosure;
- унифицировать comfortable и compact rows через общую feature-композицию;
- сохранить drag, swipe, archive, reminder, undo и celebration поведение;
- показывать comeback и temporal pattern preview без конкуренции с главным check-in action.

Что именно реализовать в UI — порядок экрана:

1. **Dashboard header**
   - Eyebrow с локальной датой, title `Today`, справа desktop action `New habit`; на mobile создание уже доступно через bottom nav, поэтому header не дублирует большой CTA.
   - Secondary overflow содержит density, reorder mode и archived habits; эти действия не находятся постоянно рядом с главным title.

2. **Today summary**
   - Главный текст: `3 of 5 habits complete`; один horizontal progress bar и supporting message `Two small steps left`.
   - Рядом только два полезных значения: current best streak и scheduled today; убрать сетку из множества равнозначных mini-cards.
   - При `100%` показать quiet completed state и одноразовую celebration только в момент последнего check-in, не при reload.
   - При отсутствии запланированных привычек показать `Nothing scheduled today` и ближайший день с планом, а не `0%` как отрицательный результат.

3. **Comeback message**
   - Показывать только после реального перерыва; текст `A small restart counts` и ссылка/scroll к самой лёгкой pending habit.
   - Не использовать warning/danger tone и не занимать отдельный full-width hero, если today-summary уже содержит comeback state.

4. **Filter and search toolbar**
   - Первый уровень: segmented filters `To do / All / Done` с counts; `Archived` находится в overflow, потому что это вторичный режим.
   - Search открывается icon button или строкой при наличии достаточной ширины; после открытия input получает focus, `Escape` очищает/закрывает только если пользователь не ввёл запрос.
   - Tags, smart/custom sort и density находятся в одном `View options` disclosure; trigger показывает badge, если фильтр активен.
   - Активные tag filters отображаются removable chips под toolbar; есть `Clear all`, но нет отдельной панели, занимающей весь первый viewport.

5. **Habit list**
   - Pending habits всегда идут до completed в default view; smart sort объясняется коротким доступным текстом в `View options`.
   - **Comfortable card:** emoji в `40x40` identity cell; имя и schedule; до двух tag chips; streak/последние 7 planned opportunities; справа явный completion control.
   - **Compact row:** emoji, имя, краткий status и completion control; дополнительные metrics скрыты, но action остаётся того же размера.
   - Daily target `>1`: вместо binary check показывать `− / current of target / +`; достижение target меняет состояние, но пользователь может исправить count.
   - Negative habit: label объясняет смысл action (`Mark day successful`), чтобы unchecked state не читался как необходимость выполнить вредную привычку.
   - Completed card получает muted surface и visible `Completed` status; не исчезает мгновенно из `To do`, пока celebration/undo активны, затем сворачивается в `Done today` section.
   - Overflow actions: open details, edit, reminder, archive; destructive delete остаётся только в detail/form confirmation, не в основном quick menu.
   - Habit name везде формируется через `formatHabitLabel()`; emoji не дублируется отдельным span и в label одновременно.

6. **Reorder and gestures**
   - Desktop drag handle появляется в explicit custom sort/reorder mode; normal card click не начинает drag.
   - Mobile reorder включается отдельным mode с up/down controls либо long-press handle; horizontal swipe не конфликтует с browser back и vertical scroll.
   - Swipe action имеет видимый keyboard/button equivalent; ни одно действие не существует только как gesture.

7. **Temporal preview and reminders**
   - На desktop preview может занимать правую колонку summary; на mobile он появляется после первого actionable habit или ниже habit list.
   - Reminders показываются compact disclosure/list после habits, если требуют внимания; они не конкурируют с today progress.

Desktop layout:

- Header и toolbar ограничены общим max-width; summary использует `8/4` grid только если temporal preview доступен, иначе один широкий блок без пустой колонки.
- Habit list имеет одну колонку до `1100 px`; две колонки допустимы только для comfortable cards одинакового interaction contract и без нарушения custom order.

Mobile layout:

- Первый viewport содержит `Today`, progress и минимум одну actionable habit.
- Filter bar может прокручиваться только внутри себя, но предпочтительно помещается без горизонтального scroll на `390 px`.
- Completion control находится справа или в нижней action-row и не ближе `8 px` к overflow button.
- После открытия software keyboard search input и результаты остаются видимы; bottom nav не перекрывает последнюю card action.

UI states:

- **First use:** onboarding с одним primary `Create a habit`, максимум тремя template suggestions и ссылкой `Start from scratch`.
- **Hydrating:** skeleton summary + 3 habit rows; onboarding не показывается до завершения первой hydration.
- **Filtered empty:** сохраняет toolbar и active chips, текст `No habits match these filters`, action `Clear filters`.
- **All done:** completed summary, collapsed `Done today` list и optional action `Review progress`; не предлагать создать новую привычку как главный CTA.
- **Offline mutation:** card показывает pending sync indicator без блокировки следующих check-ins; error даёт retry рядом с конкретной habit.

Файлы:

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte`
- новый `apps/web/src/lib/components/dashboard/DashboardToolbar.svelte`
- новый `apps/web/src/lib/components/habits/HabitCompletionControl.svelte`
- новый `apps/web/src/lib/components/habits/HabitStatusStrip.svelte`
- `apps/web/src/lib/components/TodayBlock.svelte`
- `apps/web/src/lib/components/Onboarding.svelte`
- `apps/web/src/lib/components/RemindersPanel.svelte`
- `apps/web/src/lib/habits/completionCelebration.ts`
- dashboard/overlay/gesture unit tests
- новые component tests для toolbar, completion control, negative habit и daily target states

Критерии проверки:

- основной check-in доступен без открытия меню;
- на `390x844` минимум одна pending habit доступна в первом viewport при типичном title/summary;
- dailyTarget counter и negative habit action невозможно спутать с обычным binary check;
- filters не занимают первый viewport по умолчанию;
- active filter всегда виден как chip/badge и может быть очищен одним действием;
- drag/swipe не конфликтуют с вертикальным scroll;
- все gesture actions имеют button/keyboard alternative;
- completed, pending, archived и negative habit состояния различимы;
- hydration skeleton не переключается на onboarding до получения snapshot;
- onboarding, empty filtered list и hydrated empty account не смешиваются;
- существующие dashboard unit tests и `npm run check:web` зелёные.

### UI-006. Обновить habit detail и form

Приоритет: `P1`  
Зависимости: `UI-003`, `STATS-001`, `STATS-004`

Что сделать:

- выстроить detail как «состояние → ближайшая цель → история → настройки»;
- убрать дублирующие stat cards и guide tooltips, которые не помогают принять решение;
- привести form sections к единому density и ясным validation/error состояниям;
- добавить компактную историю временных паттернов без дублирования основной statistics page.

Что именно реализовать в habit detail:

1. **Header:** back link `Today`, emoji + полное имя, status pill `Active / Archived`, overflow с `Edit / Archive`; delete находится в отдельной danger-zone ниже страницы.
2. **Today action:** самый заметный блок показывает schedule state и completion control того же contract, что dashboard; daily target и negative habit не получают отдельную несовместимую механику.
3. **Nearest milestone:** один milestone, current streak и remaining scheduled opportunities; historical best показывается supporting text, а не competing hero metric.
4. **Recent rhythm:** последние `14` или `28` плановых возможностей в компактной strip/calendar; состояния `completed / missed / frozen / not scheduled / future` имеют icon/pattern и accessible label, не только цвет.
5. **Trend:** current vs previous comparable window и короткий текст; raw chart удаляется, если он не добавляет решения.
6. **Temporal pattern:** только pattern конкретной привычки с sample и рекомендацией; если данных мало, section объясняет нужный минимум либо скрывается.
7. **Schedule and reminder summary:** readable summary `Mon, Wed, Fri · 08:00` и явная ссылка `Edit settings` вместо повторения полной формы.
8. **Danger zone:** archive/restore и delete разделены; delete требует confirmation с названием привычки и объясняет судьбу history.

Что именно реализовать в habit form:

- Одна форма с секциями `Identity`, `Schedule`, `Goal`, `Reminder`, `Organization`; на desktop content не шире `720 px`, без двухколоночной сетки длинных полей.
- **Identity:** emoji picker/field, name, optional description, color; live preview показывает итоговый `emoji + name`, но не занимает половину экрана.
- **Schedule:** сначала presets `Daily / Weekdays / Weekends / Custom`; custom открывает seven-day picker с полными accessible names; frequency summary обновляется сразу.
- **Goal:** тип `Build / Avoid`, daily target и target streak; при смене типа copy и completion preview явно объясняют будущий action.
- **Reminder:** master switch; time и permission/help появляются только при включении; denied notification permission показывает инструкцию, а не бесконечный retry.
- **Organization:** tags как token input с keyboard remove; duplicate/empty tags не создаются.
- Required labels имеют видимый indicator; hint и error занимают стабильное место, чтобы поля не прыгали после submit.
- Validation запускается после blur/submit, фокус переводится к первому invalid field, наверху появляется compact error summary со ссылками на поля.
- Primary action `Create habit / Save changes`, secondary `Cancel`; на mobile action bar располагается над bottom safe area, но не закрывает focused input.
- При unsaved changes browser back/internal navigation вызывает confirmation; успешное сохранение возвращает на detail и показывает non-blocking toast.
- Edit form загружает skeleton до данных; submit disabled только во время реального request, ошибка сохраняет введённые значения и даёт retry.

Desktop layout:

- Detail использует широкую основную колонку `minmax(0, 2fr)` и правую summary-колонку `minmax(280px, 1fr)` только для milestone/schedule; history и temporal pattern не сжимаются в узкую sidebar.
- На ширине меньше `900 px` detail переходит в одну колонку без перестановки смыслового порядка.

Mobile layout:

- Header actions помещаются в overflow; today action и milestone видны до длинной history.
- Calendar/strip не требует horizontal scroll; если `28` cells не помещаются, используется responsive grid, а не уменьшение touch targets.
- Sticky form actions учитывают `BottomNav`; при необходимости bottom nav скрывается на create/edit route, но это решение должно быть одинаковым для new и edit.

Файлы:

- `apps/web/src/routes/app/(protected)/habit/[id]/+page.svelte`
- `apps/web/src/routes/app/(protected)/habit/[id]/edit/+page.svelte`
- `apps/web/src/routes/app/(protected)/habit/new/+page.svelte`
- `apps/web/src/lib/components/HabitForm.svelte`
- `apps/web/src/lib/components/habit-form/*.svelte`
- `apps/web/src/lib/components/StatCardGrid.svelte`
- `apps/web/src/lib/components/TargetRingSection.svelte`
- `apps/web/src/lib/components/AutomatismSection.svelte`
- `apps/web/src/lib/components/MonthlyRateSection.svelte`
- `apps/web/src/lib/components/WeeklyCompletionsSection.svelte`
- `apps/web/src/lib/components/habits/HabitRhythmCalendar.svelte`
- новый общий `apps/web/src/lib/components/habits/HabitCompletionControl.svelte`, созданный в `UI-005`
- detail/form unit tests

Критерии проверки:

- главная цель и текущее состояние привычки видны в первом viewport;
- edit/archive/delete не конкурируют с основным check-in;
- detail не дублирует одну метрику в hero, stat card и chart одновременно;
- completed/missed/frozen/not-scheduled различимы без опоры только на цвет;
- form labels, hints и errors связаны с controls;
- submit с несколькими ошибками переводит focus к первой и сохраняет остальные значения;
- unsaved changes защищены при browser Back и внутренних ссылках;
- notification denied, offline save error и loading имеют отдельные состояния;
- длинное имя с emoji не ломает layout и форматируется через `formatHabitLabel()`;
- detail корректен для новой, архивной, negative и низкочастотной привычки.

### UI-007. Распространить визуальный язык на публичные страницы

Приоритет: `P2`  
Зависимости: `UI-004`, `UI-005`

Что сделать:

- обновить public navigation, landing sections, preview и CTA в том же визуальном языке;
- не превращать landing в набор одинаковых glass cards;
- заменить screenshots после стабилизации app UI;
- сохранить SEO metadata, structured data и существующие route contracts.

Что именно реализовать в UI:

- **Public header:** плоский product mark + `Habbit Runner`, существующие navigation links, secondary sign-in и primary `Start tracking`; mobile menu открывается под header как dialog/sheet, блокирует background scroll и закрывается после navigation.
- **Hero:** один конкретный value proposition, один primary и один secondary CTA; рядом реальный product preview с today progress и habit cards, а не абстрактная gradient illustration.
- Hero не использует generic badge + giant gradient headline + три floating glass cards; визуальная узнаваемость строится на route/check motif новой иконки и реальном интерфейсе продукта.
- **Proof strip:** только проверяемые свойства продукта (`Offline-first`, `No app store`, `Private by default`); не добавлять вымышленные ratings, user counts или logos.
- **How it works:** три шага `Create → Check in → Learn your rhythm` с короткими UI-фрагментами, а не одинаковыми feature cards.
- **Feature narrative:** отдельные alternating sections для today flow, streak recovery и temporal progress; каждый блок имеет один screenshot/illustration и один вывод.
- **Product preview:** desktop/mobile screenshots нового UI; carousel имеет buttons, pagination label, pause для auto-play либо вообще не auto-plays.
- **FAQ:** native-like disclosure с доступным expanded state; открытие вопроса не вызывает скачок всей страницы из-за absolute content.
- **Final CTA:** повторяет основной следующий шаг, не добавляет третье предложение; footer сохраняет privacy/about/blog links.
- Blog, feature и comparison pages получают те же header/footer/tokens, но не переписываются в лендинги и сохраняют читаемую ширину статьи.

Desktop layout:

- Hero использует asymmetric `5/7` или `6/6` composition; preview может выходить за reading column, но не за viewport.
- Section rhythm чередует широкие product visuals и узкие text columns; не использовать одну и ту же сетку карточек для всех секций.

Mobile layout:

- Hero order: value proposition → CTA → product preview; оба CTA имеют full/near-full width только если помещаются без ложной равнозначности.
- Preview не содержит unreadable desktop screenshot, уменьшенный до `320 px`; использовать отдельный mobile crop.
- Mobile menu, carousel и FAQ полностью управляются keyboard/screen reader и не конфликтуют со swipe navigation браузера.

Файлы:

- `apps/web/src/routes/+page.svelte`
- `apps/web/src/lib/components/PublicLanding.svelte`
- `apps/web/src/lib/components/PublicNav.svelte`
- `apps/web/src/lib/components/PublicPreviewCarousel.svelte`
- `apps/web/src/lib/components/public/*.svelte`
- `apps/web/src/lib/components/PublicSeoPage.svelte`
- `apps/web/static/screenshots/desktop.png`
- `apps/web/static/screenshots/mobile.png`
- public page unit tests

Критерии проверки:

- landing визуально связан с app shell и новой иконкой;
- hero показывает реальный продукт и не содержит неподтверждённого social proof;
- primary CTA одинаково называется в header, hero и final CTA;
- mobile menu управляет focus и background scroll;
- preview использует отдельные desktop/mobile assets без размытого масштабирования;
- CTA различим, доступен с клавиатуры и не вызывает layout shift;
- metadata/JSON-LD не регрессировали;
- screenshots соответствуют текущему приложению;
- public routes проходят build/prerender без `404` assets.

### QA-001. Провести accessibility, responsive и visual regression gate

Приоритет: `P0` для release  
Зависимости: `STATS-006`, `UI-004`, `UI-005`, `UI-006`, `ICON-002`

Что сделать:

- сравнить утверждённый baseline на `320`, `390`, `768`, `1024`, `1440 px`;
- проверить keyboard-only flow, screen reader names, reduced motion и contrast;
- проверить empty/loading/error/offline/long-content состояния;
- проверить PWA install и иконки на реальном Chromium, Safari/WebKit и Firefox;
- записать итоговые screenshot и ручные сценарии в docs.

UI-проверки по компонентам:

- **Navigation:** active state, deep route, theme sheet, logout confirmation, safe-area и focus return.
- **Dashboard:** first-use, hydrating, populated, all-done, filtered-empty, offline pending/error, daily target, negative habit, archived mode и reorder mode.
- **Stats:** no habits, no completions, low data, improving, stable, declining, comeback, strong weekday pattern, month pattern, no-pattern и partial current week.
- **Habit detail/form:** loading, active, archived, long name, missing description, custom schedule, permission denied, validation errors, unsaved changes и failed save.
- **Public pages:** mobile menu, hero at `320 px`, separate preview crops, carousel controls, FAQ expanded, reduced motion и no-JavaScript/prerendered content where supported.
- Для каждого state сравнивать не pixel-perfect весь viewport, а устойчивые regions: shell, header, primary action, data block и overlay; динамические даты/build time маскировать fixture-данными.
- Проверить browser zoom `200%`, text-only zoom, forced colors/high contrast, `prefers-reduced-motion` и keyboard traversal order.

Файлы:

- `apps/web/tests/e2e/visual-baseline.spec.ts`
- существующие или новые Playwright specs для dashboard/stats/temporal-pattern flows
- `apps/web/static/screenshots/README.md`
- `docs/project/modern-ui-gamified-stats-backlog.md` — отметить выполненные задачи только после gate

Критерии проверки:

- нет horizontal overflow на поддерживаемых viewport;
- ни один fixed/sticky action не перекрывает focused control, toast или последний элемент списка;
- visual snapshots используют deterministic timezone/date/fixture;
- `320 px` и `200%` zoom проходят без обрезания primary action и metric labels;
- core flows выполняются keyboard-only;
- текст и controls проходят WCAG AA, focus не скрыт;
- reduced motion отключает необязательную анимацию;
- PWA manifest и service worker не содержат missing assets;
- `cd apps/web && npm run test`;
- `cd apps/web && npm run check:web`;
- `git diff --check`.

[↑ Наверх](#top)

---

## 🗺️ Рекомендуемая очерёдность <a name="order"></a>

| Волна | Задачи | Результат |
|---|---|---|
| 0. Baseline | `UI-001` | воспроизводимые исходные экраны и список проблем |
| 1. Основа | `UI-002` → `UI-003` | токены и примитивы, на которых строятся новые экраны |
| 2. Контракт статистики | `STATS-001` → `STATS-002` → `STATS-003` | проверяемые метрики, временные паттерны и осторожные интерпретации |
| 3. Новая статистика | `STATS-005` | простой мотивирующий экран на существующем route |
| 4. Интеграция и cleanup | `STATS-004` → visual acceptance → `STATS-006` | preview на dashboard и удаление принятой legacy analytics |
| 5. Идентичность | `ICON-001` → `ICON-002` | плоский знак и корректный PWA asset pipeline |
| 6. Основной app redesign | `UI-004` → `UI-005` → `UI-006` | современный shell, dashboard, detail и form |
| 7. Публичный слой | `UI-007` | визуально согласованный landing и актуальные screenshots |
| 8. Release gate | `QA-001` | accessibility, responsive, PWA и regression verification |

Правило удаления legacy: `STATS-006` начинается только после отдельного подтверждения новой страницы на наполненном, пустом, low-data и declining сценариях. Feature flag не обязателен, но старые файлы не удаляются в том же коммите, в котором впервые появляется непроверенная новая композиция.

[↑ Наверх](#top)

---

## ✅ Общий Definition of Done <a name="definition-of-done"></a>

Задача считается выполненной только если:

- изменение связано с одной из целей документа и не добавляет самостоятельную платформу или механику;
- desktop и mobile states проверены в `cloud` и `midnight`;
- keyboard, focus-visible, contrast, loading, empty, error и offline состояния не забыты;
- user-facing habit labels используют `apps/web/src/lib/habits/formatHabitLabel.ts`;
- код, UI copy, logs и comments остаются на английском; русским является только этот planning-документ по прямому запросу;
- не добавлены suppressions, nested Java types и неявные env/config изменения;
- выполнены узкие тесты задачи и полный gate затронутого приложения;
- в backlog отмечен фактический статус, а не намерение.

[↑ Наверх](#top)

---

## ⚠️ Риски и откат <a name="risks"></a>

| Риск | Снижение риска | Откат |
|---|---|---|
| Redesign одновременно затрагивает слишком много экранов | выпускать по волнам после tokens/primitives; один feature surface на PR | вернуть конкретный экран на старую композицию, сохранив совместимые токены |
| Momentum воспринимается как непонятный «магический балл» | показать короткую методику и sample state; покрыть формулу unit tests | временно показывать только weekly progress и trend |
| Случайный weekday/month pattern выглядит как закономерность | minimum sample, effect threshold, окно и sample прямо в UI | скрыть temporal insight и оставить weekly progress/trend |
| Исследование превращается в псевдодиагностику | отделить наблюдение от рекомендации и запретить causal language | показывать только числовой паттерн без психологического copy |
| Удаление legacy ломает habit detail | repo-wide usage audit перед каждым удалением | восстановить только реально используемый shared component, не всю legacy page |
| Новая иконка обрезается maskable launcher | отдельный maskable export и safe-zone preview | вернуть предыдущие PNG в manifest, сохранив новый master для исправления |
| Десять тем дают визуальный drift | эталонные `cloud`/`midnight` и единый semantic contract | не удалять theme IDs; вернуть значения конкретной темы |

[↑ Наверх](#top)

---

## ❓ Открытые вопросы <a name="open-questions"></a>

Эти вопросы не блокируют начало `UI-001`–`UI-003` и `STATS-001`, но должны быть закрыты до соответствующей реализации:

1. Какой первый день недели использовать: locale пользователя или единый Monday-first? Рекомендация: locale/timezone пользователя, при этом aggregation tests должны быть deterministic.
2. Показывать ли все дни месяца `1–31` или только устойчивые фазы? Рекомендация: в основном выводе использовать `1–7 / середина / последние 7`, а day-of-month heat strip оставить только для progressive disclosure после достаточной выборки.
3. Какой minimum sample принять после usability-теста: текущие `28` planned opportunities для weekday pattern и `3` месяца для month phase либо более строгий порог?
4. Какой из 2–3 silhouette-вариантов иконки лучше передаёт «habit momentum» на `32x32`? Решение принимается по визуальным вариантам, а не в коде.
5. Нужно ли показывать статистику по archived habits? Рекомендация: не включать в текущий momentum, но оставить в исторических detail-данных.

[↑ Наверх](#top)

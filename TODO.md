
# План: мобильный UX, ретро-календарь и полноценный конструктор расписания

## Summary

Сделать три связанных изменения в одном проходе: опустить верхний контент PWA ниже iPhone status bar по всему приватному приложению, добавить на экране привычки интерактивный календарь для отметок прошлых
дней, и заменить текущую модель frequency + customDays на полноценное расписание с реальным влиянием на dashboard, detail и метрики.

## Key Changes

- ✅ Ввести новый объект расписания в shared/domain/sync-контракт:
    - schedule.type: 'daily' | 'weekly_days' | 'weekly_quota' | 'monthly_rules'
    - weekly_days: weekdays: number[]
    - weekly_quota: timesPerWeek: number, weekdays?: number[]
    - monthly_rules: mode: 'weeks_of_month' | 'times_per_month', timesPerMonth?: number, weeksOfMonth?: Array<1 | 2 | 3 | 4 | 'last'>, weekdays?: number[]
    - frequency оставить только как legacy-derived поле для обратной совместимости sync/storage на переходный период, но вся новая логика должна читать schedule
- ✅ Выполнить миграцию существующих привычек в новый формат без потери данных:
    - daily -> daily
    - weekdays -> weekly_days с [1,2,3,4,5]
    - weekends -> weekly_days с [0,6]
    - custom + customDays -> weekly_days с текущим набором дней
    - Если schedule отсутствует, клиент и сервер всегда вычисляют его из legacy-полей при чтении
- Добавить единый слой расписаний, например lib/habits/schedule.ts, и перевести на него все расчёты:
    - isScheduledForDate(habit, date)
    - getScheduleStatusForDate(habit, date) для UI
    - getPeriodProgress(habit, date) для weekly/monthly quota
    - calculateScheduledStreak(...) и calculateScheduledCompletionRate(...)
    - Для quota-расписаний streak и completion rate считать по периодам: неделям или месяцам, не по дням
- Обновить dashboard-логику:
    - pending и done фильтры учитывать только привычки, запланированные на сегодня
    - В all оставлять все активные привычки
    - Для незапланированных на сегодня карточек показывать спокойный статус Not scheduled today
    - Главная кнопка в dashboard для незапланированных привычек не скрывается, но становится secondary-state и пишет отметку как manual completion; такая отметка сохраняется, но не влияет на pending/done
      текущего дня
- Обновить экран привычки:
    - Добавить блок ретро-календаря над heatmap или сразу после блока Today
    - Показывать последние 5-6 недель компактной сеткой с днями
    - Клик по дню переключает completion для этой даты через уже существующий setCompletionCount(habitId, date, count)
    - Для multi-target привычек тап по дню открывает компактный stepper/popover 0..dailyTarget, а не просто boolean-toggle
    - Прошлые даты редактируемы, будущие нет
    - Для дней вне расписания визуально показывать subdued state, но manual completion разрешать
- Полностью переработать UI редактирования расписания в AddEditHabit:
    - Вместо текущих четырёх frequency-chip сделать Daily, Days of week, Times per week, Monthly
    - Для Days of week: выбор конкретных дней
    - Для Times per week: выбор 1..7 и необязательное ограничение по allowed weekdays
    - Для Monthly: два подрежима
        - Weeks of month: выбор одной или нескольких недель месяца (1st, 2nd, 3rd, 4th, Last) и дней недели
        - Times per month: выбор 1..31
    - Под селекторами всегда показывать human-readable summary, например 3 times per week, Last week on Mon and Thu
    - Обновить валидацию: нельзя сохранить пустые weekday/weeks selections, quota должна быть в допустимом диапазоне
- ✅ Исправить mobile safe area app-wide:
    - Применить верхний safe-area inset к основным sticky header-блокам в dashboard, detail и add/edit
    - Добавить верхний padding на корневой мобильный layout, а не точечный хак в одном экране
    - Проверить PullToRefresh: индикатор и gesture-старт должны быть ниже status bar и не перекрывать tappable-зону iOS
    - Сохранить нижний safe area как сейчас

## Progress

- ✅ Shared schedule normalization + `describeSchedule` helper теперь живут в `packages/shared/src/schedule.ts`, включая `scheduleFromLegacy` и унифицированную валидацию новых типов.
- ✅ Клиентские утилиты `packages/web/src/lib/habits/schedule.ts` уже считают `isScheduledForDate`, `countCompletedDaysInRange` и `getPeriodProgress`, так что новые типы расписаний читаемы на фронте.
- ✅ UI редактирования расписания перешёл на `AddEditHabitSchedule` (`packages/web/src/pages/components/add-edit-habit/AddEditHabitSchedule.tsx`) с кнопкой выбора типа, сетками по дням/неделям и всегда актуальным описанием.
- ✅ AppLayout и `PullToRefresh` корректно применяют верхний safe-area inset для iOS-пакета и смещают индикатор обновления ниже статус-бара.
- ✅ На экране привычки добавлен интерактивный `HabitRetroCalendar` (новый файл несущественен) с поповером правки прошлых дат, многоцелевым редактированием и использованием `resolveHabitSchedule`.
- ✅ Dashboard теперь фильтрует/считает pending только по запланированным на сегодня привычкам, а карточки без расписания отображают статус „Not scheduled today“ и secondary-кнопку чекбокса.
- ✅ Расчёты streak/completion rate стали расписанием-aware (`calculateScheduledStreak`/`calculateScheduledCompletionRate`), stats теперь используют их, и покрыты unit-тестами для daily и weekly quota.
- 🚧 Осталось расширить планировщик: добавить `getScheduleStatusForDate`, расчёт streak/completion rate по периодам, обновить dashboard-фильтры/ручные completion и привести stats/pending logic к расписанию.

## Public Interfaces

- Изменить shared типы привычки и sync DTO так, чтобы Habit и HabitDto содержали schedule
- В Prisma и клиентском IndexedDB добавить хранение schedule как JSON
- Все компоненты/UI должны читать человекочитаемое описание через один helper describeSchedule(schedule), без локальных ручных строк

## Test Plan

- Unit:
    - миграция legacy frequency/customDays -> schedule
    - isScheduledForDate для daily, weekday sets, weekly quota, weeks-of-month и last week
    - streak/rate по периодам для weekly/monthly quota
    - manual completion вне расписания не ломает period-progress
- UI/integration:
    - dashboard pending/done/all корректно реагирует на расписание
    - ретро-календарь меняет completion прошлой даты и сразу обновляет stats/detail
    - multi-target день в календаре позволяет выставить 0..dailyTarget
    - sticky headers и pull-to-refresh не уходят под iOS status bar
- Verification:
    - npm run lint
    - npm run build
    - при изменении Prisma/DTO: cd packages/server && npx prisma generate и затем npm run build

## Assumptions

- Календарь делаем только на экране detail, не в dashboard-card
- Новое расписание реально влияет на поведение приложения, а не только хранится
- Для quota-расписаний streak и completion rate считаются по завершённым неделям/месяцам
- На переходный период legacy frequency/customDays остаются совместимым слоем, но source of truth становится schedule

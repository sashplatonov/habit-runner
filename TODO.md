# 🚀 План улучшения Habbit Runner — задачи для AI-агента

> Основан на [исследовании](file:///Users/sash/Dev/Projects/habbit-runner/TODO_HABBIT_RESEARCH.md) рынка трекеров привычек, психологических механизмов и анализе текущего кода.

---

## Сводка: что уже есть vs что нужно

| Функция | Текущий статус | Нужно |
|---|---|---|
| Отметка в 1 нажатие | ✅ Есть (toggle button в `HabitRow`) | — |
| Streak / цепочка дней | ✅ Есть (расчёт в `habitStats.ts`, отображение `FlameIcon`) | Улучшить визуал + freeze |
| Push-напоминания | ⚠️ Частично (поле `reminderTime` есть, но нет визуального reward) | Улучшить |
| Визуальный прогресс | ✅ Есть (`HeatmapGrid`, `CompletionRing`, `MiniHeatmap`) | Улучшить |
| Онбординг | ✅ Есть (`Onboarding.tsx`, 3 шаблона) | Улучшить |
| Гибкое расписание | ✅ Есть (`schedule` — daily/weekdays/custom/interval) | — |
| Streak Freeze | ⚠️ Есть `freezeDays[]` в типе, но нет UX для «streak freeze» | Нужен UX |
| Тёмная тема / кастомизация | ✅ Есть (dark/light темы, цвета привычек) | — |
| Микро-анимации при отметке | ❌ Нет | **Критично** |
| Автосортировка по сложности | ❌ Нет (manual reorder есть) | Добавить |
| Расширенная аналитика | ⚠️ Базовая (streak, completion rate, weekly/monthly) | Расширить |
| Механизм «прощения» streak | ❌ Нет | Добавить |
| Категоризация / группировка | ⚠️ Есть теги, но нет группировки по времени дня | Опционально |

---

## 🔥 ПРИОРИТЕТ P0 — Без этого продукт проигрывает

### Задача 1. Микро-анимация при отметке привычки (Reward Loop)

**Почему:** Замыкает петлю привычки — Cue → Routine → **Reward**. Без визуального вознаграждения допамин не выделяется. Исследования показывают -15% completion rate без feedback.

**Что менять:**
- [DashboardView.helpers.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/DashboardView.helpers.tsx) — `HabitRowToggleButton`: добавить CSS-анимацию при клике (пульсация, всплеск частиц, glow-эффект)
- [index.css](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/index.css) — добавить `@keyframes` для состояния `check-pulse`, `confetti-burst`
- Опционально: haptic feedback через Capacitor API

**Как проверить:**
- ✅ При нажатии на toggle button кнопка анимируется (scale → glow → settle)
- ✅ Анимация проигрывается при переходе из `unchecked` → `checked`, но НЕ при `checked` → `unchecked`
- ✅ Визуально заметное отличие от текущего состояния

---

### Задача 2. Механизм «Streak Freeze» — прощение пропусков

**Почему:** При потере длинного стрика ~30% пользователей бросают совсем. Streak freeze повышает retention на +25% (данные Duolingo).

**Что менять:**
- [habit.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/types/habit.ts) — добавить `streakFreezeCount: number` (сколько freeze-дней осталось), `streakFreezeUsed: string[]`
- [habitStats.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/lib/habits/habitStats.ts) — `countCurrentStreak()`: учитывать `freezeDays` — не ломать стрик, если день в списке freeze
- [HabitDetailView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/HabitDetailView.tsx) — добавить UI для кнопки «Freeze today» (уже есть `toggleFreezeToday` в `HabitDetail.tsx`, но нет заметного UX)
- [DashboardView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/DashboardView.tsx) — показать индикатор доступных freeze

**Как проверить:**
- ✅ Streak не обнуляется, если день был заморожен
- ✅ В UI видно количество доступных freeze (например «❄️ 2 freeze left») — сделано: видно иконку заморозки.
- ✅ При нажатии «Freeze today» день помечается и стрик сохраняется

---

### Задача 3. Визуальное вознаграждение за 100% дня

**Почему:** Эффект Зейгарник (незавершённость мотивирует) + закрытие кольца Apple Watch = мощнейший визуальный reward.

**Что менять:**
- [CompletionRing.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/components/CompletionRing.tsx) — добавить анимацию при достижении 100% (glow burst, цвет заполнения меняется)
- [DashboardView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/DashboardView.tsx) — `DashboardHero`: показать celebration-сообщение при `todayRate === 100`

**Как проверить:**
- ✅ Когда все привычки дня выполнены, кольцо анимируется
- ✅ Появляется короткое поздравительное сообщение/анимация

---

## 🟡 ПРИОРИТЕТ P1 — Значительно повышает retention и UX

### Задача 4. Автосортировка привычек по сложности (Инсайт #10)

**Почему:** Привычка первой в списке выполняется на 60% чаще. Лёгкая первой → +35% вероятность выполнения остальных. **Ни один конкурент этого не делает.**

**Что менять:**
- [habit.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/types/habit.ts) — добавить `difficulty?: 1 | 2 | 3 | 4 | 5` (сложность, выбирается при создании)
- [AddEditHabitPage.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/add-edit-habit/AddEditHabitPage.tsx) — добавить секцию «How easy is this for you?» (1-5 slider)
- [useDashboardModel.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/hooks/useDashboardModel.ts) — опция сортировки: по `difficulty` (low → high), по историческому completion rate
- [DashboardView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/DashboardView.tsx) — добавить toggle «Sort: Custom / Smart» в FilterBar
- [db.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/lib/storage/db.ts) — миграция DB v5: добавить поле `difficulty`

**Как проверить:**
- [ ] При создании привычки есть slider сложности
- [ ] При «Smart sort» привычки выстраиваются от лёгких к сложным
- [ ] Ручная сортировка (reorder) остаётся доступной

---

### Задача 5. Лимит 3 привычки на старте + прогрессивная разблокировка (Инсайт #2)

**Почему:** 1-3 привычки → D30 retention 42%. 7+ → D30 retention 8%. Прогрессивная разблокировка = контринтуитивно, но данные однозначны.

**Что менять:**
- [Onboarding.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/components/Onboarding.tsx) — изменить текст: «Research shows starting with 3 habits is optimal. Pick your first.»
- [useDashboardModel.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/hooks/useDashboardModel.ts) — добавить soft-лимит: если `habits.length >= 3` и ни одна привычка не имеет 14+ дней стрика → показать предупреждение при попытке добавить 4-ю
- [AddEditHabit.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/AddEditHabit.tsx) / [useAddEditHabitModel.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/hooks/useAddEditHabitModel.ts) — показать soft-warning modal

**Как проверить:**
- [ ] При 3+ привычках и отсутствии 14-дневного стрика — показан soft warning (не блокирующий)
- [ ] После 2 недель стабильного выполнения предупреждение убирается
- [ ] Пользователь может проигнорировать предупреждение и добавить привычку

---

### Задача 6. Score автоматизма вместо «66 дней» (Инсайт #5)

**Почему:** «66 дней» — миф. Показываем score автоматизма на основе consistency, скорости отметки, частоты пропусков. **Никто из конкурентов этого не делает.**

**Что менять:**
- [habitStats.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/lib/habits/habitStats.ts) — добавить `calculateAutomatismScore(habit): number` (0-100%), учитывающий: consistency за 30 дней, streak длину, частоту пропусков
- [HabitDetailView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/HabitDetailView.tsx) — показать «Automatism score: 73%» с визуальной шкалой
- [StatsView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/StatsView.tsx) — общий score автоматизма по всем привычкам

**Как проверить:**
- [ ] На странице деталей привычки показан score 0-100%
- [ ] Score растёт при последовательном выполнении
- [ ] Score убедительно отражает реальную «автоматичность» привычки

---

### Задача 7. Эффект незавершённости / предзаполненный прогресс (Инсайт #4)

**Почему:** Эффект Зейгарник: частично заполненный круг мотивирует СИЛЬНЕЕ чем пустой. Вечернее push «Осталась 1 привычка» эффективнее утреннего «У тебя 5 привычек».

**Что менять:**
- [DashboardView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/DashboardView.tsx) — `DashboardHero`: изменить текст рядом с кольцом:
  - Если 0% → «Start your streak» (нейтрально, без вины)
  - Если 50-99% → «Almost there — N left!» (мотивация)
  - Если 100% → «Perfect day! 🎉»
- Вечернее push-уведомление: «You're 1 habit away from a perfect day»

**Как проверить:**
- ✅ Текст рядом с CompletionRing динамически меняется в зависимости от процента
- ✅ Тон текста мотивирующий, не вызывающий вину

---

## 🟢 ПРИОРИТЕТ P2 — Конкурентное преимущество и монетизация

### Задача 8. Расширенная аналитика (драйвер монетизации #1)

**Почему:** #1 причина покупки premium. Пользователи хотят видеть свои данные красиво.

**Что менять:**
- [StatsView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/StatsView.tsx) — добавить:
  - Тепловая карта всех привычек за год (a-la GitHub contributions)
  - Лучший день недели (когда пользователь выполняет больше всего)
  - Худший день недели
  - «Инвестиция»: «You tracked 247 days. That's 67% of the year»
- [habitStats.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/lib/habits/habitStats.ts) — добавить `getBestWeekday()`, `getWorstWeekday()`, `getTotalTrackedDays()`

**Как проверить:**
- [ ] На странице Stats отображаются новые метрики
- [ ] Данные корректно рассчитываются на реальных completions

---

### Задача 9. Специальный UX для отрицательных привычек (Инсайт #8)

**Почему:** 60% пользователей хотят трекать «не делать X», но completion rate на 40% ниже. Огромная незаполненная ниша.

**Что менять:**
- [habit.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/types/habit.ts) — добавить `type?: 'positive' | 'negative'`
- [AddEditHabitPage.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/add-edit-habit/AddEditHabitPage.tsx) — toggle «I want to DO this» / «I want to STOP this»
- [DashboardView.helpers.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/DashboardView.helpers.tsx) — для negative привычек показывать «14 days free 🏆» вместо стрика
- [habitStats.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/lib/habits/habitStats.ts) — для negative: считать стрик как дни БЕЗ отметки (инвертированная логика)

**Как проверить:**
- [ ] При создании привычки можно выбрать «negative» тип
- [ ] Для negative привычек отображается «N days free» вместо стрика
- [ ] Стрик корректно считается (дни без relapse)

---

### Задача 10. «Артефакты памяти» — data lock-in (Инсайт #7)

**Почему:** Sunk cost fallacy привязывает к приложению. «У меня тут 8 месяцев данных» — #1 причина, почему люди не уходят.

**Что менять:**
- [StatsView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/StatsView.tsx) — добавить секцию «Your Investment»:
  - «You tracked X days. That's Y% of the year»
  - «Your longest streak: N days»
  - «Habits completed: M total»
- В будущем: годовой отчёт (Spotify Wrapped style — отдельная задача)

**Как проверить:**
- [ ] На странице Stats видна секция с «Your Investment»
- [ ] Данные корректные и эмоционально привлекательные

---

### Задача 11. Сочувственные сообщения при пропусках (Мета-инсайт: «момент пропуска»)

**Почему:** 2 пропущенных дня подряд → 74% вероятность churn. Дженерик-напоминание не работает. Нужно ОСОБОЕ сочувственное сообщение.

**Что менять:**
- [DashboardView.tsx](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/pages/components/DashboardView.tsx) — если пользователь вернулся после 2+ дней без отметок → показать специальный banner:
  - «Welcome back! Missing a day doesn't erase your progress. Your longest streak is still N days.» 
  - НЕ «You missed 2 days!»
- [habitStats.ts](file:///Users/sash/Dev/Projects/habbit-runner/packages/web/src/lib/habits/habitStats.ts) — `getDaysSinceLastCompletion(): number`

**Как проверить:**
- ✅ При возвращении после 2+ дней показан сочувственный banner
- ✅ Тон сообщения поддерживающий, не обвинительный
- ✅ Banner можно закрыть (он исчезает при отметке)

---

## 📊 Итоговая матрица приоритизации

| # | Задача | Влияние | Усилия | Категория |
|---|---|---|---|---|
| 1 | Микро-анимация при отметке | 🔴 Высокое | 🟢 Низкие | Функционал + UX |
| 2 | Streak Freeze | 🔴 Высокое | 🟡 Средние | Функционал |
| 3 | Визуальный reward за 100% | 🔴 Высокое | 🟢 Низкие | UX |
| 4 | Автосортировка по сложности | 🔴 Высокое | 🟡 Средние | Функционал + UX |
| 5 | Лимит 3 привычки на старте | 🟡 Среднее | 🟢 Низкие | UX + Продажи |
| 6 | Score автоматизма | 🟡 Среднее | 🟡 Средние | Функционал |
| 7 | Эффект незавершённости | 🟡 Среднее | 🟢 Низкие | UX |
| 8 | Расширенная аналитика | 🟡 Среднее | 🔴 Высокие | Продажи |
| 9 | Negative habits UX | 🟡 Среднее | 🟡 Средние | Функционал |
| 10 | Data lock-in / «Your Investment» | 🟢 Среднее | 🟢 Низкие | Продажи |
| 11 | Сочувственные сообщения | 🟡 Среднее | 🟢 Низкие | UX + Retention |

---

## Рекомендованный порядок выполнения

```
Sprint 1 (Quick wins — P0):
  ① Задача 1: Микро-анимации (~2ч)
  ② Задача 3: Reward за 100% (~1ч)
  ③ Задача 7: Мотивирующий текст (~1ч)

Sprint 2 (Core improvements — P0/P1):
  ④ Задача 2: Streak Freeze UX (~3ч)
  ⑤ Задача 11: Сочувственные сообщения (~2ч)
  ⑥ Задача 5: Лимит 3 привычки (~2ч)

Sprint 3 (Differentiation — P1):
  ⑦ Задача 4: Автосортировка (~4ч)
  ⑧ Задача 6: Score автоматизма (~3ч)

Sprint 4 (Monetization — P2):
  ⑨ Задача 10: Data lock-in (~2ч)
  ⑩ Задача 8: Расширенная аналитика (~6ч)
  ⑪ Задача 9: Negative habits (~4ч)
```

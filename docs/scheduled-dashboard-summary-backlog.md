# Scheduled Dashboard Summary - Implementation Backlog

## Goal

Add a minimal, responsive dashboard summary above the existing toolbar. It must show a 30-day schedule-aware completion heatmap and today's segmented progress, so only habits required on each relevant calendar day contribute to the displayed score. Desktop uses the wide reference-card composition; mobile uses the separate compact three-row composition from `docs/top/mobile-reference.html`.

## Architectural decisions

- The existing client-side habit snapshot is the source of truth: it already joins the authenticated user's habits with their check-ins into `Habit.completions`. This feature does not require an API, Quarkus, migration, or persistence change.
- `apps/web/src/lib/habits/schedule.ts` remains the single resolver for schedule eligibility. The aggregate must call `isMandatoryToday(habit, date, timeZone)` for each historical date, rather than reimplement daily, weekday, weekly-quota, monthly-week, or monthly-quota rules in a component.
- Completion state must come from `getHabitCompletionState`; this preserves `dailyTarget` and negative-habit semantics. Archived habits, dates before a habit was created, and frozen or non-mandatory dates are excluded from the denominator.
- Create one dashboard-level aggregate model/helper and one presentation component. Do not repurpose per-habit `MiniHeatmap.svelte`, which intentionally visualizes one habit and does not know its schedule, or duplicate date/percentage math in the route and component.
- A date with zero required habits is `neutral`, not incomplete, and does not add to `perfectDays`. For today it displays `0/0` and a neutral `—` score (not `0%`); it has no completed/incomplete segments. This avoids presenting an unscheduled day as a failure while retaining the required count.
- The current persisted schedule contract has daily, weekday, weekly quota, monthly-week, and monthly quota variants; it has no interval/every-N-days variant. This backlog must remain resolver-driven, so a future interval type participates once it is added to the shared resolver, but it must not add a new schedule type, database fields, or form UI as incidental dashboard work.
- User-facing dashboard copy remains English. The component is display-only; completion controls, filters, toolbar state, and existing route behavior must continue to use their current owners.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | SDS-001 | P1 | - | Establishes the single tested schedule-aware aggregate needed by both layouts. |
| 2 | SDS-002 | P1 | SDS-001 | Renders the desktop and purpose-built mobile summaries from the same data. |
| 3 | SDS-003 | P2 | SDS-002 | Proves real dashboard geometry and update behavior in the browser. |

## SDS-001: Build the schedule-aware 30-day dashboard aggregate

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

Create a pure dashboard aggregate for the authenticated dashboard's active habits, and connect it to the existing canonical schedule and completion helpers. It produces the last 30 chronological calendar days (including today), today segments, count of perfect required days, and presentation-safe percentages; it does not render UI.

**Files:**

- Create `apps/web/src/lib/dashboard/scheduledCompletionSummary.ts`.
- Modify `apps/web/src/lib/habits/schedule.ts` only if a small exported date-oriented alias/helper is needed to make the existing `isMandatoryToday(habit, date, timeZone)` semantic unambiguous; do not alter scheduling rules.
- Modify `apps/web/tests/unit/schedule.test.ts` only for a necessary date-resolver regression.
- Create `apps/web/tests/unit/scheduledCompletionSummary.test.ts`.
- Search anchors: `isMandatoryToday`, `getScheduleStatusForDate`, and `resolveHabitSchedule` in `apps/web/src/lib/habits/schedule.ts`; `getHabitCompletionState` in `apps/web/src/lib/habits/completionState.ts`.

**Goal:**

Return one deterministic model which says which habits were required and completed for every dashboard day, rather than treating every active habit as due every day.

### Outcome

For a supplied date/timezone and active-habit snapshot, the model has exactly 30 ordered cells ending on that date, a completed/required count and brightness level for each required day, neutral cells for days with no requirement, and today's one-segment-per-required-habit progress data.

### Architectural decision

The helper owns only cross-habit aggregation. `schedule.ts` decides obligation and `completionState.ts` decides whether an individual habit is complete; the aggregate composes them once for both desktop and mobile. It must use the user's calendar timezone and canonical completion keys, not browser-local midnight arithmetic.

### Required changes

1. Define exported model types for a 30-day cell, today's ordered segments, and the overall summary. Include a distinct `neutral` cell state plus a bounded completion ratio/visual level for required days; retain the exact calendar date and counts for accessible labels.
2. Generate the 30-day range from the supplied reference date in the supplied/current user timezone. For each active habit, exclude it before its creation calendar date and when `getScheduleStatusForDate` reports frozen; otherwise ask the canonical mandatory resolver for that specific date.
3. Count a habit as completed only through `getHabitCompletionState(habit, completionKey).completed`. Set a required day to perfect only when `completed === required` and `required > 0`; never count neutral days as perfect or missed. Map non-perfect required ratios deterministically to the four non-neutral reference brightness levels while preserving `0/required` as the darkest required state.
4. Build today's segments from the same required-today collection in stable dashboard order. Each segment retains only whether its habit is completed and sufficient identifying data for an accessible aggregate label; do not add habit actions or names to the visual bar.
5. Add focused unit coverage for daily, selected-weekday, weekly quota, monthly-week/monthly-quota schedules; partial and full `dailyTarget`; negative habits; archived/pre-creation/frozen exclusions; a no-required day; exactly 30 ordered cells; and a timezone boundary. Test that the helper calls the common resolver semantics rather than assuming all active habits are due.

### Out of scope

- New schedule types such as every-N-days/interval schedules, and their API/database/form support.
- Changing the existing behavior of quota calculations, streaks, reminders, sorting, per-habit heatmaps, or check-in persistence.
- Rendering, dashboard layout, copy, or browser tests.

### Acceptance criteria

- A day whose required habits are all complete has the maximum bright level and increments `perfectDays` once; a partially complete required day has a proportionate lower level.
- A day with no required habits is returned as neutral, has no percentage score, and does not affect `perfectDays` or a missed-day metric.
- Today's `completed`, `required`, percent/neutral score, and segment count are computed from precisely the same mandatory-today set, including quota schedules evaluated as of today.
- An archived habit, a habit created after a historical cell, a frozen day, and an unscheduled weekday cannot inflate that cell's denominator or reduce its score.
- All returned dates and completion lookups remain correct for a supplied non-UTC timezone.

### Targeted validation

```bash
cd apps/web && npm run test -- scheduledCompletionSummary schedule
```

### Commit

```bash
git add apps/web/src/lib/dashboard/scheduledCompletionSummary.ts apps/web/src/lib/habits/schedule.ts apps/web/tests/unit/scheduledCompletionSummary.test.ts apps/web/tests/unit/schedule.test.ts
git commit -m "feat(dashboard): Aggregate scheduled completion history"
```

## SDS-002: Render the responsive scheduled dashboard summary

**Status:** TODO
**Priority:** P1
**Depends on:** SDS-001

**Exact scope:**

Add the new summary component at the top of the authenticated dashboard, replacing the existing `TodaySummary` placement there. Render distinct desktop and mobile structures from the common aggregate, following the supplied HTML references without moving the toolbar, filters, list controls, or completion mutations.

**Files:**

- Create `apps/web/src/lib/components/dashboard/ScheduledCompletionSummary.svelte`.
- Modify `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`.
- Modify `apps/web/src/lib/components/dashboard/TodaySummary.svelte` only if it is no longer used on this route; preserve it for other confirmed consumers.
- Create `apps/web/tests/unit/ScheduledCompletionSummary.test.ts`.
- Search anchors: `TodaySummary`, `scheduledToday`, `completedTodayCount`, and `todayDate` in `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`; `Surface` in `apps/web/src/lib/components/ui/Surface.svelte`.

**Goal:**

Show the requested compact schedule-aware completion signal before the dashboard controls, with an intentionally different mobile composition that stays small in the first viewport.

### Outcome

At desktop widths users see a wide minimal card with date/Daily completion, perfect days and today percentage, a horizontal 30-cell heatmap, then the today segmented bar. At widths at or below the reference 560px breakpoint, users see exactly the three compact rows specified by the mobile reference.

### Architectural decision

The route passes the aggregate and formatted date into a presentational component. The component uses the existing design tokens/`Surface` primitive but keeps a flat 30-column chronological heatmap rather than importing per-habit `MiniHeatmap`. It has no store reads, API calls, or local recomputation of schedule status.

### Required changes

1. Replace the route's `TodaySummary` instance with `ScheduledCompletionSummary`, deriving the shared aggregate from `activeHabits`, `todayDate`, and the current user timezone. Keep the existing `scheduledToday`, pending filter count, detail navigation, completion mutation flow, toolbar, and list rendering unchanged.
2. Implement the desktop card: first row has the formatted date and "Daily completion" on the left, `perfect days` and today's percent/neutral score on the right; second row has a single chronological 30-cell horizontal heatmap and a concise brightness legend; third row has completed/required, a "scheduled habits only" qualifier, percent/neutral score, and a segmented bar.
3. Implement a separate mobile DOM/layout at `max-width: 560px` with no hidden desktop content consuming space: (1) `Completion | date / scheduled only | today score`, (2) `30 days | 30 micro-cells | perfect-day count`, and (3) `Today X/Y | segmented progress | score`. Keep it three visual rows with compact padding, 7px-scale cells/segments, and no visual overflow at 320px.
4. Render every 30-day cell and each segment with non-color accessible text through a concise grouped `aria-label`/description. The visual heatmap is informational, non-interactive, and must not create 30 focus stops. The today bar exposes `completed of required` and percentage to assistive technology; the neutral state says no habits are scheduled rather than asserting 0% progress.
5. Ensure a large required-today count does not create fixed-width overflow: segments use a grid/flexible repeated track that remains inside the card, while the count stays readable. Maintain visible focus and at least 44px targets for unchanged adjacent interactive controls.
6. Add component tests for 30 cells, neutral state, full/partial state, exact segment count, accessible labels, and the presence of the compact mobile semantic structure without asserting implementation-only CSS class names.

### Out of scope

- Modifying individual `HabitTile`, `HabitCompactRow`, `MiniHeatmap`, statistics, detail, or onboarding layouts.
- New dashboard buttons, drill-down interactions, animations, tooltips, filters, or persistence.
- Changing tokens globally or recreating the reference page's mock tabs/search controls.

### Acceptance criteria

- On desktop, the summary is a single wide card above the existing toolbar and visually follows the desktop reference's three sections without changing toolbar/list behavior.
- At 560px and below, the component occupies only three compact visual rows; it does not render a wrapped desktop header, legend, headline, CTA, or an additional explanatory block.
- The heatmap has exactly 30 chronological cells; brighter cells mean a greater completed/required ratio, maximum brightness means every required habit completed, and neutral cells are distinguishable from darkest-required incomplete cells without color alone.
- Today's bar has exactly one bright/dark segment for each habit mandatory today, shows `completed/required` and percentage, and a no-required day is neutral rather than a failure.
- At 320px, 390px, and desktop widths, the summary and immediately following toolbar stay within the viewport; existing actionable controls remain reachable by keyboard and touch.

### Targeted validation

```bash
cd apps/web && npm run test -- ScheduledCompletionSummary && npm run check:types && npm run lint
```

### Commit

```bash
git add apps/web/src/lib/components/dashboard/ScheduledCompletionSummary.svelte apps/web/src/routes/app/\(protected\)/dashboard/+page.svelte apps/web/src/lib/components/dashboard/TodaySummary.svelte apps/web/tests/unit/ScheduledCompletionSummary.test.ts
git commit -m "feat(dashboard): Show scheduled completion summary"
```

## SDS-003: Prove scheduled-summary behavior and responsive geometry in the browser

**Status:** TODO
**Priority:** P2
**Depends on:** SDS-002

**Exact scope:**

Extend the existing authenticated dashboard journey fixture and browser assertions so schedule-aware calculation and actual desktop/mobile geometry are regression-protected. This task verifies the integrated feature; it does not add production behavior.

**Files:**

- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.
- Modify `apps/web/tests/unit/scheduledCompletionSummary.test.ts` only if the browser fixture reveals a missing aggregate boundary test.
- Search anchors: `mockBackend`, `habit`, `secondHabit`, and `keeps dashboard heatmaps usable` in `apps/web/tests/e2e/habit-journey.spec.ts`; Playwright projects in `apps/web/playwright.config.ts`.

**Goal:**

Demonstrate the user-visible dashboard summary with mixed schedules and prove it remains compact and non-overflowing at the target viewports.

### Outcome

The browser test fixture supplies known daily, weekday, quota, completed, incomplete, and unscheduled examples. It verifies the displayed counts/cells/segments after load and after a completion action, rather than treating a production build as responsive proof.

### Architectural decision

Keep API mocks in the existing critical user-journey file because they already model authenticated habits and check-ins. Browser assertions consume stable accessible labels and test ids/data attributes introduced solely for user-observable summary semantics; they must not inspect Svelte internals or weaken existing per-habit heatmap assertions.

### Required changes

1. Extend the mock habits/check-ins with deterministic created dates and mixed schedule types sufficient to demonstrate: an unscheduled weekday excluded today, a historical neutral day, a partial day, and a perfect day. Freeze the browser clock or otherwise make the date fixture deterministic across projects.
2. At desktop width, assert the summary appears above the toolbar, contains exactly 30 labeled heatmap cells, reports the expected perfect-day count/today `X/Y`/percentage, and has one segment per due-today habit.
3. At 320px and 390px, assert the compact three-row summary is visible, desktop-only explanation/legend is absent, no horizontal overflow occurs, and the toolbar's existing primary controls remain visible/reachable below it. At a desktop width, assert the desktop structure is used and remains inside the card bounds.
4. Toggle or complete a due-today habit through the existing UI and assert the summary's count, percentage, and segment state update; verify that an unscheduled habit does not change today's denominator.
5. Run the focused unit and browser tests plus the production web build. If the local Playwright web server cannot bind or Chromium cannot start, record the exact infrastructure blocker rather than calling browser proof successful.

### Out of scope

- Backend integration, remote CI, deployment, screenshots for release notes, or changing unrelated E2E suites.
- Altering existing test expectations solely to accommodate a product regression.
- Additional mobile redesign outside the new top summary.

### Acceptance criteria

- The end-to-end fixture proves the visible daily score excludes a habit not mandatory today and shows a neutral historical day without counting it as missed/perfect.
- The desktop run proves the 30-day strip and all today segments fit their summary card; the mobile runs prove the three-row summary, no horizontal page overflow, and reachable current dashboard controls at 320px and 390px.
- A user completion mutation updates the visible `completed/required`, percentage, and bright/dark segment state without reload.
- The focused unit tests, lint, type check, production build, and relevant desktop/mobile Playwright projects pass, or an external runtime blocker is explicitly reported with its command and error.

### Targeted validation

```bash
cd apps/web && npm run test -- scheduledCompletionSummary ScheduledCompletionSummary && npm run lint && npm run check:types && npm run build && npx playwright test tests/e2e/habit-journey.spec.ts --project=desktop --project=compact-mobile --project=mobile
```

### Commit

```bash
git add apps/web/tests/e2e/habit-journey.spec.ts apps/web/tests/unit/scheduledCompletionSummary.test.ts
git commit -m "test(dashboard): Cover scheduled summary responsiveness"
```

# Habit List 30-Day Heatmap Review - Remediation Backlog

## Goal

Make the completed dashboard heatmap work as a calendar-aligned 30-day activity view in every supported user timezone, while preserving its existing shared completion-key contract and responsive layouts.

## Architectural decisions

- `MiniHeatmap.svelte` owns only presentation of the existing canonical completion keys; neither the API, Quarkus domain, persistence model, nor migrations need to change.
- A `YYYY-MM-DD` calendar date is timezone-independent once derived. Weekday placement must use the shared UTC-based calendar helper, as the existing full `HabitHeatmap.svelte` does, rather than the browser-local `Date#getDay()`.
- Keep `MiniHeatmap` as the only 30-day list visualization. Do not duplicate date calculations in `HabitCompactRow`, `HabitTile`, or their tests.
- The completed review found no backend API, persistence, ownership, responsive-overflow, primary-control, or accessibility regression in the inspected scope. The targeted lint, unit, backend integration, and Playwright checks passed; deployed-device and remote-CI proof remain outside this local review.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | HLR-HEATMAP-RVW-001 | P2 | - | Corrects the shared calendar-grid geometry and locks the cross-timezone contract before further UI work. |

## HLR-HEATMAP-RVW-001: Align the mini heatmap grid with canonical calendar weekdays

**Status:** DONE
**Priority:** P2
**Depends on:** -

**Exact scope:**

Correct the leading placeholder calculation in `MiniHeatmap` so a 30-day sequence is aligned to the weekday of its canonical `YYYY-MM-DD` value in all browser timezones. The defect is currently reproducible in a UTC-negative timezone: `2026-07-30T00:00:00Z` is locally Wednesday in `America/Los_Angeles`, although the canonical calendar date is Thursday.

**Files:**

- Modify `apps/web/src/lib/components/MiniHeatmap.svelte`.
- Modify `apps/web/tests/unit/MiniHeatmap.test.ts`.
- Reuse `getWeekdayFromCalendarDate` from `apps/web/packages/shared/src/time.ts` (or its existing shared-package export); do not alter the completion-key format.

**Goal:**

The same calendar date appears in the same heatmap weekday row for users in UTC-positive and UTC-negative timezones, without changing which 30 days or completion values are displayed.

### Outcome

The heatmap retains exactly 30 chronological cells ending today, but its leading blank cells are based on the canonical calendar weekday rather than the machine's local representation of midnight UTC.

### Architectural decision

The shared calendar helper is the source of truth for weekday conversion because it uses `calendarDateToDate(...).getUTCDay()`. `MiniHeatmap` may derive its range from the current user's timezone, but it must not reinterpret already-derived calendar-date strings in the browser timezone.

### Required changes

1. Replace the local-time weekday calculation in `MiniHeatmap` with the shared canonical calendar-date weekday helper, keeping the current 30-day range and completion lookup keys unchanged.
2. Remove any now-unused date conversion import from the component; do not introduce a second date or completion-key conversion helper.
3. Extend the component test to assert the expected leading-grid alignment for a fixed date and to prove that the result remains canonical when the test process uses a UTC-negative timezone.
4. Retain the existing `dailyTarget` completion-state assertions so the geometry fix cannot weaken completion colouring behavior.

### Out of scope

- Changes to `HabitCompactRow.svelte`, `HabitTile.svelte`, the dashboard route, density preference, or primary action controls.
- New API endpoints, DTOs, Quarkus services, Flyway migrations, or stored timezone fields.
- Labels, tooltips, per-cell interactions, analytics, or a redesign of the full `HabitHeatmap`.

### Acceptance criteria

- A canonical date such as `2026-07-30` is placed using Thursday regardless of whether the browser/test process runs in `Europe/Belgrade` or `America/Los_Angeles`.
- The component still renders 30 unique dates from today minus 29 days through today and still uses `calendarDateToCompletionKey` for completion lookup.
- A completion below `dailyTarget` remains neutral and a completion meeting the target remains completed.
- Compact and comfortable dashboard consumers continue to use the shared component without new props, duplicate date calculations, or layout changes.

### Targeted validation

```bash
cd apps/web && npm run lint && TZ=America/Los_Angeles npm run test -- MiniHeatmap
```

### Commit

```bash
git add apps/web/src/lib/components/MiniHeatmap.svelte apps/web/tests/unit/MiniHeatmap.test.ts docs/habit-list-30-day-heatmap-review-backlog.md
git commit -m "fix(dashboard): Align heatmap weekdays across timezones"
```

## Rejected observations

- The current local Playwright scenario completed all 20 `habit-journey` project runs, including the 320 px compact and 1280 px comfortable heatmap checks; no responsive overflow or unavailable primary-control defect was reproduced.
- `HabitListQueryIT` passed, and the reviewed feature reads existing `Habit.completions`; there is no evidence that the heatmap change requires a backend, API, or database remediation.

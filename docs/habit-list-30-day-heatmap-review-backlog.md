# Habit List 30-Day Heatmap Review - Remediation Backlog

## Goal

Make the dashboard heatmap match the approved reference: a single horizontal 30-day activity row along the bottom of every compact row and comfortable tile, while preserving the corrected canonical timezone contract.

## Architectural decisions

- `MiniHeatmap.svelte` owns only presentation of the existing canonical completion keys; neither the API, Quarkus domain, persistence model, nor migrations need to change.
- A `YYYY-MM-DD` calendar date is timezone-independent once derived. Weekday placement must use the shared UTC-based calendar helper, as the existing full `HabitHeatmap.svelte` does, rather than the browser-local `Date#getDay()`.
- The approved list visualization is a one-row chronological signal: all 30 cells run from oldest to newest, left to right, along the card's bottom edge. The seven-row calendar layout is not part of this feature.
- Keep `MiniHeatmap` as the only 30-day list visualization. Do not duplicate date calculations or create a desktop/mobile variant in `HabitCompactRow`, `HabitTile`, or their tests.
- The completed review found no backend API, persistence, ownership, responsive-overflow, primary-control, or accessibility regression in the inspected scope. The targeted lint, unit, backend integration, and Playwright checks passed; deployed-device and remote-CI proof remain outside this local review.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | HLR-HEATMAP-RVW-001 | P2 | - | Completed: corrected the canonical weekday calculation in the former calendar grid. |
| 2 | HLR-HEATMAP-RVW-002 | P1 | HLR-HEATMAP-RVW-001 | Restores the approved one-row bottom heatmap in the shared component. |

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

## HLR-HEATMAP-RVW-002: Render the list heatmap as a single horizontal bottom row

**Status:** DONE
**Priority:** P1
**Depends on:** HLR-HEATMAP-RVW-001

**Exact scope:**

Correct the shared `MiniHeatmap` visual composition used by both dashboard densities. It currently uses `grid-flow-col grid-rows-7`, producing a multi-row weekly grid. The approved reference and the original feature backlog require one horizontal chronological row at the bottom of each card.

**Files:**

- Modify `apps/web/src/lib/components/MiniHeatmap.svelte`.
- Modify `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte` only if its lower heatmap container must be widened or constrained for the shared row.
- Modify `apps/web/src/lib/components/HabitTile.svelte` only if its lower heatmap container must be widened or constrained for the shared row.
- Modify `apps/web/tests/unit/MiniHeatmap.test.ts`.
- Modify `apps/web/tests/unit/HabitCompactRowHeatmap.test.ts`.
- Modify `apps/web/tests/unit/HabitTileHeatmap.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

**Goal:**

On mobile and desktop, each dashboard habit card displays one low-profile bottom row of 30 activity cells: the oldest day at the left, today at the right, with no weekly columns or multi-row wrapping.

### Outcome

The heatmap is visually equivalent to the approved reference: a compact, full-width timeline at the bottom of each card. It no longer makes the card tall or forms a seven-row calendar block.

### Architectural decision

`MiniHeatmap` remains the single owner of the 30-day sequence, canonical completion-key lookup, colours, and responsive cell geometry. Its consumers retain placement and the accessible range description only. Use a non-wrapping responsive row in the shared component; do not add a second heatmap or a consumer-specific date calculation.

### Required changes

1. Replace the seven-row column-flow layout and remove its leading weekday placeholder cells from `MiniHeatmap`; keep exactly 30 actual activity cells in chronological DOM order.
2. Use a responsive one-row layout that remains inside a 320 px card and uses the available bottom-row width on desktop without changing completion data, colours, or the `dailyTarget` rule.
3. Preserve the dedicated lower area in `HabitCompactRow` and `HabitTile`; adjust only its flex/grid constraints if required so the shared row cannot overlap the completion control or detail action.
4. Replace source-text-only assertions with rendered-DOM checks for one visual row, 30 cells, and chronological left-to-right order. Extend Playwright to measure the one-row geometry in compact 320 px and comfortable 1280 px layouts for every seeded card.

### Out of scope

- Changes to dashboard data loading, density preferences, completion mutation, detail routing, or primary-action semantics.
- API, DTO, Quarkus service, database, Flyway, and timezone-persistence changes.
- Week labels, per-cell editing, tooltips, analytics, and redesign of the full `HabitHeatmap` component.

### Acceptance criteria

- Every compact row and comfortable tile contains exactly 30 visible activity cells in one horizontal visual row at its bottom; cells neither wrap nor form a seven-row calendar grid.
- The first cell is today minus 29 calendar days and the last is today; DOM and visual order are oldest to newest, left to right.
- At 320 px, the heatmap remains inside its card with no page-level horizontal overflow, while completion and detail controls remain visible, named, and usable.
- At 1280 px, every comfortable tile uses its available lower-row width without exceeding its boundary or overlapping the completion control.
- A count below `dailyTarget` remains neutral and a count meeting it keeps the habit-theme colour. The existing canonical completion-key and timezone behaviour remain unchanged.

### Targeted validation

```bash
cd apps/web && npm run lint && npm run test -- MiniHeatmap HabitCompactRowHeatmap HabitTileHeatmap && npx playwright test habit-journey --project=desktop
```

### Commit

```bash
git add apps/web/src/lib/components/MiniHeatmap.svelte apps/web/src/lib/components/dashboard/HabitCompactRow.svelte apps/web/src/lib/components/HabitTile.svelte apps/web/tests/unit/MiniHeatmap.test.ts apps/web/tests/unit/HabitCompactRowHeatmap.test.ts apps/web/tests/unit/HabitTileHeatmap.test.ts apps/web/tests/e2e/habit-journey.spec.ts docs/habit-list-30-day-heatmap-review-backlog.md
git commit -m "fix(dashboard): Render habit heatmaps in one row"
```

## Rejected observations

- The prior local Playwright scenario did not reproduce page overflow or inaccessible primary actions, but it did not validate the approved one-row visual composition. Its green geometry assertion therefore does not close HLR-HEATMAP-RVW-002.
- `HabitListQueryIT` passed, and the reviewed feature reads existing `Habit.completions`; there is no evidence that the heatmap change requires a backend, API, or database remediation.

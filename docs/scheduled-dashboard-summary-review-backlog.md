# Scheduled Dashboard Summary - Review Remediation Backlog

## Goal

Correct the confirmed timezone, aggregation, and accessibility defects in SDS-001 through SDS-003 without changing the existing habits/check-ins API or dashboard completion controls.

## Architectural decisions

- The current instant, converted through the saved user timezone, is the canonical dashboard date. Route-level local-midnight construction must not create a second calendar boundary.
- The aggregate derives today segments from the same required-habit set used for the final history cell; schedule eligibility remains owned by `schedule.ts`.
- The summary stays display-only. Its assistive description belongs on the visual groups, while the live region announces only the changed today score.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | SDSR-001 | P1 | - | Prevents wrong completion date for a saved timezone differing from the browser timezone. |
| 2 | SDSR-002 | P2 | SDSR-001 | Removes duplicate aggregate selection paths. |
| 3 | SDSR-003 | P2 | SDSR-002 | Makes score changes concise and the visual data available to assistive technology. |

## SDSR-001: Use the saved user timezone for dashboard today

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

Use the current instant rather than browser-local midnight on the protected dashboard, and cover a browser UTC / user America/Los_Angeles boundary.

**Files:**

- Modify `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

### Outcome

At the same instant, the visible score and completion mutation use the saved user calendar date even when the browser timezone differs.

### Required changes

1. Derive the dashboard date/key with the current user timezone.
2. Add a deterministic Playwright regression for the UTC browser / Los Angeles user boundary.

### Acceptance criteria

- At `2026-08-28T12:00:00Z`, a saved `America/Los_Angeles` timezone renders the `2026-08-28` summary cell, not the previous day.
- Existing dashboard completion behavior remains unchanged.

### Targeted validation

```bash
cd apps/web && npx playwright test tests/e2e/habit-journey.spec.ts --project=desktop --grep "saved user timezone"
```

### Commit

```bash
git add apps/web/src/routes/app/\(protected\)/dashboard/+page.svelte apps/web/tests/e2e/habit-journey.spec.ts docs/scheduled-dashboard-summary-review-backlog.md
git commit -m "fix(dashboard): Respect saved timezone in summary"
```

## SDSR-002: Derive today segments from the history aggregate

**Status:** TODO
**Priority:** P2
**Depends on:** SDSR-001

**Exact scope:**

Remove the duplicate required-today filter in the scheduled completion aggregate.

**Files:**

- Modify `apps/web/src/lib/dashboard/scheduledCompletionSummary.ts`.
- Modify `apps/web/tests/unit/scheduledCompletionSummary.test.ts`.

### Outcome

The final history cell, today counts, and today segments share one required-habit collection.

### Required changes

1. Preserve the canonical schedule/completion helpers while retaining the required habits internally for the final calendar day.
2. Keep all exported model contracts unchanged and retain quota, negative-habit, frozen, and timezone coverage.

### Acceptance criteria

- Today segments contain exactly the habits counted by the final history cell.
- No API, persistence, or schedule contract changes are introduced.

### Targeted validation

```bash
cd apps/web && npm run test -- scheduledCompletionSummary
```

### Commit

```bash
git add apps/web/src/lib/dashboard/scheduledCompletionSummary.ts apps/web/tests/unit/scheduledCompletionSummary.test.ts docs/scheduled-dashboard-summary-review-backlog.md
git commit -m "refactor(dashboard): Share scheduled today aggregate"
```

## SDSR-003: Expose complete summary semantics without noisy live updates

**Status:** TODO
**Priority:** P2
**Depends on:** SDSR-002

**Exact scope:**

Give both visual data groups accessible descriptions and constrain live announcements to the updated today score.

**Files:**

- Modify `apps/web/src/lib/components/dashboard/ScheduledCompletionSummary.svelte`.
- Modify `apps/web/tests/unit/scheduledCompletionSummary.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

### Outcome

Screen readers can access each cell/segment state through its described chart, while completion changes announce only the new today result.

### Required changes

1. Attach concise descriptions to heatmap and segment groups without adding focus stops.
2. Move the polite live region from the full card to a dedicated score status.
3. Preserve compact 320px/390px geometry with readable labels.

### Acceptance criteria

- The heatmap and today bar have accessible descriptions containing their non-color states.
- A summary update does not make the full card a live region.
- Desktop and compact mobile layouts remain free of horizontal overflow.

### Targeted validation

```bash
cd apps/web && npm run test -- scheduledCompletionSummary && npx playwright test tests/e2e/habit-journey.spec.ts --project=desktop --project=compact-mobile --project=mobile --grep "scheduled dashboard summary"
```

### Commit

```bash
git add apps/web/src/lib/components/dashboard/ScheduledCompletionSummary.svelte apps/web/tests/unit/scheduledCompletionSummary.test.ts apps/web/tests/e2e/habit-journey.spec.ts docs/scheduled-dashboard-summary-review-backlog.md
git commit -m "fix(dashboard): Improve summary accessibility"
```

## Rejected observations

- The habits/check-ins API, authorization, and persistence contracts were inspected and already supply authenticated user-scoped snapshots; SDS introduced no backend change requiring remediation.

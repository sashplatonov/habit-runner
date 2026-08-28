# Progress Analytics Redesign - Review Remediation Backlog

## Goal

Close the confirmed regressions found while reviewing `PROG-AN-001` through `PROG-AN-004`: make analytics overlays deterministic for keyboard users and E2E, keep detail links inside the anonymous showcase, and prevent Progress hydration from relying on an unbounded check-in response.

## Architectural decisions

- `buildModernStatsSnapshot` remains a frontend-derived presentation model over the authenticated habits/check-ins store; this review found no need for a duplicate statistics API, migration, or persisted analytics projection.
- The route that owns `AppRuntime` resolves detail URLs. `ProgressHabitRow` stays presentation-oriented and receives the resolved link, so the same component works for `/app` and `/showcase`.
- The existing cursor endpoint (`GET /checkins/page`) is the supported synchronization contract for the web store. Do not add a second client-side aggregation source or silently truncate historical check-ins.
- A hover/focus preview must not share the modal dialog lifecycle. Only explicitly opened explanations may trap focus and restore it on close.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | PROG-AN-RVW-001 | P0 | - | Restores a reliable browser quality gate and the required Escape/focus behavior. |
| 2 | PROG-AN-RVW-002 | P1 | - | Keeps anonymous users inside the showcase when following analytics rows. |
| 3 | PROG-AN-RVW-003 | P2 | - | Uses the backend's stable cursor contract for scalable hydration. |

## PROG-AN-RVW-001: Separate tooltip preview from modal explanation state

**Status:** DONE
**Priority:** P0
**Depends on:** -

**Exact scope:**

Make `ChartGuideTooltip` deterministic when a trigger is reached by keyboard, opened explicitly, closed with Escape, and focused again. The current full Progress browser gate is flaky because focus preview, modal focus trapping, and restoration share the same `open` lifecycle.

**Files:**

- Modify `apps/web/src/lib/components/ChartGuideTooltip.svelte`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.
- Create or modify a focused component test under `apps/web/tests/unit/` for the trigger/open/close contract.

**Goal:**

Tooltip explanations open deliberately, close reliably with Escape, and restore focus without immediately reopening or depending on viewport/browser timing.

### Outcome

Keyboard users can inspect an analytics explanation, dismiss it with Escape, and continue tabbing. The authenticated Progress E2E is repeatable on desktop, compact mobile, mobile, and Telegram webview projects.

### Architectural decision

Keep non-modal hover/focus preview separate from the explicit modal dialog state managed by `overlayManager`. Do not use a focus trap for a passive preview, and do not let focus restoration trigger another modal open.

### Required changes

1. Model preview and explicitly pinned/open explanation states separately, with one clear owner for overlay registration and cleanup.
2. Ensure click and keyboard activation open the dialog; Escape works whether focus is on the trigger, panel, or its close control.
3. Restore focus once after close without retriggering preview; preserve pointer/touch opening and outside-click behavior.
4. Replace timing-sensitive E2E interaction with semantic keyboard assertions and add focused coverage for the close-and-restore sequence.
5. Prove repeatability with the affected Progress test across all configured Playwright projects.

### Out of scope

- Replacing `overlayManager`, redesigning tooltip copy, or changing unrelated dialogs.
- Suppressing, retrying, or skipping the failing browser assertions.

### Acceptance criteria

- Focusing a trigger alone does not create a modal focus trap.
- Activating a trigger opens exactly one labelled dialog; Escape closes it and returns focus to that trigger.
- The dialog remains closed after focus restoration until the user explicitly opens it again.
- The authenticated Progress analytics scenario passes repeatedly on desktop, compact-mobile, mobile, and telegram-webview.

### Targeted validation

```bash
cd apps/web && npm run test -- ChartGuideTooltip && npx playwright test tests/e2e/habit-journey.spec.ts --grep "authenticated progress analytics" --repeat-each=3
```

### Commit

```bash
git add apps/web/src/lib/components/ChartGuideTooltip.svelte apps/web/tests/unit/ apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "fix(tooltip): stabilize analytics keyboard overlay"
```

## PROG-AN-RVW-002: Resolve analytics habit links through the active runtime

**Status:** TODO
**Priority:** P1
**Depends on:** -

**Exact scope:**

Remove the hard-coded protected-app detail URL from `ProgressHabitRow`; rows rendered on `/showcase/stats` must link to the corresponding anonymous showcase habit route.

**Files:**

- Modify `apps/web/src/lib/components/stats/ProgressHabitRow.svelte`.
- Modify `apps/web/src/routes/app/(protected)/stats/+page.svelte`.
- Modify `apps/web/tests/unit/ProgressHabitRow.test.ts`.
- Modify `apps/web/tests/e2e/showcase-journey.spec.ts`.

**Goal:**

Following a habit link from analytics preserves the active application context rather than redirecting a demo user into the authenticated route tree.

### Outcome

`/app/stats` links to `/app/habit/:id`, while `/showcase/stats` links to `/showcase/habit/:id`; both use the same `ProgressHabitRow` rendering component.

### Architectural decision

The stats route already owns `AppRuntime.resolve`, which normalizes app and showcase paths. Resolve `detailHref` there and pass it to the presentation component instead of importing a protected route in the component.

### Required changes

1. Replace the row's hard-coded protected route with a required resolved detail-link prop.
2. Resolve row links through the active runtime in the shared Stats screen so app and showcase receive their correct bases.
3. Update the component test to assert the supplied href, not a protected implementation detail.
4. Add an anonymous showcase browser assertion that follows an analytics row and remains within `/showcase/habit/:id` without API/auth traffic.

### Out of scope

- Changing habit-detail screen content, demo data, authentication rules, or dashboard links.

### Acceptance criteria

- Every analytics row has an accessible habit link.
- Authenticated Progress links remain inside `/app`.
- Showcase Progress links remain inside `/showcase` and open the selected demo habit.
- The showcase journey still makes no `/api/**` or auth request.

### Targeted validation

```bash
cd apps/web && npm run test -- ProgressHabitRow && npx playwright test tests/e2e/showcase-journey.spec.ts --grep "analytics"
```

### Commit

```bash
git add apps/web/src/lib/components/stats/ProgressHabitRow.svelte apps/web/src/routes/app/'(protected)'/stats/+page.svelte apps/web/tests/unit/ProgressHabitRow.test.ts apps/web/tests/e2e/showcase-journey.spec.ts
git commit -m "fix(progress): preserve showcase habit links"
```

## PROG-AN-RVW-003: Hydrate web check-ins through the cursor API

**Status:** TODO
**Priority:** P2
**Depends on:** -

**Exact scope:**

Move authenticated web-store hydration away from the unbounded `GET /checkins` list path and onto the existing stable `/checkins/page` cursor contract.

**Files:**

- Modify `apps/web/src/lib/api/checkins.ts`.
- Modify `apps/web/src/lib/stores/habits.ts`.
- Modify `apps/web/tests/unit/checkins.api.test.ts`.
- Modify `apps/web/tests/unit/habits.store.test.ts`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinResource.java` only if its bulk-list contract needs explicit deprecation documentation after web migration.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImplTest.java` when changing that public resource contract.

**Goal:**

Long-running accounts load complete, deterministic check-in history without one unbounded database query and JSON response.

### Outcome

The web store follows `nextCursor` until hydration is complete and constructs the same snapshot as today. The cursor ordering remains owned by backend repository/query code.

### Architectural decision

Reuse `CheckinResource.findPage`, `CheckinQueryHandler.findPage`, and `CheckinRepository.findSyncPageForUser`; the frontend may orchestrate pages but must not reimplement cursor encoding, ordering, or ownership checks. Keep backward compatibility for the legacy bulk endpoint explicitly documented until all supported clients have migrated.

### Required changes

1. Add a client helper that consumes all cursor pages in order, rejects invalid/repeated cursors, and preserves API error handling.
2. Use that helper from `refreshRuntimeFromBackend` while retaining the store's single snapshot replacement after both habits and check-ins finish.
3. Add unit coverage for multiple pages, terminal cursor, repeated-cursor protection, and hydration failure without partial runtime state.
4. Document the legacy bulk endpoint's compatibility/deprecation status in its OpenAPI description; do not silently impose a truncating limit.
5. Add backend coverage if the resource contract changes, including authenticated ownership and cursor validation.

### Out of scope

- A new statistics endpoint, database migration, localStorage analytics cache, or changes to check-in mutation semantics.

### Acceptance criteria

- A multi-page response produces one complete, ordered check-in collection and the same habit completion snapshot as an equivalent bulk response.
- A malformed or repeated cursor fails visibly without replacing the last known store state with partial data.
- Progress retains enough history for all 1w/4w/12w calculations after reload.
- The API documentation no longer claims that an unbounded list is a default page.

### Targeted validation

```bash
cd apps/web && npm run test -- checkins.api habits.store modernStats
cd apps/backend && ./mvnw test -Dtest=CheckinServiceImplTest
```

### Commit

```bash
git add apps/web/src/lib/api/checkins.ts apps/web/src/lib/stores/habits.ts apps/web/tests/unit/checkins.api.test.ts apps/web/tests/unit/habits.store.test.ts apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinResource.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImplTest.java
git commit -m "refactor(sync): page checkin hydration"
```

## Rejected observations

- The analytics selector is intentionally frontend-owned over the existing habits/check-ins snapshot; no duplicate backend statistics endpoint or schema migration is justified by the reviewed changes.
- The inspected check-in resource enforces the authenticated user context and has a stable cursor query path; no new ownership or date-validation defect was found in the reviewed route.
- The compact Progress heatmaps use a separate component from Dashboard's 30-day `MiniHeatmap`; they do not share the fixed-cell layout implementation.

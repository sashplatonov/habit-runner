# Compact Dashboard Editor v2 - Review Remediation Backlog

## Goal

Close the confirmed validation and API-boundary gaps in the completed compact habit editor without changing its panel model, draft ownership, or visual-reference layout.

## Architectural decisions

- `HabitForm.svelte` remains the sole owner of the draft and client-side validation. On a failed dashboard-level save, it must select the panel that owns the first invalid field before moving focus; it must not create a second form or persist partial state.
- The backend remains authoritative for persisted schedules. Keep `schedule` optional for legacy clients, but validate every supplied schedule at the DTO boundary before mapping it to `HabitEntity`; do not rely on the UI's clamped controls.
- Preserve the current save payload, optimistic-locking behavior, API routes, and existing valid legacy schedules. No migration is needed because this work rejects invalid future mutations only.
- Reference conformance is measured against the 12 HTML screens in `compact-dashboard-editor-full-set-v2/` at 390x844, then rechecked at 320x740 and 1280x900. The authenticated editor, not the showcase promotional banner, is the comparison surface.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | CDE-RVW-001 | P2 | - | Protects the server contract used by the editor and non-web clients. |
| 2 | CDE-RVW-002 | P1 | - | Makes the primary Save action recoverable when validation starts on the dashboard. |
| 3 | CDE-RVW-003 | P1 | - | Restores the complete preview information hierarchy shared by dashboard and Identity. |
| 4 | CDE-RVW-004 | P1 | - | Reinstates the five focused schedule screens required by the reference set. |
| 5 | CDE-RVW-005 | P2 | CDE-RVW-004 | Aligns shared focused-screen headers with the reference labels. |
| 6 | CDE-RVW-006 | P2 | CDE-RVW-005 | Keeps reminder controls truthful while restoring the reference block order. |

## CDE-RVW-001: Validate supplied schedule variants at the API boundary

**Status:** DONE
**Priority:** P2
**Depends on:** -

**Exact scope:**

Ensure a create or update request cannot persist an invalid supplied `schedule` variant, including an out-of-range quota or a schedule whose required fields are empty. The current DTO accepts the nested object without `@Valid`, and `HabitServiceImpl` maps it directly to the entity.

**Files:**

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitCreateRequestDto.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitUpdateRequestDto.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitScheduleDto.java` or create dedicated top-level validator types in the same package.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/habit/HabitResourceTest.java` and add an HTTP-level validation test in the existing habit test package if direct resource tests cannot exercise Jakarta Validation.

**Goal:**

The API rejects invalid schedules with the existing validation-error contract before mapper/service persistence, while valid schedule variants and legacy requests without `schedule` remain compatible.

### Outcome

The server independently enforces the schedule invariants expressed by the compact editor: `weekly_days` needs at least one weekday, `monthly_weeks` needs both selected weekdays and selected weeks, and quota variants keep their documented bounds.

### Architectural decision

Use Jakarta Validation cascade for nested value constraints plus one reusable type-aware constraint for cross-field invariants. Keep the rule out of `HabitResource`, UI components, and MapStruct mappings so every create/update path has one validation boundary.

### Required changes

1. Cascade validation from both habit request DTOs into a non-null supplied `schedule` object.
2. Add a type-aware schedule validator that accepts `null` for backward compatibility and rejects only structurally invalid supplied variants.
3. Return the established validation response without reaching `HabitServiceImpl` or writing an entity when validation fails.
4. Add regression coverage for create and update rejection, at least one valid schedule variant, and a legacy request without `schedule`.

### Out of scope

Changing schedule semantics, normalizing or repairing already stored rows, API-versioning, database migrations, or replacing the frontend validation.

### Acceptance criteria

- A supplied weekly-days schedule with no weekdays returns the standard validation failure and does not call the service/persist a habit.
- A supplied monthly-weeks schedule missing weekdays or weeks returns the standard validation failure.
- Quotas outside their documented limits are rejected server-side even when sent by a non-web client.
- Valid daily, weekly quota, monthly quota, and monthly-weeks schedules remain accepted.
- Existing create/update payloads that omit `schedule` remain compatible with legacy frequency fields.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest=HabitResourceTest,HabitServiceImplTest
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitCreateRequestDto.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitUpdateRequestDto.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitScheduleDto.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto apps/backend/src/test/java/com/sashplatonov/habbit/runner/habit
git commit -m "fix(api): validate supplied habit schedules"
```

## CDE-RVW-002: Route dashboard validation failures to the owning editor panel

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

Repair the primary dashboard Save/Create flow in `HabitForm.svelte`. With an empty name or invalid schedule, `handleSubmit` stores errors while the dashboard remains mounted; the error summary and target controls exist only in focused panels, so no visible error or focus target is available.

**Files:**

- Modify `apps/web/src/lib/components/HabitForm.svelte`.
- Modify `apps/web/tests/unit/HabitForm.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

**Goal:**

Saving from the dashboard makes every client-side validation failure visible and moves keyboard focus to the first actionable invalid control without losing the draft or issuing a mutation.

### Outcome

The dashboard Save/Create action transitions to Identity for name/description errors and Schedule for schedule errors, renders the existing inline/error-summary feedback, and focuses the matching field or schedule control after the panel mounts.

### Architectural decision

Map validation keys to the already-owned local `HabitEditorPanel` state and keep `focusFirstInvalidField` as the only focus coordinator. Do not duplicate validation messages on the dashboard or add a separate submit flow; after a panel save failure it must retain the current focused panel.

### Required changes

1. Derive the owning panel for `name`/`description`, `schedule`, `scheduleWeeks`, and `scheduleWeekdays` errors.
2. When submission begins on the dashboard, activate that owner before scheduling focus; preserve the current focused panel for validation that originates there.
3. Ensure the summary has appropriate status/alert semantics once mounted and focus lands on a real, keyboard-operable invalid field or schedule control.
4. Add focused unit coverage for dashboard Create/Save with an empty name and with an invalid monthly-weeks schedule, asserting panel selection, visible feedback, focus, no `onSubmit`, and retained draft.
5. Add a mobile Playwright regression for the dashboard save failure at 320x740 and 390x844, including no mutation and no horizontal overflow.

### Out of scope

Changing error copy, server error mapping, the dashboard visual hierarchy, adding routes/query parameters for panels, or changing successful save/navigation behavior.

### Acceptance criteria

- On a new habit dashboard with a blank name, Create opens Identity, visibly reports `Name is required`, and moves focus to `#habit-name` without calling `onSubmit`.
- On an invalid monthly-weeks draft saved from the dashboard, Create opens Schedule, exposes the correct inline schedule error, and moves focus to a related schedule control.
- The draft value and selected schedule remain unchanged while the user corrects the error and a subsequent valid save still uses the single existing payload path.
- On 320x740 and 390x844, the focused invalid control is reachable above the fixed footer and the document has no horizontal overflow.

### Targeted validation

```bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
```

### Commit

```bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "fix(habits): reveal dashboard validation errors"
```

## CDE-RVW-003: Restore complete compact previews on Dashboard and Identity

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

Bring `01_dashboard.html` and `02_identity.html` back to the required preview hierarchy. The current shared `HabitPreview` omits the `Preview` section label and tags, separates type/schedule/goal into pills and lines, and Identity has a second reduced preview that shows only schedule and color.

**Files:**

- Modify `apps/web/src/lib/components/habits/HabitPreview.svelte`.
- Modify `apps/web/src/lib/components/habit-form/HabitEditorDashboard.svelte`.
- Modify `apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte`.
- Modify `apps/web/src/lib/components/HabitForm.svelte`.
- Modify `apps/web/tests/unit/HabitForm.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

**Goal:**

Both preview surfaces communicate the same draft: name and emoji, type, schedule, daily target, streak target, tags, and color in the card order and line hierarchy of the two reference screens.

### Outcome

Dashboard and Identity show an explicit Preview section with the complete compact summary, and every displayed value refreshes before Save without introducing another draft model.

### Architectural decision

Keep `HabitForm.svelte` as the source of the derived values. Extend the existing preview component/props or extract one presentational projection from it; do not recreate summary derivation inside each panel.

### Required changes

1. Render the reference Preview label and card hierarchy in `HabitPreview`.
2. Pass the selected tag summary and the existing type/schedule/target values from `HabitForm` to both Dashboard and Identity previews.
3. Preserve truncation and wrapping for long names/tags, plus the existing color and emoji precedence.
4. Add unit and mobile E2E assertions that edit identity, tags, and goal values, return to Dashboard, and observe the complete preview before any mutation.

### Out of scope

Changing tag storage, habit label formatting, dashboard tile order, or the save payload.

### Acceptance criteria

- At 390x844, the Dashboard preview matches `01_dashboard.html`: a Preview heading, emoji/name, one compact behavior/schedule/goal line, and a tags-plus-color line.
- At 390x844, the Identity preview matches `02_identity.html` and reflects unsaved type, schedule, target, tags, and color values.
- Long habit names and five tags do not overflow at 320x740 or 1280x900.
- Preview-only interaction never issues a network mutation.

### Targeted validation

```bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
```

### Commit

```bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habits/HabitPreview.svelte apps/web/src/lib/components/habit-form/HabitEditorDashboard.svelte apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "fix(habits): align compact editor previews"
```

## CDE-RVW-004: Make each schedule variant a focused reference screen

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

Restore the screen hierarchy in `04a_schedule_daily.html`, `04b_schedule_days_of_week.html`, `04c_schedule_weekly_quota.html`, `04d_schedule_monthly_quota.html`, and `04e_schedule_monthly_weeks.html`. `HabitScheduleSection.svelte` currently expands every variant below the chooser while the header remains `Schedule`; the references require a selected focused screen with its own title/subtitle and Back to the chooser.

**Files:**

- Modify `apps/web/src/lib/components/HabitForm.svelte`.
- Modify `apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte`.
- Create focused schedule view components under `apps/web/src/lib/components/habit-form/` only when they remove duplicated frame/content logic.
- Modify `apps/web/tests/unit/HabitForm.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

**Goal:**

Selecting a schedule type opens its matching focused screen while retaining one draft and allowing Back to return to the chooser, not directly to the dashboard.

### Outcome

All five variants expose the reference heading, configuration card, metrics, resulting rule, and reference-specific subtitle before the user returns to the chooser or the dashboard.

### Architectural decision

Extend the existing local editor-panel state with a typed schedule-detail substate (or equivalent typed panel values) owned by `HabitForm`. Reuse the present schedule bindings, validators, conversion helpers, and a single Save action; do not introduce routes, stores, or a second schedule model.

### Required changes

1. Keep `04_schedule.html` as the chooser with its current Effect card, but make each choice navigate to a separate focused view.
2. Match the titles/subtitles and section grouping of all five schedule-detail references, including Daily metrics, weekday/month-week selections, quota counters, and resulting-rule cards.
3. Make detail Back return to the chooser with the changed draft retained; chooser Back returns to the dashboard.
4. Preserve keyboard/touch behavior, 44px controls, validation messages, bounds, and no mutation before Save.
5. Add unit and mobile E2E coverage for all five transitions, two-level Back behavior, retained draft, and 320/390/1280 overflow checks.

### Out of scope

Changing schedule semantics, shared schedule conversion, API contracts, historical check-ins, or adding deep links.

### Acceptance criteria

- Each of the five selected variants matches its corresponding `04a`–`04e` reference at 390x844, including focused header title/subtitle, card order, metrics, and Resulting rule.
- Detail Back returns to Schedule chooser; chooser Back returns to Dashboard; neither loses unsaved schedule values.
- Invalid weekdays or monthly weeks remain visible and focusable in their owning focused screen.
- At 320x740 and 1280x900, no horizontal overflow occurs and the fixed footer does not cover a required control.

### Targeted validation

```bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts tests/unit/habitFormModel.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
```

### Commit

```bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte apps/web/src/lib/components/habit-form apps/web/tests/unit/HabitForm.test.ts apps/web/tests/unit/habitFormModel.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "fix(habits): restore focused schedule screens"
```

## CDE-RVW-005: Use reference-specific focused-screen subtitles

**Status:** TODO
**Priority:** P2
**Depends on:** CDE-RVW-004

**Exact scope:**

Replace the generic focused-panel subtitle `Edit this part of your habit.` with the reference-specific context in `02_identity.html`, `03_habit_type.html`, `04_schedule.html`, `04a`–`04e`, `05_goal.html`, `06_reminder.html`, and `07_organization.html`.

**Files:**

- Modify `apps/web/src/lib/components/HabitForm.svelte`.
- Modify `apps/web/tests/unit/HabitForm.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

**Goal:**

The sticky header provides the screen-specific context promised by every reference without changing panel navigation or draft state.

### Outcome

Identity says `Edit habit · Identity`, Habit type says `Edit habit · Behavior`, Schedule says `Edit habit · Schedule`, Goal says `Edit habit · Goal`, Reminder says `Edit habit · Reminder`, Organization says `Edit habit · Tags`, and schedule details use their corresponding `Schedule · …` subtitle.

### Architectural decision

Centralize title/subtitle metadata beside the typed panel state in `HabitForm`; individual controls must not own or duplicate header copy.

### Required changes

1. Add a typed title/subtitle mapping for every dashboard, focused panel, chooser, and schedule detail.
2. Render it through the existing single sticky header and preserve the dashboard’s dynamic habit/schedule/active subtitle.
3. Add accessible heading and E2E assertions for all reference titles/subtitles.

### Out of scope

Changing any domain copy, button label, footer behavior, route, or layout beyond header text needed for the reference.

### Acceptance criteria

- Every reference screen has the matching heading and subtitle at 390x844.
- Header text remains legible without horizontal overflow at 320px and does not change draft values.
- Keyboard Back behavior remains unchanged for Dashboard and non-schedule focused panels.

### Targeted validation

```bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
```

### Commit

```bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "fix(habits): match editor header context"
```

## CDE-RVW-006: Restore Reminder reference grouping with an accessible enabled state

**Status:** TODO
**Priority:** P2
**Depends on:** CDE-RVW-005

**Exact scope:**

Align `HabitReminderSection.svelte` with `06_reminder.html`. The reference places time, current summary, and notification notice consecutively; the current full-width enabled/disabled button inserts an extra block before the summary and changes the mobile hierarchy.

**Files:**

- Modify `apps/web/src/lib/components/habit-form/HabitReminderSection.svelte`.
- Modify `apps/web/tests/unit/HabitForm.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts`.

**Goal:**

The Reminder screen follows the reference card order while retaining a keyboard-accessible way to control and announce the enabled state.

### Outcome

Time, summary, and notice appear in the reference order. The enabled state remains an explicit accessible control integrated into that hierarchy, and the truthful delivery copy remains unchanged.

### Architectural decision

Keep `reminderEnabled` and `reminderTime` as bindings owned by `HabitForm`. Reposition or compact the existing control; do not infer notification delivery or make the summary itself a non-semantic action.

### Required changes

1. Recompose the card into the reference field → summary → notice order.
2. Retain an accessible, 44px-reachable enabled-state control with `aria-pressed` and visible selected state without adding a competing card-level interaction.
3. Preserve clear-to-null behavior, dashboard summary updates, and no false claim that a reminder will be delivered.
4. Add unit/mobile E2E assertions for enabled/disabled state, time clear, visible order, and footer reachability.

### Out of scope

Push permissions, delivery scheduling, backend changes, or a new notification settings route.

### Acceptance criteria

- At 390x844, Reminder matches `06_reminder.html` in card grouping and visual order while keeping an accessible enabled-state control.
- Time and enabled-state changes update the summary before Save; clearing time submits `null`.
- At 320x740 and 1280x900, the notice and controls remain reachable without overlap or horizontal overflow.

### Targeted validation

```bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
```

### Commit

```bash
git add apps/web/src/lib/components/habit-form/HabitReminderSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "fix(habits): align reminder screen hierarchy"
```

## Reference audit

| Reference | Result | Remediation |
| --- | --- | --- |
| `01_dashboard.html` | Preview omits its reference label and complete tags/behavior line. | CDE-RVW-003 |
| `02_identity.html` | Preview is reduced to schedule/color instead of the complete draft summary. | CDE-RVW-003, CDE-RVW-005 |
| `03_habit_type.html` | Control/rule composition is present; focused-header subtitle is generic. | CDE-RVW-005 |
| `04_schedule.html` | Chooser and Effect are present; focused-header subtitle is generic. | CDE-RVW-005 |
| `04a_schedule_daily.html` | Daily content is embedded below the chooser instead of its own focused screen. | CDE-RVW-004, CDE-RVW-005 |
| `04b_schedule_days_of_week.html` | Weekday content is embedded below the chooser instead of its own focused screen. | CDE-RVW-004, CDE-RVW-005 |
| `04c_schedule_weekly_quota.html` | Weekly quota content is embedded below the chooser instead of its own focused screen. | CDE-RVW-004, CDE-RVW-005 |
| `04d_schedule_monthly_quota.html` | Monthly quota content is embedded below the chooser instead of its own focused screen. | CDE-RVW-004, CDE-RVW-005 |
| `04e_schedule_monthly_weeks.html` | Monthly-weeks content is embedded below the chooser instead of its own focused screen. | CDE-RVW-004, CDE-RVW-005 |
| `05_goal.html` | Goal controls/rule are present; focused-header subtitle is generic. | CDE-RVW-005 |
| `06_reminder.html` | Enabled control adds a block before the reference summary/notice order. | CDE-RVW-005, CDE-RVW-006 |
| `07_organization.html` | Tag count, chips, add row, and suggestions are present; focused-header subtitle is generic. | CDE-RVW-005 |

## Rejected observations

- The editor panels are not URL-addressable. This is intentional: CDE-001 explicitly chose local panel state with no routes or query parameters.
- The fixed mobile action bar, safe-area inset, visible focus treatment, minimum 44px controls, and horizontal-overflow protections are present in the current implementation and were not added as remediation tasks.
- The full `habit-journey` run stops in its first legacy dashboard selector: `openHabitDetails` searches for an `article` button labelled with the old habit text, while the current dashboard exposes the detail screen through its newer compact-row interaction. The failure is a stale E2E selector, not a confirmed compact-editor product regression; it is outside this remediation backlog.
- No backend persistence, authorization, transaction, migration, or PWA regression was confirmed in the reviewed compact-editor change set.

# Compact Dashboard Habit Editor v2 - Implementation Backlog

## Goal

Rebuild the edit-habit experience as the compact dashboard plus focused settings screens in compact-dashboard-editor-full-set-v2. Preserve the existing form draft, persistence contract, validation, save and discard behavior; do not implement new domain behavior.

## Visual-reference protocol

Each screen task below has exactly one reference URL. Before its commit, the executor must:

1. Seed the state described in that task, open the product and exact reference side by side at 390x844, and capture the product screen with Playwright inspector or a failure screenshot.
2. Compare header, title/subtitle, card order, control type/order, selected state, icons, card radii/spacing, fixed footer, and visible summary text. Fix every unexplained difference.
3. Repeat the actual product screen at 320x740 and 1280x900. Assert document.documentElement.scrollWidth <= window.innerWidth, 44x44px minimum touch targets, keyboard-visible focus, and reachability above the footer.
4. A DOM assertion or build does not establish visual conformance. Record an intentional product-only difference in the commit body or PR description.

Reference HTML is read-only visual source material. It must never be copied into production or edited to hide a mismatch.

## Architectural decisions

- HabitForm.svelte remains sole owner of draft values, initial snapshot, validation, saving, submit payload, soft-limit modal, and page-leave protection. Focused views receive bindings only and must not submit partial state.
- Keep focused screens as local state within the existing editor route. Panel Back returns to dashboard without losing draft; dashboard Back retains onBack and dirty-discard behavior. Both authenticated and showcase routes retain the same editor.
- Reuse HabitFormValues, validateHabitForm, buildLegacyScheduleFields, normalizeTags, HabitSchedule, describeSchedule, COLORS, ICONS, and SCHEDULE_TYPE_OPTIONS. Do not change API, store, schema, or legacy schedule conversion.
- Do not create duplicate schedule transitions, DTOs, or a second form. Production copy remains English and must be truthful about notifications and schedule behavior.

## Recommended implementation order

| Order | Task | Priority | Depends on | Screen |
| ---: | --- | --- | --- | --- |
| 1 | CDE-001 | P1 | - | Dashboard shell |
| 2 | CDE-002 | P1 | CDE-001 | Dashboard overview |
| 3 | CDE-003 | P1 | CDE-001 | Identity |
| 4 | CDE-004 | P1 | CDE-001 | Habit type |
| 5 | CDE-005 | P1 | CDE-001 | Schedule chooser |
| 6 | CDE-006 | P1 | CDE-005 | Daily schedule |
| 7 | CDE-007 | P1 | CDE-005 | Days of week |
| 8 | CDE-008 | P1 | CDE-005 | Weekly quota |
| 9 | CDE-009 | P1 | CDE-005 | Monthly quota |
| 10 | CDE-010 | P1 | CDE-005 | Monthly weeks |
| 11 | CDE-011 | P1 | CDE-001 | Goal |
| 12 | CDE-012 | P1 | CDE-001 | Reminder |
| 13 | CDE-013 | P1 | CDE-001 | Organization |
| 14 | CDE-014 | P2 | CDE-002..CDE-013 | End-to-end proof |

## CDE-001: Add the local editor-screen state and shared focused-screen frame

**Status:** DONE  
**Priority:** P1  
**Depends on:** -

**Exact scope:**

Create the local screen-selection boundary used by all reference screens. This task does not implement the dashboard cards or any settings control.

**Files:**

- Modify apps/web/src/lib/components/HabitForm.svelte.
- Create apps/web/src/lib/components/habit-form/HabitEditorPanel.svelte if a common header/content/footer frame removes duplication.
- Modify apps/web/tests/unit/HabitForm.test.ts.

**Goal:**

Panel navigation has one draft, one final save action, and reliable Back behavior before individual screens are introduced.

### Outcome

A panel identifier can switch between dashboard and named local panel while all current draft fields remain owned by HabitForm.

### Architectural decision

Use a typed local panel identifier in HabitForm; no routes, stores, query parameters, or API calls are added.

### Required changes

1. Introduce dashboard/panel state and callbacks that later screen components can use.
2. Make panel Back return to dashboard without calling onBack; retain existing navigation/discard behavior for editor Back.
3. Keep form submission, error focus, soft-limit, beforeunload, and full payload construction unchanged.
4. Unit-test state transition and draft retention.

### Out of scope

Dashboard layout, headers, footer styling, tile content, and settings controls.

### Acceptance criteria

- Switching local panel then returning leaves every unsaved field unchanged.
- Panel Back does not call onBack; dashboard Back retains current dirty-flow protection.
- Existing create/edit submit unit tests pass without changing their expected payload.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitEditorPanel.svelte apps/web/tests/unit/HabitForm.test.ts
git commit -m "refactor(habits): add editor screen state"
~~~

## CDE-002: Implement the compact editor dashboard

**Status:** DONE
**Priority:** P1  
**Depends on:** CDE-001

**Exact scope:**

Implement only the overview matching [01_dashboard.html](../compact-dashboard-editor-full-set-v2/01_dashboard.html): header, preview, six quick-setting tiles, advanced summary, and fixed footer.

**Files:**

- Modify apps/web/src/lib/components/HabitForm.svelte.
- Modify apps/web/src/lib/components/habit-form/FormActionBar.svelte only if needed for reference footer geometry.
- Create apps/web/src/lib/components/habit-form/HabitEditorDashboard.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

The edit route opens a compact, scannable dashboard that links to all six local panels and shows current unsaved draft summaries.

### Outcome

The screen has reference hierarchy and exactly six interactive tiles in its two-column mobile grid.

### Architectural decision

Dashboard is a projection of the HabitForm draft. Tile activation changes local panel state only.

### Required changes

1. Render reference-shaped header with editor Back, editable-habit subtitle, preview card, Quick settings grid, Advanced summary, and fixed Cancel/Save footer.
2. Add tiles in exact reference order: Identity, Habit type, Schedule, Goal, Reminder, Organization.
3. Derive tile/preview summaries from current draft; use existing formatHabitLabel, describeSchedule, colors, and target/reminder data.
4. Add accessible labels/data anchors and browser checks for tile navigation, footer, overflow, and no network save before Save.

### Out of scope

The content of individual panels; new API behavior; changing existing discard/save semantics.

### Acceptance criteria

- At 390x844, product matches [01_dashboard.html](../compact-dashboard-editor-full-set-v2/01_dashboard.html): card order, 2-column tile order, preview, advanced grouping, and footer.
- Six tiles are keyboard operable and each opens its intended local screen state.
- Preview/tile summaries reflect draft values before save; Save remains the only mutation trigger.
- At 320x740 and 1280x900, no horizontal overflow occurs and footer does not cover content.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/FormActionBar.svelte apps/web/src/lib/components/habit-form/HabitEditorDashboard.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add compact editor dashboard"
~~~

## CDE-003: Implement the Identity screen

**Status:** DONE
**Priority:** P1  
**Depends on:** CDE-001

**Exact scope:**

Implement only Identity, matching [02_identity.html](../compact-dashboard-editor-full-set-v2/02_identity.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte.
- Modify apps/web/src/lib/components/HabitForm.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users edit preset/custom emoji, name, description, and color in a focused compact screen with a live preview.

### Outcome

The panel reproduces the reference field/card order while retaining existing icon precedence and validation behavior.

### Architectural decision

Existing Identity bindings remain in HabitForm; this screen neither normalizes nor submits its own data.

### Required changes

1. Render header, Identity card, preset grid, custom emoji preview/input, name, description, base colors, and preview in reference order.
2. Preserve custom emoji override, compound emoji, 40-character name, 8,000-character description, selected state, inline errors, and invalid-field focus.
3. Return to dashboard with draft retained and identity summary refreshed.
4. Add unit/browser assertions for custom emoji, color, invalid name, and compact geometry.

### Out of scope

Habit type, tags, schedule, target, reminder, API/schema changes.

### Acceptance criteria

- At 390x844, product matches [02_identity.html](../compact-dashboard-editor-full-set-v2/02_identity.html), including control/card order and selected visual states.
- Preset selection and custom icon precedence are accessible and reflected in preview/dashboard before save.
- Invalid validation remains visible and moves focus to its field.
- At 320x740 and 1280x900, all controls fit, focus is visible, and interactive items meet 44x44px.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add identity editor screen"
~~~

### Completed

- **Implemented:** `HabitIdentitySection.svelte` rebuilt to reference layout: preset emoji grid (5 cols), custom emoji with live preview, name with 40-char limit, description with 8,000-char counter, base color chips, and a separate Preview card. New data anchors: `data-editor-identity`, `data-editor-identity-preview`, `data-editor-emoji-grid`, `data-editor-identity-name`. New props `previewLabel`/`previewSchedule` wired from `HabitForm.svelte`.
- **Tests:** `HabitForm.test.ts` repaired (stale selectors broken by commit `dd93dd3` restored to component reality) plus two new tests: draft retention across dashboard return, invalid-name focus on the identity panel. Result: 9/9 passed. ESLint clean on all changed files, including max-lines.
- **E2E:** `habit-journey.spec.ts` added mobile test `edits identity on the focused panel without saving before Save` (panel open, 15 preset buttons, preset/color selection, live preview text, dashboard summary refresh, no mutation requests before Save, no horizontal overflow at 320/390/1280, 44px emoji targets). Lint clean.
- **Commits:** CDE-003 code in `8377241` (`feat(habits): add identity editor screen`); dashboard fixes in `bf25ae1`; timezone E2E blocker fix in `607a898`.
- **Verification:** Unit 9/9 passed; `npm run build` passes; all 40 E2E tests pass across 4 projects (desktop, compact-mobile, mobile, telegram-webview). The previously confirmed external `scheduled dashboard summary` timezone blocker was resolved by passing the real moment (`new Date()`) instead of a pre-truncated local midnight to `buildScheduledCompletionSummary`.

## CDE-004: Implement the Habit type screen

**Status:** DONE
**Priority:** P1  
**Depends on:** CDE-001

**Exact scope:**

Implement only Habit type, matching [03_habit_type.html](../compact-dashboard-editor-full-set-v2/03_habit_type.html).

**Files:**

- Modify apps/web/src/lib/components/HabitForm.svelte.
- Create apps/web/src/lib/components/habit-form/HabitTypeSection.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users choose Build habit or Avoid habit in a focused screen and understand the actual resulting rule.

### Outcome

The screen has the reference header, segment, selected state, explanatory notice, and Current rule card.

### Architectural decision

HabitForm owns the existing type field. The new component only binds it and derives copy from the selected value.

### Required changes

1. Render reference layout and a mutually exclusive Build/Avoid control with aria-pressed or equivalent radio semantics.
2. Use rule text consistent with current positive/negative application behavior.
3. Update dashboard summary without saving; retain draft on panel Back.
4. Test keyboard selection, non-color selection state, summary update, and overflow.

### Out of scope

Any change to type domain semantics, history, backend payload, or other panels.

### Acceptance criteria

- At 390x844, product matches [03_habit_type.html](../compact-dashboard-editor-full-set-v2/03_habit_type.html).
- Exactly one type is exposed as selected to assistive technology; both controls are 44px reachable.
- Current-rule and dashboard summaries change before save.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitTypeSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add habit type editor screen"
~~~

## CDE-005: Implement the Schedule chooser

**Status:** DONE  
**Priority:** P1  
**Depends on:** CDE-001

**Exact scope:**

Implement only the schedule type chooser matching [04_schedule.html](../compact-dashboard-editor-full-set-v2/04_schedule.html). Detailed schedule configuration is separate work.

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte.
- Modify apps/web/src/lib/components/HabitForm.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users see the current schedule, choose one of five types, and navigate to the exact dedicated configuration screen.

### Outcome

The chooser lists Daily, Days of week, Weekly quota, Monthly quota, Monthly weeks in reference order and reports a truthful Effect summary.

### Architectural decision

HabitSchedule stays source of truth. Existing createScheduleForType transition logic is reused; no new schedule transformation is introduced.

### Required changes

1. Render header, type choices, active state, Effect card, and future-history notice.
2. Keep selection routing local: choosing a type opens its configuration screen and preserves compatible existing values through current transition logic.
3. Use semantic selected state, visible focus, and accurate current/effect text.
4. Test choice order, navigation target, preservation, and mobile layout.

### Out of scope

Daily/days/quota/monthly controls, validation changes, payload changes.

### Acceptance criteria

- At 390x844, product matches [04_schedule.html](../compact-dashboard-editor-full-set-v2/04_schedule.html).
- Five choices appear in exact reference order; the active schedule is distinguishable without color only.
- Every choice reaches the correct local screen while retaining the single form draft.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add schedule chooser screen"
~~~

## CDE-006: Implement the Daily schedule screen

**Status:** DONE  
**Priority:** P1  
**Depends on:** CDE-005

**Exact scope:**

Implement only the daily configuration screen matching [04a_schedule_daily.html](../compact-dashboard-editor-full-set-v2/04a_schedule_daily.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Daily schedule explains its fixed rule without exposing irrelevant configuration controls.

### Outcome

The screen presents reference summary line, weekly metrics, Resulting rule, and unchanged-history message.

### Architectural decision

Daily remains the existing schedule object type daily; this panel does not mutate schedule data.

### Required changes

1. Render the daily-specific card and summaries from the daily schedule contract.
2. Use Back to return to chooser, then dashboard, without draft loss.
3. Test no editable day/quota control is present and footer remains usable.

### Out of scope

Any schedule mutation or change to daily semantics.

### Acceptance criteria

- At 390x844, product matches [04a_schedule_daily.html](../compact-dashboard-editor-full-set-v2/04a_schedule_daily.html).
- The rule accurately says every calendar day; history remains unchanged.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add daily schedule screen"
~~~

## CDE-007: Implement the Days of week screen

**Status:** DONE  
**Priority:** P1  
**Depends on:** CDE-005

**Exact scope:**

Implement only weekly_days configuration matching [04b_schedule_days_of_week.html](../compact-dashboard-editor-full-set-v2/04b_schedule_days_of_week.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/unit/habitFormModel.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users select weekdays and see exact selected-count/pattern/resulting-rule feedback.

### Outcome

A seven-day compact grid and summary follow the reference while preserving validation and sorted weekday contract.

### Architectural decision

Reuse existing weekday toggle/sort and validation; the screen only changes the weekly_days schedule binding.

### Required changes

1. Render seven accessible selected buttons in reference order and selected-count/pattern summary.
2. Render resulting rule from selected weekdays, distinguishing unselected weekdays from misses.
3. Preserve empty-selection validation and focus.
4. Add unit/browser tests for select, deselect, validation, payload, and geometry.

### Out of scope

Quota/multiweek schedules, weekday ordering changes, or server behavior.

### Acceptance criteria

- At 390x844, product matches [04b_schedule_days_of_week.html](../compact-dashboard-editor-full-set-v2/04b_schedule_days_of_week.html).
- Every weekday is a 44px keyboard-operable selected control; summary reflects current choice.
- Empty required selection blocks Save and focuses an appropriate weekday control.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts tests/unit/habitFormModel.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/unit/habitFormModel.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add weekday schedule screen"
~~~

## CDE-008: Implement the Weekly quota screen

**Status:** DONE  
**Priority:** P1  
**Depends on:** CDE-005

**Exact scope:**

Implement only weekly_quota configuration matching [04c_schedule_weekly_quota.html](../compact-dashboard-editor-full-set-v2/04c_schedule_weekly_quota.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users choose a bounded weekly completion target and understand flexible timing.

### Outcome

The screen has reference counter, metrics, and How it counts summary.

### Architectural decision

Reuse existing setWeeklyQuota clamp of 1..7 and existing optional weekday data; do not turn optional weekdays into required constraints.

### Required changes

1. Render accessible decrement/value/increment controls with correct disabled/bounded behavior.
2. Preserve optional weekday state where it exists, while clearly summarizing actual restriction/flexibility.
3. Add tests for bounds, summary, panel Back, payload, and geometry.

### Out of scope

Monthly quota, changing quota limits, or new recurrence semantics.

### Acceptance criteria

- At 390x844, product matches [04c_schedule_weekly_quota.html](../compact-dashboard-editor-full-set-v2/04c_schedule_weekly_quota.html).
- Counter cannot submit below 1 or above 7; its accessible value and summary update before save.
- Optional weekday restriction is described truthfully.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add weekly quota schedule screen"
~~~

## CDE-009: Implement the Monthly quota screen

**Status:** DONE  
**Priority:** P1  
**Depends on:** CDE-005

**Exact scope:**

Implement only monthly_quota configuration matching [04d_schedule_monthly_quota.html](../compact-dashboard-editor-full-set-v2/04d_schedule_monthly_quota.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users choose a bounded monthly completion target and understand its monthly progress rule.

### Outcome

The screen uses the reference counter, metrics, and How it counts hierarchy.

### Architectural decision

Reuse current setMonthlyQuota clamp of 1..31 and optional weekday binding.

### Required changes

1. Render accessible bounded counter and monthly target summaries.
2. Preserve optional weekday data and describe it accurately.
3. Add tests for 1/31 bounds, summary, draft retention, payload, and geometry.

### Out of scope

Weekly quota, month boundary rules, or API/schema changes.

### Acceptance criteria

- At 390x844, product matches [04d_schedule_monthly_quota.html](../compact-dashboard-editor-full-set-v2/04d_schedule_monthly_quota.html).
- Counter cannot pass 1 or 31; summary reports current month target before Save.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add monthly quota schedule screen"
~~~

## CDE-010: Implement the Monthly weeks screen

**Status:** DONE  
**Priority:** P1  
**Depends on:** CDE-005

**Exact scope:**

Implement only monthly_weeks configuration matching [04e_schedule_monthly_weeks.html](../compact-dashboard-editor-full-set-v2/04e_schedule_monthly_weeks.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/unit/habitFormModel.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users choose month weeks and weekdays, then see the exact combined schedule rule.

### Outcome

Five month-week controls and seven weekday controls follow reference grouping and retain existing last-week semantics.

### Architectural decision

Reuse WeekOfMonth values 1..4 and last, existing toggles, and validation. The reference label Week 5 must map to existing last only if product semantics already support it; do not silently change the domain.

### Required changes

1. Render month-week and weekday grids with current domain labels and selected states.
2. Derive resulting rule from actual weeks/weekdays, including last-week behavior.
3. Preserve separate empty weeks/weekdays validation and focus.
4. Test selection, deselection, last week, payload, and compact geometry.

### Out of scope

Changing WeekOfMonth persistence, adding a literal fifth-week type, or quota behavior.

### Acceptance criteria

- At 390x844, product matches [04e_schedule_monthly_weeks.html](../compact-dashboard-editor-full-set-v2/04e_schedule_monthly_weeks.html) except a documented label difference required by existing last-week domain semantics.
- Week/month controls are 44px keyboard-operable and do not overflow at 320px.
- Both required groups validate independently and resulting rule is accurate.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts tests/unit/habitFormModel.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/unit/habitFormModel.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add monthly weeks schedule screen"
~~~

## CDE-011: Implement the Goal screen

**Status:** TODO  
**Priority:** P1  
**Depends on:** CDE-001

**Exact scope:**

Implement only Goal matching [05_goal.html](../compact-dashboard-editor-full-set-v2/05_goal.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitTargetSection.svelte.
- Modify apps/web/src/lib/components/HabitForm.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users configure daily target and streak target with immediately understandable completion rule.

### Outcome

The screen has reference layout, compact target feedback cards, and Resulting rule card.

### Architectural decision

Reuse dailyTarget and targetStreak bindings and existing clamps; no target logic moves into the panel.

### Required changes

1. Render accessible synchronized range/number target controls and result cards.
2. Retain configured daily-target bounds and 1..365 streak.
3. Update dashboard summary before save and test bounds, focus, payload, and geometry.

### Out of scope

Schedule/type changes, target-domain changes, or API changes.

### Acceptance criteria

- At 390x844, product matches [05_goal.html](../compact-dashboard-editor-full-set-v2/05_goal.html).
- Number/range values stay synchronized and resulting rule is correct before save.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitTargetSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add goal editor screen"
~~~

## CDE-012: Implement the Reminder screen

**Status:** TODO  
**Priority:** P1  
**Depends on:** CDE-001

**Exact scope:**

Implement only Reminder matching [06_reminder.html](../compact-dashboard-editor-full-set-v2/06_reminder.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitReminderSection.svelte.
- Modify apps/web/src/lib/components/HabitForm.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users set/clear reminder time and enabled state with truthful notification status.

### Outcome

The focused screen follows reference grouping and clearly distinguishes configured time from enabled delivery.

### Architectural decision

Reuse reminderTime/reminderEnabled bindings. Existing app/system notification limitation is retained; the panel cannot claim delivery.

### Required changes

1. Render time control, enabled state, current summary, and truthful notice in reference order.
2. Preserve clear-to-null submission, panel Back retention, and dashboard summary.
3. Test enabled/disabled, set/clear time, save payload, accessibility, and geometry.

### Out of scope

Push permission, actual notification delivery, backend changes.

### Acceptance criteria

- At 390x844, product matches [06_reminder.html](../compact-dashboard-editor-full-set-v2/06_reminder.html).
- Enabled state/time summary is truthful and accessible before save.
- Clearing time submits reminderTime null; no product copy promises impossible delivery.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitReminderSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add reminder editor screen"
~~~

## CDE-013: Implement the Organization screen

**Status:** TODO  
**Priority:** P1  
**Depends on:** CDE-001

**Exact scope:**

Implement only Organization matching [07_organization.html](../compact-dashboard-editor-full-set-v2/07_organization.html).

**Files:**

- Modify apps/web/src/lib/components/habit-form/HabitTagsSection.svelte.
- Modify apps/web/src/lib/components/HabitForm.svelte.
- Modify apps/web/tests/unit/HabitForm.test.ts.
- Modify apps/web/tests/e2e/habit-journey.spec.ts.

**Goal:**

Users add/remove tags and choose suggestions in a focused compact screen.

### Outcome

The screen matches reference tag count, chips, add row, and suggestions.

### Architectural decision

Reuse existing tags/tagInput bindings and normalizeTags behavior; no tag persistence path is added.

### Required changes

1. Render tag count, selected removable chips, add input/button, suggestions in reference order.
2. Preserve Enter/comma add, sanitization, duplicate prevention, five-tag limit, and accessible remove labels.
3. Update dashboard summary before save and test all limit/error states and geometry.

### Out of scope

New tag taxonomy, multiword tag support, backend changes.

### Acceptance criteria

- At 390x844, product matches [07_organization.html](../compact-dashboard-editor-full-set-v2/07_organization.html).
- Add/remove/suggestion controls are keyboard accessible, 44px reachable, and disable additional adds at five.
- Summary updates before save and persisted tags survive reload.
- Complete the Visual-reference protocol for this one reference.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts --project=mobile
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/HabitForm.svelte apps/web/src/lib/components/habit-form/HabitTagsSection.svelte apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts
git commit -m "feat(habits): add organization editor screen"
~~~

## CDE-014: Verify complete editor journey and all reference screens

**Status:** TODO  
**Priority:** P2  
**Depends on:** CDE-002, CDE-003, CDE-004, CDE-005, CDE-006, CDE-007, CDE-008, CDE-009, CDE-010, CDE-011, CDE-012, CDE-013

**Exact scope:**

Add only missing cross-screen regression coverage and resolve confirmed mismatches. Review every reference linked above.

**Files:**

- Modify apps/web/tests/e2e/habit-journey.spec.ts.
- Modify apps/web/tests/e2e/showcase-journey.spec.ts.
- Modify apps/web/tests/unit/HabitForm.test.ts only for missing cross-screen behavior.
- Modify directly affected files under apps/web/src/lib/components/habit-form only for confirmed defect fixes.

**Goal:**

Prove draft retention, single save/reload, recovery, showcase reuse, responsive behavior, and visible fidelity for all supplied screens.

### Outcome

One browser journey visits every screen, changes representative data, saves once, reloads, and remains usable in all specified viewports.

### Architectural decision

Automated tests prove behavior and geometry; visual comparison remains recorded human evidence rather than a false claim of pixel comparison.

### Required changes

1. Cover dashboard-to-every-screen navigation, local Back, monthly weeks, cleared reminder, tags, save, reload.
2. Cover invalid required schedule, API error/conflict, dirty editor Back, unchanged create flow, and showcase in-memory route.
3. Run all specified viewports and complete the Visual-reference protocol for all twelve supplied pages.
4. Run focused quality gate and document browser-runtime blockers honestly.

### Out of scope

New product behavior, unrelated E2E cleanup, CI/deployment changes.

### Acceptance criteria

- All screen changes survive dashboard navigation and one save/reload.
- Error/conflict/discard never saves partial state; showcase requires no authenticated write.
- Browser tests cover 320x740, 390x844, 1280x900 without overflow.
- Each reference page has explicit visual-review evidence; check:web is clean.

### Targeted validation

~~~bash
cd apps/web && npm run test -- tests/unit/HabitForm.test.ts
cd apps/web && npm run test:e2e -- tests/e2e/habit-journey.spec.ts tests/e2e/showcase-journey.spec.ts --project=mobile
cd apps/web && npm run check:web
~~~

### Commit

~~~bash
git add apps/web/src/lib/components/habit-form apps/web/tests/unit/HabitForm.test.ts apps/web/tests/e2e/habit-journey.spec.ts apps/web/tests/e2e/showcase-journey.spec.ts
git commit -m "test(habits): verify compact editor screens"
~~~

## Final execution gate

After every task is DONE:

~~~bash
cd apps/web && npm run check
cd apps/backend && ./mvnw test
~~~

Do not mark CDE-014 DONE from a build alone. State separately which unit/static/build checks passed and whether browser evidence was obtained.

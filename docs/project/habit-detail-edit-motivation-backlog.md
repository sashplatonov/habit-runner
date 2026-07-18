<a name="top"></a>

# Habit Detail, Editing, Motivation, and Description Overlay Backlog

Status: `in progress` — implementation and automated gates complete; authenticated browser matrix and screenshot evidence pending
Scope: `apps/web` habit detail, create/edit form, shared habit controls, and habit description overlay
Related plans: [Today UI, Motivation, and Theme Backlog](./today-ui-motivation-themes-backlog.md) and [Modern UI and Gamified Statistics Backlog](./modern-ui-gamified-stats-backlog.md), especially `UI-003`, `UI-005`, and `UI-006`

## 📋 Table of Contents <a name="table-of-contents"></a>

- [🎯 Goal and boundaries](#goal-and-boundaries)
- [🔎 Current implementation audit](#current-implementation-audit)
- [🧠 Research-backed motivation model](#research-backed-motivation-model)
- [✨ Target experience](#target-experience)
- [🏗️ Architecture decisions](#architecture-decisions)
- [📊 Priority summary](#priority-summary)
- [🧩 Backlog](#backlog)
- [🗺️ Recommended execution order](#recommended-execution-order)
- [🧪 Verification matrix](#verification-matrix)
- [✅ Definition of Done](#definition-of-done)
- [🔍 Implementation review](#implementation-review)
- [⚠️ Risks and rollback](#risks-and-rollback)
- [❓ Open product questions](#open-product-questions)

## 🎯 Goal and boundaries <a name="goal-and-boundaries"></a>

Create one coherent, modern interaction language across the habit detail and create/edit screens. The redesigned detail screen should make today's action obvious, provide restrained game-like progress and feedback, and help the user recover after a miss without shame. The form should use aligned controls, predictable spacing, stable validation, and the same semantic tokens as the rest of the application. Habit descriptions should open in a polished, accessible overlay that works equally well with mouse, keyboard, touch, long Markdown, and every theme.

Success means:

- the first habit-detail viewport answers `What is this habit?`, `Is it scheduled today?`, `What should I do now?`, and `How close am I to today's goal?`;
- detail and dashboard use the same completion semantics for binary, multi-target, negative, frozen, pending, and error states;
- edit and create use the same section, field, segmented-control, action, focus, error, and spacing contracts;
- all primary mobile controls are at least `44x44 px`, remain above safe areas, and do not require hover;
- habit descriptions are readable without navigating away and without losing trigger focus;
- motivation is based on truthful progress and immediate feedback, not pressure or fabricated scores.

### Non-goals

- No XP economy, coins, random rewards, leaderboard, social comparison, streak-loss penalty, or pay-to-preserve mechanic.
- No change to habit, check-in, schedule, reminder, archive, or deletion API contracts unless implementation reveals a verified defect.
- No rewrite of the global statistics page. Habit detail may summarize only the information required for the next decision.
- No new chart library, form library, tooltip library, or animation dependency.
- No storage of derived presentation labels or milestone progress in the backend.
- No removal of Markdown support or the existing DOM sanitization boundary for descriptions.
- No redesign of unrelated dashboard, public, settings, or navigation surfaces in this backlog.

[↑ Back to top](#top)

## 🔎 Current implementation audit <a name="current-implementation-audit"></a>

The backlog is based on the current Svelte 5/SvelteKit checkout.

### Habit detail

- `apps/web/src/routes/app/(protected)/habit/[id]/+page.svelte` owns data selection, mutations, celebration state, navigation, presentation, charts, archive, freeze, retroactive editing, and deletion in one route component.
- The sticky header mixes navigation, identity, archive, edit, `Add +1`, `-1`, and freeze controls. Their heights, radii, labels, and visual weight do not share one hierarchy.
- Detail duplicates today's progress across header controls, `TodayBlock`, target/stat cards, and supporting charts.
- Detail implements its own completion and confetti path even though dashboard cards already use `HabitCompletionControl.svelte` and shared completion feedback.
- Several icon targets are below `44x44 px`; action wrapping can make the sticky header tall on narrow screens.
- Current statistics emphasize streak, best streak, rate, automatism, 90-day heatmap, target ring, monthly rate, weekly completions, and retro calendar simultaneously. The next action is not clearly dominant.
- Archive is a header icon while delete is a text action at the bottom; the user receives little explanation of how either operation affects history.

### Create and edit

- Both routes correctly reuse `HabitForm.svelte`, but the form header, section cards, habit-type selector, error banners, and submit action use separate class contracts.
- `HabitForm.svelte` owns hydration, dirty-state tracking, validation, schedule compatibility mapping, tag normalization, submit state, a behavioral warning modal, and the complete page layout.
- Existing section components are a useful boundary, but labels, hints, validation space, control density, and heading hierarchy are not yet uniform.
- The save action is sticky near the top. On mobile it competes with the form title and does not provide a bottom thumb-zone action near the end of the flow.
- Validation is submit-driven and does not provide a linked error summary or focus the first invalid field.
- The create-only soft-limit warning makes an unsupported `80%` claim. It should become neutral guidance or be removed unless a verifiable product source is approved.
- Edit has route-level save error output in addition to the form's own error output, which creates two possible error surfaces.

### Description overlay

- `DescriptionTooltip.svelte` safely parses Markdown with `marked` and sanitizes output with `DOMPurify`; those boundaries must remain.
- Desktop uses `role="tooltip"` while rendering a focusable close button and potentially rich/scrollable content. Interactive content should use popover/non-modal-dialog semantics instead of tooltip semantics.
- The trigger is a dashed `?`, can be as small as `16x16 px`, and exposes `aria-label="Description"` without `aria-expanded`, `aria-controls`, or habit context.
- Hover can open the desktop surface and a three-second timer can close it while the user is reading. Keyboard behavior is not covered by meaningful interaction assertions.
- Mobile uses a bottom sheet and backdrop, but markup and overlay lifecycle are duplicated instead of composing the existing `Overlay.svelte` primitive.
- Positioning tests cover viewport edges, but overlay tests mainly prove that the component renders and sanitizes HTML.

### Existing foundations to preserve

- `theme.css` already defines semantic surface, content, border, focus, status, and shadow tokens across the supported themes.
- `Surface.svelte`, `StatusPill.svelte`, `ProgressBar.svelte`, and `SegmentedControl.svelte` already define useful visual primitives.
- `overlayManager.ts`, `Overlay.svelte`, and `tooltipPosition.ts` already provide focus restoration, Escape handling, outside-click behavior, scroll locking, and collision-aware positioning.
- `HabitCompletionControl.svelte` already models scheduled, completed, multi-target, frozen, pending, and error states on dashboard cards.
- `formatHabitLabel.ts` remains the required habit-label formatter wherever a composed text label is rendered.
- Existing `HabitForm`, completion-control, overlay, tooltip-position, detail-hint, and habit-stat unit tests provide regression anchors.

[↑ Back to top](#top)

## 🧠 Research-backed motivation model <a name="research-backed-motivation-model"></a>

Research guides the product hypotheses below; it does not prove that a particular layout will improve this product's retention. Any retention or completion claim must be validated with product analytics and user research after release.

| Evidence | Product translation | Guardrail |
|---|---|---|
| Progress-monitoring interventions improved goal attainment on average across 138 studies ([Harkin et al., 2016](https://doi.org/10.1037/bul0000025)). | Keep today's completed/target value and the next required step visible, numeric, and updated immediately. | Display recorded behavior only; do not invent a readiness, discipline, or motivation score. |
| Immediate rewards were more strongly associated with persistence than delayed rewards in the studied long-term-goal contexts ([Woolley and Fishbach, 2017](https://doi.org/10.1177/0146167216676480)). | Provide immediate state change, short confirmation copy, and an optional restrained completion flourish after a successful mutation. | Feedback is predictable and informational; no variable-ratio rewards, loot, or attention traps. |
| Specific `when / where / how` plans improved goal attainment across 94 tests ([Gollwitzer and Sheeran, 2006](https://doi.org/10.1016/S0065-2601(06)38002-1)). | Show the readable schedule/reminder context beside today's action and make settings one tap away. | Do not turn the first detail viewport into a planning questionnaire. |
| Repetition in a consistent context was associated with increasing automaticity, while formation time varied widely and one missed opportunity did not materially affect the modeled process ([Lally et al., 2010](https://doi.org/10.1002/ejsp.674)). | Emphasize repetition and context; after a miss, offer a neutral next opportunity instead of declaring failure. | Do not promise a universal `21-day` or `66-day` transformation and do not shame a broken streak. |

Resulting motivational contract:

1. **Today's objective:** one truthful scheduled action, or an explicit `Not scheduled today` state.
2. **Visible progress:** `count / target`, a semantic progress indicator, and a clear remaining step.
3. **Immediate feedback:** optimistic UI only when reconciliation is safe; otherwise a pending state followed by success, undo, or recoverable error.
4. **Nearest milestone:** show one reachable milestone derived from existing data, never a wall of competing scores.
5. **Recovery:** missed opportunities use neutral language such as `Continue with today's step`; no red failure banner or lost-identity copy.
6. **Autonomy:** archive, edit, freeze, and history remain available but visually secondary to today's action.
7. **Restraint:** celebration occurs only on a real transition to today's completed state and respects `prefers-reduced-motion`.

[↑ Back to top](#top)

## ✨ Target experience <a name="target-experience"></a>

### Habit detail hierarchy

1. **Identity header:** back to Today, `emoji + full habit name`, description trigger, and status pill. Edit/archive move into one secondary action group or overflow on narrow screens.
2. **Today's step:** schedule state, readable reminder/context, shared completion control, `count / target`, pending/error/undo feedback, and one concise message.
3. **Momentum:** current streak or recent consistency plus one nearest milestone. Historical best is supporting text, not a competing hero card.
4. **Recent rhythm:** a compact `14` or `28` scheduled-opportunity view with completed, missed, frozen, unscheduled, and future states distinguishable without color alone.
5. **Insight and settings:** at most one evidence-based observation plus schedule/reminder summary and an `Edit settings` action.
6. **History and safety:** retroactive editing is available as a secondary mode inside the recent-rhythm surface; archive/restore and delete live in a clearly explained danger zone.

### Create/edit hierarchy

1. Page header with back/cancel, mode-specific title, and save status.
2. Compact live preview using the final `emoji + name`, color, type, and schedule summary.
3. Sections in a stable order: `Identity` → `Schedule` → `Goal` → `Reminder` → `Organization`.
4. One validation summary plus field-level errors after submit; field errors also appear after blur.
5. Desktop action in the header and mobile sticky action above the bottom safe area, both reflecting the same submit state.
6. Unsaved-change protection for browser unload and internal navigation.

### Description overlay

- Desktop: compact, collision-aware, non-modal popover anchored to a modern info icon. Hover may preview it, but click/focus keeps it open until explicit dismissal, Escape, or outside click.
- Mobile: bottom sheet with title, close action, drag affordance, safe-area padding, bounded height, and internal scrolling.
- Rich Markdown is treated as interactive/readable content, so the surface uses popover/dialog semantics rather than `role="tooltip"`.
- Long words, lists, links, inline code, and paragraphs wrap without page overflow. Links have visible focus and safe external-link behavior.
- Trigger size is at least `44x44 px` where it is an independent action. Dense rows may use a visually compact icon inside a `44x44 px` hit area.

[↑ Back to top](#top)

## 🏗️ Architecture decisions <a name="architecture-decisions"></a>

### AD-HABIT-01. Routes orchestrate; pure modules derive presentation

`+page.svelte` keeps store selection, navigation, and mutation orchestration. Add a pure `habitDetailViewModel.ts` module for schedule state, today's progress copy, milestone choice, recent-rhythm cells, and recovery messaging. It consumes existing schedule, completion, and statistics helpers; it must not introduce a second completion calculation.

Why: presentation states become deterministic and independently testable without putting Svelte markup or product copy into the data store.

### AD-HABIT-02. One completion control contract across dashboard and detail

Promote `dashboard/HabitCompletionControl.svelte` to `components/habits/HabitCompletionControl.svelte` and extend it only where detail needs an explicit decrement/undo affordance. Dashboard cards, compact rows, and detail import the same component and pass intent callbacks. Mutation ownership remains in the route/store layer.

Why: binary, multi-target, negative, frozen, pending, and failed mutations must not mean different things on different screens.

### AD-HABIT-03. Existing semantic tokens and UI primitives remain the design system

Use `Surface`, `StatusPill`, `ProgressBar`, `SegmentedControl`, and tokens from `theme.css`. Add narrowly scoped primitives only for missing contracts: `IconButton`, `FormSection`, `FieldMessage`, and `FormActionBar`. Do not encode theme IDs or raw success/error colors in feature components.

Why: alignment comes from a small geometry/state contract, not repeated Tailwind strings.

### AD-HABIT-04. Detail gamification is derived and transition-based

The detail view may derive today's objective, milestone distance, and recent rhythm from the loaded habit and check-ins. It does not persist XP, badges, levels, or a motivational score. Celebration is delegated to the existing completion-feedback path and fires only when a user mutation crosses the completed threshold.

Why: this provides game-like clarity and reward without creating a new domain model or manipulative loop.

### AD-HABIT-05. Form state and presentation are separate responsibilities

Extract pure validation, initial-value mapping, dirty comparison, and legacy schedule serialization from `HabitForm.svelte` into `habitFormModel.ts`. `HabitForm.svelte` remains the form orchestrator; section components render fields and report intent. Route-level components own fetch/not-found and final navigation only.

Why: the current form can be redesigned safely while preserving schedule compatibility and submit payloads.

### AD-HABIT-06. Rich descriptions are popovers/sheets, not semantic tooltips

Keep the public component name initially to minimize churn, but implement it by composing `Overlay.svelte`, `overlayManager.ts`, and `tooltipPosition.ts`. Desktop uses a non-modal popover/dialog contract; mobile uses a modal sheet. Add stable trigger/panel IDs, `aria-expanded`, `aria-controls`, focus restoration, and explicit accessible names.

Why: rich Markdown and close controls exceed the semantics and interaction limits of a basic tooltip.

### AD-HABIT-07. Mobile order is semantic order

The DOM order is identity → today's step → momentum → recent rhythm → insight/settings → history → danger zone. Desktop columns may change placement with CSS grid, but keyboard and screen-reader order must remain meaningful. The baseline viewports are `360x800`, `390x844`, `768x1024`, and `1280x800`.

Why: responsive layout must not require duplicated markup or confusing focus order.

### AD-HABIT-08. Accessibility and theme parity are release gates

- Touch targets: at least `44x44 px` with at least `8 px` separation for adjacent independent actions.
- Text contrast: at least `4.5:1`; large text and meaningful UI graphics: at least `3:1`.
- Visible focus, error, pending, selected, disabled, archived, and completion states in every theme.
- No status communicated by color alone.
- `200%` zoom without horizontal page scrolling.
- `prefers-reduced-motion` removes particle/transform effects while preserving state and text feedback.

[↑ Back to top](#top)

## 📊 Priority summary <a name="priority-summary"></a>

| Order | ID | Priority | Size | Outcome | Depends on |
|---:|---|---|---|---|---|
| 1 | `HABIT-UX-001` | P0 | S | Baseline states and preserved behavior contract | none |
| 2 | `HABIT-UX-002` | P0 | M | Shared control and form-geometry primitives | `HABIT-UX-001` |
| 3 | `HABIT-UX-003` | P0 | M | Pure detail presentation and motivation model | `HABIT-UX-001` |
| 4 | `HABIT-UX-004` | P1 | L | Modern, motivating habit detail | `HABIT-UX-002`, `HABIT-UX-003` |
| 5 | `HABIT-UX-005` | P1 | L | Coherent create/edit flow | `HABIT-UX-002` |
| 6 | `HABIT-UX-006` | P1 | M | Modern accessible description popover/sheet | `HABIT-UX-002` |
| 7 | `HABIT-UX-007` | P1 | M | Mobile, accessibility, theme, and regression gate | `HABIT-UX-004` through `HABIT-UX-006` |
| 8 | `HABIT-UX-008` | P2 | S | Remove superseded detail UI and update docs | `HABIT-UX-007` |

`P0` protects domain behavior and establishes reusable contracts. `P1` delivers the requested user-facing redesign. `P2` removes legacy code only after parity is proven.

[↑ Back to top](#top)

## 🧩 Backlog <a name="backlog"></a>

### HABIT-UX-001 — Capture baseline states and interaction invariants

Priority: `P0`  
Estimated size: `S`  
Dependencies: none

Tasks:

- Create deterministic fixtures for new, active, archived, positive, negative, daily-target, frozen-today, not-scheduled-today, no-history, long-history, pending, save-error, and permission-denied habits.
- Record `cloud` and `midnight` screenshots at `390x844` and `1280x800` for detail, create, edit, and an open description overlay.
- Document invariants for increment/decrement, negative-habit semantics, freeze, undo, archive/restore, delete, retroactive history, reminder settings, schedule serialization, and dirty-state protection.
- Capture current keyboard order and mobile sticky-element overlap before structural changes.
- Confirm which legacy detail sections remain required by the statistics backlog before marking any section for removal.

Files:

- `apps/web/tests/fixtures/habitDetailFixtures.ts` (new)
- `apps/web/tests/fixtures/habitFormFixtures.ts` (new)
- `apps/web/tests/unit/HabitForm.test.ts`
- `apps/web/tests/unit/HabitCompletionControl.test.ts`
- `docs/project/habit-detail-edit-motivation-backlog.md`

Acceptance criteria:

- Every later task can reproduce its edge states without a live backend.
- Baseline evidence identifies route, theme, viewport, habit type, and overlay state.
- No behavior is removed because it was hidden in the current route component.
- Negative, multi-target, freeze, archive, and retroactive-edit semantics are written as explicit invariants.

Verification:

- `cd apps/web && npm run test:unit -- HabitForm HabitCompletionControl`
- Manual baseline at `390x844` and `1280x800` in `cloud` and `midnight`.

### HABIT-UX-002 — Establish shared control and form geometry

Priority: `P0`  
Estimated size: `M`  
Dependencies: `HABIT-UX-001`

Tasks:

- Move the shared completion control from the dashboard namespace to the habit feature namespace and update all consumers in one change.
- Add or promote a general icon-button contract with `44x44 px` hit area, consistent radius, visible focus, pressed/expanded state, loading state, and required accessible name.
- Add `FormSection`, `FieldMessage`, and `FormActionBar` primitives using existing semantic tokens and spacing variables.
- Define the shared geometry contract: `44 px` controls, `8 px` adjacent-action gap, one surface radius/elevation, stable field message area, and consistent section heading hierarchy.
- Keep feature-specific wording and layout in habit components; do not turn primitives into a general page builder.

Files:

- `apps/web/src/lib/components/dashboard/HabitCompletionControl.svelte` (move)
- `apps/web/src/lib/components/habits/HabitCompletionControl.svelte` (new target)
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte`
- `apps/web/src/lib/components/ui/IconButton.svelte` (new)
- `apps/web/src/lib/components/habit-form/FormSection.svelte` (new)
- `apps/web/src/lib/components/habit-form/FieldMessage.svelte` (new)
- `apps/web/src/lib/components/habit-form/FormActionBar.svelte` (new)
- `apps/web/src/lib/theme/theme.css` only if a missing semantic token is proven
- `apps/web/tests/unit/HabitCompletionControl.test.ts`
- new focused primitive component tests

Acceptance criteria:

- Dashboard behavior and accessible names remain unchanged after the move.
- Shared controls expose hover, focus-visible, active, disabled, pending, selected/expanded, success, and error states without layout shift.
- Components contain no theme-ID branches and no new raw status colors.
- Form primitives do not own habit store access or payload serialization.

Verification:

- `cd apps/web && npm run test:unit -- HabitCompletionControl`
- `cd apps/web && npm run check:web`

### HABIT-UX-003 — Build the pure detail presentation model

Priority: `P0`  
Estimated size: `M`  
Dependencies: `HABIT-UX-001`

Tasks:

- Define a discriminated `HabitDetailViewModel` for `loading`, `not-found`, `not-scheduled`, `ready`, `in-progress`, `complete`, `frozen`, `archived`, `pending`, and `error` states.
- Derive today's `count / target`, remaining count, schedule/reminder summary, neutral recovery copy, and one nearest milestone.
- Build `14` or `28` recent scheduled-opportunity cells with explicit `completed`, `missed`, `frozen`, `not-scheduled`, and `future` states.
- Reuse existing timezone, schedule, completion, and stats helpers; add no date parsing inside Svelte markup.
- Replace unsupported universal automatism labels such as `Infallible` or fixed-day promises with descriptive, non-diagnostic copy.

Files:

- `apps/web/src/lib/habits/habitDetailViewModel.ts` (new)
- `apps/web/src/lib/habits/detailHints.ts`
- `apps/web/src/lib/habits/habitStats.ts` only where existing derived data can be reused safely
- `apps/web/tests/unit/habitDetailViewModel.test.ts` (new)
- `apps/web/tests/unit/detailHints.test.ts`
- `apps/web/tests/unit/habitStats.test.ts`

Acceptance criteria:

- The same input and reference date always produce the same presentation model.
- Low-frequency schedules do not count unscheduled days as misses.
- A single missed opportunity never produces shame/failure copy or resets a derived identity label.
- Negative habits and targets above one receive explicit, unambiguous action copy.
- No presentation model mutates the habit or reads a Svelte store.

Verification:

- `cd apps/web && npm run test:unit -- habitDetailViewModel detailHints habitStats`
- Boundary tests for timezone change, month boundary, future dates, sparse schedules, frozen dates, and malformed numeric input.

### HABIT-UX-004 — Redesign habit detail around today's step

Priority: `P1`  
Estimated size: `L`  
Dependencies: `HABIT-UX-002`, `HABIT-UX-003`

Tasks:

- Reduce the route to orchestration and compose focused detail sections driven by `HabitDetailViewModel`.
- Build an identity header with a formatted label, description trigger, status pill, and secondary edit/archive actions; use an overflow menu on narrow screens if needed.
- Build `HabitTodayStep.svelte` with the shared completion control, schedule/reminder context, semantic progress, pending/error/undo state, and reduced-motion-safe feedback.
- Build one `HabitMomentum.svelte` section for current progress and nearest milestone; historical best remains supporting copy.
- Build `HabitRecentRhythm.svelte` using scheduled opportunities and non-color state cues, with retroactive editing composed as a secondary mode in the same surface.
- Build `HabitSettingsSummary.svelte` with readable schedule/reminder text and one `Edit settings` link.
- Keep retroactive history editing inside the recent-rhythm surface and ensure it cannot be mistaken for today's primary action.
- Consolidate archive/restore and delete into an explained danger zone. Deletion confirmation includes the formatted habit label and what happens to history.
- Remove duplicate hero/stat/chart blocks only after their information is represented in the new hierarchy or intentionally delegated to the statistics page.

Files:

- `apps/web/src/routes/app/(protected)/habit/[id]/+page.svelte`
- `apps/web/src/lib/components/habits/HabitDetailHeader.svelte` (new)
- `apps/web/src/lib/components/habits/HabitTodayStep.svelte` (new)
- `apps/web/src/lib/components/habits/HabitMomentum.svelte` (new)
- `apps/web/src/lib/components/habits/HabitRecentRhythm.svelte` (new)
- `apps/web/src/lib/components/habits/HabitSettingsSummary.svelte` (new)
- `apps/web/src/lib/components/habits/HabitDangerZone.svelte` (new)
- `apps/web/src/lib/components/habits/HabitRhythmCalendar.svelte` (new)
- `apps/web/src/lib/components/overlays/DayStatusMenu.svelte` (new)
- `apps/web/src/lib/habits/completionCelebration.ts`
- `apps/web/tests/unit/HabitDetailPage.test.ts` (new)
- focused tests for each new detail component where behavior is non-trivial

Acceptance criteria:

- On `390x844`, identity, today's state/progress, and the primary action appear before long history content.
- A scheduled positive habit can be completed with one obvious action; multi-target and negative habits cannot be mistaken for binary completion.
- `Not scheduled today`, frozen, archived, pending, and failed states never show an invalid primary mutation.
- Completing the last required unit produces one immediate confirmation; reload, hydration, theme switch, and route return do not replay celebration.
- Edit/archive/delete do not visually compete with today's action.
- The same metric is not repeated in hero, stat card, and chart.
- `formatHabitLabel()` is used for composed habit labels in headings, accessible names, confirmation copy, and notifications.
- Existing check-in, undo, freeze, archive, delete, and retroactive-history behavior remains intact.

Verification:

- `cd apps/web && npm run test:unit -- HabitDetail habitDetailViewModel HabitCompletionControl`
- `cd apps/web && npm run check:web`
- Manual keyboard and touch pass at `360x800`, `390x844`, `768x1024`, and `1280x800`.

### HABIT-UX-005 — Unify create and edit into one coherent form flow

Priority: `P1`  
Estimated size: `L`  
Dependencies: `HABIT-UX-002`

Tasks:

- Extract initial-value mapping, validation, dirty comparison, tag normalization, and compatibility serialization into a pure form model.
- Recompose the existing sections with `FormSection` and `FieldMessage`; align labels, required indicators, hints, errors, radii, heights, focus rings, and spacing.
- Add a compact live preview using emoji, name, color, habit type, and readable schedule summary.
- Present schedule presets first and keep advanced weekly/monthly controls progressively disclosed without losing existing schedule shapes.
- Rename habit types in UI to clear user language such as `Build` and `Avoid`; explain how the completion action changes before save.
- Show reminder time/help only when reminders are enabled; distinguish denied permission, unsupported browser, and save failure.
- Add blur/submit validation, a linked error summary, and focus movement to the first invalid field.
- Use one submit-error surface. Preserve entered values and expose retry after failure.
- Replace the unsupported `80%` soft-limit claim with neutral guidance based on focus and user choice, or remove the modal in favor of an inline advisory.
- Add internal-navigation dirty protection in addition to `beforeunload`.
- Keep desktop and mobile actions synchronized; the mobile action bar sits above the bottom safe area and never covers the focused field or keyboard.

Files:

- `apps/web/src/lib/components/HabitForm.svelte`
- `apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte`
- `apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte`
- `apps/web/src/lib/components/habit-form/HabitTargetSection.svelte`
- `apps/web/src/lib/components/habit-form/HabitReminderSection.svelte`
- `apps/web/src/lib/components/habit-form/HabitTagsSection.svelte`
- `apps/web/src/lib/components/habit-form/HabitPreview.svelte` (new)
- `apps/web/src/lib/habits/habitFormModel.ts` (new)
- `apps/web/src/routes/app/(protected)/habit/new/+page.svelte`
- `apps/web/src/routes/app/(protected)/habit/[id]/edit/+page.svelte`
- `apps/web/src/lib/components/AppLayout.svelte` only if route-aware bottom-nav handling is required
- `apps/web/tests/unit/HabitForm.test.ts`
- `apps/web/tests/unit/habitFormModel.test.ts` (new)

Acceptance criteria:

- Create and edit have identical geometry and state behavior; only title, initial values, and primary-action copy differ.
- All existing schedule variants serialize without data loss.
- Labels, hints, descriptions, and errors are programmatically associated with controls.
- Submitting multiple errors focuses the first invalid field while preserving all values.
- Save failure preserves values and offers retry; only one error alert is announced.
- Internal navigation and browser unload protect dirty state without prompting after a successful save.
- At `390x844`, the primary action remains reachable, respects safe areas, and does not overlap BottomNav or the software keyboard.
- Required touch targets are at least `44x44 px`; seven-day and type selectors remain readable at `200%` zoom.

Verification:

- `cd apps/web && npm run test:unit -- HabitForm habitFormModel`
- `cd apps/web && npm run check:web`
- Manual create/edit parity pass for daily, weekdays, custom weekly, quota, monthly-week, positive, negative, reminder-off, and permission-denied fixtures.

### HABIT-UX-006 — Redesign the habit description popover and mobile sheet

Priority: `P1`  
Estimated size: `M`  
Dependencies: `HABIT-UX-002`

Tasks:

- Replace the dashed `?` trigger with a modern info/document icon inside the shared icon-button contract.
- Add a context-aware accessible name such as `Open description for {habit label}`, plus `aria-expanded` and `aria-controls`.
- Compose the surface with the existing overlay manager and shared overlay primitive instead of maintaining a separate lifecycle.
- Use non-modal popover/dialog semantics on desktop and modal bottom-sheet semantics on mobile.
- Remove the forced three-second reading timeout. Hover preview may close after pointer leave only when focus/click has not pinned the surface.
- Preserve sanitized Markdown and add deliberate typography for headings, paragraphs, lists, links, inline code, blockquotes, and long unbroken text.
- Add collision handling after content resize, viewport resize, and scroll; keep the panel within `12 px` viewport margins.
- Restore trigger focus after Escape, close button, or outside click. Mobile sheet locks background scroll and respects the bottom safe area.
- Ensure opening the overlay inside a clickable habit card does not navigate or toggle completion.

Files:

- `apps/web/src/lib/components/DescriptionTooltip.svelte`
- `apps/web/src/lib/components/overlays/Overlay.svelte`
- `apps/web/src/lib/components/overlays/overlayManager.ts` only if a missing generic capability is proven
- `apps/web/src/lib/components/overlays/tooltipPosition.ts`
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte`
- `apps/web/src/routes/app/(protected)/habit/[id]/+page.svelte`
- `apps/web/tests/unit/DescriptionTooltip.test.ts` (new; replace shallow overlay assertions)
- `apps/web/tests/unit/tooltipPosition.test.ts`
- `apps/web/tests/unit/overlayBehavior.test.ts`

Acceptance criteria:

- Mouse, keyboard, and touch can open and close the description without triggering the parent card action.
- Desktop rich content does not use `role="tooltip"`; mobile exposes an accessible modal dialog/sheet.
- Trigger expanded state and panel relationship are exposed to assistive technology.
- Escape/outside/close behavior restores focus; mobile background scroll is locked only while open.
- Sanitized Markdown remains free of executable scripts/event handlers and supports readable themed typography.
- Long content scrolls inside the surface without horizontal page overflow.
- Popover remains inside the viewport near all four edges and after resize/scroll.
- The overlay passes in all supported themes without raw hard-coded surface colors.

Verification:

- `cd apps/web && npm run test:unit -- DescriptionTooltip tooltipPosition overlayBehavior`
- `cd apps/web && npm run check:web`
- Manual VoiceOver/keyboard/touch pass with short, long, linked, code-heavy, and malicious descriptions.

### HABIT-UX-007 — Run the mobile, accessibility, theme, and regression gate

Priority: `P1`  
Estimated size: `M`  
Dependencies: `HABIT-UX-004`, `HABIT-UX-005`, `HABIT-UX-006`

Tasks:

- Build a route/state screenshot matrix for detail, create, edit, open description overlay, validation errors, pending mutations, and save failure.
- Check `cloud`, `midnight`, and every remaining theme for contrast, focus visibility, status distinction, overlay surfaces, and custom habit colors.
- Test `360x800`, `390x844`, `768x1024`, `1280x800`, mobile landscape, `200%` zoom, reduced motion, coarse pointer, and keyboard-only navigation.
- Verify no sticky header/action bar/bottom sheet overlaps BottomNav, safe areas, browser UI, software keyboard, toast, or another overlay.
- Run regression coverage for dashboard completion, form serialization, archive/delete, retroactive edits, Markdown sanitization, and SSR safety.
- Record any intentional visual changes and remaining manual validation evidence in this backlog.

Files:

- all files changed by `HABIT-UX-004` through `HABIT-UX-006`
- `apps/web/tests/unit/HabitDetailPage.test.ts`
- `apps/web/tests/unit/HabitForm.test.ts`
- `apps/web/tests/unit/HabitCompletionControl.test.ts`
- `apps/web/tests/unit/DescriptionTooltip.test.ts`
- `apps/web/tests/unit/dashboardSsrSafety.test.ts`
- optional repository-standard visual/e2e fixtures only if the existing test stack supports them
- `docs/project/habit-detail-edit-motivation-backlog.md`

Acceptance criteria:

- No horizontal page scroll at target viewports or `200%` zoom.
- Primary touch targets meet `44x44 px`; compact visual icons retain a compliant hit area.
- Focus order follows visual/semantic order and focus remains visible in every theme.
- Completion, frozen, archived, pending, error, and selected states are not color-only.
- Reduced motion removes celebration movement without hiding completion feedback.
- Detail, form, and description overlay pass the full frontend gate with no dashboard regression.

Verification:

- `cd apps/web && npm run test`
- `cd apps/web && npm run check:web`
- Manual screenshot and accessibility matrix recorded in the implementation review section added during delivery.

### HABIT-UX-008 — Remove superseded detail UI and update documentation

Priority: `P2`  
Estimated size: `S`  
Dependencies: `HABIT-UX-007`

Tasks:

- Run a repo-wide import and behavior audit before deleting legacy stat/detail components.
- Remove only components and helpers with no remaining dashboard, detail, stats, or documentation consumer.
- Update the broader modern UI backlog so `UI-006` points to this detailed plan instead of maintaining conflicting acceptance criteria.
- Update tooltip documentation to distinguish simple chart hints from rich habit-description popovers.
- Set this backlog to `complete` only after automated and manual evidence is recorded.

Candidate files, subject to usage audit:

- `apps/web/src/lib/components/TodayBlock.svelte`
- `apps/web/src/lib/components/StatCardGrid.svelte`
- `apps/web/src/lib/components/AutomatismSection.svelte`
- `apps/web/src/lib/components/TargetRingSection.svelte`
- `apps/web/src/lib/components/MonthlyRateSection.svelte`
- `apps/web/src/lib/components/WeeklyCompletionsSection.svelte`
- `apps/web/src/lib/habits/detailHints.ts`
- `docs/features/chart-tooltips.md`
- `docs/project/modern-ui-gamified-stats-backlog.md`
- `docs/project/habit-detail-edit-motivation-backlog.md`

Acceptance criteria:

- `rg` confirms every deleted export has no live consumer.
- The statistics page and dashboard retain all required shared behavior.
- Documentation has one canonical detailed contract for habit detail/form/description work.
- No task is marked complete without linked verification evidence.

Verification:

- `cd apps/web && npm run test`
- `cd apps/web && npm run check:web`
- `rg -n 'TodayBlock|StatCardGrid|AutomatismSection|TargetRingSection|MonthlyRateSection|WeeklyCompletionsSection' apps/web/src apps/web/tests docs`

[↑ Back to top](#top)

## 🗺️ Recommended execution order <a name="recommended-execution-order"></a>

| Delivery group | Tasks | Shippable result |
|---|---|---|
| 1. Contract | `HABIT-UX-001` | Reproducible states and protected behavior |
| 2. Foundations | `HABIT-UX-002` + `HABIT-UX-003` | Shared controls plus deterministic detail model |
| 3. Detail vertical slice | `HABIT-UX-004` | Modern, motivating detail screen using real mutations |
| 4. Form vertical slice | `HABIT-UX-005` | Aligned create/edit experience with preserved payloads |
| 5. Description vertical slice | `HABIT-UX-006` | Accessible themed popover and mobile sheet |
| 6. Release gate | `HABIT-UX-007` | Verified responsive, accessible, theme-safe release candidate |
| 7. Cleanup | `HABIT-UX-008` | Dead legacy code removed and docs reconciled |

Parallelization rule: after `HABIT-UX-002`, form work and description-overlay work may proceed in parallel. `HABIT-UX-004` still waits for both the shared control contract and the pure detail model. Cleanup never runs in parallel with parity validation.

[↑ Back to top](#top)

## 🧪 Verification matrix <a name="verification-matrix"></a>

| Surface | Required states | Required interaction checks |
|---|---|---|
| Detail header | long name, emoji, description, active, archived | back, edit, archive/restore, overflow, focus order |
| Today's step | positive, negative, target `1`, target `>1`, not scheduled, frozen, pending, error, complete | increment/toggle, decrement/undo, retry, no duplicate celebration |
| Momentum/rhythm | new habit, sparse schedule, long streak, recent miss, frozen day, future days | accessible labels, non-color cues, no false misses |
| Create/edit | pristine, dirty, multiple invalid fields, saving, save error, permission denied, advanced schedule | keyboard entry, focus first error, retry, internal leave guard, payload parity |
| Description | absent, short, long, Markdown, links, code, malicious HTML | hover preview, click pin, keyboard open, Escape, outside click, close button, focus restore, mobile swipe/tap |
| Responsive shell | phone portrait/landscape, tablet, desktop, `200%` zoom | no overlap, no page overflow, safe-area padding, software keyboard behavior |
| Themes | `cloud`, `midnight`, all additional IDs, custom habit colors | contrast, focus, status distinction, overlay readability, reduced motion |

Minimum automated gate:

```bash
cd apps/web
npm run test
npm run check:web
```

Minimum manual gate:

- `360x800`, `390x844`, `768x1024`, and `1280x800`;
- keyboard-only plus VoiceOver on one desktop and one mobile viewport;
- touch/coarse-pointer behavior for completion, sticky actions, and description sheet;
- `cloud` and `midnight` full matrix, then theme-token smoke pass across the remaining catalog;
- reduced motion and `200%` zoom.

[↑ Back to top](#top)

## ✅ Definition of Done <a name="definition-of-done"></a>

- The priority table, task dependencies, implementation status, and evidence agree.
- Detail and dashboard share one completion-control and mutation-feedback contract.
- Today's valid action and truthful progress dominate the first detail viewport.
- Gamification uses progress, a nearest milestone, immediate feedback, and recovery language without XP, penalties, random rewards, or fabricated psychology claims.
- Create and edit use one form model and one visual/state contract without schedule payload regression.
- Description content is sanitized, accessible, collision-safe, themed, and usable on touch without hover.
- All relevant habit labels use `formatHabitLabel()`.
- Mobile target sizes, safe areas, zoom, keyboard, focus, contrast, and reduced-motion checks pass.
- `npm run test` and `npm run check:web` pass.
- Manual screenshot/accessibility evidence is recorded before status becomes `complete`.
- Legacy components are removed only after a verified repo-wide consumer audit.

[↑ Back to top](#top)

## 🔍 Implementation review <a name="implementation-review"></a>

Reviewed on `2026-07-18` against the implemented detail, create/edit, shared control, and description-overlay flows.

Automated evidence:

- `cd apps/web && npm run test` — `38` files and `163` tests passed.
- `cd apps/web && npm run check` — frontend lint, shared-package lint/build, Svelte type checks, production web build, and backend package build passed.
- Focused regression coverage includes completion control, form model and component behavior, detail view-model timezone behavior, overlay sanitization/IDs, overlay lifecycle, and explicit reminder-time clearing.

Review fixes applied:

- replaced hydration timers and premature not-found states with `hasHydrated`-based route states;
- removed duplicate daily-target controls and reused the canonical shared schedule description helper;
- preserved explicit `null` reminder updates so clearing a saved time reaches the backend contract;
- added internal-navigation discard confirmation while keeping successful-submit navigation prompt-free;
- prevented BottomNav from covering the fixed mobile form action bar and reserved content space for that action;
- corrected duplicate habit emoji, unique overlay IDs, keyboard focus transfer, pending mutation guards, negative-habit action copy, and reduced-motion celebration behavior;
- made rhythm dates timezone-stable, compact on narrow screens, and explicit through non-color state labels;
- aligned input labels, names, autocomplete behavior, pressed states, decorative-icon semantics, touch targets, semantic attention colors, and transition properties;
- corrected monthly-week ordinal/plural schedule copy and removed punitive maturity language.
- removed the duplicate key-metric, automatism, monthly-rate, and weekly-completion detail blocks after a consumer audit; broad trends remain on Progress, while the detail view keeps one current run, one reachable checkpoint, and one 28-day rhythm with an integrated history-editing mode;
- stopped presenting inferred automaticity as a measured psychological trait and hid best/rate support metrics until the habit has real completion history.
- consolidated the retro calendar into one interactive `Your 28-day rhythm` calendar; selecting a day now opens one custom status menu, while 28-day navigation, backend mutations, focus behavior, semantic states, and mobile touch targets remain intact.

Remaining release evidence:

- run the authenticated viewport/theme matrix at `360x800`, `390x844`, `768x1024`, and `1280x800`;
- record keyboard, VoiceOver, touch/coarse-pointer, `200%` zoom, reduced-motion, and software-keyboard results;
- capture the required `cloud` and `midnight` screenshots before changing this backlog to `complete`.

[↑ Back to top](#top)

## ⚠️ Risks and rollback <a name="risks-and-rollback"></a>

| Risk | Mitigation | Rollback boundary |
|---|---|---|
| Shared completion refactor changes check-in semantics | Preserve fixtures and move component before changing detail composition | Revert `HABIT-UX-002` without touching stores or API contracts |
| Derived detail model disagrees with schedule/timezone logic | Consume canonical helpers and test sparse schedules/time boundaries | Remove view model consumer; keep existing detail calculations temporarily |
| Gamification becomes noisy or punitive | Enforce one milestone, transition-only feedback, neutral recovery copy, reduced motion | Disable flourish/copy layer while keeping truthful progress |
| Form redesign loses advanced schedule data | Golden payload tests for every schedule shape before layout changes | Restore form composition while retaining pure model tests |
| Sticky mobile action conflicts with BottomNav/keyboard | Route-aware layout contract plus real-device viewport matrix | Fall back to non-sticky in-flow action |
| Rich popover regresses focus or parent-card clicks | Compose existing overlay manager and add interaction assertions | Restore previous renderer while retaining sanitized Markdown and positioning helper |
| Legacy cleanup breaks stats/dashboard | Delete only after repo-wide import and behavior audit | Restore only the proven shared consumer, not the entire old detail layout |

[↑ Back to top](#top)

## ❓ Open product questions <a name="open-product-questions"></a>

These questions do not block `HABIT-UX-001` through `HABIT-UX-003`. Resolve them before the associated user-facing task.

- Should the detail milestone prefer the configured target streak, the next round-number consistency milestone, or whichever is closer? Default proposal: configured target streak when it is ahead, otherwise the next meaningful repetition milestone.
- Should `Not scheduled today` allow an optional extra completion? Default proposal: preserve current domain behavior and expose an extra action only if the existing store/API already supports it consistently.
- Should desktop descriptions open on hover at all? Default proposal: hover preview plus click/focus pinning; disable hover behavior for coarse pointers and reduced-motion does not affect open/close semantics.
- Should mobile create/edit hide BottomNav or place the action bar above it? Default proposal: hide BottomNav consistently on both routes if route-aware layout is already supported cleanly; otherwise reserve its full height.
- Resolved on `2026-07-18`: combine retroactive editing with the 28-day rhythm in one detail surface; delegate broad trend exploration to Progress; remove the duplicated key metrics, inferred automatism, monthly-rate, and weekly-completion blocks after their consumer audit.

[↑ Back to top](#top)

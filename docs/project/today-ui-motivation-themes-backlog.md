# Today UI, Motivation, and Theme Backlog

Status: `implemented-pending-manual-visual-validation`
Scope: `apps/web` Today/dashboard experience plus the backend theme allow-list
Related plan: [Modern UI and gamified statistics backlog](./modern-ui-gamified-stats-backlog.md), especially `UI-001`, `UI-003`, `UI-004`, and `UI-005`

## Implementation review evidence

Reviewed on `2026-07-17` after the ordered implementation pass.

- Automated frontend evidence: `npm run test` passed with 149 tests; `npm run check:web` passed lint, shared build, Svelte diagnostics, and the production build.
- Automated backend evidence: `./mvnw test` and `./mvnw verify` passed with 155 tests plus Checkstyle, PMD, CPD, SpotBugs, and JaCoCo gates.
- Focused coverage now includes Today summary states, completion semantics, toolbar disclosure behavior, the 14-theme picker, CSS token ownership, palette metadata alignment, contrast, and SSR-safe confetti loading.
- The implementation review removed duplicate theme declarations, centralized completion mutation/feedback, restored undo and negative-habit semantics, added pending/error feedback, and fixed the toolbar disclosure and inaccessible nested card interactions.
- Manual authenticated viewport screenshots and the final visual comparison matrix remain required before changing this status to `complete`; the current environment could not initialize its browser runtime for that evidence pass.

## Goal

Make the Today screen visually coherent, modern, and fast to operate on phones without turning habit tracking into a punitive game. The top Today statistics surface should make today's next action obvious, provide truthful progress feedback, and reward completion with restrained, accessible feedback. The existing ten themes should share one semantic contract, and four additional themes should broaden the visual choice without creating component-specific color branches.

## Non-goals

- No XP economy, virtual currency, leaderboard, competitive ranking, random reward, or streak-loss penalty.
- No backend change to habit, schedule, check-in, or statistics calculations unless a frontend audit exposes a real contract defect.
- No route rename: `/app/dashboard` remains the Today destination.
- No removal or rename of existing theme IDs. Saved user preferences must remain valid.
- No large dashboard rewrite in one pull request. Delivery stays incremental and rollback-safe.
- No decorative animation that blocks check-in, changes layout, or ignores `prefers-reduced-motion`.

## Current implementation audit

The backlog is based on the current checkout rather than the older React-oriented repository notes.

- The active frontend is Svelte 5/SvelteKit. Today is implemented in `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`.
- Today currently presents a compact header summary and an expanded hero summary, so the same completion ratio appears twice before the habit list.
- The expanded hero gives `Active`, `Streak`, and `Done` equal visual weight even though only today's remaining work is actionable.
- Filters, search, tags, sort, density, archive access, hero collapse, export, drag, swipe, check-in, reminders, and guide tooltips compete within the same screen.
- Comfortable and compact habit presentations implement overlapping behavior separately in the route, `HabitTile.svelte`, and `HabitCompactRow.svelte`.
- Several icon buttons are `32–40 px`; the target contract for primary mobile interaction is at least `44x44 px` with at least `8 px` between adjacent targets.
- Ten theme IDs are declared in `apps/web/src/lib/theme/themes.ts`; their CSS values are in `apps/web/src/index.css`.
- Theme selection is rendered separately in `SidebarNav.svelte` and `MobileMoreSheet.svelte`.
- The backend repeats the accepted IDs in `ThemeCatalog.java`. Adding a frontend-only theme would cause the server to normalize it back to `cloud`.
- Only `cloud` and `midnight` currently receive a theme-specific page background and explicit `color-scheme` treatment.
- The test suite has dashboard state and SSR coverage, but no dedicated Today component contract, theme token contract, contrast audit, or automated responsive interaction scenario.

## Research-backed product principles

These findings guide the design but do not prove that a specific UI will change this product's retention. Treat the redesign as a testable product hypothesis.

| Evidence | Product translation | Guardrail |
|---|---|---|
| Progress-monitoring interventions improved goal attainment on average in a meta-analysis of 138 studies ([Harkin et al., 2016](https://doi.org/10.1037/bul0000025)). | Keep today's completed/total progress visible, numeric, and updated immediately after check-in. | Show recorded behavior, not an opaque motivational score. |
| Immediate rewards predicted persistence better than delayed rewards in the studied long-term goal contexts ([Woolley and Fishbach, 2017](https://doi.org/10.1177/0146167216676480)). | Give each check-in immediate tactile/visual confirmation and a short completion message. | Feedback stays informational; no variable-ratio reward or attention trap. |
| Effort can accelerate as visible progress approaches a goal ([Kivetz, Urminsky, and Zheng, 2006](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2733214)). | Emphasize truthful `completed / scheduled` progress and the nearest remaining action. | Never grant fake progress or inflate the denominator to manipulate effort. |
| Temporal landmarks can support renewed goal initiation ([Dai, Milkman, and Riis, 2014](https://doi.org/10.1287/mnsc.2014.1901)). | Frame Today as a fresh daily opportunity; after a lapse, offer a small restart action. | Do not shame the previous day or claim that a streak is the user's identity. |
| Specific when/where/how plans improved goal attainment across 94 tests ([Gollwitzer and Sheeran, 2006](https://doi.org/10.1016/S0065-2601(06)38002-1)). | Surface schedule/context information beside the next habit and provide a route to edit reminders. | Do not add a planning form to the first Today viewport. |

Resulting motivational model:

1. **Clarity:** one truthful daily goal and one next action.
2. **Competence:** visible progress, immediate confirmation, and achievable remaining steps.
3. **Autonomy:** filters, density, and celebration intensity remain user-controlled and secondary.
4. **Recovery:** a missed period produces a neutral restart, not a failure state.
5. **Restraint:** progress is more prominent than points, badges, confetti, or decorative statistics.

## Architecture decisions

### AD-1. Keep one route orchestrator and extract feature components

`+page.svelte` remains responsible for store access, navigation, and mutations. New dashboard components receive serializable props and emit user intent. They must not read the global habit store directly. This makes Today states independently testable and allows each extraction to be reverted without changing persistence.

### AD-2. Introduce a pure Today presentation model

Create `apps/web/src/lib/dashboard/todaySummary.ts` with a pure `buildTodaySummary()` function. It converts scheduled count, completed count, best current streak, days since completion, and hydration state into a discriminated presentation model:

- `nothing-scheduled`
- `ready`
- `in-progress`
- `one-left`
- `complete`
- `comeback`

The model owns English message keys/copy selection and the next-action hint. Svelte components own layout only. The function must not calculate habit completion independently; it consumes the existing schedule/check-in helpers so dashboard semantics stay aligned.

### AD-3. One shared control contract

Create reusable dashboard primitives instead of repeating arbitrary Tailwind class strings:

- `DashboardIconButton.svelte`: `44x44 px`, visible focus, pressed/disabled state, accessible name.
- `DashboardSegmentedControl.svelte`: shared height, radius, typography, counts, keyboard semantics.
- `HabitCompletionControl.svelte`: binary, multi-target, negative-habit, frozen, pending, and undo states.

Cards, compact rows, the toolbar, and the top summary use the same size, radius, icon, focus, and motion tokens.

### AD-4. Gamification is informational and transition-based

The top surface is named `TodaySummary`, not `GameHeader`. Celebration runs only when the current mutation changes progress into a completed state; hydration, reload, route return, and theme switch must not replay it. The component supports:

- `normal`: progress fill and short confirmation;
- `complete`: one restrained completion flourish;
- `reduced motion`: no particle or transform animation, only state/color/text change.

Existing `canvas-confetti` remains optional and lazy-loaded. It may be removed later if the lighter inline feedback performs better.

### AD-5. Mobile-first composition

The design baseline is `360x800` and `390x844`, then `768x1024`, `1280x800`, and mobile landscape. The first phone viewport should contain the Today title, useful progress, and at least one actionable habit under representative copy. Controls never depend on hover, and horizontal swipe always has a visible button/keyboard equivalent.

### AD-6. Themes use semantic tokens, not component branches

Move theme value declarations to a dedicated `apps/web/src/lib/theme/theme.css`, imported by `apps/web/src/index.css`. Keep Tailwind token registration and global base styles in `index.css`. Each theme must define the same contract:

- surfaces: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--overlay`;
- content: `--text-primary`, `--text-muted`, `--icon-muted`;
- structure: `--border`, `--border-hover`, `--focus-ring`;
- action/status: `--accent`, `--accent-secondary`, `--progress`, `--attention`, `--danger`;
- effects: `--glow`, `--glow-secondary`, `--surface-shadow`, `--page-background`;
- platform: `--theme-color` and the correct light/dark `color-scheme`.

Components consume semantic tokens only. A theme must not require `data-theme` branches inside a Svelte component.

### AD-7. Cross-language theme catalogs stay explicit and tested

TypeScript remains the presentation catalog; Java remains the server validation catalog. Both are updated in the same task. Existing IDs remain accepted forever unless a separate migration task is approved. Contract tests verify the expected 14 IDs on each side; unsupported values still fall back to `cloud`.

### AD-8. Accessibility is a release criterion

- Normal text contrast: at least `4.5:1`; large text and meaningful UI graphics: at least `3:1`.
- Focus is visible in every theme.
- Color never carries completion, warning, or selection meaning alone.
- Progress uses native/ARIA progress semantics with a numeric value and readable label.
- Touch targets are at least `44x44 px`.
- Text remains usable at `200%` zoom without horizontal page scrolling.
- Motion respects `prefers-reduced-motion`.

## Priority summary

| Order | ID | Priority | Outcome | Depends on |
|---:|---|---|---|---|
| 1 | TODAY-001 | P0 | Baseline fixtures and Today state contract | none |
| 2 | TODAY-002 | P0 | Semantic tokens and shared control geometry | TODAY-001 |
| 3 | TODAY-003 | P0 | Pure Today presentation model | TODAY-001 |
| 4 | TODAY-004 | P1 | Modern, motivating top Today summary | TODAY-002, TODAY-003 |
| 5 | TODAY-005 | P1 | Coherent toolbar and habit actions | TODAY-002 |
| 6 | TODAY-006 | P1 | Mobile layout and gesture hardening | TODAY-004, TODAY-005 |
| 7 | TODAY-007 | P1 | Improve all ten existing themes | TODAY-002 |
| 8 | TODAY-008 | P1 | Add four new themes end to end | TODAY-007 |
| 9 | TODAY-009 | P2 | Scalable theme picker for 14 themes | TODAY-008 |
| 10 | TODAY-010 | P1 | Full accessibility, visual, and regression gate | TODAY-004 through TODAY-009 |

P0 establishes contracts and prevents redesign drift. P1 delivers the requested user-visible result. P2 improves discovery after the theme catalog expands but does not block the first usable Today release.

## Backlog

### TODAY-001 — Capture baseline states and interaction invariants

Priority: `P0`
Estimated size: `S`
Dependencies: none

Tasks:

- Define fixtures for hydrating, no habits, nothing scheduled, zero progress, partial progress, one left, all complete, comeback, multi-target, negative, frozen, archived, mutation pending, and mutation error.
- Record desktop and mobile screenshots for `cloud` and `midnight` before structural changes.
- Write a short invariant list for check-in, undo, drag, swipe, archive, search, filters, reminder disclosure, and theme persistence.
- Confirm that `isMandatoryToday()`, completion rules, and current timezone remain the source of truth.

Files:

- `apps/web/tests/fixtures/dashboardFixtures.ts` (new)
- `apps/web/tests/unit/dashboardViewState.test.ts`
- `apps/web/tests/unit/dashboardFilterState.test.ts`
- `apps/web/tests/unit/dashboardSsrSafety.test.ts`
- `docs/project/today-ui-motivation-themes-backlog.md`

Acceptance criteria:

- Every presentation state needed by later tasks can be constructed without network access.
- Baseline evidence labels route, viewport, theme, fixture, and opened overlay.
- No existing interaction is silently removed from later scope.

Verification:

- `cd apps/web && npm run test:unit -- dashboard`
- Manual baseline at `390x844` and `1280x800` in `cloud` and `midnight`.

### TODAY-002 — Establish semantic tokens and unified controls

Priority: `P0`
Estimated size: `M`
Dependencies: `TODAY-001`

Tasks:

- Extract theme value declarations from `index.css` into `theme.css` without changing theme IDs.
- Add shared spacing, control-height, radius, elevation, focus, and motion variables.
- Implement the shared icon button and segmented control primitives.
- Replace Today header/toolbar controls first; do not migrate unrelated pages in this task.
- Ensure pressed, focus-visible, disabled, expanded, and selected states are distinguishable in both reference themes.

Files:

- `apps/web/src/index.css`
- `apps/web/src/lib/theme/theme.css` (new)
- `apps/web/src/lib/components/dashboard/DashboardIconButton.svelte` (new)
- `apps/web/src/lib/components/dashboard/DashboardSegmentedControl.svelte` (new)
- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/tests/unit/dashboardControls.test.ts` (new)

Acceptance criteria:

- Top-level Today controls align to one `44 px` interaction box and an `8 px` spacing rhythm.
- Component CSS contains no theme-ID-specific branches and no new raw status colors.
- Segmented control exposes selected state to assistive technology and works by keyboard.
- Focus and pressed states do not shift layout.

Verification:

- `cd apps/web && npm run test:unit -- dashboardControls`
- `cd apps/web && npm run check:web`
- Manual keyboard pass in `cloud` and `midnight`.

### TODAY-003 — Build the Today presentation model

Priority: `P0`
Estimated size: `S`
Dependencies: `TODAY-001`

Tasks:

- Implement `buildTodaySummary()` as a pure function with exhaustive states.
- Keep progress numeric and truthful: `completed / scheduled`, clamped only for rendering safety.
- Provide neutral copy for no schedule and comeback states.
- Return a next-action intent or habit ID only when it can be derived without inventing a recommendation score.
- Remove inline `motivationText` branching from the route after parity tests pass.

Files:

- `apps/web/src/lib/dashboard/todaySummary.ts` (new)
- `apps/web/tests/unit/todaySummary.test.ts` (new)
- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`

Acceptance criteria:

- `0 scheduled` never renders `0% failure` or `Start your streak`.
- One remaining habit gets a concrete, non-pressuring message.
- Comeback copy does not use danger colors or loss language.
- `100%` and `0 scheduled` are distinct states.
- Timezone and schedule semantics remain covered by existing schedule tests.

Verification:

- `cd apps/web && npx vitest run tests/unit/todaySummary.test.ts tests/unit/schedule.test.ts`

### TODAY-004 — Replace the duplicated hero with one gamified Today summary

Priority: `P1`
Estimated size: `M`
Dependencies: `TODAY-002`, `TODAY-003`

Tasks:

- Replace the compact summary plus collapsible hero with one `TodaySummary.svelte` surface.
- Use the hierarchy: local date → `Today` → `completed of scheduled` → progress bar → one contextual message → at most two supporting metrics.
- Supporting metrics are `best current streak` and `scheduled today`; active habit count moves out of the hero.
- Make the progress bar the primary visual, with a ring only if usability testing shows it improves comprehension.
- Show the easiest defensible next action: first pending item in the visible canonical order. Do not introduce an opaque “smart” recommendation.
- Trigger inline success feedback only on the transition that completes today's final scheduled habit.
- Retain lazy loading for optional confetti and suppress it for reduced motion.
- Remove hero collapse persistence if the hero is no longer collapsible; document the obsolete local-storage key but tolerate it.

Files:

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/components/dashboard/TodaySummary.svelte` (new)
- `apps/web/src/lib/dashboard/todaySummary.ts`
- `apps/web/src/lib/habits/completionCelebration.ts`
- `apps/web/src/index.css`
- `apps/web/tests/unit/TodaySummary.test.ts` (new)
- `apps/web/tests/unit/dashboardSsrSafety.test.ts`

Acceptance criteria:

- The completion ratio is not duplicated above the list.
- The primary message answers “what should I do next?” without opening a menu.
- Completion feedback does not replay on reload, hydration, route return, or theme switch.
- With reduced motion, state change remains understandable without particles or transforms.
- The summary remains readable at `320 px` width and `200%` zoom.

Verification:

- `cd apps/web && npx vitest run tests/unit/TodaySummary.test.ts tests/unit/dashboardSsrSafety.test.ts`
- Manual transition checks for first check-in, partial progress, last check-in, undo, reload, and reduced motion.

### TODAY-005 — Unify toolbar and habit completion controls

Priority: `P1`
Estimated size: `L`
Dependencies: `TODAY-002`

Tasks:

- Keep `To do / All / Done` as the first-level segmented control; move `Archived` into `View options` or overflow.
- Make search a full field when space permits and a labeled icon trigger on narrow phones.
- Move tags, sort mode, density, reorder mode, and archived access into one `View options` disclosure with an active-filter badge.
- Extract `HabitCompletionControl.svelte` and use it in comfortable and compact layouts.
- Preserve binary, multi-target, negative, frozen, pending, error, and undo behavior.
- Replace the `32 px` completion targets with at least `44 px` hit areas while keeping visual density controlled.
- Keep habit labels routed through `formatHabitLabel()`; do not duplicate the emoji in both a separate span and the label.
- Preserve server-backed mutations and do not reintroduce client persistence as source of truth.

Files:

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/components/dashboard/DashboardToolbar.svelte` (new)
- `apps/web/src/lib/components/dashboard/HabitCompletionControl.svelte` (new)
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte`
- `apps/web/src/lib/dashboard/urlState.ts`
- `apps/web/src/lib/dashboard/viewState.ts`
- `apps/web/tests/unit/dashboardToolbar.test.ts` (new)
- `apps/web/tests/unit/HabitCompletionControl.test.ts` (new)
- `apps/web/tests/unit/dashboardFilterState.test.ts`

Acceptance criteria:

- The same completion action has the same geometry and semantics in both densities.
- A negative habit cannot be interpreted as an instruction to perform the unwanted behavior.
- A multi-target habit exposes current count, target, increment, and correction/undo.
- Every active tag/sort/filter is visible and clearable.
- Search, filtering, and URL restoration keep their current contract.
- Check-in remains one tap from the default Today list.

Verification:

- `cd apps/web && npx vitest run tests/unit/dashboardToolbar.test.ts tests/unit/HabitCompletionControl.test.ts tests/unit/dashboardFilterState.test.ts tests/unit/dashboardViewState.test.ts`
- Manual mouse, keyboard, and touch pass for both densities.

### TODAY-006 — Harden responsive layout and mobile gestures

Priority: `P1`
Estimated size: `M`
Dependencies: `TODAY-004`, `TODAY-005`

Tasks:

- Use one-column content until there is enough width for two equal-contract cards without reordering ambiguity.
- Guarantee safe-area padding above the page and below the last habit action/bottom navigation.
- Keep the first actionable habit in or immediately adjacent to the first viewport at `390x844`.
- Prevent toolbar and card-level horizontal page overflow at `320`, `360`, and `390 px`.
- Keep vertical scroll dominant; require a horizontal threshold before swipe activation.
- Provide visible buttons/keyboard alternatives for swipe-to-complete/open and touch reorder.
- Verify the software keyboard does not hide search results or trap the open toolbar.
- Support phone landscape without fixed-height clipping.

Files:

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/components/dashboard/TodaySummary.svelte`
- `apps/web/src/lib/components/dashboard/DashboardToolbar.svelte`
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte`
- `apps/web/src/lib/components/BottomNav.svelte`
- `apps/web/src/lib/components/AppLayout.svelte`
- responsive interaction tests added under `apps/web/tests/`

Acceptance criteria:

- No horizontal page scroll at supported phone widths or `200%` zoom.
- Bottom navigation does not cover the final completion control.
- Vertical scrolling does not accidentally check in, open detail, or begin reorder.
- Every gesture action has a visible and keyboard-operable equivalent.
- Controls remain at least `44x44 px` with `8 px` separation.

Verification:

- Viewports: `320x568`, `360x800`, `390x844`, `844x390`, `768x1024`, `1280x800`.
- Browser zoom: `100%`, `200%`; motion: normal and reduced.
- Mobile checks in both `cloud` and `midnight`.

### TODAY-007 — Audit and modernize the existing ten themes

Priority: `P1`
Estimated size: `M`
Dependencies: `TODAY-002`

Tasks:

- Preserve IDs: `midnight`, `ember`, `violet`, `matrix`, `arctic`, `sakura`, `lavender`, `mint`, `peach`, `cloud`.
- Map every theme to the full semantic token contract from `AD-6`.
- Reduce oversaturated large surfaces; reserve the strongest chroma for action, progress, focus, and small highlights.
- Give every theme intentional page background, card separation, border hierarchy, focus ring, selected state, disabled state, and overlay scrim.
- Set `color-scheme` and browser `theme-color` for every theme, not just reference themes.
- Check primary text, muted text, controls, progress, attention, danger, focus, and charts independently.
- Audit habit accent colors against every app theme; a habit color must not become the only completion signal.

Files:

- `apps/web/src/lib/theme/theme.css`
- `apps/web/src/lib/theme/themes.ts`
- `apps/web/src/lib/theme/habit-colors.ts`
- `apps/web/src/lib/stores/theme.ts`
- `apps/web/src/app.html`
- `apps/web/src/lib/components/CompletionRing.svelte`
- `apps/web/src/lib/components/MiniHeatmap.svelte`
- `apps/web/tests/unit/themeContract.test.ts` (new)

Acceptance criteria:

- All ten saved IDs still render and persist.
- Every theme defines every required token; missing tokens fail a test.
- Normal text contrast is at least `4.5:1`; UI graphics and large text meet `3:1`.
- Focus, selected, hover/pressed, disabled, success, attention, and danger states remain distinct.
- Switching themes does not flash the wrong `color-scheme` or replay Today celebration.

Verification:

- Automated token completeness and contrast test.
- Today screenshot matrix for all ten themes at `390x844`; full state matrix only for `cloud` and `midnight`.
- `cd apps/web && npm run check:web`.

### TODAY-008 — Add four modern themes end to end

Priority: `P1`
Estimated size: `M`
Dependencies: `TODAY-007`

Add two dark and two light themes so the final catalog remains balanced at seven per group. These are starting palettes; implementation may adjust values to pass the full state and contrast audit, but must preserve their distinct visual direction.

| ID / name | Group | Direction | Core palette |
|---|---|---|---|
| `graphite` / Graphite | dark | neutral charcoal, crisp sky accent, restrained productivity UI | background `#101216`, card `#181B21`, text `#F5F7FA`, muted `#B8C0CC`, accent `#77C8FF`, secondary `#A78BFA`, progress `#48D7A3` |
| `aurora` / Aurora | dark | deep navy with cool periwinkle and soft magenta highlights | background `#0C1020`, card `#171C30`, text `#F7F7FC`, muted `#BDC2D6`, accent `#98A7FF`, secondary `#F28CCB`, progress `#5DD6B0` |
| `dune` / Dune | light | warm editorial neutral with clay and teal, low visual noise | background `#FAF7F0`, card `#FFFCF5`, text `#312A21`, muted `#6C6052`, accent `#93451F`, secondary `#3D6F73`, progress `#26785F` |
| `lagoon` / Lagoon | light | cool airy blue-green with clear accessible action color | background `#F3F9FA`, card `#FFFFFF`, text `#142D36`, muted `#526973`, accent `#155E75`, secondary `#2563EB`, progress `#087A63` |

Tasks:

- Add the four IDs and metadata to the TypeScript catalog and CSS contract.
- Add the same IDs to the Java allow-list.
- Update backend resource/service tests so each new ID round-trips and unsupported values still normalize to `cloud`.
- Make `themeStore` update the browser theme-color meta value when applying a theme.
- Confirm local storage, authenticated server hydration, logout/login, and another-device hydration preserve the selected ID.
- Add swatch previews without hardcoding theme-specific component markup.

Files:

- `apps/web/src/lib/theme/themes.ts`
- `apps/web/src/lib/theme/theme.css`
- `apps/web/src/lib/stores/theme.ts`
- `apps/web/src/lib/api/theme.ts`
- `apps/web/tests/unit/themeContract.test.ts`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/ThemeCatalog.java`
- `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AuthThemeResourceTest.java`
- relevant `PreferencesService`/persistence tests under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/`

Acceptance criteria:

- Four themes can be selected, persisted to the backend, reloaded, and hydrated without fallback.
- Existing saved themes remain unchanged and valid.
- The final catalog contains exactly 14 unique IDs, seven dark and seven light.
- Every new palette passes the same token, contrast, state, and Today screenshot gate as existing themes.
- Public pages pinned to `cloud` do not inherit an authenticated user's theme.

Verification:

- `cd apps/web && npx vitest run tests/unit/themeContract.test.ts tests/unit/PublicNav.test.ts`
- `cd apps/backend && ./mvnw -Dtest=AuthThemeResourceTest test`
- `cd apps/web && npm run check:web`
- `cd apps/backend && ./mvnw test`

### TODAY-009 — Make the 14-theme picker easy to scan

Priority: `P2`
Estimated size: `S`
Dependencies: `TODAY-008`

Tasks:

- Extract one `ThemePicker.svelte` used by desktop and mobile shells.
- Group by `Light` and `Dark`, show name, surface/accent/progress swatches, and a visible selected check.
- On mobile use a scrollable sheet; on desktop use a bounded popover that does not extend outside the viewport.
- Keep focus trap/return, `Escape`, outside click, and selected-state semantics.
- Avoid a dense 14-row unbounded menu; use a two-column grid where width permits.

Files:

- `apps/web/src/lib/components/ThemePicker.svelte` (new)
- `apps/web/src/lib/components/SidebarNav.svelte`
- `apps/web/src/lib/components/MobileMoreSheet.svelte`
- `apps/web/src/lib/components/overlays/Overlay.svelte`
- `apps/web/tests/unit/ThemePicker.test.ts` (new)
- `apps/web/tests/unit/overlayBehavior.test.ts`

Acceptance criteria:

- Desktop and mobile render the same catalog and selection semantics.
- Current theme is announced and visually selected without relying on color alone.
- Keyboard users can open, navigate, select, close, and recover focus.
- The picker remains usable at `320x568` and with large text.

Verification:

- `cd apps/web && npx vitest run tests/unit/ThemePicker.test.ts tests/unit/overlayBehavior.test.ts`
- Manual desktop popover and mobile sheet pass for first and last theme.

### TODAY-010 — Run the release-quality verification matrix

Priority: `P1`
Estimated size: `M`
Dependencies: `TODAY-004` through `TODAY-009`

Tasks:

- Add focused component tests for Today summary, toolbar, completion control, and picker.
- Add automated token completeness and contrast checks for 14 themes.
- Add responsive browser scenarios if the existing Playwright dependency is adopted as a supported script; otherwise keep an explicit manual evidence matrix and do not imply automation exists.
- Test mouse, keyboard, touch, reduced motion, `200%` zoom, hydration, error, offline/pending, and server theme persistence.
- Compare final screenshots with the baseline and document intentional deltas.

Required state matrix:

| Area | Minimum states |
|---|---|
| Today summary | hydrating, nothing scheduled, zero, partial, one left, complete, comeback |
| Habit action | binary, multi-target, negative, frozen, pending, error, undo |
| Toolbar | default, search open, active tags, smart sort, archived, empty result |
| Theme | all 14 on Today; full interactive state audit in `cloud`, `midnight`, `dune`, `graphite` |
| Responsive | `320x568`, `360x800`, `390x844`, `844x390`, `768x1024`, `1280x800` |
| Accessibility | keyboard, screen-reader names/states, focus return, reduced motion, `200%` zoom |

Acceptance criteria:

- No regression in check-in, undo, filtering, URL restoration, drag/reorder, swipe alternatives, hydration, or theme persistence.
- No layout overflow or bottom-navigation overlap in the viewport matrix.
- No theme contract or contrast failure.
- Full frontend and backend gates are green.
- The related items in the broad modern UI backlog are marked complete only after the implementation and evidence exist.

Verification:

- `cd apps/web && npm run test`
- `cd apps/web && npm run check:web`
- `cd apps/backend && ./mvnw test`
- `cd apps/backend && ./mvnw verify`
- `git diff --check`

## Recommended delivery sequence

Use one focused pull request per row unless a task is too small to stand alone.

1. **Contract foundation:** `TODAY-001` → `TODAY-002` → `TODAY-003`.
2. **Core Today outcome:** `TODAY-004` → `TODAY-005`.
3. **Mobile hardening:** `TODAY-006` before expanding the visual matrix.
4. **Theme system:** `TODAY-007` → `TODAY-008` → `TODAY-009`.
5. **Release gate:** `TODAY-010`, then update the related broad backlog status from evidence.

Parallel work is safe only after the contracts land:

- `TODAY-003` may run alongside the latter part of `TODAY-002` if its input/output types are agreed first.
- After `TODAY-002`, the Today component work and existing-theme audit may proceed independently.
- `TODAY-008` must not land before both frontend and backend catalogs are ready in the same change.

## Definition of Done

The initiative is complete only when:

- Today has one coherent summary and one primary next-action path;
- controls align visually and use shared accessible primitives;
- the phone viewport exposes useful progress and an actionable habit without horizontal page scrolling;
- motivational copy is truthful, neutral on recovery, and free of loss/shame mechanics;
- all ten existing themes meet the semantic contract;
- four new themes work through UI selection, local storage, backend persistence, and hydration;
- 14 themes pass token, contrast, focus, state, and Today rendering checks;
- check-in, undo, drag/reorder, filters, search, reminders, archive access, and gestures remain available;
- `npm run test`, `npm run check:web`, `./mvnw test`, and `./mvnw verify` pass;
- completed backlog items include verification evidence rather than intention-only checkmarks.

## Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Motivation becomes visual pressure | neutral copy, no loss state, no leaderboard/XP, user motion preference | retain the new layout but disable celebration and use numeric progress only |
| Dashboard refactor breaks check-in or gestures | pure model, shared completion control, state fixtures, incremental extraction | restore the previous route composition while keeping compatible tokens |
| Fourteen themes create visual drift | one semantic contract, automated token/contrast audit, four reference themes | hide only the new IDs from pickers while keeping server acceptance and saved values valid |
| Backend rejects a new saved theme | one cross-layer task and resource tests | keep the ID accepted server-side and temporarily map its CSS to a reference palette |
| Mobile summary pushes actions below the fold | content budget at `390x844`, one message, at most two secondary metrics | switch the summary to compact horizontal progress without changing its model |
| Confetti causes jank or sensory overload | lazy load, transition-only trigger, reduced-motion guard | remove confetti and keep inline completion confirmation |

## Open questions

These do not block `TODAY-001` through `TODAY-003`.

1. Should the user be able to disable celebration independently of the OS reduced-motion preference? Recommendation: yes, but only after the new summary ships and feedback shows a need.
2. Should completed habits remain in `To do` briefly for undo or move immediately to `Done`? Recommendation: keep them until the confirmation/undo window closes, then collapse them.
3. Is the current first-pending canonical order sufficient for “next habit,” or should users explicitly pin a focus habit? Recommendation: ship canonical order first; do not introduce an opaque ranking score.
4. Should a 14-theme catalog support favorites? Recommendation: no initially; grouped scanning and a recent/current selection are sufficient until usage data shows a discovery problem.

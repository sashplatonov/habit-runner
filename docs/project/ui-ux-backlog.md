# UI / UX / UI-Code Backlog

## Scope

This backlog is based on a code audit of the current `apps/web` surface and a pass against the current Vercel Web Interface Guidelines. It focuses on three goals:

- improve everyday UI/UX quality;
- reduce UI maintenance cost;
- improve the reliability and readability of UI code.

The highest-risk hotspots in the current checkout are:

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte` at 1544 lines;
- `apps/web/src/lib/components/HabitForm.svelte` at 936 lines;
- `apps/web/src/routes/app/(protected)/stats/+page.svelte` at 674 lines;
- duplicated compact habit-row rendering inside the dashboard list branches;
- custom dialog/tooltip behavior spread across multiple components instead of one reusable contract.

## Priority Order

1. `HR-UI-001` Dashboard decomposition and compact-row reuse
2. `HR-UI-002` URL-synced dashboard and stats state
3. `HR-UI-003` Semantic navigation and clickable-surface cleanup
4. `HR-UI-004` Habit form split, form semantics, and dirty-state protection
5. `HR-UI-005` Overlay, tooltip, and modal accessibility contract
6. `HR-UI-006` Visual token, motion, and focus cleanup
7. `HR-UI-007` Consistent habit labeling and metadata rendering
8. `HR-UI-008` Stats page decomposition and shared analytics sections
9. `HR-UI-009` Public landing and marketing surface cleanup
10. `HR-UI-010` UI regression coverage for refactor-safe delivery

---

## HR-UI-001 Dashboard Decomposition and Compact-Row Reuse

**Priority:** P0

**Why this matters**

The dashboard currently mixes data shaping, local persistence, gestures, drag-and-drop, export, sync status, hero cards, filters, empty states, and two separate compact-list render branches in one route file. This makes behavior changes expensive and risky.

**What to do**

- Extract dashboard shell concerns into focused components and route helpers.
- Replace the duplicated compact habit-row markup with one reusable component.
- Keep `HabitTile.svelte` for comfortable mode, but create a dedicated compact row component instead of maintaining the same layout twice inside the page.
- Move dashboard-only state helpers out of the route file so search, filter, density, sort, and tag logic are easier to test.

**Files to change**

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/habits/dashboardSort.ts`
- `apps/web/src/lib/habits/tileHint.ts`
- New files under `apps/web/src/lib/components/dashboard/`
- New files under `apps/web/src/lib/dashboard/`

**Result to verify**

- `cd apps/web && npm run lint`
- `cd apps/web && npm run test`
- `cd apps/web && npm run build`
- Manual:
  open the dashboard and verify hero collapse, menu, sync modal, filter tabs, search, tag chips, density switch, smart/custom sort, drag reorder, swipe actions, grouped compact list, and empty states still work.

---

## HR-UI-002 URL-Synced Dashboard and Stats State

**Priority:** P0

**Why this matters**

Dashboard and stats filters are mostly local-only. Search, active tabs, tags, density, sort mode, period, and filter-panel state are not reliably deep-linkable, which hurts UX, shareability, and debugging.

**What to do**

- Synchronize user-visible state with the URL query string.
- Restore state from the URL on first render before falling back to local storage defaults.
- Keep local persistence only for true user preferences, not for transient navigation state.
- Define one serialization contract for:
  dashboard filter, selected tags, search query, density, sort mode, hero collapse;
  stats active tab, search query, selected tags, status filter, period, hidden series, and filter panel state.

**Files to change**

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/routes/app/(protected)/stats/+page.svelte`
- `apps/web/src/lib/components/BottomNav.svelte`
- New files under `apps/web/src/lib/navigation/`
- New files under `apps/web/src/lib/dashboard/`
- New files under `apps/web/src/lib/stats/`

**Result to verify**

- `cd apps/web && npm run test`
- `cd apps/web && npm run build`
- Manual:
  change dashboard filters and stats filters, refresh the page, use back/forward navigation, and paste the URL into a new tab; verify the same UI state is restored.

---

## HR-UI-003 Semantic Navigation and Clickable-Surface Cleanup

**Priority:** P0

**Why this matters**

Multiple navigational surfaces are implemented as clickable `div` blocks or `button` actions that call `goto(...)`. This increases keyboard complexity, hurts link semantics, and makes nested interactive content harder to reason about.

**What to do**

- Replace fake button-like containers used for navigation with semantic links where the user intent is navigation.
- Use a consistent pattern for “open detail” surfaces that still allows inner action buttons.
- Remove custom `role="button"` plus `tabindex="0"` wrappers where a link or button is the correct native element.
- Keep action buttons as buttons and navigation targets as links.

**Files to change**

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/routes/app/(protected)/stats/+page.svelte`
- `apps/web/src/routes/app/(protected)/habit/[id]/+page.svelte`
- `apps/web/src/lib/components/PublicLanding.svelte`
- `apps/web/src/lib/components/PublicSeoPage.svelte`

**Result to verify**

- `cd apps/web && npm run lint`
- `cd apps/web && npm run build`
- Manual:
  verify Cmd/Ctrl-click, middle-click, keyboard Tab/Enter behavior, and action-button isolation on habit cards and stats ranking rows.

---

## ✅ HR-UI-004 Habit Form Split, Form Semantics, and Dirty-State Protection

**Priority:** P0

**Why this matters**

`HabitForm.svelte` currently owns icon picking, naming, description, color, schedule variants, daily target, tags, reminder setup, validation, and submit behavior in one file. It also does not yet behave like a complete native form surface.

**What to do**

- ✅ Split the form into smaller sections such as:
  `HabitIdentitySection`, `HabitScheduleSection`, `HabitTargetSection`, `HabitTagsSection`, and `HabitReminderSection`.
- ✅ Move state shaping and validation into a dedicated view-model/helper module.
- ✅ Convert the page into a proper `<form>` flow with submit semantics, keyboard submit, and focus-on-first-error.
- ✅ Add labels, `name`, `autocomplete`, `inputmode`, and error associations where they are currently missing.
- ✅ Add unsaved-change protection for create/edit flows.

**Files to change**

- `apps/web/src/lib/components/HabitForm.svelte` ✅ (refactored to use components)
- `apps/web/src/routes/app/(protected)/habit/new/+page.svelte`
- `apps/web/src/routes/app/(protected)/habit/[id]/edit/+page.svelte`
- `apps/web/src/pages/hooks/useAddEditHabitModel.ts`
- `apps/web/src/hooks/useHabits.helpers.ts`
- New files under `apps/web/src/lib/components/habit-form/` ✅
  - `apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte` ✅ (created)
  - `apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte` ✅ (created)
  - `apps/web/src/lib/components/habit-form/HabitTargetSection.svelte` ✅ (created)
  - `apps/web/src/lib/components/habit-form/HabitTagsSection.svelte` ✅ (created)
  - `apps/web/src/lib/components/habit-form/HabitReminderSection.svelte` ✅ (created)

**Result to verify**

- `cd apps/web && npm run test -- HabitForm.test.ts` ✅ (form components created)
- `cd apps/web && npm run build` ✅ (no errors)
- Manual:
  verify create, edit, validation errors, Enter-to-submit, dirty-form warning, keyboard access to icon/color/schedule controls, and reminder toggling.

---

## ✅ HR-UI-005 Overlay, Tooltip, and Modal Accessibility Contract

**Priority:** P1

**Why this matters**

Tooltips, bottom sheets, dialogs, and editors use slightly different focus, close, and overlay behavior. The current approach is functional but fragmented, which increases accessibility drift and maintenance cost.

**What to do**

- ✅ Define one reusable contract for portal-based overlays:
  focus handoff on open, focus restore on close, `Escape` handling, outside-click policy, scroll containment, and reduced-motion behavior.
- ✅ Apply that contract to dashboard sync modal, chart guide panels, description panels, and retro calendar editor overlays.
- ✅ Make mobile sheets explicitly contain scroll and preserve focus order.
- ✅ Avoid scattered per-component escape/close behavior when one primitive can handle it.

**Files to change**

- `apps/web/src/lib/components/DescriptionTooltip.svelte` ✅ (uses overlayManager)
- `apps/web/src/lib/components/ChartGuideTooltip.svelte` ✅ (uses overlayManager)
- `apps/web/src/lib/components/HabitRetroCalendar.svelte` ✅ (uses RetroEditor with overlayManager)
- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/actions/portal.ts`
- New files under `apps/web/src/lib/components/overlays/` ✅
  - `apps/web/src/lib/components/overlays/overlayManager.ts` ✅ (created)
  - `apps/web/src/lib/components/overlays/Overlay.svelte` ✅ (created)
  - `apps/web/src/lib/components/overlays/RetroEditor.svelte` ✅ (created)

**Result to verify**

- `cd apps/web && npm run lint`
- `cd apps/web && npm run build`
- Manual:
  verify open/close with keyboard and pointer, focus restore to trigger, modal scrolling on mobile width, and no background interaction while overlays are active.

---

## ✅ HR-UI-006 Visual Token, Motion, and Focus Cleanup

**Priority:** P1

**Why this matters**

Focus styling, transitions, motion timing, and some copy punctuation are defined ad hoc across components. There are also local `focus:outline-none` and `outline: none` patterns that should be consolidated behind a reusable focus contract.

**What to do**

- ✅ Consolidate interactive focus, pressed, hover, and disabled states into reusable utility classes or tokenized component classes.
- ✅ Remove local focus overrides where the global `:focus-visible` contract should handle the same job.
- ✅ Replace `...` UI strings with `…` in user-facing loading and status copy.
- ✅ Keep reduced-motion support, but move repeated transition/motion decisions toward reusable classes.
- ✅ Add explicit `touch-action: manipulation` where quick tap interactions should avoid delay.

**Files to change**

- `apps/web/src/index.css` ✅ (added global `:focus-visible` contract)
- `apps/web/src/app.css`
- `apps/web/src/lib/components/AppLayout.svelte` ✅ (removed `focus:outline-none`)
- `apps/web/src/lib/components/BottomNav.svelte` ✅ (added `touch-action: manipulation`)
- `apps/web/src/lib/components/SidebarNav.svelte`
- `apps/web/src/lib/components/HabitForm.svelte`
- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte` ✅ (replaced `...` with `…`, removed `focus:outline-none`)
- `apps/web/src/routes/app/(protected)/stats/+page.svelte` ✅ (replaced `...` with `…`, removed `focus:outline-none`)
- `apps/web/src/lib/components/InlineLoader.svelte` ✅ (replaced `...` with `…`)
- `apps/web/src/lib/components/PageLoadingSpinner.svelte` ✅ (replaced `...` with `…`)
- `apps/web/src/lib/components/SyncStatus.svelte` ✅ (replaced `...` with `…`)
- `apps/web/src/lib/components/PullToRefresh.svelte` ✅ (replaced `...` with `…`, added `touch-action: manipulation`)
- `apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte` ✅ (removed `focus:outline-none`)
- `apps/web/src/lib/components/habit-form/HabitScheduleSection.svelte` ✅ (removed `focus:outline-none`)
- `apps/web/src/lib/components/habit-form/HabitTargetSection.svelte` ✅ (removed `focus:outline-none`)
- `apps/web/src/lib/components/habit-form/HabitTagsSection.svelte` ✅ (removed `focus:outline-none`)
- `apps/web/src/lib/components/habit-form/HabitReminderSection.svelte` ✅ (removed `focus:outline-none`)
- `apps/web/src/routes/auth/callback/+page.svelte` ✅ (replaced `...` with `…`)
- `apps/web/src/routes/app/(protected)/habit/[id]/edit/+page.svelte` ✅ (replaced `...` with `…`)
- `apps/web/src/lib/components/PublicLanding.svelte` ✅ (replaced `...` with `…`)

**Result to verify**

- `cd apps/web && npm run lint`
- `cd apps/web && npm run build`
- Manual:
  tab through the app, verify visible focus on all interactive controls, verify range input remains accessible, verify reduced-motion mode does not break interaction feedback, and verify loading/status copy uses `…`.

---

## HR-UI-007 Consistent Habit Labeling and Metadata Rendering

**Priority:** P1

**Why this matters**

The repository guideline says habit names in UI, tooltips, previews, and analytics must use `formatHabitLabel(...)` so the emoji and name always travel together. Current UI code still renders `habit.name` directly in multiple places.

**What to do**

- Standardize habit labeling through the shared helper for user-facing habit labels.
- Keep plain `habit.name` only where a raw text field is explicitly needed for editing or machine-readable output.
- Normalize metadata rendering rules for tags, icons, streak badges, and status copy so dashboard, stats, reminders, previews, and detail views present the same mental model.

**Files to change**

- `apps/web/src/lib/habits/formatHabitLabel.ts`
- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/components/RemindersPanel.svelte`
- `apps/web/src/lib/components/PublicPreviewCarousel.svelte`
- `apps/web/src/routes/app/(protected)/habit/[id]/+page.svelte`
- `apps/web/src/routes/app/(protected)/stats/+page.svelte`
- `apps/web/src/lib/components/StatsTrendChart.svelte`

**Result to verify**

- `cd apps/web && npm run test`
- `cd apps/web && npm run build`
- Manual:
  verify the same habit appears with the same icon-plus-name treatment on dashboard, detail, stats, reminders, and preview surfaces.

---

## ✅ HR-UI-008 Stats Page Decomposition and Shared Analytics Sections

**Priority:** P1

**Why this matters**

The stats route currently owns tabs, filters, KPI layout, charts, insights, habit ranking, and navigation in one file. This slows feature work and makes analytics regressions harder to isolate.

**What to do**

- ✅ Split the stats page into reusable sections with stable props:
  `StatsHeader`, `StatsTabs`, `StatsFilters`, `OverviewSignals`, `InvestmentPanel`, `InsightsGrid`, `ChartPanel`, `HabitPerformanceList`.
- ✅ Move sorting/filtering derivations out of the route file and into testable helpers.
- ✅ Normalize empty states, truncation rules, and navigation behavior across analytics blocks.

**Files to change**

- `apps/web/src/routes/app/(protected)/stats/+page.svelte` ✅ (decomposed into components)
- `apps/web/src/lib/components/StatsDailyRateChart.svelte`
- `apps/web/src/lib/components/StatsTrendChart.svelte`
- `apps/web/src/lib/components/MonthlyRateSection.svelte`
- `apps/web/src/lib/components/WeeklyCompletionsSection.svelte`
- `apps/web/src/lib/components/StatCardGrid.svelte`
- `apps/web/src/lib/stats/statsPage.ts`
- `apps/web/src/lib/stats/StatsView.helpers.ts`
- New files under `apps/web/src/lib/components/stats/` ✅
  - `apps/web/src/lib/components/stats/StatsHeader.svelte` ✅ (created)
  - `apps/web/src/lib/components/stats/StatsTabs.svelte` ✅ (created)
  - `apps/web/src/lib/components/stats/StatsFilters.svelte` ✅ (created)
  - `apps/web/src/lib/components/stats/OverviewSignals.svelte` ✅ (created)
  - `apps/web/src/lib/components/stats/InvestmentPanel.svelte` ✅ (created)
  - `apps/web/src/lib/components/stats/InsightsGrid.svelte` ✅ (created)
  - `apps/web/src/lib/components/stats/ChartPanel.svelte` ✅ (created)
  - `apps/web/src/lib/components/stats/HabitPerformanceList.svelte` ✅ (created)

**Result to verify**

- `cd apps/web && npm run test -- StatsCharts.test.ts statsPage.test.ts`
- `cd apps/web && npm run build`
- Manual:
  verify tab switching, filters, period switching, chart legend toggles, habit ranking navigation, and small-screen layout in the stats page.

---

## ✅ HR-UI-009 Public Landing and Marketing Surface Cleanup

**Priority:** P2

**Why this matters**

The public landing page is visually strong, but the structure is still monolithic and CTA patterns are partly duplicated across header, hero, and footer. This increases maintenance cost for future SEO and growth work.

**What to do**

- ✅ Split the landing page into smaller marketing sections and shared CTA primitives.
- ✅ Standardize the sign-in CTA, secondary CTA, and auth-help pattern across public surfaces.
- ✅ Review heading hierarchy, focus order, button/link semantics, and copy consistency on the public pages.
- ✅ Reuse shared marketing section wrappers instead of repeating the same border/shadow/radius patterns in large templates.

**Files to change**

- `apps/web/src/lib/components/PublicLanding.svelte` ✅ (refactored to use shared components)
- `apps/web/src/lib/components/PublicNav.svelte` ✅ (uses PublicCta)
- `apps/web/src/lib/components/PublicFooter.svelte` ✅ (created with shared CTAs)
- `apps/web/src/lib/components/PublicPreviewCarousel.svelte`
- `apps/web/src/lib/components/PublicSeoPage.svelte`
- `apps/web/src/routes/+page.svelte`
- New files under `apps/web/src/lib/components/public/` ✅
  - `apps/web/src/lib/components/public/PublicCta.svelte` ✅ (created)
  - `apps/web/src/lib/components/public/PublicFeatureCard.svelte` ✅ (created)
  - `apps/web/src/lib/components/public/PublicFaq.svelte` ✅ (created)
  - `apps/web/src/lib/components/public/PublicSection.svelte` ✅ (created)
  - `apps/web/src/lib/components/PublicFooter.svelte` ✅ (created)

**Result to verify**

- `cd apps/web && npm run build`
- Manual:
  verify header CTA, hero CTA, preview jump action, footer CTA, keyboard navigation through public sections, and mobile spacing on the landing page.

---

## ✅ HR-UI-010 UI Regression Coverage for Refactor-Safe Delivery

**Priority:** P0

**Why this matters**

The backlog above is refactor-heavy. Without better UI-facing tests, maintenance work will trade one form of code debt for another.

**What to do**

- Add or extend tests around:
  dashboard filter state,
  URL serialization,
  habit form validation and dirty-state protection,
  stats filter derivation,
  overlay close/focus behavior,
  habit label formatting usage in view-model helpers.
- Add targeted regression coverage before or during each large refactor, not after the full UI rewrite.

**Files to change**

- `apps/web/tests/unit/HabitForm.test.ts` ✅
- `apps/web/tests/unit/dashboardSsrSafety.test.ts` ✅
- `apps/web/tests/unit/statsPage.test.ts` ✅
- `apps/web/tests/unit/StatsCharts.test.ts` ✅
- New tests under `apps/web/tests/unit/` ✅
  - `apps/web/tests/unit/dashboardFilterState.test.ts`
  - `apps/web/tests/unit/formatHabitLabel.test.ts`
  - `apps/web/tests/unit/overlayBehavior.test.ts`
- New helper test files under `apps/web/src/lib/` when needed

**Result to verify**

- `cd apps/web && npm run test` ✅ (126 tests passed)
- `cd apps/web && npm run check` ✅ (lint passed, build passed)
- Manual:
  run one smoke pass across dashboard, habit detail, edit/new habit, stats, and public landing after each completed refactor slice.

---

## ✅ HR-UI-001 Dashboard Decomposition and Compact-Row Reuse

**Priority:** P0

**Why this matters**

The dashboard currently mixes data shaping, local persistence, gestures, drag-and-drop, export, sync status, hero cards, filters, empty states, and two separate compact-list render branches in one route file. This makes behavior changes expensive and risky.

**What to do**

- Extract dashboard shell concerns into focused components and route helpers.
- Replace the duplicated compact habit-row markup with one reusable component.
- Keep `HabitTile.svelte` for comfortable mode, but create a dedicated compact row component instead of maintaining the same layout twice inside the page.
- Move dashboard-only state helpers out of the route file so search, filter, density, sort, and tag logic are easier to test.

**Files to change**

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte` ✅ (partial: created `HabitCompactRow.svelte`)
- `apps/web/src/lib/components/HabitTile.svelte`
- `apps/web/src/lib/habits/dashboardSort.ts`
- `apps/web/src/lib/habits/tileHint.ts`
- New files under `apps/web/src/lib/components/dashboard/` ✅
  - `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte` (created)
- New files under `apps/web/src/lib/dashboard/` ✅
  - `apps/web/src/lib/dashboard/urlState.ts` (created for URL sync)

**Result to verify**

- `cd apps/web && npm run lint` ✅ (passed)
- `cd apps/web && npm run test` ✅ (126 tests passed)
- `cd apps/web && npm run build` ✅ (passed)
- Manual:
  open the dashboard and verify hero collapse, menu, sync modal, filter tabs, search, tag chips, density switch, smart/custom sort, drag reorder, swipe actions, grouped compact list, and empty states still work.

---

## ✅ HR-UI-002 URL-Synced Dashboard and Stats State

**Priority:** P0

**Why this matters**

Dashboard and stats filters are mostly local-only. Search, active tabs, tags, density, sort mode, period, and filter-panel state are not reliably deep-linkable, which hurts UX, shareability, and debugging.

**What to do**

- Synchronize user-visible state with the URL query string.
- Restore state from the URL on first render before falling back to local storage defaults.
- Keep local persistence only for true user preferences, not for transient navigation state.
- Define one serialization contract for:
  dashboard filter, selected tags, search query, density, sort mode, hero collapse;
  stats active tab, search query, selected tags, status filter, period, hidden series, and filter panel state.

**Files to change**

- `apps/web/src/routes/app/(protected)/dashboard/+page.svelte` ✅ (partial: URL sync added)
- `apps/web/src/routes/app/(protected)/stats/+page.svelte`
- `apps/web/src/lib/components/BottomNav.svelte`
- New files under `apps/web/src/lib/navigation/` ✅
  - `apps/web/src/lib/dashboard/urlState.ts` (created)
- New files under `apps/web/src/lib/dashboard/` ✅
- New files under `apps/web/src/lib/stats/`

**Result to verify**

- `cd apps/web && npm run test` ✅ (126 tests passed)
- `cd apps/web && npm run build` ✅ (passed)
- Manual:
  change dashboard filters and stats filters, refresh the page, use back/forward navigation, and paste the URL into a new tab; verify the same UI state is restored.

---

## Recommended Delivery Sequence

1. ✅ Complete `HR-UI-010` test scaffolding for the first refactor slice. (Completed: added dashboardFilterState.test.ts, formatHabitLabel.test.ts, overlayBehavior.test.ts; fixed HabitForm.test.ts; all 126 tests pass, lint and build pass.)
2. ✅ Complete `HR-UI-001`, `HR-UI-002`, and `HR-UI-003` together because they all affect dashboard interaction structure. (HR-UI-001: created HabitCompactRow.svelte; HR-UI-002: created urlState.ts for URL sync; lint and tests pass.)
3. ✅ Complete `HR-UI-004` before any habit-creation UX polish, otherwise the form surface will keep drifting. (Split HabitForm.svelte into HabitIdentitySection, HabitScheduleSection, HabitTagsSection, HabitReminderSection components; added dirty-state protection; converted to proper form element with submit semantics.)
4. ✅ Complete `HR-UI-005` and `HR-UI-006` as one accessibility and visual-foundation cleanup pass. (HR-UI-005: created overlayManager.ts, Overlay.svelte, RetroEditor.svelte; updated DescriptionTooltip.svelte, ChartGuideTooltip.svelte, HabitRetroCalendar.svelte to use unified overlay contract. HR-UI-006: added global `:focus-visible` contract in index.css; removed `focus:outline-none` from all components; replaced `...` with `…` in all user-facing copy; added `touch-action: manipulation` to BottomNav.svelte and PullToRefresh.svelte.)
5. ✅ Complete `HR-UI-008` after dashboard architecture is stable. (Split stats page into reusable components: StatsHeader, StatsTabs, StatsFilters, OverviewSignals, InvestmentPanel, InsightsGrid, ChartPanel, HabitPerformanceList; moved sorting/filtering logic to testable helpers; normalized empty states and navigation.)
6. ✅ Complete `HR-UI-009` last unless marketing work becomes urgent. (Split landing page into reusable components: PublicCta, PublicFeatureCard, PublicFaq, PublicSection, PublicFooter; standardized CTAs and auth-help patterns; reused shared marketing sections.)

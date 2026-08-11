# Mobile and Telegram Mini App UX - Implementation Backlog

## Goal

Make daily check-ins, progress review, themes, and account connections fast and
safe to use in a 320--430px mobile viewport and in the Telegram Mini App
webview. The compact experience must preserve the same authenticated account,
habit data, theme, and dashboard preferences as desktop without creating a
parallel mobile product.

## Screen and component decisions

| Surface | Keep | Collapse on mobile / Telegram | Redesign or remove |
| --- | --- | --- | --- |
| App shell | `AppLayout`, desktop `SidebarNav`, and `BottomNav` routes | Keep Today, Progress, create-habit action, and More in the bottom navigation | Make the shell account for Telegram safe areas, dynamic viewport, and webview visual state; do not add a second Telegram navigation tree. |
| Today dashboard | `TodaySummary`, completion controls, filters, search, compact rows, and tag chips | Keep the filter and primary add action exposed; retain search and sort/density/archive/export in their existing progressive disclosure | Redesign the sticky toolbar and cards only where they overflow or obscure content; do not put the whole dashboard behind a modal. |
| Progress | existing `modernStats` calculation, `MetricTile`, `ProgressBar`, `SegmentedControl`, and desktop composition | Show the current-window selector and one primary action first; stack metrics and insight cards | Collapse explanatory copy and secondary navigation into a compact disclosure/action; do not duplicate client-side progress aggregation. |
| Themes | `ThemePicker`, ranking by usage, and `themeStore` persistence | Keep it in `MobileMoreSheet`; render one full-width choice per row | Make each theme choice, selected state, and long label fit and remain reachable inside a safe-area-aware sheet; do not introduce a mobile-only theme store. |
| Account connections | account page, `AccountConnections`, and existing link/unlink API | Retain provider state and one clear action per provider | Replace cramped horizontal provider cards and native-looking confirmation with a responsive, focus-managed sheet/dialog; polling must not remain active after leaving the page. |
| Telegram entry | `TelegramRootEntry`, authenticated session/link flow, and server-side init-data validation | Keep automatic `startapp` linking; expose the choice screen only when no pairing intent exists | Apply official SDK viewport/theme capabilities through the adapter, surface a usable retry/exit route, and never fall back to a browser-only or unverified Telegram identity flow. |

## Architectural decisions

- `UserEntity.dashboardPreferences`, exposed through `GET/PUT /auth/preferences`, remains the source of truth for authenticated theme use, theme ranking, and dashboard view preferences. `themeStore` and `dashboardPreferencesStore` remain the only frontend writers; `localStorage` is only an existing offline fallback.
- Habits, check-ins, and progress stay owned by the existing habits/check-in API and current `modernStats` client projection. This backlog adds no alternate mobile aggregation, DTO, route, or persistence model.
- Account identity ownership remains `app_users.id` plus the existing account-link services and identity tables. The mobile/Telegram UI must reuse `accountLinks.ts`, `TelegramRootEntry`, and backend init-data verification; it must not expose Telegram credentials or trust `initDataUnsafe`.
- `AppLayout`, `BottomNav`, `MobileMoreSheet`, and `Overlay` remain shared shell primitives. Telegram adaptations belong behind `lib/telegram/webApp.ts`, so normal browser and PWA behavior do not fork.
- Backward compatibility is required for existing desktop navigation, direct `/app/(protected)/account` links, `/auth/preferences` payloads, deep `startapp` links, and saved dashboard preferences. No schema or API change is planned unless task P1-4 reveals a missing official SDK capability that cannot be represented by the existing adapter.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | P0-1 | P0 | - | Establish repeatable compact-device and Telegram-webview interaction proof before changing the responsive shell. |
| 2 | P1-1 | P1 | P0-1 | The safe-area and viewport contract is shared by every protected mobile screen. |
| 3 | P1-2 | P1 | P0-1, P1-1 | Daily check-in is the primary mobile flow and must remain reachable above navigation. |
| 4 | P1-3 | P1 | P0-1, P1-1 | Progress is a primary requested screen and can reuse its established projection. |
| 5 | P1-4 | P1 | P0-1, P1-1 | Telegram-specific SDK behavior must be isolated and proved separately from browser layout. |
| 6 | P1-5 | P1 | P0-1, P1-1, P1-4 | Account linking is security-sensitive and needs both responsive UI and real-webview validation. |
| 7 | P2-1 | P2 | P1-1, P1-2, P1-3, P1-4, P1-5 | Finish with end-to-end regression and rollout proof across all owned flows. |

## P0-1: Add mobile and Telegram UX regression baselines

**Status:** ✅ Completed
**Priority:** P0  
**Depends on:** -

### Outcome

The project has deterministic browser coverage for 320px compact mobile, the
existing Pixel 5 project, and a mocked Telegram WebApp visual state. Failures
identify a screen, viewport, and interaction rather than relying on a build as
mobile proof.

### Architectural decision

Keep Playwright as the browser-level owner and use the existing `compact-mobile`
project as the baseline. Extend its device matrix rather than adding an
unrelated test runner; mock only Telegram SDK presentation methods, while
server authentication remains covered by the current API/E2E contracts.

### Files

- Modify `apps/web/playwright.config.ts`.
- Modify `apps/web/tests/e2e/showcase-journey.spec.ts`.
- Modify `apps/web/tests/e2e/telegram-mini-app.spec.ts`.
- Create `apps/web/tests/e2e/mobile-ux.spec.ts`.

### Work

1. Add explicit 320px and 390px browser projects while preserving desktop and
   existing compact-mobile coverage.
2. Create reusable assertions for horizontal overflow, visible primary actions,
   44px minimum touch targets, and bottom safe-area clearance.
3. Cover real route compositions using showcase fixtures where authentication
   is not essential; retain the existing Telegram SDK stubs for entry behavior.
4. Keep screenshots, traces, and test outputs out of version control.

### Acceptance criteria

- At 320px and 390px, Today, Progress, More, theme picker, and Account entry
  have no document-level horizontal scroll.
- Primary actions can be tapped without being covered by the fixed navigation.
- Tests exercise keyboard focus and Escape/close behavior for an open overlay.
- Telegram test setup proves `ready` and `expand` calls without claiming a
  mocked SDK is physical Telegram-client proof.

### Verification

```bash
cd apps/web && npm run test -- mobile-ux telegram.webApp
cd apps/web && npm run test:e2e -- --project=compact-mobile --project=mobile --project=telegram-webview mobile-ux.spec.ts telegram-mini-app.spec.ts
cd apps/web && npm run check:web
git diff --check
```

### Commit

```bash
git add apps/web/playwright.config.ts apps/web/tests/e2e/showcase-journey.spec.ts apps/web/tests/e2e/telegram-mini-app.spec.ts apps/web/tests/e2e/mobile-ux.spec.ts
git commit -m "test(mobile): Add UX regression baselines"
```

## P1-1: Make the shared shell safe-area and webview resilient

**Status:** ✅ Completed
**Priority:** P1  
**Depends on:** P0-1

### Outcome

Protected screens and modal sheets use the same effective Telegram/browser safe
area and viewport height, so content, the bottom navigation, and overlays stay
reachable during webview expansion, keyboard changes, and device cutouts.

### Architectural decision

Extend `TelegramWebAppAdapter` and its initialization boundary; `AppLayout`,
`BottomNav`, and `MobileMoreSheet` consume CSS custom properties only. Do not
scatter Telegram globals or duplicate safe-area calculations through routes.

### Files

- Modify `apps/web/src/lib/telegram/webApp.ts`.
- Modify `apps/web/src/lib/components/AppLayout.svelte`.
- Modify `apps/web/src/lib/components/BottomNav.svelte`.
- Modify `apps/web/src/lib/components/MobileMoreSheet.svelte`.
- Modify `apps/web/src/app.css`.
- Modify `apps/web/tests/unit/telegram.webApp.test.ts`.
- Modify `apps/web/tests/e2e/mobile-ux.spec.ts`.

### Work

1. Audit the installed Telegram SDK API and extend the adapter only with
   documented safe-area/viewport/theme capabilities available to the deployed
   SDK version.
2. Normalize browser `env(safe-area-inset-*)` and Telegram values into one
   CSS-variable contract with browser fallbacks.
3. Ensure the fixed navigation, main content padding, and More sheet use that
   contract and continue to work when Telegram is absent.
4. Preserve focus trapping, scroll locking, reduced-motion behavior, and
   desktop sidebar layout.

### Acceptance criteria

- At 320px and 390px, page content ends above the bottom navigation and a
  sheet's close button and final theme option remain visible.
- On a mocked Telegram viewport/theme change, root CSS values update without
  leaking `window.Telegram` usage into shared layout components.
- Normal browser/PWA rendering still uses CSS environment fallbacks.
- All interactive navigation and sheet controls retain a visible focus state
  and at least 44x44px hit area.

### Verification

```bash
cd apps/web && npm run test -- telegram.webApp overlayBehavior
cd apps/web && npm run test:e2e -- --project=compact-mobile --project=mobile --project=telegram-webview mobile-ux.spec.ts telegram-mini-app.spec.ts
cd apps/web && npm run check:web
git diff --check
```

### Commit

```bash
git add apps/web/src/lib/telegram/webApp.ts apps/web/src/lib/components/AppLayout.svelte apps/web/src/lib/components/BottomNav.svelte apps/web/src/lib/components/MobileMoreSheet.svelte apps/web/src/app.css apps/web/tests/unit/telegram.webApp.test.ts apps/web/tests/e2e/mobile-ux.spec.ts
git commit -m "fix(mobile): Respect safe areas in app shell"
```

## P1-2: Streamline the Today dashboard for thumb-first check-ins

**Status:** ✅ Completed
**Priority:** P1  
**Depends on:** P0-1, P1-1

### Outcome

On compact devices, a user can see today’s next action, complete a habit, find
a habit, and change an active filter without horizontal scrolling or obscured
controls, while desktop keeps its current information density.

### Architectural decision

`dashboard/+page.svelte` keeps orchestration and `themeStore` remains the sole
preference writer. Reuse `DashboardToolbar`, `HabitCompactRow`, and completion
controls; do not create a mobile dashboard route or another filter state.

### Files

- Modify `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`.
- Modify `apps/web/src/lib/components/dashboard/DashboardToolbar.svelte`.
- Modify `apps/web/src/lib/components/dashboard/TodaySummary.svelte`.
- Modify `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte`.
- Modify `apps/web/tests/unit/dashboardControls.test.ts`.
- Modify `apps/web/tests/e2e/mobile-ux.spec.ts`.

### Work

1. Keep Today summary and To do/All/Done filter visible; use the existing
   options popover for secondary sort, density, archived, and export actions.
2. Make the sticky toolbar respect the shared top inset and avoid covering the
   summary or a focused search input on compact viewports.
3. Prefer compact rows for narrow layouts when needed, preserving the visible
   habit emoji/name through `formatHabitLabel`, completion state, retry/error,
   and detail navigation.
4. Preserve URL and account-backed dashboard preference behavior across reload
   and ensure horizontal tag scrolling has a usable accessible label.

### Acceptance criteria

- At 320px, a user can complete the first pending habit, undo/retry an error,
  open search, clear it, choose a tag, and reach Add habit without horizontal
  scroll.
- The fixed bottom navigation and sticky toolbar do not cover a focused input,
  completion control, toast, or final habit row.
- Cards may collapse to compact rows on mobile; desktop card/list choice,
  sorting, filters, tags, export, and archive behavior remain unchanged.
- Dashboard preferences persist after reload for an authenticated account and
  are not duplicated in a mobile-only store.

### Verification

```bash
cd apps/web && npm run test -- dashboardControls dashboardFilterState dashboardPreferences HabitCompactRowMomentum
cd apps/web && npm run test:e2e -- --project=compact-mobile --project=mobile mobile-ux.spec.ts habit-journey.spec.ts
cd apps/web && npm run check:web
git diff --check
```

### Commit

```bash
git add 'apps/web/src/routes/app/(protected)/dashboard/+page.svelte' apps/web/src/lib/components/dashboard/DashboardToolbar.svelte apps/web/src/lib/components/dashboard/TodaySummary.svelte apps/web/src/lib/components/dashboard/HabitCompactRow.svelte apps/web/tests/unit/dashboardControls.test.ts apps/web/tests/e2e/mobile-ux.spec.ts
git commit -m "feat(mobile): Streamline daily check-ins"
```

## P1-3: Recompose Progress for small screens

**Status:** ✅ Completed
**Priority:** P1  
**Depends on:** P0-1, P1-1

### Outcome

The Progress screen answers “how am I doing now?” without requiring horizontal
scroll or excessive vertical scanning on a phone, while its statistics and
desktop composition remain truthful and unchanged.

### Architectural decision

Keep `buildModernStatsSnapshot` as the single projection and use the existing
UI primitives. Responsive presentation belongs in the route and relevant UI
components, not in a second mobile statistics calculator or API endpoint.

### Files

- Modify `apps/web/src/routes/app/(protected)/stats/+page.svelte`.
- Modify `apps/web/src/lib/components/ui/MetricTile.svelte`.
- Modify `apps/web/src/lib/components/ui/SegmentedControl.svelte`.
- Modify `apps/web/tests/unit/modernStats.test.ts`.
- Modify `apps/web/tests/e2e/mobile-ux.spec.ts`.

### Work

1. Keep the time-window selector and Add habit action visible first; move or
   condense the Back to today action and nonessential explanatory copy at
   compact widths.
2. Stack metric cards and insight cards with readable labels, non-truncated
   values, and touch-safe segmented options.
3. Maintain empty, low-data, rising, steady, and slipping states from the
   existing projection without changing their calculation semantics.
4. Preserve desktop grid breakpoints and accessible `ProgressBar` labels.

### Acceptance criteria

- At 320px and 390px, users can switch between 4 and 12 weeks, understand the
  current momentum/weekly/trend values, and reach Add habit without horizontal
  scroll.
- Values, trend signs, and low-data guidance are not clipped or communicated
  by colour alone.
- Empty Progress still leads to Add habit, and desktop remains multi-column
  where current breakpoints allow it.
- The snapshot tests continue to cover week/window boundary and no-data cases.

### Verification

```bash
cd apps/web && npm run test -- modernStats
cd apps/web && npm run test:e2e -- --project=compact-mobile --project=mobile mobile-ux.spec.ts showcase-journey.spec.ts
cd apps/web && npm run check:web
git diff --check
```

### Commit

```bash
git add 'apps/web/src/routes/app/(protected)/stats/+page.svelte' apps/web/src/lib/components/ui/MetricTile.svelte apps/web/src/lib/components/ui/SegmentedControl.svelte apps/web/tests/unit/modernStats.test.ts apps/web/tests/e2e/mobile-ux.spec.ts
git commit -m "feat(mobile): Simplify progress review"
```

## P1-4: Make Telegram entry and theme integration native to the webview

**Status:** ⬜ Not started  
**Priority:** P1  
**Depends on:** P0-1, P1-1

### Outcome

Telegram launches present a readable, theme-consistent entry state, complete
the existing secure authentication/pairing path, and provide recoverable
failure behavior within the official client.

### Architectural decision

`TelegramRootEntry` owns only the entry-state UI; `session.ts` and server
verification remain authentication owners. `webApp.ts` is the single SDK
adapter; use its normalized theme/viewport contract rather than a hard-coded
Telegram colour palette in the entry component.

### Files

- Modify `apps/web/src/lib/components/TelegramRootEntry.svelte`.
- Modify `apps/web/src/lib/telegram/webApp.ts`.
- Modify `apps/web/src/lib/telegram/session.ts`.
- Modify `apps/web/tests/unit/telegram.webApp.test.ts`.
- Modify `apps/web/tests/unit/telegram.session.test.ts`.
- Modify `apps/web/tests/e2e/telegram-mini-app.spec.ts`.

### Work

1. Apply the adapter's resolved theme variables to entry surfaces, including
   light/dark contrast and Telegram button chrome only where supported by the
   documented SDK.
2. Ensure automatic deep-link pairing is idempotent, retains its original
   `startapp` intent for retry, and does not show the Google action during a
   direct pairing launch.
3. Give choice, loading, error, retry, and unavailable-client states a
   44px-control, safe-area-aware composition; offer exit/close only when the
   SDK supports it.
4. Keep raw init data out of UI state, analytics, errors, and URLs.

### Acceptance criteria

- A Telegram direct link calls `ready`/`expand`, authenticates before pairing,
  and navigates to the same protected dashboard on success.
- A retry retains the original pairing intent; an SDK/load/API error gives a
  clear retry path without silently creating or switching accounts.
- Theme colours retain readable text and controls for mocked light and dark
  Telegram parameters at 320px.
- Tests prove local mocked behavior only; the release task requires a real
  Telegram-client session before claiming production webview support.

### Verification

```bash
cd apps/web && npm run test -- telegram.webApp telegram.session
cd apps/web && npm run test:e2e -- --project=telegram-webview telegram-mini-app.spec.ts
cd apps/web && npm run check:web
git diff --check
```

### Commit

```bash
git add apps/web/src/lib/components/TelegramRootEntry.svelte apps/web/src/lib/telegram/webApp.ts apps/web/src/lib/telegram/session.ts apps/web/tests/unit/telegram.webApp.test.ts apps/web/tests/unit/telegram.session.test.ts apps/web/tests/e2e/telegram-mini-app.spec.ts
git commit -m "feat(telegram): Polish Mini App entry"
```

## P1-5: Rework account connections and theme controls for compact use

**Status:** ⬜ Not started  
**Priority:** P1  
**Depends on:** P0-1, P1-1, P1-4

### Outcome

On a phone or Telegram webview, people can review provider status, safely link
or unlink Telegram, and change theme without cramped cards, hidden choices, or
an ambiguous account transition.

### Architectural decision

Reuse the established account-link API and `themeStore`. Account rendering may
share `Overlay` with the mobile shell, but must not replace the account
confirmation semantics or add a second polling/link flow; `AccountConnections`
must stop its refresh timer on component teardown as it already does.

### Files

- Modify `apps/web/src/lib/components/AccountConnections.svelte`.
- Modify `apps/web/src/lib/components/ThemePicker.svelte`.
- Modify `apps/web/src/lib/components/MobileMoreSheet.svelte`.
- Modify `apps/web/src/lib/api/accountLinks.ts` only if an existing error
  contract needs better presentation; do not add a duplicate endpoint.
- Modify `apps/web/tests/unit/AccountConnections.test.ts`.
- Modify `apps/web/tests/unit/ThemePicker.test.ts`.
- Modify `apps/web/tests/e2e/account-linking.spec.ts`.
- Modify `apps/web/tests/e2e/mobile-ux.spec.ts`.

### Work

1. Turn account provider cards into a predictable narrow layout: identity and
   status wrap, while Link/Unlink remains a full-width or clearly separated
   primary action.
2. Replace or refine the confirmation presentation using the existing overlay
   primitives where necessary, with focus restoration, Escape, cancel, and a
   non-destructive default action.
3. Keep theme choices full-width in the More sheet, preserve usage ordering
   and selected-state semantics, and close the sheet only after a selection is
   committed optimistically through `themeStore`.
4. Retain the popup/deep-link behavior from website to Telegram, distinguish
   configured versus blocked-popup/API failure, and never show challenge tokens.

### Acceptance criteria

- At 320px, long Google/email and Telegram display names wrap or truncate
  safely; all provider status and Link/Unlink controls remain visible and
  reachable.
- Unlink asks for explicit confirmation, restores focus on cancel, and cannot
  remove the final remaining sign-in provider.
- Link Telegram opens the existing one-click deep-link flow; a blocked popup
  or failed request provides a specific retryable error without exposing a
  token.
- In More, every theme option is reachable, selected theme has a programmatic
  pressed state, and the selected label/badge never overflows.
- Theme and dashboard usage ordering survive authenticated reload through the
  existing preferences API; account connection state refreshes after a
  successful link/unlink.

### Verification

```bash
cd apps/web && npm run test -- AccountConnections ThemePicker accountLinks themeContract
cd apps/web && npm run test:e2e -- --project=compact-mobile --project=mobile mobile-ux.spec.ts account-linking.spec.ts
cd apps/web && npm run check:web
cd apps/backend && ./mvnw test
git diff --check
```

### Commit

```bash
git add apps/web/src/lib/components/AccountConnections.svelte apps/web/src/lib/components/ThemePicker.svelte apps/web/src/lib/components/MobileMoreSheet.svelte apps/web/src/lib/api/accountLinks.ts apps/web/tests/unit/AccountConnections.test.ts apps/web/tests/unit/ThemePicker.test.ts apps/web/tests/e2e/account-linking.spec.ts apps/web/tests/e2e/mobile-ux.spec.ts
git commit -m "feat(mobile): Improve account and theme controls"
```

## P2-1: Complete release validation and Telegram rollout evidence

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P1-1, P1-2, P1-3, P1-4, P1-5

### Outcome

The completed mobile and Telegram UX has a documented proof boundary: static
and browser tests pass locally, and staging Telegram-client validation confirms
the behavior that mocks cannot establish.

### Architectural decision

Do not add a new deployment path. Keep release instructions in the existing
Telegram rollout document, distinguish local/browser proof from real-client and
remote CI proof, and update no credentials or environment variable names.

### Files

- Modify `docs/telegram-mini-app-rollout.md`.
- Modify `README.md` only if its stated compact-mobile test inventory changes.
- Modify `apps/web/tests/e2e/mobile-ux.spec.ts`.
- Modify `apps/web/tests/e2e/telegram-mini-app.spec.ts`.

### Work

1. Record the exact device/viewports, browser projects, and non-secret staging
   verification checklist for Today, Progress, themes, Account link/unlink,
   safe areas, and Telegram error/retry behavior.
2. Run unit, frontend static, backend, and browser checks; repair failures
   without lint/quality suppressions.
3. In the official Telegram staging client, validate first launch, direct
   website-to-Telegram link, Telegram-first Google/email link, reopen/refresh,
   theme selection, and safe-area control reachability.
4. Confirm a fresh remote CI/deployment result separately; do not treat local
   `docker compose config`, mocks, or Playwright as production Telegram proof.

### Acceptance criteria

- Every named mobile screen passes 320px and 390px browser interaction tests;
  desktop navigation/regression remains covered.
- The production build, frontend lint/type checks, and backend tests pass with
  no suppressions or ignored warnings.
- The rollout document names local versus real Telegram-client versus remote
  CI evidence, required credentials by variable name only, and rollback as a
  normal application deploy rollback.
- A real Telegram staging session confirms both identity-link directions use
  the same account data after closing and reopening the webview.

### Verification

```bash
cd apps/web && npm run test
cd apps/web && npm run check:web
cd apps/backend && ./mvnw clean verify
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile --project=mobile --project=telegram-webview
docker compose --env-file .env.example --profile db config --quiet
git diff --check
```

### Commit

```bash
git add docs/telegram-mini-app-rollout.md README.md apps/web/tests/e2e/mobile-ux.spec.ts apps/web/tests/e2e/telegram-mini-app.spec.ts
git commit -m "docs(mobile): Record Mini App UX rollout"
```

## Execution notes

- P0-1 deliberately creates the `mobile` and `telegram-webview` Playwright
  projects referenced by later tasks; they do not exist at backlog creation.
- The source tree currently has only `desktop` and `compact-mobile` projects.
  Each later command becomes executable after P0-1 and should use the actual
  resulting project names consistently.
- This is a planning artifact only. No application behavior, API contract,
  schema, environment variable, or deployment configuration was changed.

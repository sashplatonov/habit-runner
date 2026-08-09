# Real UI Showcase - Implementation Backlog

## Goal

Turn `/showcase` into a public, fully navigable demonstration of Habbit Runner's
actual application UI. A visitor must be able to check in habits, open details,
create, edit, archive, delete, reorder, and review statistics without OAuth,
backend requests, database writes, or browser persistence. The public landing
page and GitHub-facing README must direct visitors to this interactive showcase
instead of presenting static screen previews as the primary product evidence.

## Architectural decisions

- The authenticated API and PostgreSQL remain the sole source of truth for real
  accounts. Showcase data is an independent, explicitly fictional `Habit` and
  check-in snapshot held only in page memory; it is reset on hard reload or the
  visible reset action.
- The showcase must use the existing `Habit`, schedule, completion, dashboard,
  detail, form, and statistics logic. Extract screen orchestration and the
  habit-store dependency behind an injected runtime rather than copying markup
  or recreating a simplified dashboard.
- The production `habitsStore` keeps its authenticated REST implementation.
  A separate in-memory implementation satisfies the same `HabitsStore`
  contract, reusing shared snapshot, metrics, IDs, and pure mutation helpers.
  It must never import an API client, auth session helper, IndexedDB helper, or
  browser storage helper.
- Public demo navigation uses the `/showcase` route family. It must not create
  a synthetic auth session, bypass the `(protected)` route guard, or make
  `/app/*` accessible without authentication. Authenticated URLs and behavior
  remain backward compatible.
- App shell navigation receives route targets and mode-specific callbacks from
  its owner. The demo shell has a visible non-persistent-demo notice, a reset
  action, and an exit-to-marketing action; it must not offer logout, push setup,
  or account-backed preference sync.
- The existing static `PublicPreviewCarousel` is not another product surface.
  Remove it from the landing page and delete it if no remaining import uses it.
  Existing repository image assets are retained unless a reference audit proves
  they are obsolete; no asset deletion is required for this feature.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | P1-1 | P1 | - | Establishes safe, realistic demo data and mutations without I/O. |
| 2 | P1-2 | P1 | P1-1 | Makes the existing application screens and shell reusable by both runtimes. |
| 3 | P1-3 | P1 | P1-2 | Exposes the complete public demo journey through a separate route family. |
| 4 | P1-4 | P1 | P1-3 | Makes the public entry point promote the working demo instead of screenshots. |
| 5 | P2-1 | P2 | P1-1, P1-2, P1-3, P1-4 | Proves the no-I/O contract and the real cross-screen browser journey. |

## P1-1: Provide an in-memory habit runtime for the showcase

**Status:** ✅ Complete  
**Priority:** P1  
**Depends on:** -

### Outcome

The showcase can start with a believable, date-relative set of habits and
history, and every habit mutation is immediately reflected in memory. Reloading
the page restores the original fixture; the demo never contacts `/api`, OAuth,
IndexedDB, `localStorage`, or `sessionStorage`.

### Architectural decision

`Habit` and `HabitsStore` remain the UI contracts. Extract only pure store
mutation and snapshot behavior needed by both runtimes; keep REST, auth, and
storage adapters on the production side. The demo adapter owns its ephemeral
arrays of habits and check-ins and exposes the existing store methods, so
dashboard and detail calculations retain one implementation.

### Files

- Modify `apps/web/src/lib/stores/habits.ts`.
- Create `apps/web/src/lib/stores/habits.storeCore.ts`.
- Create `apps/web/src/lib/showcase/createShowcaseHabitsStore.ts`.
- Modify `apps/web/src/lib/showcase/portfolioFixture.ts`.
- Modify `apps/web/src/types/habit.ts` only if the obsolete display-only
  `ShowcaseHabit` and `ShowcaseDay` types are no longer referenced.
- Create `apps/web/tests/unit/showcaseHabitsStore.test.ts`.

### Work

1. Replace the display-only showcase fixture with a deterministic factory of
   valid domain `Habit` values and check-ins covering positive and negative
   habits, multiple daily targets, schedules, tags, completed and pending work,
   and enough history for the existing statistics screen.
2. Move reusable, non-I/O mutation behavior from the production store into the
   core module: completion counts, create/update normalization, archive,
   delete/restore, freeze days, ordering, snapshots, and metrics. Keep API
   calls and authenticated user handling in `habits.ts`.
3. Implement `createShowcaseHabitsStore()` against the existing `HabitsStore`
   interface using the fixture and the shared core. All mutations operate on
   cloned in-memory values; `refresh()` is a no-op or deterministic reset only
   when explicitly requested by the showcase owner.
4. Add a deliberate `reset()` capability outside the production store contract
   for the demo shell. Do not extend production API DTOs or database schema.
5. Cover representative creation, completion/undo, edit, archive, delete and
   reset behavior, including a test that the fixture factory does not share
   mutable references between runs.

### Acceptance criteria

- A fresh demo store exposes hydrated habits with meaningful today and history
  data using the existing `Habit` shape.
- Completing, undoing, editing, creating, archiving, deleting, restoring, and
  reordering habits update the store snapshot and its metrics immediately.
- A demo reset exactly restores the initial fixture, and a hard reload has the
  same result.
- The demo store source has no imports from `$lib/api`, `$lib/auth`,
  `$lib/storage`, or browser storage APIs.
- Production `createHabitsStore()` continues to use authenticated API requests
  and preserves its existing public methods and behavior.

### Verification

```bash
cd apps/web && npm run test -- showcaseHabitsStore
cd apps/web && npm run check:web
```

### Commit

```bash
git add apps/web/src/lib/stores/habits.ts apps/web/src/lib/stores/habits.storeCore.ts apps/web/src/lib/showcase/createShowcaseHabitsStore.ts apps/web/src/lib/showcase/portfolioFixture.ts apps/web/src/types/habit.ts apps/web/tests/unit/showcaseHabitsStore.test.ts
git commit -m "feat(showcase): add in-memory habit runtime"
```

## P1-2: Make the existing app screens runtime and route-base aware

**Status:** ✅ Complete  
**Priority:** P1  
**Depends on:** P1-1

### Outcome

The dashboard, habit detail, create/edit form, and progress screens render
from one set of real UI components in both authenticated and showcase modes.
The existing `/app/*` routes retain their authenticated layout, URLs, and API
backed behavior.

### Architectural decision

Screen components receive a runtime containing the `HabitsStore`, navigation
base, and mode capabilities instead of importing the global store and hard
coding `/app` URLs. The protected layout supplies the current global store and
account-aware shell; the showcase layout supplies the in-memory store and demo
shell. Route files become thin adapters, preventing a parallel copy of dashboard
logic, detail logic, forms, or statistics.

### Files

- Modify `apps/web/src/lib/components/AppLayout.svelte`.
- Modify `apps/web/src/lib/components/SidebarNav.svelte`.
- Modify `apps/web/src/lib/components/BottomNav.svelte`.
- Modify `apps/web/src/routes/app/(protected)/+layout.svelte`.
- Modify `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`.
- Modify `apps/web/src/routes/app/(protected)/habit/[id]/+page.svelte`.
- Modify `apps/web/src/routes/app/(protected)/habit/new/+page.svelte`.
- Modify `apps/web/src/routes/app/(protected)/habit/[id]/edit/+page.svelte`.
- Modify `apps/web/src/routes/app/(protected)/stats/+page.svelte`.
- Create `apps/web/src/lib/app/runtime.ts`.
- Create `apps/web/src/lib/app/AppRuntimeProvider.svelte`.
- Create reusable screen components under `apps/web/src/lib/app/screens/` for
  dashboard, habit detail, habit form, and stats.
- Modify focused unit tests under `apps/web/tests/unit/` that assert the
  extracted screen contracts.

### Work

1. Define one typed app-runtime contract for a `HabitsStore`, route builders,
   navigation, appearance state, and allowed shell actions. Use Svelte context
   or an equivalent explicit provider, with a clear error when a screen is used
   without its runtime.
2. Extract the actual route-level behavior into reusable screen components;
   retain existing components such as `HabitTile`, `HabitForm`,
   `TodaySummary`, `HabitDetail*`, `DashboardToolbar`, and
   `buildModernStatsSnapshot` rather than recreating their UI.
3. Parameterize all app navigation targets that currently resolve
   `/app/(protected)/*`, including links in the shell, dashboard, detail,
   create/edit forms, and stats. Keep route IDs encoded exactly as they are
   today.
4. Give the shell an explicit demo mode: route-aware sidebar and mobile links,
   an accessible demo banner/reset action, and no account-only controls. Keep
   mobile focus management, skip link, safe-area layout, theme keyboard
   behavior, and 44px controls intact.
5. Leave the protected layout responsible for session expiry, initial API
   hydration, push subscription, authenticated theme synchronization, and
   logout. None of these responsibilities may move into the showcase provider.

### Acceptance criteria

- Authenticated dashboard, detail, create, edit, and stats routes still use
  the production store and preserve their current URLs and session redirect.
- The same dashboard, detail, form, and stats UI code can render with an
  injected showcase store; no `Showcase*` copy of those screens exists.
- Sidebar and bottom navigation derive all destinations from the supplied route
  base and correctly mark dashboard and stats active in both modes.
- In demo mode there is a clear non-persistent label and reset action, but no
  logout, OAuth, push-subscription, or account-preference mutation control.
- Keyboard focus remains visible after navigation and every interactive shell
  control remains at least 44x44px on a 320px viewport.

### Verification

```bash
cd apps/web && npm run test -- dashboardControls HabitForm HabitMomentum modernStats PublicNav
cd apps/web && npm run check:web
```

### Commit

```bash
git add apps/web/src/lib/components/AppLayout.svelte apps/web/src/lib/components/SidebarNav.svelte apps/web/src/lib/components/BottomNav.svelte 'apps/web/src/routes/app/(protected)' apps/web/src/lib/app apps/web/tests/unit
git commit -m "refactor(app): share screens across runtimes"
```

## P1-3: Publish the complete real-UI showcase route family

**Status:** ✅ Complete  
**Priority:** P1  
**Depends on:** P1-2

### Outcome

Visitors can enter `/showcase` directly into the familiar dashboard and use a
complete temporary habit journey: dashboard, detail, check-in, add, edit,
archive/delete, reorder, and progress. Every in-app demo link stays inside
`/showcase` and works without a session.

### Architectural decision

The showcase has its own public SvelteKit route tree and layout. It supplies
the in-memory runtime once per page load and never changes auth state. It is
not mounted beneath `(protected)` and does not route visitors through `/app`.

### Files

- Modify `apps/web/src/routes/showcase/+page.svelte`.
- Create `apps/web/src/routes/showcase/+layout.svelte`.
- Create `apps/web/src/routes/showcase/habit/[id]/+page.svelte`.
- Create `apps/web/src/routes/showcase/habit/new/+page.svelte`.
- Create `apps/web/src/routes/showcase/habit/[id]/edit/+page.svelte`.
- Create `apps/web/src/routes/showcase/stats/+page.svelte`.
- Modify `apps/web/src/routes/+layout.svelte`.
- Modify `apps/web/src/lib/seo/publicPages.ts`.
- Remove obsolete display-only sections from
  `apps/web/src/lib/showcase/portfolioFixture.ts` when P1-1 makes them unused.

### Work

1. Replace the current card-only `/showcase` content with the shared dashboard
   screen inside the demo app shell. Keep concise public context before or in
   the shell so visitors understand that their changes are temporary.
2. Add public child routes for detail, new habit, edit, and progress, each as a
   thin adapter to the shared screen and the showcase runtime.
3. Make every demo navigation action, link, form completion, empty state, undo,
   archive/delete confirmation, reorder interaction, and stats focus link stay
   under `/showcase`. A visitor must never be sent to OAuth or a protected URL
   while exploring the demo.
4. Update the root layout's showcase condition from an exact-path special case
   to the complete `/showcase` route family so it does not initialize
   authenticated theme state for child demo screens.
5. Update showcase SEO title, description, and visible copy from “read-only
   preview” to “interactive, temporary demo”; do not claim that demo data is
   stored or that it represents a real account.

### Acceptance criteria

- Visiting `/showcase` with no auth storage renders the real dashboard UI and
  initial habits without a redirect or loading error.
- A visitor can complete and undo a habit, open its detail, create and edit a
  habit, archive or delete a habit, use the supported reordering control, and
  inspect the resulting stats without page failure.
- The demo works after directly opening any valid showcase detail, edit, new,
  or stats URL; unknown IDs render the existing not-found state with a link back
  to `/showcase`.
- All in-demo navigation remains under `/showcase`; no request reaches
  `/api/` and no auth endpoint, browser storage write, IndexedDB write, or
  service mutation is initiated.
- Reset restores the fixture and reload also restores it. The layout has no
  horizontal overflow at 320px and usable desktop navigation at 1280px.

### Verification

```bash
cd apps/web && npm run check:types
cd apps/web && npm run test:e2e -- showcase
```

### Commit

```bash
git add apps/web/src/routes/showcase apps/web/src/routes/+layout.svelte apps/web/src/lib/seo/publicPages.ts apps/web/src/lib/showcase/portfolioFixture.ts
git commit -m "feat(showcase): expose full demo journey"
```

## P1-4: Make showcase the public product entry point

**Status:** ✅ Complete  
**Priority:** P1  
**Depends on:** P1-3

### Outcome

The marketing homepage sends visitors to the interactive showcase instead of
scrolling to static pseudo-screens. The README also presents the showcase link
as the primary product proof rather than embedded screen captures.

### Architectural decision

The public landing page is marketing and routing only; product exploration
lives in the real demo route tree. Remove the unused carousel implementation
instead of keeping a visually similar but functionally divergent UI surface.

### Files

- Modify `apps/web/src/lib/components/PublicLanding.svelte`.
- Remove `apps/web/src/lib/components/PublicPreviewCarousel.svelte` if the
  repository reference audit finds no other import.
- Modify `apps/web/src/lib/components/PublicNav.svelte` if CTA copy or focus
  order needs alignment with the showcase-first flow.
- Modify `apps/web/src/lib/seo/publicPages.ts`.
- Modify `README.md`.
- Modify or create focused tests under `apps/web/tests/unit/` for public CTA
  destinations.

### Work

1. Remove the homepage preview-carousel section and its scroll-to-preview CTA;
   replace it with one prominent semantic link to `/showcase` whose copy makes
   the interaction and no-sign-in requirement explicit.
2. Keep Google sign-in available as the secondary path to the real account,
   but make its distinction from the temporary demo clear in copy and keyboard
   order.
3. Retune hero and navigation wording to lead with “try the real interface”
   rather than “see a preview”, without changing the public SEO pages unrelated
   to showcase.
4. Replace the README screenshots navigation/section with an interactive
   showcase section and link. Retain only a short note that actual account data
   requires OAuth; do not embed static screenshots as product evidence.
5. Delete `PublicPreviewCarousel.svelte` only after `rg` confirms it has no
   remaining import. Do not delete the image assets or capture documentation in
   this task unless they become unreferenced and a separate cleanup is approved.

### Acceptance criteria

- The homepage has no static product-preview carousel, screenshot panels, or
  “See product preview” control.
- From keyboard and pointer input, the primary public product CTA opens
  `/showcase` and its accessible name communicates that no sign-in is needed.
- Google OAuth remains available but is visibly secondary to “Try the demo”.
- README top navigation and product evidence point to `/showcase` rather than
  a screenshots section, and all Markdown links resolve.
- At 320px and 1280px the hero controls wrap without horizontal scrolling and
  retain visible focus.

### Verification

```bash
cd apps/web && npm run test -- PublicNav
cd apps/web && npm run check:web
rg -n "PublicPreviewCarousel|product-preview|See product preview" apps/web/src README.md
```

### Commit

```bash
git add apps/web/src/lib/components/PublicLanding.svelte apps/web/src/lib/components/PublicNav.svelte apps/web/src/lib/components/PublicPreviewCarousel.svelte apps/web/src/lib/seo/publicPages.ts apps/web/tests/unit README.md
git commit -m "feat(public): promote interactive showcase"
```

## P2-1: Prove demo isolation and the full browser journey

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P1-1, P1-2, P1-3, P1-4

### Outcome

Automated browser coverage proves that the public demo is a usable real-UI
journey and cannot accidentally write to a user account or browser persistence.
It also protects the homepage-to-showcase entry point on desktop and compact
mobile viewports.

### Architectural decision

The showcase E2E spec observes actual network and browser-storage behavior,
not only source imports. It reuses the production Playwright server and tests
the public route without injecting an auth session or mocking authenticated API
responses.

### Files

- Modify `apps/web/tests/e2e/showcase.spec.ts`.
- Create `apps/web/tests/e2e/showcase-journey.spec.ts`.
- Modify `apps/web/tests/unit/showcaseHabitsStore.test.ts` if P1-1 coverage
  exposes an untested mutation boundary.
- Modify `apps/web/tests/unit/PublicNav.test.ts` or add
  `apps/web/tests/unit/PublicLanding.test.ts` for the showcase CTA.

### Work

1. Replace the current card-toggle-only showcase test with assertions against
   the shared app shell and real dashboard controls.
2. Add an end-to-end journey that starts anonymously at `/`, enters the demo,
   checks in a habit, opens detail, edits it, creates another habit, verifies
   statistics update, resets the demo, and confirms the seed state is back.
3. In both showcase specs, fail on `/api/` or auth requests and observe writes
   to `localStorage`, `sessionStorage`, IndexedDB, and cookies. Permit only
   non-mutating static asset and analytics requests already made by the public
   application; document any such allowance in the test by endpoint and reason.
4. Run the journey for the configured desktop and compact-mobile Playwright
   projects. Assert no horizontal page overflow, visible focus after keyboard
   navigation, and reachable primary actions on the compact viewport.
5. Keep authenticated `habit-journey.spec.ts` independent: it must still mock
   and prove the server-backed flow instead of being converted to demo coverage.

### Acceptance criteria

- Public demo E2E passes with an empty browser session and no mocked auth
  session.
- The journey demonstrates real screen transitions and mutations, not only
  text changes on one showcase card.
- Test instrumentation records zero `/api/` and auth requests and zero browser
  persistence writes during the demo journey.
- Desktop and compact-mobile runs demonstrate reachable controls, no horizontal
  overflow, and reset/reload restoration of the fixture.
- Existing authenticated habit journey remains green and still verifies its
  API-backed lifecycle.

### Verification

```bash
cd apps/web && npm run test
cd apps/web && npm run check:web
cd apps/web && npm run test:e2e -- showcase
cd apps/web && npm run test:e2e -- habit-journey
```

### Commit

```bash
git add apps/web/tests/e2e/showcase.spec.ts apps/web/tests/e2e/showcase-journey.spec.ts apps/web/tests/unit/showcaseHabitsStore.test.ts apps/web/tests/unit/PublicNav.test.ts apps/web/tests/unit/PublicLanding.test.ts
git commit -m "test(showcase): cover isolated real UI flow"
```

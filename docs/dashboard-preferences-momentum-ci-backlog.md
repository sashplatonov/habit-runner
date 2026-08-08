# Dashboard preferences, momentum signals, and CI efficiency - Implementation Backlog

## Goal

Authenticated users keep their dashboard presentation after signing in again or using another device: filter, tag selection, sort mode, card/list density, and theme-picker ranking are restored from their account. Dashboard cards and compact rows show a flame for an active streak and a calm ice state for positive habits that have been inactive for at least seven scheduled days. GitHub Actions continues to protect changed application code while avoiding duplicate or irrelevant free-plan runner work.

## Architectural decisions

- `users` is the durable owner of account preferences. Extend the existing `GET/PUT /auth/preferences` contract rather than creating a dashboard-only endpoint or browser-only second source of truth.
- Keep `theme`, `timezone`, and the new dashboard preferences in one versioned, validated preferences value. The web shared `UserPreferences` contract is the API boundary; `PreferencesService` is the only backend normalization point; the dashboard consumes a dedicated web preference store/helper rather than reading raw `localStorage` itself.
- Persist only explicit cross-device choices: dashboard filter, selected tags, sort mode, density, and theme-ranking counts. Keep search text in the URL only, authentication session handling local by design, and client error logs local and bounded. Habit reminder configuration and habit order are already owned by habit/check-in APIs and must not be copied into preferences.
- Use an additive Flyway migration with an empty/default preference payload for existing users. Unknown fields and invalid enum/tag/count values are ignored or normalized to defaults, so older clients and existing accounts remain usable.
- A single pure dashboard-momentum helper owns the `flame` and `ice` classification. Flame means a non-zero current scheduled streak. Ice applies only to positive, non-archived habits with a completion history whose latest successful completion is at least seven *scheduled*, non-frozen days behind the reference date; negative habits are excluded because absence is their success condition.
- Both `HabitTile.svelte` and `HabitCompactRow.svelte` render the same helper output. Do not calculate inactivity separately in each component or store decorative state in the database.
- CI optimization preserves all existing quality categories for relevant changes. It uses path-aware job conditions and shared setup/caches; no test, security, OpenAPI, PostgreSQL integration, or Compose smoke gate is silently removed for a change that can affect it. Local validation cannot prove GitHub-hosted minutes saved; a fresh pushed run is required.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | P0-1 | P0 | - | Establish one validated, migration-safe account preference contract before any UI hydration. |
| 2 | P1-2 | P1 | P0-1 | Move every intended durable browser preference onto that contract and prove relogin behavior. |
| 3 | P1-3 | P1 | - | Define the schedule-aware visual status once before rendering it in two layouts. |
| 4 | P1-4 | P1 | P1-3 | Apply the shared status to cards and rows with responsive and accessible behavior. |
| 5 | P2-5 | P2 | - | Reduce CI consumption without weakening required checks for affected code. |
| 6 | P2-6 | P2 | P0-1, P1-2, P1-4, P2-5 | Synchronize operational documentation and run final local gates; collect remote CI evidence separately. |

## P0-1: Persist and validate account-level dashboard preferences

**Status:** ✅ Completed  
**Priority:** P0  
**Depends on:** -

### Outcome

The authenticated preferences response and update request carry a normalized dashboard-preferences value, and existing accounts receive safe defaults without losing their theme or timezone.

### Architectural decision

Extend the existing preference DTOs, shared web contract, `PreferencesService`, and `UserEntity`; store one serialized/versioned preference payload in the existing user record. The request must remain compatible with clients that send only `theme` and `timezone`.

### Files

- Modify `apps/web/packages/shared/src/auth.ts`.
- Modify `apps/web/src/lib/api/theme.ts`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto/UpdatePreferencesRequest.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto/UserPreferencesResponse.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/PreferencesService.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/UserEntity.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java` only if OpenAPI annotations need the expanded schema.
- Create `apps/backend/src/main/resources/db/migration/V12__add_user_dashboard_preferences.sql`.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AuthServiceUnitCoverageTest.java`.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/resource/AuthPreferencesResourceUnitTest.java`.
- Modify `spec/openapi/openapi.yaml` through the existing backend snapshot command.

### Work

1. Define a small typed dashboard-preference payload for filter, selected tags, sort mode, density, and theme usage counts; set defaults matching the current dashboard defaults.
2. Add an additive user column and entity mapping. Backfill/default existing rows without changing or deleting `theme` or `timezone`.
3. Normalize values at the service boundary: accept the existing theme/timezone-only request, bound tags and usage counts, permit only supported filter/sort/density values, and omit unknown future fields.
4. Return the normalized stored value from both preference endpoints, preserving authenticated-user ownership and existing 400/403 behavior.
5. Add service/resource regression tests for defaults, valid round trip, invalid payload normalization, and legacy request compatibility; regenerate and verify the OpenAPI snapshot.

### Acceptance criteria

- An existing user with no new column value receives `pending`, `custom`, `comfortable`, no selected tags, and empty theme usage, while retaining their stored theme and timezone.
- `PUT /auth/preferences` by user A cannot read or write user B’s preferences; unauthenticated requests remain rejected.
- A request containing unsupported mode values, malformed tags, or invalid usage counts returns a safe normalized response without persisting unsafe values.
- A legacy request containing only `theme` and `timezone` still succeeds and leaves dashboard preferences at their previous/default value.
- The generated OpenAPI schema describes the expanded request and response exactly.

### Verification

```bash
cd apps/backend && ./mvnw test -Dtest=AuthServiceUnitCoverageTest,AuthPreferencesResourceUnitTest
cd apps/backend && ./mvnw -B -ntp package -DskipTests -Dquarkus.smallrye-openapi.store-schema-directory=../../spec/openapi
git diff --exit-code -- spec/openapi/openapi.yaml
cd apps/backend && ./mvnw test
```

### Commit

```bash
git add apps/web/packages/shared/src/auth.ts apps/web/src/lib/api/theme.ts apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/UserEntity.java apps/backend/src/main/resources/db/migration/V12__add_user_dashboard_preferences.sql apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth spec/openapi/openapi.yaml
git commit -m "feat(preferences): persist dashboard view settings"
```

## P1-2: Hydrate all intended durable UI preferences after authentication

**Status:** ✅ Completed  
**Priority:** P1  
**Depends on:** P0-1

### Outcome

Changing dashboard view options or theme ranking saves the account preference, and the same options are restored after logout/login and in a new browser. Search text remains a shareable URL state rather than a hidden saved preference.

### Architectural decision

Add a dashboard-preference store/helper that hydrates through the existing preference API alongside `themeStore`. Retain local storage only as an unauthenticated/first-paint fallback and migrate its valid values to the server after successful authenticated hydration. The route must not issue competing writes from raw `$effect`s.

### Files

- Create `apps/web/src/lib/dashboard/preferences.ts`.
- Create `apps/web/src/lib/stores/dashboardPreferences.ts`.
- Modify `apps/web/src/lib/stores/theme.ts`.
- Modify `apps/web/src/lib/theme/themes.ts`.
- Modify `apps/web/src/lib/components/ThemePicker.svelte`.
- Modify `apps/web/src/routes/app/(protected)/dashboard/+page.svelte`.
- Modify `apps/web/src/lib/dashboard/urlState.ts` if URL precedence needs explicit normalization.
- Modify `apps/web/tests/unit/dashboardViewState.test.ts`.
- Modify `apps/web/tests/unit/dashboardControls.test.ts`.
- Modify `apps/web/tests/unit/ThemePicker.test.ts`.
- Create `apps/web/tests/unit/dashboardPreferences.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts` or create `apps/web/tests/e2e/dashboard-preferences.spec.ts`.

### Work

1. Audit and classify every current browser persistence key. Move the five approved cross-device preferences to the shared API contract; record that auth-session, diagnostic-log, and URL-search state deliberately remain local/non-durable, while reminder and habit state already use their domain APIs.
2. Make hydration deterministic: explicit URL parameters win for the current navigation, account preferences become the durable default, and legacy local values are a one-time fallback/migration rather than overriding the account after relogin.
3. Persist each explicit toolbar/ThemePicker change with error handling that preserves the last confirmed account value or clearly restores a safe UI state after failed save. Avoid request storms from initialization effects.
4. Keep theme selection behavior and timezone persistence intact while moving the usage-ranking counts out of their local-only implementation.
5. Add unit and browser coverage for API payload serialization, invalid/local legacy values, relogin hydration, URL override precedence, and a failed save/retry path.

### Acceptance criteria

- With a clean browser profile, select `Smart`, `List`, a non-default filter, tags, and themes; after logout/login the dashboard and ThemePicker reproduce the account’s saved values.
- On a second browser/device for the same user, those saved choices load without relying on the first browser’s `localStorage`.
- A dashboard URL with an explicit valid filter/sort/density/tags displays that state for the current visit without overwriting the stored default merely by opening the link.
- Search text is not restored as a hidden account preference; an empty URL starts with no search query.
- Failed preference fetch/save neither blocks habit hydration nor replaces a valid visible state with malformed data; retrying a later user action can persist successfully.
- Toolbar controls remain keyboard-operable, show visible focus, and retain 44px minimum touch targets at 360px and desktop widths.

### Verification

```bash
cd apps/web && npm run test -- dashboardPreferences dashboardViewState dashboardControls ThemePicker
cd apps/web && npm run check:web
cd apps/web && npm run test:e2e -- dashboard-preferences
```

### Commit

```bash
git add apps/web/src/lib/dashboard apps/web/src/lib/stores/dashboardPreferences.ts apps/web/src/lib/stores/theme.ts apps/web/src/lib/theme/themes.ts apps/web/src/lib/components/ThemePicker.svelte 'apps/web/src/routes/app/(protected)/dashboard/+page.svelte' apps/web/tests
git commit -m "feat(dashboard): restore account view preferences"
```

## P1-3: Define schedule-aware flame and inactivity signals

**Status:** ✅ Completed  
**Priority:** P1  
**Depends on:** -

### Outcome

Every dashboard layout receives the same factual status for an active streak or a long-inactive positive habit, with no false ice state on rest days, freezes, or negative habits.

### Architectural decision

Create a pure frontend view-model helper over the existing schedule and completion-key utilities. It is presentation-derived data, not a persisted habit field, API response field, or duplicate sort score.

### Files

- Create `apps/web/src/lib/habits/dashboardMomentumStatus.ts`.
- Modify `apps/web/src/lib/habits/habitStats.ts` only if an exported, reusable per-habit latest-completion primitive is required.
- Create `apps/web/tests/unit/dashboardMomentumStatus.test.ts`.
- Modify `apps/web/tests/unit/schedule.test.ts` only for shared schedule edge cases not already covered.

### Work

1. Define a typed signal with an accessible label and mutually exclusive visual priority: frozen/not-scheduled remains neutral, a current scheduled streak produces flame, and otherwise a positive habit becomes ice after seven missed eligible scheduled days since its latest successful completion.
2. Calculate dates using the current user timezone, canonical completion keys, schedule rules, and freeze days; avoid day-millisecond arithmetic and raw object-key ordering.
3. Exclude archived and negative habits from the ice signal. A habit with no completion history stays neutral rather than being labelled as long inactive.
4. Add focused cases for daily, weekly-days, quota schedules, timezone boundaries, today not yet completed, freezes, unscheduled gaps, stale history, and the seven-day boundary.

### Acceptance criteria

- A habit with a current scheduled streak reports the flame signal and its exact current streak count.
- A positive habit becomes ice only after seven eligible scheduled opportunities since the latest success; rest days and frozen days do not advance that count.
- A positive habit with no completion history, a negative habit, an archived habit, and a habit that is frozen/not scheduled today do not show ice.
- The result is identical for card and compact-row consumers given the same habit, reference date, and timezone.

### Verification

```bash
cd apps/web && npm run test -- dashboardMomentumStatus schedule
cd apps/web && npm run check:web
```

### Commit

```bash
git add apps/web/src/lib/habits/dashboardMomentumStatus.ts apps/web/src/lib/habits/habitStats.ts apps/web/tests/unit/dashboardMomentumStatus.test.ts apps/web/tests/unit/schedule.test.ts
git commit -m "feat(habits): derive dashboard momentum signals"
```

## P1-4: Render flame and ice signals in dashboard cards and rows

**Status:** ✅ Completed  
**Priority:** P1  
**Depends on:** P1-3

### Outcome

Comfortable cards and compact rows visibly show a flame beside an active streak and an ice treatment with plain-language status for long-inactive positive habits, without changing completion controls or layout behavior.

### Architectural decision

Render the P1-3 view model in the two existing dashboard components using `lucide-svelte` icons already used in the application. Do not add bitmap assets, store visual flags, or fork the dashboard’s completion/sort logic.

### Files

- Modify `apps/web/src/lib/components/HabitTile.svelte`.
- Modify `apps/web/src/lib/components/dashboard/HabitCompactRow.svelte`.
- Modify `apps/web/src/routes/app/(protected)/dashboard/+page.svelte` only if a shared reference date/timezone must be passed explicitly.
- Create `apps/web/tests/unit/HabitTileMomentum.test.ts`.
- Create `apps/web/tests/unit/HabitCompactRowMomentum.test.ts`.
- Modify `apps/web/tests/e2e/habit-journey.spec.ts` or create `apps/web/tests/e2e/dashboard-momentum.spec.ts`.

### Work

1. Add the flame glyph and streak count to both layouts when the shared helper emits a streak, replacing duplicate phase-icon selection in these dashboard surfaces while leaving the detail-page phase system unchanged.
2. Add an ice glyph and concise recovery-oriented status for the stale signal in both layouts; preserve frozen and not-scheduled labels as higher-priority neutral states.
3. Keep card headings, habit emoji/name formatting, completion actions, overflow/truncation, rings, heatmaps, and drag/swipe behavior intact.
4. Verify visual hierarchy at 360x800, 390x844, 768x1024, and 1280x800. Honor reduced motion and expose non-color text or an accessible label so icon meaning is available to assistive technology.
5. Add component and browser tests that exercise card/list switching and no-signal states.

### Acceptance criteria

- In card and list density, a current-streak habit exposes a visible flame plus count and an accessible label describing the streak.
- In both densities, a qualifying inactive positive habit exposes ice plus a readable recovery status; it does not obscure the habit name, action, ring, or description trigger.
- Frozen and not-scheduled habits keep their existing labels and do not also display flame/ice.
- At 360px no horizontal page overflow appears, primary controls remain reachable with a 44px target, and keyboard focus remains visible.
- Changing density still shows the same signal for the same habit and does not alter sort order or completion state.

### Verification

```bash
cd apps/web && npm run test -- HabitTileMomentum HabitCompactRowMomentum dashboardMomentumStatus
cd apps/web && npm run check:web
cd apps/web && npm run test:e2e -- dashboard-momentum
```

### Commit

```bash
git add apps/web/src/lib/components/HabitTile.svelte apps/web/src/lib/components/dashboard/HabitCompactRow.svelte 'apps/web/src/routes/app/(protected)/dashboard/+page.svelte' apps/web/tests
git commit -m "feat(dashboard): show habit flame and ice states"
```

## P2-5: Make GitHub Actions path-aware and remove duplicated setup work

**Status:** ✅ Completed  
**Priority:** P2  
**Depends on:** -

### Outcome

Documentation-only changes do not schedule application jobs, frontend-only and backend-only changes run their relevant gates, and cross-stack/runtime changes still run the full required quality path.

### Architectural decision

Keep `.github/workflows/quality.yml` as the single workflow. Use a lightweight changed-path detector to drive job `if` conditions and one explicit runtime-impact path set for Docker/Compose/OpenAPI/security work; retain cancellation, timeouts, short failure-only artifacts, and safe cache use.

### Files

- Modify `.github/workflows/quality.yml`.
- Modify `docs/operations/github-automation.md`.
- Record the workflow decision in `docs/operations/github-automation.md`; the legacy `docs/ai-fix-log.md` file is not present in this checkout.
- Create `scripts/ci/verify-quality-workflow.sh` only if a local workflow-structure/path-fixture check is needed and can run without GitHub credentials.

### Work

1. Measure the current workflow topology and identify the exact path sets for web/shared, backend/migrations/OpenAPI, Docker/Compose/smoke, workflow files, and security-sensitive manifests. Treat workflow edits as full-quality changes.
2. Add a low-cost changed-files job and gate downstream jobs from its outputs. Ensure changes affecting shared contracts, Dockerfiles, Compose files, CI scripts, lockfiles, or workflow config select every dependent validation lane.
3. Avoid repeated setup where safe: preserve Maven and npm dependency caches, do not install Playwright or build the browser test server in lanes that cannot exercise frontend code, and keep failure diagnostics only on failure with three-day retention.
4. Validate YAML and the changed-path decision table locally; document which paths trigger each gate, the rollback (revert the workflow commit), and the limit that GitHub-hosted minute savings require fresh remote runs to confirm.

### Acceptance criteria

- A Markdown-only pull request starts no quality workflow jobs.
- A web-only change runs frontend quality/security and any explicitly dependent shared checks, but does not run backend PostgreSQL integration or Compose smoke.
- A backend migration/OpenAPI change runs backend verification, PostgreSQL integration, security, and Compose smoke; a Docker/Compose/CI-script change runs all required smoke dependencies.
- A shared-contract change runs both frontend and backend validation paths.
- A later commit to the same PR cancels obsolete in-progress jobs, and failure-only artifacts retain their current three-day limit.
- No environment entries in Compose or Docker `ARG`/`ENV` declarations are removed or renamed; if any workflow path decision changes environment/build behavior, `docker compose config` remains part of verification.

### Verification

```bash
actionlint .github/workflows/quality.yml
docker compose --env-file .env.example --profile db config --quiet
./scripts/ci/smoke-stack.sh
cd apps/web && npm run check:web
cd apps/backend && ./mvnw -B -ntp verify
git diff --check
```

### Commit

```bash
git add .github/workflows/quality.yml docs/operations/github-automation.md docs/dashboard-preferences-momentum-ci-backlog.md
git commit -m "ci(quality): skip unrelated validation lanes"
```

## P2-6: Document rollout and run the cross-layer release gate

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P0-1, P1-2, P1-4, P2-5

### Outcome

The repository documents the preference migration and CI decision rules, and local checks distinguish static/build evidence from real browser and remote-GitHub proof.

### Architectural decision

Keep implementation documentation in the existing docs hub and operational workflow guide. Do not claim that a local build proves mobile interaction, PostgreSQL migration rollout, or GitHub Actions cost reduction.

### Files

- Modify `docs/README.md`.
- Modify `docs/operations/github-automation.md`.
- Modify `docs/ai-fix-log.md`.
- Modify `docs/dashboard-preferences-momentum-ci-backlog.md` to mark only committed, verified tasks as completed.

### Work

1. Add the backlog/documentation link to the docs hub and record the preference-migration compatibility, risk, and rollback instructions in the fix log.
2. Document how to validate preference reset/rollback, the seven-scheduled-day ice policy, and the path-to-job CI matrix.
3. Execute all local unit, static, build, database/Compose, and browser checks in dependency order. Push the CI optimization separately and record fresh workflow URLs/durations before asserting actual resource savings.

### Acceptance criteria

- Documentation states the preference source of truth, legacy-client compatibility, migration rollback procedure, and the exact intended non-persisted browser state.
- Documentation defines flame and ice behavior, including schedule/freeze/negative-habit exclusions.
- Each completed backlog task has a matching atomic commit and recorded local verification result.
- Browser E2E proves the visible desktop and mobile interaction; remote workflow results are separately recorded before making a GitHub Actions savings claim.

### Verification

```bash
cd apps/web && npm run test
cd apps/web && npm run check
cd apps/backend && ./mvnw -B -ntp test
docker compose --env-file .env.example --profile db config --quiet
./scripts/ci/smoke-stack.sh
git diff --check
git status --short
```

### Commit

```bash
git add docs/README.md docs/operations/github-automation.md docs/ai-fix-log.md docs/dashboard-preferences-momentum-ci-backlog.md
git commit -m "docs(rollout): record dashboard preference delivery"
```

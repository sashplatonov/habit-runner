# AI Fix Log

## 2026-08-08 — PR-008 optimistic locking foundation

- Added JPA `@Version` management to habits and check-ins.
- Added V10 defaults and non-null constraints for persisted entity versions.
- Added optional expected-version fields to habit and check-in mutation DTOs;
  stale writes are rejected before persistence.
- Added a stable `409 RESOURCE_VERSION_CONFLICT` response for stale writes.

Remaining PR-008 work: deterministic duplicate-request recovery tests and
concurrent creation semantics.

## 2026-08-08 — PR-009 mutation validation and invariants

- Added Bean Validation bounds for habit names, descriptions, icons, targets,
  collections, custom weekdays, and schedule frequencies.
- Added PostgreSQL V11 checks for scalar targets, ordering, check-in counts,
  weekday ranges, and schedule limits.
- Verified compilation and the PostgreSQL integration suite through OrbStack.

## 2026-08-08 — PR-010 cursor pagination

- Added stable opaque `updatedAt/id` cursors and bounded page limits for habits
  and check-ins without breaking the existing list endpoints.
- Added additive `/habits/page` and `/checkins/page` API contracts plus shared
  frontend pagination types and API helpers.
- Invalid cursors and out-of-range limits return 400; existing indexes remain
  the query path.

## 2026-08-08 — PR-011 query-cost measurement

- Added PostgreSQL Hibernate statistics coverage for a representative
  multi-habit list and batch fetching for element collections.
- The focused integration test passes with six collection loads for three
  habits; full OrbStack `verify -Ppostgres-it` now passes after simplifying
  mutation flow and cursor parsing to satisfy Checkstyle and PMD.

## 2026-08-08 — PR-007 PostgreSQL integration suite

- Added the `postgres-it` Maven profile with Quarkus Dev Services PostgreSQL 18,
  explicit test configuration, Flyway migration coverage, and repository tests
  for PostgreSQL constraints, sorting, cursors, indexes, and converted storage.
- Added a dedicated CI job that runs the profile on Ubuntu and uploads Failsafe
  diagnostics only when the integration gate fails.
- Local profile execution is green through OrbStack Docker; five PostgreSQL
  integration tests and the full Maven verify quality gate pass.

Risk: CI still needs one remote run to validate the hosted runner environment;
fast H2 tests remain unchanged and continue to run.

Rollback: remove the `postgres-it` Maven profile, integration test sources,
test resources, and the dedicated CI job. Keep the existing H2 test profile.

## 2026-08-01 — Habit icon and share graphic simplification

- Replaced the app icon with a flat calendar-and-check mark that communicates a
  completed daily habit without decorative or abstract elements.
- Reworked the social/share graphic to use the same restrained visual language:
  one calendar mark, a plain message, and a seven-day completion row.
- Regenerated the PNG favicon and touch-icon assets from the updated SVG source
  so browser tabs, install prompts, and home-screen icons stay visually aligned.

Risk: this changes brand presentation only. Check the icon at small sizes and on
light/dark browser chrome before publishing.

Rollback: restore the previous SVG and PNG assets in `apps/web/static/` and
`apps/web/public/`, then rebuild the web app.

## 2026-07-30 — PR-004 review follow-up

- Added the missing `V9__secure_refresh_token_families.sql` migration and verified
  both a fresh V1–V9 PostgreSQL migration and conversion of an existing plaintext
  refresh token to its SHA-256 digest.
- Bounded the in-memory authentication rate limiter at 10,000 keys, evicted expired
  buckets, and failed closed through a shared overflow bucket.
- Preferred the proxy-controlled `X-Real-IP` value and the last forwarded hop so a
  client-supplied first `X-Forwarded-For` value cannot bypass the limiter behind the
  bundled nginx proxy.
- Distinguished a concurrent refresh-rotation conflict from token replay. The web
  client recovers a session won by another browser context, while expired, revoked,
  or replayed tokens clear all auth cookies.
- Decoupled the refresh-rotation conflict from JAX-RS and added a dedicated HTTP
  mapper. A concurrent refresh loser now returns the intended 409 rather than 500;
  a two-request race test protects the one-winner contract.
- Improved the OAuth callback status announcement for assistive technology and made
  its failed-state link return to the public home page.

Risk: the migration removes the plaintext `token` column after backfilling digests.
Back up the database before deployment and deploy the migration together with the
backend code.

Rollback: restore the pre-deployment database backup and deploy the previous backend
image. A code-only rollback is not compatible after V9 removes the plaintext column.

## 2026-07-30 — PR-005 dependency review

- Updated DOMPurify to 3.4.12 and applied all non-breaking `npm audit fix`
  updates, including SvelteKit 2.70.2 and fixed transitive releases of `ws`,
  `form-data`, `fast-uri`, and top-level `brace-expansion`.
- `npm audit --omit=dev` reports zero vulnerabilities.
- The remaining full-audit findings are build-time-only upstream chains:
  `@vite-pwa/sveltekit > vite-plugin-pwa > workbox-build >
  @trickfilm400/rollup-plugin-off-main-thread > ejs > jake > filelist >
  minimatch > brace-expansion`, and `@sveltejs/kit > cookie`.
- Current releases `@vite-pwa/sveltekit@1.1.0` and
  `@sveltejs/kit@2.70.2` still resolve those chains. The audit-proposed
  `@sveltejs/kit@0.0.30` is an invalid breaking downgrade, so no override,
  suppression, or forced downgrade was added.
- Updated the Quarkus platform from 3.37.1 to the latest 3.37 maintenance
  release, 3.37.4, so its managed Jackson and Netty dependencies receive the
  security fixes reported by the current Trivy database.
- Quarkus 3.37.4 manages fixed Netty 4.1.136.Final but still manages vulnerable
  `jackson-core` 2.22.0, so `jackson-core` is explicitly managed at the fixed
  patch release 2.22.1 until the Quarkus BOM catches up.

Risk: the unresolved advisories apply to development/build tooling and do not
enter the production dependency graph. Recheck them when SvelteKit, Vite PWA,
or Workbox publishes a fixed dependency graph.

Rollback: restore the previous `apps/web/package.json` and
`apps/web/package-lock.json`, then run `npm install`.

## 2026-08-08 — Phase 2 committed-task review

- Fixed cursor pagination in both habit and check-in page endpoints so they
  fetch one look-ahead row, return at most the requested limit, and omit
  `nextCursor` on the final page.
- Added a regression test for the check-in query handler's final-page contract.
- Restored required braces in the new frontend pagination helpers; `npm run
  check` had been failing its ESLint quality gate on these committed changes.
- Extracted the cursor value object into its own top-level Java type to keep the
  pagination API aligned with the repository's one-type-per-file rule.

Risk: paged endpoints perform one additional bounded row read (maximum 200)
to determine whether another page exists. Existing non-paged endpoints and
their compatibility contracts are unchanged.

Rollback: revert the review commit; pagination will return to the previous
exact-limit heuristic and the frontend lint errors will return.

## 2026-08-08 — PR-008 duplicate-request safety

- Made habit creation strict: POST now conflicts whenever the requested ID
  already exists, including for the same owner; updates remain the replacement
  path.
- Mapped persistence constraint races to a stable HTTP 409 `RESOURCE_CONFLICT`
  response instead of an unhandled 500.
- Added unit coverage for same-owner create conflicts and persistence conflict
  mapping.

Risk: clients retrying POST with an existing habit ID must use the update
endpoint after this contract clarification. Database uniqueness remains the
concurrency boundary for check-in writes.

Rollback: revert the PR-008 follow-up commit and restore the prior create
semantics and generic persistence exception handling.

# Portfolio Publication - Implementation Backlog

## Goal

Prepare Habbit Runner for safe public publication as a Senior Java Backend
portfolio repository. The repository must have no unaddressed secret exposure,
a green reproducible quality baseline, a browser-to-API proof for the primary
habit workflow, concise API evidence, documented operations boundaries, and a
safe public product showcase that does not weaken production authentication.

## Architectural decisions

- PostgreSQL and the Quarkus API remain the source of truth for authenticated
  habits, check-ins, sessions, and preferences. Browser storage and showcase
  fixtures must not become another mutable source of truth.
- The existing `RequireAuth`, cookie/JWT, CSRF, `OperationResult`, Flyway, and
  Docker Compose mechanisms are the extension points. Do not add a parallel
  authentication stack, a test-only production API route, or a second API
  client.
- The full-stack Playwright path must exercise the existing nginx `/api` proxy,
  Quarkus resources, Flyway schema, and PostgreSQL. It may mint a short-lived
  test token only in the test harness using the smoke environment; it must not
  persist a credential in source, an image, or the browser bundle.
- The public showcase is a read-only SvelteKit route backed by static,
  non-personal fixture data. It is deliberately separate from `/app` and does
  not create, mutate, or expose account data.
- Existing mocked Playwright journeys remain fast UI coverage. Do not replace
  them with the slower stack journey; add one focused contract suite beside
  them.
- Historical secret remediation is a security operation, not merely a scanner
  configuration change. Treat every detected VAPID-like value as compromised
  until its provenance is documented and, where applicable, the credential is
  revoked and rotated.
- Remote GitHub Actions evidence is an operational proof. It cannot be claimed
  from a local build and intentionally has no source commit of its own.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | P0-1 | P0 | - | Remove publication-blocking secret exposure before pushing further history. |
| 2 | P0-2 | P0 | - | Restore the broken PostgreSQL migration quality gate. |
| 3 | P1-1 | P1 | - | Make the existing CSRF browser contract valid across configured origins. |
| 4 | P1-2 | P1 | - | Stop the Docker build from hiding a service-worker failure. |
| 5 | P2-1 | P2 | P0-2, P1-1, P1-2 | Add one real browser-to-PostgreSQL contract proof. |
| 6 | P2-2 | P2 | P1-1 | Give reviewers a short, runnable API walkthrough. |
| 7 | P2-3 | P2 | - | Define the deployment boundary for health and metrics endpoints. |
| 8 | P2-4 | P2 | - | Make the product visible without weakening OAuth. |
| 9 | P2-5 | P2 | P0-1, P0-2, P1-1, P1-2, P2-1, P2-2, P2-3, P2-4 | Collect the only valid remote CI publication proof. |

## P0-1: Remediate historical secret-like values and add a history scan gate

**Status:** ✅ Completed  
**Priority:** P0  
**Depends on:** -

### Outcome

No active credential remains usable from any reachable Git ref, and the public
history scan has a documented clean result. Placeholder VAPID examples remain
visibly synthetic and cannot be mistaken for deployable values.

### Architectural decision

Credential provenance and revocation are owned outside the application. The
repository owns only sanitized examples, documentation, and a scanner gate.
Do not silence a confirmed secret by adding a broad scanner ignore rule.

### Files

- Modify `.env.example`.
- Modify `docs/setup/web-push-setup.md`.
- Modify `.github/workflows/quality.yml`.
- Create `.gitleaks.toml` only if a reviewed, narrow false-positive allowlist
  is required after replacing examples.

### Work

1. Inventory each Gitleaks finding by ref, path, type, and masked value; do not
   paste full values into an issue, commit, workflow log, or documentation.
2. Ask the credential owner to revoke and regenerate every value that was ever
   active. If provenance cannot be proved synthetic, treat it as active.
3. Rewrite every reachable local publishable ref that contains an active value,
   preserving a private recovery bundle. Remote publication remains a separate
   explicitly authorized force-push step; invalidate obsolete clones and
   deployment secrets before publishing.
4. Replace source examples with explicit placeholders; add a Gitleaks history
   scan to the security workflow. A false-positive allowlist, if needed, must
   match only the reviewed placeholder and explain why it is safe.
5. Keep `.env`, `.env.production`, private keys, and generated scan reports
   ignored; never commit them as evidence.

### Acceptance criteria

- A full-history scan of all publishable refs exits successfully with no
  unreviewed finding.
- Every rotated secret has been updated in its deployment secret store before
  the rewritten history is published.
- `.env.example` and Web Push documentation contain only synthetic masked
  placeholders, not valid VAPID material.
- The CI security lane fails on a newly introduced test secret and passes on
  the sanitized repository.
- A fresh clone has no tracked `.env`, certificate, private-key, or credential
  file.

### Verification

```bash
gitleaks git --no-banner --redact=100 --log-opts='--all' .
git log --all --format='%H' | while read commit; do git ls-tree -r --name-only "$commit"; done | rg '(^|/)(\.env|[^/]+\.pem|[^/]+\.key|[^/]+\.p12|[^/]+\.jks)$'
git ls-files -ci --exclude-standard
actionlint .github/workflows/quality.yml
```

Remote proof: push the rewritten publishable branch, run the `security` job,
and confirm its secret scan is green in GitHub Actions.

### Commit

```bash
git add .env.example docs/setup/web-push-setup.md .github/workflows/quality.yml .gitleaks.toml
git commit -m "ci(security): Scan repository history for secrets"
```

## P0-2: Make the Flyway migration integration test version-independent

**Status:** ✅ Completed  
**Priority:** P0  
**Depends on:** -

### Outcome

`verify -Ppostgres-it` passes against a fresh PostgreSQL database after every
tracked migration, including V12 and future additive migrations.

### Architectural decision

Flyway files under `apps/backend/src/main/resources/db/migration` are the
schema source of truth. The integration test must derive expectations from the
tracked migration set or assert the required latest migration without retaining
a stale duplicated count.

### Files

- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/FlywayMigrationIT.java`.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/PostgreSqlRepositoryIT.java` only if an additional schema invariant belongs there.

### Work

1. Replace the hard-coded expectation for eleven applied migrations with an
   expectation that stays aligned with the tracked Flyway migration inventory.
2. Retain the assertion that only successful rows count and preserve targeted
   checks for converted storage and cursor indexes.
3. Add or retain coverage for the V12 user dashboard preference column so the
   test proves more than a migration count.
4. Do not alter production migration files merely to satisfy the test.

### Acceptance criteria

- A fresh PostgreSQL Dev Services database records all tracked migrations as
  successful.
- The test fails if a tracked migration is absent or unsuccessful.
- The schema proof includes the required V12 column and existing schedule/index
  invariants.
- The unit suite and the PostgreSQL integration suite both remain green.

### Verification

```bash
cd apps/backend && ./mvnw -B -ntp verify
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
```

### Commit

```bash
git add apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/FlywayMigrationIT.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/PostgreSqlRepositoryIT.java
git commit -m "test(flyway): Cover current migration schema"
```

## P1-1: Complete the CORS contract for cookie-based CSRF mutations

**Status:** ⬜ Not started  
**Priority:** P1  
**Depends on:** -

### Outcome

A browser served from an allowed origin can send the existing `X-CSRF-Token`
header for authenticated POST, PUT, PATCH, and DELETE requests; unallowed
origins and missing/mismatched tokens remain rejected.

### Architectural decision

The browser session helper owns header creation, while Quarkus owns CORS and
CSRF enforcement. Extend the existing configuration and filters; do not add a
second token transport or disable CSRF for cross-origin development.

### Files

- Modify `apps/backend/src/main/resources/application.properties`.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AuthRefreshTest.java`.
- Create `apps/backend/src/test/java/com/sashplatonov/habbit/runner/api/CorsConfigurationTest.java`.

### Work

1. Add the existing CSRF header name to the explicit Quarkus CORS allowlist.
2. Add a REST-level preflight assertion for an allowed configured origin and
   `X-CSRF-Token`; keep a negative assertion for an unallowed origin or header.
3. Preserve the current same-origin nginx `/api` path and the double-submit
   CSRF check in `CsrfGuardFilter`.
4. Verify that the test uses no production credential or real browser cookie.

### Acceptance criteria

- An OPTIONS preflight from configured localhost development origin permits
  `X-CSRF-Token` and the configured mutating methods.
- A mutation with matching cookie/header still succeeds through the existing
  auth flow.
- A mutation with missing or mismatched CSRF data returns the current 403
  behavior.
- An origin outside `CORS_ORIGINS` is not granted the CSRF header.

### Verification

```bash
cd apps/backend && ./mvnw -B -ntp test
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
docker compose --env-file .env.example --profile db config --quiet
```

### Commit

```bash
git add apps/backend/src/main/resources/application.properties apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AuthRefreshTest.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/api/CorsConfigurationTest.java
git commit -m "fix(cors): Allow CSRF request header"
```

## P1-2: Fail Docker builds when the service worker cannot compile

**Status:** ⬜ Not started  
**Priority:** P1  
**Depends on:** -

### Outcome

The web image build fails if the custom service worker cannot compile, while a
valid production PWA build still produces the manifest and worker.

### Architectural decision

VitePWA and the existing SvelteKit build are the sole service-worker pipeline.
Do not add a fallback generated worker or bypass an error with shell control
operators.

### Files

- Modify `apps/web/Dockerfile`.
- Modify `scripts/ci/smoke-stack.sh` only if it needs a targeted artifact assertion.

### Work

1. Remove the shell branch that converts a failed service-worker compile into
   success.
2. Keep the existing inject-manifest pipeline and Docker cache structure.
3. Assert in the smoke path that the web image starts and serves the generated
   PWA manifest/worker assets without exposing build-time configuration values.

### Acceptance criteria

- A valid `docker compose` image build succeeds and the web healthcheck passes.
- An intentionally invalid worker compile causes the Docker build to fail.
- The successful image includes the generated manifest and service worker.

### Verification

```bash
cd apps/web && npm run build
./scripts/ci/smoke-stack.sh
docker compose --env-file .env.example --profile db config --quiet
```

### Commit

```bash
git add apps/web/Dockerfile scripts/ci/smoke-stack.sh
git commit -m "fix(web): Fail on service worker build errors"
```

## P2-1: Add a real authenticated browser-to-database contract journey

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P0-2, P1-1, P1-2

### Outcome

One CI browser journey drives a real nginx, Quarkus, Flyway, and PostgreSQL
stack through create, check-in, stale-version conflict, and reload persistence.

### Architectural decision

The test harness uses the existing cookie/JWT authentication contract and the
Compose stack. It must not mock API routes and must not introduce a test-only
login resource. Test data is isolated by the ephemeral Compose project and
removed on completion.

### Files

- Create `apps/web/tests/e2e/stack-contract.spec.ts`.
- Create `scripts/ci/run-stack-e2e.sh`.
- Modify `apps/web/playwright.config.ts`.
- Modify `scripts/ci/smoke-stack.sh`.
- Modify `.github/workflows/quality.yml`.

### Work

1. Extend the smoke environment with a test-harness-only mechanism to mint a
   short-lived cookie-compatible JWT from its non-production secret without
   adding an HTTP endpoint or storing the token in the repository.
2. Start the existing Compose project, wait for readiness, pass its web URL to
   Playwright, and always remove containers, network, volume, and test output
   on completion.
3. Add one serial desktop journey that creates a habit, upserts a check-in,
   reloads to prove persistence, and submits a stale version to observe 409
   handling in the UI.
4. Keep existing mocked UI E2E tests unchanged and run this slower suite as a
   distinct CI step after the Compose smoke contract.

### Acceptance criteria

- The test makes no `page.route()` interception for API responses.
- The browser communicates through `/api` on nginx, and the API uses a fresh
  Flyway-migrated PostgreSQL database.
- The created habit and check-in remain visible after browser reload.
- A stale write receives the existing conflict response and a visible,
  accessible error state.
- The test leaves no container, volume, token, database dump, or credential in
  the repository after success or failure.

### Verification

```bash
cd apps/web && npm run test:e2e
./scripts/ci/run-stack-e2e.sh
./scripts/ci/smoke-stack.sh
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
```

Remote proof: run the workflow from a clean GitHub runner and retain browser
diagnostics only on failure.

### Commit

```bash
git add apps/web/tests/e2e/stack-contract.spec.ts apps/web/playwright.config.ts scripts/ci/run-stack-e2e.sh scripts/ci/smoke-stack.sh .github/workflows/quality.yml
git commit -m "test(stack): Cover authenticated habit journey"
```

## P2-2: Add concise API evidence for portfolio reviewers

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P1-1

### Outcome

A reviewer can locate the generated OpenAPI contract and understand the
authenticated habit/check-in flow, validation response, and optimistic conflict
response in under two minutes.

### Architectural decision

The generated `spec/openapi/openapi.yaml` remains the API source of truth.
README examples are illustrative only and must not duplicate a hand-maintained
schema, real token, account identifier, or deployment URL.

### Files

- Modify `README.md`.
- Modify `docs/architecture/api-contract.md`.

### Work

1. Link the repository OpenAPI snapshot and state where the runtime `/openapi`
   endpoint is available in a local stack.
2. Add short, safe curl examples for the existing habit list and check-in
   upsert endpoints, using placeholders for authentication and IDs.
3. Show representative 400 validation and 409 version-conflict response shapes
   using the existing `ErrorResponse` fields.
4. Keep the README product-focused; put endpoint details in the API document
   rather than duplicating the entire OpenAPI specification.

### Acceptance criteria

- Every documented method and path exists in `spec/openapi/openapi.yaml`.
- Examples contain no actual cookie, JWT, email, key, or private URL.
- The documentation distinguishes cookie authentication, CSRF header use, and
  the `/api` nginx proxy from direct local Quarkus access.
- A new reader can find the current API contract from the repository root.

### Verification

```bash
cd apps/backend && ./mvnw -B -ntp package -DskipTests -Dquarkus.smallrye-openapi.store-schema-directory=../../spec/openapi
git diff --exit-code -- spec/openapi/openapi.yaml
rg -n 'openapi|curl|X-CSRF-Token|RESOURCE_VERSION_CONFLICT' README.md docs/architecture/api-contract.md
```

### Commit

```bash
git add README.md docs/architecture/api-contract.md
git commit -m "docs(api): Add portfolio request examples"
```

## P2-3: Document health and metrics ingress boundaries

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** -

### Outcome

Operators can determine which health and metrics endpoints are reachable from
the public web route, the internal Docker network, and an external deployment
router without inferring policy from Compose files.

### Architectural decision

Quarkus remains responsible for health and metrics endpoints; nginx and the
deployment network own exposure. This task documents the current boundary and
does not add authentication to probes or expose the API port publicly.

### Files

- Modify `docs/monitoring/newrelic.md`.
- Modify `docs/setup/getting-started.md`.
- Modify `docker-compose.yml` only if the documented current contract and the
  actual Compose exposure differ.
- Modify `docker-compose.dokploy.yml` only if the documented deployment overlay
  and its real routing contract differ.

### Work

1. Document the intended audience for `/q/health/live`, `/q/health/ready`, and
   metrics, including whether each path is internal-only or routed externally.
2. Describe the nginx `/api` proxy boundary and the Dokploy overlay separately
   from local Compose.
3. Add safe validation commands that test permitted paths without printing
   credentials or metrics payloads.
4. If an exposure mismatch is found, resolve it with the smallest Compose or
   nginx change and document rollback steps.

### Acceptance criteria

- Local Compose documentation matches the actual `api` port exposure and nginx
  proxy behavior.
- Deployment documentation does not imply that metrics or readiness are public
  unless the overlay explicitly routes them.
- Health probes remain usable by Compose after any change.
- The document distinguishes local proof from deployed ingress proof.

### Verification

```bash
docker compose --env-file .env.example --profile db config --quiet
docker compose -f docker-compose.dokploy.yml config --quiet
./scripts/ci/smoke-stack.sh
```

### Commit

```bash
git add docs/monitoring/newrelic.md docs/setup/getting-started.md docker-compose.yml docker-compose.dokploy.yml
git commit -m "docs(ops): Define health endpoint ingress"
```

## P2-4: Add a safe read-only portfolio showcase route

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** -

### Outcome

Visitors can inspect realistic dashboard, habit, schedule, and conflict-state
presentation without Google OAuth, a database write, or access to any account.

### Architectural decision

The route is public and read-only. Static fixture data is owned by a dedicated
frontend fixture module and is never passed to stores as authenticated data or
persisted to IndexedDB/local storage. `/app` remains the only authenticated
product path.

### Files

- Create `apps/web/src/routes/showcase/+page.svelte`.
- Create `apps/web/src/lib/showcase/portfolioFixture.ts`.
- Modify `apps/web/src/lib/components/PublicNav.svelte`.
- Modify `apps/web/src/lib/seo/publicPages.ts`.
- Create `apps/web/tests/e2e/showcase.spec.ts`.
- Create `apps/web/tests/unit/portfolioFixture.test.ts`.

### Work

1. Compose the public page from existing display components where they can run
   without authenticated store mutations; otherwise use a small read-only view
   model rather than copying dashboard state logic.
2. Use clearly fictional habits and non-personal data. Do not show real user
   identifiers, account data, analytics, API keys, or a working mutation form.
3. Add navigation and SEO metadata using the existing public-page mechanisms.
4. Cover desktop and compact-mobile presentation, keyboard navigation, visible
   focus, and a clear explanation that the page is a read-only showcase.

### Acceptance criteria

- `/showcase` loads without OAuth, API calls, or browser persistence writes.
- All calls to action that would mutate data lead to sign-in or are explicitly
  disabled and labelled as read-only.
- At 320px and desktop widths, no horizontal overflow occurs and interactive
  controls meet the existing 44px target.
- Screen readers receive a route heading and the read-only status.
- Existing protected dashboard behavior is unchanged.

### Verification

```bash
cd apps/web && npm run lint
cd apps/web && npm run check:types
cd apps/web && npm run test
cd apps/web && npm run test:e2e
cd apps/web && npm run build
```

### Commit

```bash
git add apps/web/src/routes/showcase/+page.svelte apps/web/src/lib/showcase/portfolioFixture.ts apps/web/src/lib/components/PublicNav.svelte apps/web/src/lib/seo/publicPages.ts apps/web/tests/e2e/showcase.spec.ts apps/web/tests/unit/portfolioFixture.test.ts
git commit -m "feat(showcase): Add read-only portfolio preview"
```

## P2-5: Collect fresh remote publication evidence

**Status:** ⬜ Not started  
**Priority:** P2  
**Depends on:** P0-1, P0-2, P1-1, P1-2, P2-1, P2-2, P2-3, P2-4

### Outcome

The public repository has a fresh green GitHub Actions run for the exact
publishable commit and no documentation claims unsupported remote results.

### Architectural decision

GitHub Actions is the source of truth for hosted CI status. This task creates
no empty commit: it verifies the final implementation commit on the configured
default/publication branch and records only factual evidence.

### Files

- Modify `README.md` only if current quality-evidence wording needs correction.
- Modify `docs/operations/github-automation.md` only if the actual workflow
  branch or required jobs changed in earlier tasks.

### Work

1. Confirm that the public default branch is the branch matched by
   `.github/workflows/quality.yml`; if publishing from `release`, explicitly
   extend the trigger in a separate focused CI commit before this proof.
2. Push the final commit and wait for backend, PostgreSQL integration, security,
   frontend, stack E2E, and smoke jobs applicable to the changed paths.
3. Inspect failed-job diagnostics rather than rerunning blindly; fix any issue
   in a new focused commit and repeat the run.
4. Record only run URL/commit SHA/job status if documentation needs the evidence;
   do not claim cost savings, production deployment, OAuth-provider validation,
   or physical-device PWA proof.

### Acceptance criteria

- The GitHub run for the exact publication SHA is green for all required jobs.
- The PostgreSQL integration, secret scan, frontend tests, full-stack E2E, and
  Docker smoke jobs show results consistent with local checks.
- The default/publication branch is protected or its CI trigger is documented
  and active.
- README quality claims are limited to evidence actually produced.

### Verification

```bash
git status --short --branch
git rev-parse HEAD
gh run list --branch "$(git branch --show-current)" --limit 5
gh run view <run-id> --log-failed
```

Remote GitHub Actions proof is required; local commands alone cannot complete
this task.

### Commit

No commit for remote evidence alone. If workflow or documentation changes are
needed, commit them separately with their respective task before rerunning CI.

## Final quality gate

Run after every implementation task and again before publication:

```bash
git diff --check
gitleaks git --no-banner --redact=100 --log-opts='--all' .
actionlint .github/workflows/quality.yml
docker compose --env-file .env.example --profile db config --quiet
cd apps/web && npm run check
cd apps/web && npm run test:coverage
cd apps/web && npm run test:e2e
cd apps/backend && ./mvnw -B -ntp verify
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
./scripts/ci/smoke-stack.sh
```

The stack-contract command is additionally required after P2-1. A green local
gate does not prove a remote Actions run, a deployed OAuth flow, or production
PWA behavior.

<a id="top"></a>

# 🧭 Portfolio Readiness Remediation Backlog

This backlog converts the public GitHub portfolio audit into an ordered execution plan for an AI coding agent. The target outcome is a repository that is safe to make public, reproducible from a clean environment, and credible as a Senior Java Backend Engineer portfolio project.

The document is intentionally implementation-oriented. Every task contains the selected architectural decision, concrete file scope, acceptance criteria, verification commands, and the required commit command.

## 📚 Table of contents

- [Execution contract](#execution-contract)
- [Phase 0 — Public-release blockers](#phase-0)
  - [PR-001 — Purge the leaked VAPID private key](#pr-001)
  - [PR-002 — Remove the production email-only login bypass](#pr-002)
  - [PR-003 — Reject insecure production secrets](#pr-003)
- [Phase 1 — Security and portable runtime](#phase-1)
  - [PR-004 — Rotate and protect refresh tokens](#pr-004)
  - [PR-005 — Remediate current dependency findings](#pr-005)
  - [PR-006 — Make the local Compose stack portable](#pr-006)
- [Phase 2 — Database correctness and API reliability](#phase-2)
  - [PR-007 — Add PostgreSQL integration tests](#pr-007)
  - [PR-008 — Enforce optimistic locking and duplicate-request safety](#pr-008)
  - [PR-009 — Enforce mutation validation and database invariants](#pr-009)
  - [PR-010 — Replace the silent 200-row cap with cursor pagination](#pr-010)
  - [PR-011 — Verify and bound collection-loading query cost](#pr-011)
- [Phase 3 — Maintainable Java and trustworthy quality gates](#phase-3)
  - [PR-012 — Align Java packages with source paths](#pr-012)
  - [PR-013 — Remove quality-gate suppressions and enable integration tests](#pr-013)
  - [PR-014 — Publish a complete verified OpenAPI contract](#pr-014)
- [Phase 4 — Frontend contract and end-to-end proof](#phase-4)
  - [PR-015 — Remove unsupported offline-first behavior and claims](#pr-015)
  - [PR-016 — Preserve typed backend errors in the web client](#pr-016)
  - [PR-017 — Add critical Playwright journeys](#pr-017)
  - [PR-018 — Remove production debug UI and accessibility defects](#pr-018)
- [Phase 5 — Operations, CI, and portfolio presentation](#phase-5)
  - [PR-019 — Align readiness, metrics, and tracing claims](#pr-019)
  - [PR-020 — Add Docker and contract smoke gates to CI](#pr-020)
  - [PR-021 — Rebuild the public repository narrative](#pr-021)
  - [PR-022 — Apply remaining verified patch upgrades](#pr-022)

---

<a id="execution-contract"></a>

## 🤖 Execution contract

The AI agent must follow these rules for every task:

1. Execute tasks in the listed order unless a task explicitly states that it is independent.
2. Start from a clean working tree and inspect the current implementation before editing.
3. Preserve existing environment variables and provide backward-compatible migration where a name or behavior changes.
4. Never print a secret. Use redacted fingerprints only.
5. Do not introduce nested Java classes, records, enums, or interfaces.
6. Do not add lint, Checkstyle, PMD, SpotBugs, or coverage suppressions.
7. Add regression tests for every behavior change.
8. Run the task-specific checks first, then the full relevant gate.
9. Inspect `git diff --check` and `git status --short` before committing.
10. Commit only the task's files. Do not include unrelated user changes.
11. If an acceptance criterion cannot be verified, stop without committing and report the blocker.
12. Destructive history rewriting and remote force-push require explicit maintainer approval at the moment they are executed.

Baseline full gates:

```bash
cd apps/backend && ./mvnw -B -ntp verify
cd apps/web && npm run test && npm run check:web
docker compose --profile db config --quiet
```

[↑ Back to top](#top)

---

<a id="phase-0"></a>

## 🔴 Phase 0 — Public-release blockers

<a id="pr-001"></a>

### PR-001 — Purge the leaked VAPID private key

**Status:** local history rewrite done; remote force-push and secret rotation remain external follow-ups.

**Problem and evidence**

- Git history contains a private VAPID key in the deleted `docs/WEB_PUSH_SETUP.md`.
- The finding is reachable from `main`, so deleting the current file did not remove the credential from public history.
- Current CI scans the checked-out filesystem but does not provide a documented full-history release gate.

**Architectural decision**

- Treat the exposed VAPID key as compromised and rotate it before any repository publication.
- Rewrite history with `git filter-repo` so the historical file and secret blob are unreachable from every branch and tag intended for publication.
- Add a repeatable full-history secret-scan release procedure. Do not add an allowlist for the leaked value.
- Keep key rotation and deployment-secret updates outside Git. Never store the replacement private key in repository files.

**Files and external state**

- Historical path: `docs/WEB_PUSH_SETUP.md`
- `.github/workflows/quality.yml`
- New: `docs/operations/public-release-security.md`
- External: VAPID deployment secret and all Git refs intended for publication

**Implementation notes**

1. Obtain explicit maintainer approval before rewriting history or force-pushing.
2. Generate or receive a replacement VAPID pair without printing the private key.
3. Update the deployment secret first and verify push registration with the replacement public key.
4. Create a backup ref outside the publication namespace.
5. Rewrite all publication refs to remove the historical file or exact secret blob.
6. Add a CI/release full-history Gitleaks check using full-depth checkout.
7. Document recovery, rotation evidence, and the exact publication gate without recording secret values.

**Acceptance criteria**

- The old private key is revoked and is no longer used by any deployment.
- `git log --all -- docs/WEB_PUSH_SETUP.md` does not expose the removed history in publication refs.
- A redacted full-history Gitleaks scan reports no real secret.
- CI checks out enough history for its secret-history gate.
- No current file contains a private VAPID key.
- The force-push is not executed without separate explicit approval.

**Verification**

```bash
gitleaks git . --redact
git log --all -- docs/WEB_PUSH_SETUP.md
rg -n 'VAPID_PRIVATE|PRIVATE_VAPID|BEGIN .*PRIVATE KEY' . \
  --glob '!node_modules/**' --glob '!target/**' --glob '!.git/**'
git diff --check
```

[↑ Back to top](#top)

**AI agent commit command:** `git add .github/workflows/quality.yml docs/operations/public-release-security.md && git commit -m "fix(security): purge leaked vapid key"`

<a id="pr-002"></a>

### PR-002 — Remove the production email-only login bypass

**Status:** done.

**Problem and evidence**

- `POST /auth/login` accepts only an email address.
- `AuthService.login(String email)` issues access and refresh tokens when the email belongs to an existing user.
- Anyone who knows an existing email can impersonate that user.

**Architectural decision**

- Google OAuth remains the production authentication mechanism.
- Remove the email-only endpoint from production code instead of adding a fake password layer.
- If deterministic local authentication is required, implement a separate dev/test-only identity provider that is unavailable when `DEPLOYMENT_ENV=production`.
- Production startup must fail if a dev authentication switch is enabled.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java`
- `apps/backend/src/main/resources/application.properties`
- `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/`
- `apps/web/src/lib/` and `apps/web/src/routes/` callers discovered with `rg -n '/auth/login|authService\\.login'`
- `.env.example`
- `docs/setup/getting-started.md`

**Acceptance criteria**

- No production route issues a session from an unverified email alone.
- Unknown and known emails are indistinguishable through unauthenticated production APIs.
- Google OAuth login and refresh behavior remain covered.
- A dev/test login mechanism, if retained, returns 404 or is not registered in production.
- Production configuration rejects any enabled dev-login flag.

**Verification**

```bash
rg -n '@Path\\(\"/login\"\\)|authService\\.login|POST.*/auth/login' apps
cd apps/backend && ./mvnw -B -ntp test
cd apps/web && npm run test
cd apps/backend && ./mvnw -B -ntp verify
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend apps/web .env.example docs/setup/getting-started.md && git commit -m "fix(auth): remove email-only login"`

<a id="pr-003"></a>

### PR-003 — Reject insecure production secrets

**Status:** done.

**Problem and evidence**

- `docker-compose.yml` falls back to `AUTH_SECRET=change-me` and `DB_PASSWORD=password`.
- The same stack defaults to `DEPLOYMENT_ENV=production`.
- `AuthReadinessHealthCheck` only checks whether the secret is non-blank, so `change-me` passes readiness.

**Architectural decision**

- Development may use explicit documented local defaults only in a development-specific Compose overlay.
- Production configuration has no secret fallback and fails before serving traffic when secrets are missing, known defaults, or below a documented minimum entropy/length policy.
- Readiness reports configuration validity; it must not reveal the secret or its fingerprint.

**Files**

- `docker-compose.yml`
- `docker-compose.local.yml`
- `docker-compose.native.yml`
- `.env.example`
- `apps/backend/src/main/resources/application.properties`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/health/AuthReadinessHealthCheck.java`
- `apps/backend/src/test/java/com/sashplatonov/habbit/runner/health/HealthReadinessTest.java`
- `docs/setup/getting-started.md`

**Acceptance criteria**

- Production Compose cannot resolve successfully with `AUTH_SECRET=change-me` or a blank required password.
- Local development still has a documented non-production startup path.
- Backend startup/readiness rejects missing, default, or insufficient production auth secrets.
- No secret value is logged or returned by health endpoints.
- Every Compose variant passes configuration validation with its documented env contract.

**Verification**

```bash
rg -n 'change-me|DB_PASSWORD:-password|AUTH_SECRET:-' docker-compose*.yml apps/backend
docker compose --env-file .env.example --profile db config --quiet
docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.local.yml --profile db config --quiet
docker compose --env-file .env.example -f docker-compose.native.yml --profile db config --quiet
cd apps/backend && ./mvnw -B -ntp test
```

[↑ Back to top](#top)

**AI agent commit command:** `git add docker-compose.yml docker-compose.local.yml docker-compose.native.yml .env.example apps/backend docs/setup/getting-started.md && git commit -m "fix(config): reject insecure production secrets"`

---

<a id="phase-1"></a>

## 🟠 Phase 1 — Security and portable runtime

<a id="pr-004"></a>

### PR-004 — Rotate and protect refresh tokens

**Status:** completed and verified locally on 2026-07-30.

**Problem and evidence**

- Refresh tokens are persisted in reusable plaintext form.
- A successful refresh does not provide one-time token rotation and reuse detection.
- Public authentication endpoints have no explicit request-rate protection.

**Architectural decision**

- Store only a SHA-256 token digest plus token-family metadata.
- Rotate the refresh token atomically on every successful refresh.
- Reuse of an already-rotated token revokes the complete token family.
- Keep cookie behavior HttpOnly, Secure, and SameSite Strict.
- Apply bounded per-IP and per-account rate limits only to unauthenticated authentication endpoints; do not introduce a distributed cache until multiple backend replicas require it.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/RefreshTokenEntity.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/RefreshTokenRepository.java`
- New: `apps/backend/src/main/resources/db/migration/V9__secure_refresh_token_families.sql`
- `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AuthRefreshTest.java`
- `apps/web/tests/unit/auth.session.test.ts`

**Acceptance criteria**

- Raw refresh tokens are never stored or logged.
- Every refresh returns a new token and invalidates the previous token.
- Concurrent refresh requests have one deterministic winner.
- The losing request in a concurrent refresh race returns 409, never 500.
- Reuse of an invalidated token revokes the family and clears auth cookies.
- Logout revokes the current family.
- Rate-limited requests return 429 with a stable error code and `Retry-After`.

**Verification**

```bash
rg -n 'refresh.*token|token.*refresh' apps/backend/src/main/java \
  | rg -v 'log|digest|hash'
cd apps/backend && ./mvnw -B -ntp test -Dtest=AuthRefreshTest
cd apps/web && npm run test -- auth.session.test.ts
cd apps/backend && ./mvnw -B -ntp verify
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend apps/web/tests/unit/auth.session.test.ts && git commit -m "fix(auth): rotate refresh tokens"`

<a id="pr-005"></a>

### PR-005 — Remediate current dependency findings

**Status:** completed and verified locally on 2026-07-30. Remaining full-audit
findings are upstream-only development chains documented in `docs/ai-fix-log.md`;
the production graph and High/Critical Trivy gate are clean.

**Problem and evidence**

- The production dependency graph contains a DOMPurify advisory in version `3.4.11`.
- The full npm audit also reports development and build-chain findings.
- A remote Trivy run can become stale relative to the current registry advisory set.

**Architectural decision**

- Upgrade the direct production dependency first to the smallest compatible fixed release.
- Update transitive development dependencies through normal semver-compatible lockfile resolution.
- Do not add audit exceptions, Trivy ignores, or severity downgrades.
- Keep a vulnerability gate and the build/test gates in the same commit.

**Files**

- `apps/web/package.json`
- `apps/web/package-lock.json`
- `.github/workflows/quality.yml` only if the existing scan does not cover the fixed graph

**Acceptance criteria**

- `npm audit --omit=dev` reports zero known vulnerabilities.
- Remaining full-audit findings, if any, are documented with package path and an upstream-only reason; no suppressions are added.
- Frontend tests, lint, type checks, and production build pass.
- Trivy reports no High or Critical dependency vulnerability.

**Verification**

```bash
cd apps/web && npm audit --omit=dev
cd apps/web && npm audit
cd apps/web && npm run test
cd apps/web && npm run check:web
docker run --rm -v "$PWD:/work:ro" -w /work aquasec/trivy:0.72.0 \
  fs --scanners vuln --severity HIGH,CRITICAL --exit-code 1 \
  --skip-dirs node_modules,target,dist,build,.svelte-kit .
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/web/package.json apps/web/package-lock.json .github/workflows/quality.yml && git commit -m "fix(web): update vulnerable dependencies"`

<a id="pr-006"></a>

### PR-006 — Make local Compose startup reliable

**Status:** completed and verified locally on 2026-07-30 within the approved
scope. The maintainer subsequently approved the dedicated Dokploy deployment
overlay.

**Problem and evidence**

- The base Compose files require the external Dokploy network `dokploy-ipv6`,
  which prevents a clean local stack from starting before deployment-specific
  infrastructure exists.
- `DB_PORT` is used both as the backend connection port and as the bundled
  database's published host port, so resolving a host-port collision breaks
  container-to-container database connectivity.
- Production-profile metric export is always enabled and rejects the intentionally
  empty local New Relic key before the API can start.
- Optional VAPID configuration can make backend readiness fail and prevent the web container from starting.
- A clean developer cannot exercise protected flows without external OAuth configuration.

**Architectural decision**

- Keep local Compose files self-contained and attach the API to the external
  `dokploy-ipv6` network through a dedicated deployment overlay.
- Keep `DB_PORT` as the backend connection port and add `DB_HOST_PORT` for the
  published database port, with a fallback to `DB_PORT` for existing env files.
- Make New Relic metric export opt-in through `NEW_RELIC_METRICS_ENABLED`; local
  startup must not require an observability secret.
- Missing optional push configuration produces a named degraded/disabled component status but does not make the core API unready.
- Provide a dev-only identity path from PR-002 or document the exact OAuth setup; never expose the dev identity provider in production.

**Files**

- `docker-compose.yml`
- `docker-compose.local.yml`
- `docker-compose.native.yml`
- New: `docker-compose.dokploy.yml`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/health/NotificationReadinessHealthCheck.java`
- `apps/backend/src/test/java/com/sashplatonov/habbit/runner/health/HealthReadinessTest.java`
- `.env.example`
- `docs/setup/getting-started.md`
- `docs/monitoring/newrelic.md`

**Acceptance criteria**

- Local Compose startup does not require a pre-created Dokploy network.
- Core API readiness is UP without VAPID values, while notification capability is visibly disabled.
- The Dokploy overlay preserves the existing external routing contract for JVM
  and native deployments.
- A host PostgreSQL port collision can be resolved with `DB_HOST_PORT` without
  changing the API's internal database port.
- The API starts without a New Relic key when metric export is disabled.
- A clean developer can reach a documented usable application state within ten minutes.
- All environment variables remain documented and backward-compatible.

**Verification**

```bash
DB_HOST_PORT=55432 docker compose -f docker-compose.yml -f docker-compose.local.yml --profile db config --quiet
docker compose -f docker-compose.yml -f docker-compose.dokploy.yml config --quiet
docker compose -f docker-compose.native.yml -f docker-compose.dokploy.yml config --quiet
DB_HOST_PORT=55432 docker compose -f docker-compose.yml -f docker-compose.local.yml --profile db up --build --wait
curl --fail http://127.0.0.1:5137/api/q/health/ready
curl --fail http://127.0.0.1:5137/
DB_HOST_PORT=55432 docker compose -f docker-compose.yml -f docker-compose.local.yml --profile db down
cd apps/backend && ./mvnw -B -ntp test
```

[↑ Back to top](#top)

**AI agent commit command:** `git add .env.example docker-compose.yml docker-compose.local.yml docker-compose.native.yml docker-compose.dokploy.yml apps/backend docs/ai-fix-log.md docs/monitoring/newrelic.md docs/portfolio-readiness-backlog.md docs/setup/getting-started.md && git commit -m "refactor(docker): isolate dokploy deployment"`

---

<a id="phase-2"></a>

## 🗄️ Phase 2 — Database correctness and API reliability

<a id="pr-007"></a>

### PR-007 — Add PostgreSQL integration tests

**Status:** ✅ completed and verified with OrbStack Docker plus CI configuration.

**Problem and evidence**

- Backend tests use H2 with schema recreation and Flyway disabled.
- PostgreSQL-specific JSONB/lateral migrations and real constraints are not exercised.
- Maven Failsafe currently has no reliable database integration suite.

**Architectural decision**

- Keep fast H2 tests for isolated unit/resource feedback.
- Add a separate `postgres-it` integration profile using Quarkus Dev Services PostgreSQL, which is backed by Testcontainers.
- Execute Flyway from an empty database and run repository/API integration tests against the migrated schema.
- Name integration tests `*IT` and run them through Failsafe. Do not create nested container helper classes.

**Files**

- `apps/backend/pom.xml`
- `.github/workflows/quality.yml`
- `apps/backend/src/test/resources/application-postgres-it.properties`
- `apps/backend/src/test/resources/application.properties`
- `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/PostgresTestProfile.java`
- New: `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/FlywayMigrationIT.java`
- New: `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/PostgreSqlRepositoryIT.java`
- `apps/backend/src/main/resources/db/migration/`
- `apps/backend/src/main/resources/application.properties`

**Acceptance criteria**

- A fresh PostgreSQL container migrates from V1 through the latest migration.
- Repository integration tests prove FK, unique constraints, JSONB conversion, sorting, and cursor indexes.
- Integration tests do not depend on a developer-installed PostgreSQL server.
- CI runs the PostgreSQL suite and retains diagnostics only on failure.
- Existing fast test execution remains available.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp test
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
cd apps/backend && ./mvnw -B -ntp flyway:info -Ppostgres-it
```

The `postgres-it` profile requires a running Docker daemon. CI executes the
same profile on an Ubuntu runner and uploads Failsafe diagnostics on failure.

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend/pom.xml apps/backend/src/test .github/workflows/quality.yml docs/portfolio-readiness-backlog.md docs/ai-fix-log.md && git commit -m "test(database): verify postgres migrations"`

<a id="pr-008"></a>

### PR-008 — Enforce optimistic locking and duplicate-request safety

**Status:** ✅ completed and verified with unit tests, web API tests, and the
full OrbStack PostgreSQL quality gate.

**Problem and evidence**

- Habit and check-in entities expose a `version` field but do not use JPA `@Version`.
- Concurrent updates can overwrite each other.
- Concurrent check-in upserts can race between lookup and insert and surface a database error.
- Habit creation behavior for an existing ID does not clearly match the documented create-or-replace semantics.

**Architectural decision**

- Use JPA optimistic locking as the single write-conflict mechanism.
- Return HTTP 409 with a stable conflict code when the expected version is stale.
- Make check-in PUT idempotent through the database unique key and deterministic conflict recovery.
- Define habit create semantics explicitly: POST creates and conflicts on an existing ID; PATCH/PUT updates according to the documented contract.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/HabitLifecycleEntityBase.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/CheckinEntity.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/service/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/service/CheckinMutationHandler.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitUpdateRequestDto.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/HabitStatusUpdateRequestDto.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/dto/CheckinUpsertRequestDto.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/GlobalExceptionMapper.java`
- New: `apps/backend/src/main/resources/db/migration/V10__enforce_entity_versions.sql`
- Backend resource/service/integration tests
- `apps/web/src/lib/api/habits.ts`
- `apps/web/src/lib/api/checkins.ts`

**Acceptance criteria**

- Version columns are non-null and managed by JPA.
- Two updates using the same prior version produce one success and one deterministic 409.
- Duplicate retries of the same check-in PUT return the same effective resource state.
- Concurrent creation of the same habit/check-in does not produce an unhandled 500.
- Create, replace, and update semantics are documented and tested.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp test \
  -Dtest=HabitServiceImplTest,CheckinServiceImplTest
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
cd apps/web && npm run test -- habits.store.test.ts checkins.api.test.ts
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend apps/web/src/lib/api apps/web/tests && git commit -m "fix(data): enforce optimistic locking"`

<a id="pr-009"></a>

### PR-009 — Enforce mutation validation and database invariants

**Status:** ✅ completed and verified with backend compilation plus OrbStack
PostgreSQL migration/integration tests.

**Problem and evidence**

- Update DTOs permit blank or oversized text and invalid numeric values.
- Schedule collections and nested values are not consistently bounded.
- Several domain invariants exist only in Java normalization and are not protected by PostgreSQL constraints.

**Architectural decision**

- Validate request shape at the DTO boundary with Bean Validation.
- Keep cross-field business rules in domain/application validators.
- Enforce durable scalar invariants with PostgreSQL `CHECK`, `NOT NULL`, FK, and unique constraints.
- Map validation and constraint failures to stable 400 or 409 API errors without exposing SQL details.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/dto/`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/dto/`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/GlobalExceptionMapper.java`
- New: `apps/backend/src/main/resources/db/migration/V11__enforce_habit_invariants.sql`
- Backend DTO/resource/PostgreSQL integration tests
- `apps/web/src/lib/components/HabitForm.svelte` or the current habit-form implementation

**Acceptance criteria**

- Blank names, excessive lengths, negative targets/counts, invalid day ranges, and oversized collections are rejected.
- API validation responses use stable field paths and error codes.
- Direct invalid SQL inserts fail on database constraints.
- Valid existing data migrates successfully.
- Frontend constraints match backend constraints without duplicating hidden business rules.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp test
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
cd apps/web && npm run test -- HabitForm.test.ts habitFormModel.test.ts
cd apps/web && npm run check:web
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend apps/web/src apps/web/tests && git commit -m "fix(api): validate mutation payloads"`

<a id="pr-010"></a>

### PR-010 — Replace the silent 200-row cap with cursor pagination

**Status:** ✅ completed with additive `/habits/page` and `/checkins/page`
contracts, bounded limits, opaque cursors, and OrbStack verification.

**Problem and evidence**

- Repository methods call `.page(0, 200)` without exposing a page or cursor contract.
- Records after the first 200 become unreachable.
- The static OpenAPI document does not explain the limit or continuation behavior.

**Architectural decision**

- Use stable cursor pagination ordered by the existing indexed sort tuple and ID tie-breaker.
- Return `items` plus nullable `nextCursor`.
- Validate a bounded `limit` with a conservative default.
- Keep a temporary compatibility response only if current frontend callers cannot migrate atomically.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/HabitRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/CheckinRepository.java`
- Habit/check-in resources, query handlers, and response DTOs
- `apps/backend/src/main/resources/db/migration/V8__add_list_query_indexes.sql`
- New migration only if the final cursor requires another index
- `apps/web/src/lib/api/habits.ts`
- `apps/web/src/lib/api/checkins.ts`
- Backend and frontend pagination tests

**Acceptance criteria**

- More than 200 records can be traversed without omissions or duplicates.
- Cursor ordering is deterministic when timestamps are equal.
- Invalid or forged cursors return 400.
- Limit is bounded and documented.
- Query plans use an appropriate index in PostgreSQL integration tests.

**Verification**

```bash
rg -n '\\.page\\(0, 200\\)' apps/backend/src/main/java
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
cd apps/web && npm run test
cd apps/web && npm run check:web
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend apps/web/src/lib/api apps/web/tests && git commit -m "feat(api): add cursor pagination"`

<a id="pr-011"></a>

### PR-011 — Verify and bound collection-loading query cost

**Status:** ✅ completed and verified with the full OrbStack PostgreSQL Maven
quality gate.

**Problem and evidence**

- Habit mapping reads multiple element collections for list responses.
- Mapping a large page may trigger N+1 queries or a large Cartesian fetch.
- No PostgreSQL integration test currently asserts a query-count or latency boundary.

**Architectural decision**

- Measure first with Hibernate statistics in an integration test.
- If N+1 is confirmed, use a dedicated list projection or bounded batch fetching rather than joining every collection into one query.
- Keep the detailed single-habit endpoint responsible for data that is not required in list cards.
- Do not add a cache before the query shape is corrected.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/HabitRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitEntityMappings.java`
- Habit response/list DTOs
- New: `apps/backend/src/test/java/com/sashplatonov/habbit/runner/integration/HabitListQueryIT.java`
- `apps/backend/src/main/resources/application.properties`

**Acceptance criteria**

- The integration test records the baseline query count for a representative multi-habit dataset.
- List query count remains bounded as the number of habits increases.
- Response payload still contains every field required by the current dashboard.
- No `EAGER` collection is introduced as a blanket workaround.
- PostgreSQL query plan and test runtime remain documented in the test.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it \
  -Dit.test=HabitListQueryIT
cd apps/backend && ./mvnw -B -ntp verify
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend/src/main apps/backend/src/test && git commit -m "fix(database): bound habit list queries"`

---

<a id="phase-3"></a>

## ☕ Phase 3 — Maintainable Java and trustworthy quality gates

<a id="pr-012"></a>

### PR-012 — Align Java packages with source paths

**Problem and evidence**

- Multiple Java files are stored under `resource`, `service`, or `infrastructure/http` paths while declaring a different package.
- The mismatch makes package boundaries misleading and complicates navigation and static analysis.

**Architectural decision**

- Preserve runtime behavior and existing logical packages.
- Move files so filesystem paths match declared packages; change package declarations only when the current package is itself architecturally incorrect.
- Update imports and tests mechanically.
- Keep one top-level responsibility per file and introduce no compatibility facade unless external consumers require it.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/`
- `apps/backend/src/test/java/com/sashplatonov/habbit/runner/`

**Acceptance criteria**

- Every Java source path matches its declared package.
- No production or test Java file contains more than one top-level type.
- Public REST paths and serialized DTO names remain unchanged.
- The full backend gate passes without new suppressions.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp verify
git diff --check
git status --short
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend/src/main/java apps/backend/src/test/java && git commit -m "refactor(java): align packages with paths"`

<a id="pr-013"></a>

### PR-013 — Remove quality-gate suppressions and enable integration tests

**Problem and evidence**

- Maven defaults to `skipITs=true`.
- SpotBugs uses `failOnError=false` and broad exclusions.
- JaCoCo excludes `ServiceMetricsInstrumentation`.
- Java 25 compilation still reports a Lombok Unsafe warning, and SpotBugs reports a missing JSON-B annotation class.

**Architectural decision**

- Quality tools fail the build on real findings.
- Replace broad category exclusions with code fixes; do not introduce narrower suppressions as a shortcut.
- Test startup instrumentation through a Quarkus test or extract testable top-level collaborators.
- Run PostgreSQL ITs in `verify` for CI while retaining an explicit fast local test command.
- Use Maven Enforcer to make the documented Java and Maven minimum versions executable.
- Resolve warning-producing dependency/toolchain configuration through compatible dependency or compiler changes, not log filtering.

**Files**

- `apps/backend/pom.xml`
- `apps/backend/spotbugs/exclude.xml`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/instrumentation/ServiceMetricsInstrumentation.java`
- Metrics tests under `apps/backend/src/test/java/`
- `.github/workflows/quality.yml`

**Acceptance criteria**

- SpotBugs fails on findings and has no broad EI/UWF/NP category exclusions.
- JaCoCo checks all production classes that contain project behavior.
- Failsafe executes the PostgreSQL integration suite in CI.
- Maven fails early with an actionable message when Java or Maven is below the supported version.
- Maven verify emits no project-actionable compiler or missing-class warning.
- Coverage remains at or above the configured threshold.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp clean verify -Ppostgres-it
test -f apps/backend/target/spotbugsXml.xml
rg -n 'failOnError>false|skipITs>true|ServiceMetricsInstrumentation.class' \
  apps/backend/pom.xml apps/backend/spotbugs
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend/pom.xml apps/backend/spotbugs apps/backend/src .github/workflows/quality.yml && git commit -m "fix(build): enforce backend quality gates"`

<a id="pr-014"></a>

### PR-014 — Publish a complete verified OpenAPI contract

**Problem and evidence**

- `spec/openapi/openapi.yaml` covers only a small subset of the implemented API.
- Authentication, check-ins, notifications, pagination, errors, and concurrency semantics are missing or stale.
- Static API documentation can drift without failing CI.

**Architectural decision**

- Quarkus annotations and DTO schemas are the source of truth.
- Generate the OpenAPI artifact deterministically during verification.
- Check the generated artifact into `spec/openapi/openapi.yaml` only if a stable public snapshot is useful; CI must fail on drift.
- Document cookie/CSRF behavior, OAuth flow, standard errors, pagination, and 409 conflicts.

**Files**

- Backend REST resources and DTOs
- `apps/backend/src/main/resources/application.properties`
- `apps/backend/pom.xml`
- `spec/openapi/openapi.yaml`
- New: `docs/architecture/api-contract.md`
- `.github/workflows/quality.yml`

**Acceptance criteria**

- Every public backend route is present in OpenAPI.
- Security schemes distinguish cookie auth, CSRF header requirements, and public OAuth endpoints.
- Validation, 400, 401, 403, 404, 409, 429, and 500 responses use shared schemas.
- CI regenerates or compares the specification and fails on drift.
- At least three executable request examples cover read, mutation, and conflict behavior.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp verify
git diff --exit-code -- spec/openapi/openapi.yaml
rg -n '/auth|/checkins|/habits|/notifications|nextCursor|409|429' \
  spec/openapi/openapi.yaml
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend spec/openapi docs/architecture/api-contract.md .github/workflows/quality.yml && git commit -m "docs(api): publish verified openapi contract"`

---

<a id="phase-4"></a>

## 🎨 Phase 4 — Frontend contract and end-to-end proof

<a id="pr-015"></a>

### PR-015 — Remove unsupported offline-first behavior and claims

**Problem and evidence**

- `apps/web/src/lib/stores/habits.ts` performs backend mutations before updating in-memory state.
- IndexedDB persistence helpers are not part of the active CRUD path.
- `VITE_SYNC_ENABLED` is documented but has no active runtime contract.
- README, feature pages, SEO text, privacy copy, and blog content claim full offline writes and background sync.

**Architectural decision**

- Use an honest backend-first PWA architecture for portfolio readiness.
- Keep service-worker application-shell caching, but do not claim offline data mutation or local-first storage.
- Remove dead Dexie mutation helpers and `VITE_SYNC_ENABLED` only after repository-wide usage verification.
- Do not build a new outbox/conflict engine in this remediation backlog.

**Files**

- `apps/web/src/lib/stores/habits.ts`
- `apps/web/src/lib/storage/`
- `apps/web/src/routes/features/+page.svelte`
- `apps/web/src/routes/about/+page.svelte`
- `apps/web/src/routes/privacy-policy/+page.svelte`
- `apps/web/src/lib/seo/`
- `apps/web/src/content/blog/`
- `README.md`
- `docs/architecture/offline-sync-plan.md`
- `docs/architecture/overview.md`
- `docs/setup/getting-started.md`
- `.env.example`
- `apps/web/.env.example`
- Docker build arguments that reference `VITE_SYNC_ENABLED`

**Acceptance criteria**

- No public text claims that habit data can be written or synchronized offline.
- PWA shell caching and actual degraded behavior are described accurately.
- No dead sync environment variable remains in code, Compose, examples, or docs.
- IndexedDB helpers are either actively used under a tested contract or removed.
- Online CRUD and session tests continue to pass.

**Verification**

```bash
rg -n 'offline-first|fully offline|works offline|IndexedDB first|local outbox|VITE_SYNC_ENABLED' \
  README.md docs apps/web/src .env.example docker-compose*.yml
rg -n 'persistHabitInDb|upsertCheckinInDb|dexieLiveQuery' apps/web/src
cd apps/web && npm run test
cd apps/web && npm run check:web
docker compose --profile db config --quiet
```

[↑ Back to top](#top)

**AI agent commit command:** `git add README.md docs apps/web .env.example docker-compose.yml docker-compose.local.yml docker-compose.native.yml docker-compose.dokploy.yml && git commit -m "refactor(web): remove false offline mode"`

<a id="pr-016"></a>

### PR-016 — Preserve typed backend errors in the web client

**Problem and evidence**

- API helpers reduce backend failures to HTTP status and status text.
- Stable backend error codes and validation details are lost before reaching forms and route-level error states.
- `+error.svelte` may display a raw route error message.

**Architectural decision**

- Introduce one typed `ApiError` representation in the API client layer.
- Parse only the documented problem schema from PR-014 and fall back to a generic safe message.
- Map field validation errors at the form boundary.
- Log technical context through observability without rendering stack traces or raw backend messages.

**Files**

- New: `apps/web/src/lib/api/ApiError.ts`
- `apps/web/src/lib/api/habits.ts`
- `apps/web/src/lib/api/checkins.ts`
- Other callers under `apps/web/src/lib/api/`
- `apps/web/src/lib/stores/habits.ts`
- `apps/web/src/routes/+error.svelte`
- Habit forms and route-level error components
- Frontend unit tests

**Acceptance criteria**

- 400 validation details reach the correct form fields.
- 401/403, 404, 409, 429, and 500 have distinct safe UI states.
- Unknown or malformed error bodies fall back safely.
- Raw stack traces and arbitrary server messages are never displayed.
- Existing refresh single-flight behavior remains unchanged.

**Verification**

```bash
cd apps/web && npm run test
cd apps/web && npm run check:web
rg -n 'response\\.statusText|error\\.message' apps/web/src/lib/api apps/web/src/routes
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/web/src apps/web/tests && git commit -m "fix(web): preserve backend error details"`

<a id="pr-017"></a>

### PR-017 — Add critical Playwright journeys

**Problem and evidence**

- `@playwright/test` is installed but no maintained Playwright configuration or E2E suite proves the product journey.
- Unit tests do not verify the browser/backend/cookie/CSRF integration.
- Frontend coverage has no enforced baseline and is not checked by CI.

**Architectural decision**

- Add a small serial critical-path suite, not broad screenshot coverage.
- Start the real web and backend services against an isolated PostgreSQL database.
- Use only the dev/test identity provider from PR-002.
- Cover desktop and compact mobile for the same semantic flow.
- Add a conservative Vitest coverage threshold based on the measured baseline and raise it only when meaningful behavior tests justify the change.

**Files**

- New: `apps/web/playwright.config.ts`
- New: `apps/web/tests/e2e/habit-journey.spec.ts`
- New: `apps/web/tests/e2e/session-expiry.spec.ts`
- `apps/web/package.json`
- `apps/web/vite.config.ts`
- Test environment Compose/config files
- `.github/workflows/quality.yml`

**Acceptance criteria**

- E2E covers sign-in, habit creation, check-in, analytics visibility, edit, and delete.
- Expired access token refresh and logout are proven through browser cookies without exposing their values.
- One 409 conflict and one validation failure are visible to the user.
- Desktop and compact-mobile projects pass.
- CI enforces the documented frontend line and branch coverage baseline.
- CI artifacts are uploaded only on failure and retained briefly.

**Verification**

```bash
cd apps/web && npm run test:e2e
cd apps/web && npm run test -- --coverage
cd apps/web && npm run check:web
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/web/package.json apps/web/package-lock.json apps/web/vite.config.ts apps/web/playwright.config.ts apps/web/tests/e2e .github/workflows/quality.yml docker-compose*.yml && git commit -m "test(e2e): cover critical user journey"`

<a id="pr-018"></a>

### PR-018 — Remove production debug UI and accessibility defects

**Problem and evidence**

- `/debug/mini-heatmap` is included in the production bundle.
- Public UI contains broad `transition-all`, decorative icons without explicit accessibility treatment, images without intrinsic dimensions, and `"Adding..."` instead of an ellipsis.
- Responsive behavior has static coverage but no completed manual browser audit.

**Architectural decision**

- Remove the debug route from production source; component development belongs in tests or a development-only harness.
- Replace broad transitions with property-specific transitions and respect reduced motion.
- Decorative icons are hidden from the accessibility tree; meaningful controls receive explicit names.
- Set intrinsic image dimensions and preserve existing responsive layout.

**Files**

- `apps/web/src/routes/debug/mini-heatmap/`
- `apps/web/src/lib/components/PublicNav.svelte`
- `apps/web/src/lib/components/PublicLanding.svelte`
- `apps/web/src/lib/components/Onboarding.svelte`
- Other files returned by `rg -n 'transition-all|Adding\\.\\.\\.' apps/web/src`
- `apps/web/tests/unit/PublicNav.test.ts`
- Relevant component tests

**Acceptance criteria**

- Production route manifest contains no debug route.
- Interactive controls retain at least a 44-by-44 CSS pixel target.
- Keyboard navigation, focus visibility, reduced motion, and accessible names are verified.
- Images avoid layout shift through dimensions or aspect ratio.
- Desktop and mobile Playwright projects remain green.

**Verification**

```bash
rg -n 'debug/mini-heatmap|transition-all|Adding\\.\\.\\.' apps/web/src
cd apps/web && npm run test
cd apps/web && npm run check:web
cd apps/web && npm run test:e2e
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/web/src apps/web/tests && git commit -m "fix(web): remove production debug surface"`

---

<a id="phase-5"></a>

## ⚙️ Phase 5 — Operations, CI, and portfolio presentation

<a id="pr-019"></a>

### PR-019 — Align readiness, metrics, and tracing claims

**Problem and evidence**

- Readiness previously treated optional notifications as a core outage.
- OpenTelemetry dependencies exist while tracing is disabled.
- Documentation references metrics behavior that may not match the installed registry/export path.
- Current trace IDs provide correlation but not distributed tracing.

**Architectural decision**

- Separate liveness, core readiness, and optional capability status.
- Keep trace-ID correlation as the documented tracing model unless real OpenTelemetry export is enabled and verified end to end.
- Expose metrics only through a configured, tested registry/exporter.
- Do not add Prometheus or another backend only for portfolio decoration.

**Files**

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/health/`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/`
- `apps/backend/src/main/resources/application.properties`
- `apps/backend/pom.xml`
- `docs/monitoring/newrelic.md`
- `docs/operations/reliability-rollout.md`
- Health and metrics tests

**Acceptance criteria**

- `/q/health/live` tests process health only.
- `/q/health/ready` fails only when the API cannot safely serve core requests.
- Optional notification state is observable without blocking readiness.
- Every documented metrics or tracing command works against a running stack.
- Disabled OpenTelemetry is described honestly or removed if unused.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp test
cd apps/backend && ./mvnw -B -ntp verify
docker compose --profile db up --build --wait
curl --fail http://127.0.0.1:8080/q/health/live
curl --fail http://127.0.0.1:8080/q/health/ready
docker compose --profile db down
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend docs/monitoring/newrelic.md docs/operations/reliability-rollout.md && git commit -m "fix(observability): align readiness and metrics"`

<a id="pr-020"></a>

### PR-020 — Add Docker and contract smoke gates to CI

**Problem and evidence**

- CI validates backend, frontend, and Trivy but does not prove container build/startup.
- Compose portability, health dependency order, migrations, and OpenAPI drift can regress independently of unit tests.
- Documentation-only API changes may bypass useful contract checks.

**Architectural decision**

- Add one bounded smoke job after backend and frontend gates.
- Build the actual images, start the portable Compose stack, wait on health, call core health/API/web endpoints, then tear down unconditionally.
- Reuse the PostgreSQL and OpenAPI checks from prior tasks instead of duplicating test logic.
- Keep the smoke sequence in one checked-in shell script so local and CI verification use the same commands.
- Keep artifacts failure-only with short retention and retain concurrency cancellation.

**Files**

- `.github/workflows/quality.yml`
- `docker-compose.yml`
- New: `scripts/ci/smoke-stack.sh`
- `docs/operations/github-automation.md`

**Acceptance criteria**

- CI proves backend image, web image, Flyway startup, backend readiness, and web health.
- OpenAPI drift fails the workflow.
- Job timeout and cleanup run even after failure.
- Logs are uploaded only on failure for no more than three days.
- Existing dependency caches remain bounded and stable.

**Verification**

```bash
actionlint .github/workflows/quality.yml
docker compose --profile db config --quiet
docker compose --profile db up --build --wait
curl --fail http://127.0.0.1:8080/q/health/ready
curl --fail http://127.0.0.1:3000/
docker compose --profile db down --volumes
```

[↑ Back to top](#top)

**AI agent commit command:** `git add .github/workflows/quality.yml docker-compose.yml scripts/ci docs/operations/github-automation.md && git commit -m "ci(quality): add docker contract smoke"`

<a id="pr-021"></a>

### PR-021 — Rebuild the public repository narrative

**Problem and evidence**

- README still describes a React frontend and stale sync architecture.
- The repository has no license, Mermaid system diagram, screenshots, roadmap, or explicit limitations.
- GitHub description is empty.
- The name `Habbit Runner` may look like an accidental misspelling of `Habit Runner`.
- Tracked `.DS_Store` files and a stale empty `cve-assessment-result.json` reduce repository hygiene.

**Architectural decision**

- Make the root README a short recruiter-first entry point, not a duplicate of all docs.
- Lead with the business problem, verified feature set, architecture diagram, Java/Quarkus decisions, security model, test evidence, ten-minute startup, limitations, and links to deeper docs.
- Either document `Habbit` as an intentional brand or perform a separate repository-wide rename; do not leave it ambiguous.
- Add an explicit license selected by the maintainer.
- Keep screenshots focused on proving the backend-backed product journey.

**Files**

- `README.md`
- `docs/README.md`
- `docs/architecture/overview.md`
- `docs/setup/getting-started.md`
- New: `docs/roadmap.md`
- New: `docs/limitations.md`
- New: `docs/assets/screenshots/`
- New: `LICENSE`
- `.gitignore`
- `.github/.DS_Store`
- `apps/web/tests/.DS_Store`
- `cve-assessment-result.json`
- GitHub repository description and topics

**Acceptance criteria**

- README correctly states SvelteKit 2/Svelte 5 and the current backend-first data path.
- Mermaid diagram matches actual runtime components and trust boundaries.
- Every documented startup command has been executed from a clean checkout or container environment.
- README links to current OpenAPI, security, monitoring, roadmap, limitations, and license.
- At least two current screenshots show the main journey without private data.
- No `.DS_Store` or stale generated scan artifact remains tracked.
- GitHub description and topics summarize the project and Senior Java focus.
- The maintainer has explicitly selected the license and branding decision.

**Verification**

```bash
rg -n 'React|Vite 7|App\\.tsx|/sync|fully offline|VITE_SYNC_ENABLED' \
  README.md docs
git ls-files | rg '\\.DS_Store$|cve-assessment-result\\.json$'
test -f LICENSE
test -f docs/roadmap.md
test -f docs/limitations.md
docker compose --profile db config --quiet
cd apps/web && npm run check:web
cd apps/backend && ./mvnw -B -ntp verify
```

[↑ Back to top](#top)

**AI agent commit command:** `git add README.md docs LICENSE .gitignore .github apps/web/tests cve-assessment-result.json && git commit -m "docs(portfolio): align public repository story"`

<a id="pr-022"></a>

### PR-022 — Apply remaining verified patch upgrades

**Problem and evidence**

- Quarkus, `java-jwt`, SvelteKit, and several build dependencies have newer compatible patch/minor releases.
- Large dependency churn before correctness fixes would obscure regressions.

**Architectural decision**

- Perform maintenance upgrades only after all behavior and integration gates are in place.
- Upgrade one ecosystem at a time using BOM-managed or semver-compatible versions.
- Keep major upgrades out of this task.
- Preserve a separate commit if backend and frontend upgrades reveal unrelated failures.

**Files**

- `apps/backend/pom.xml`
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `.github/renovate.json`

**Acceptance criteria**

- Quarkus and `java-jwt` use current compatible non-preview releases.
- Frontend direct dependencies use compatible fixed releases.
- No forced resolution, vulnerability ignore, or quality suppression is introduced.
- Backend, frontend, PostgreSQL integration, E2E, Docker smoke, npm audit, and Trivy gates pass.

**Verification**

```bash
cd apps/backend && ./mvnw -B -ntp versions:display-dependency-updates
cd apps/backend && ./mvnw -B -ntp verify -Ppostgres-it
cd apps/web && npm outdated
cd apps/web && npm audit
cd apps/web && npm run test && npm run check:web && npm run test:e2e
docker compose --profile db up --build --wait
docker compose --profile db down
```

[↑ Back to top](#top)

**AI agent commit command:** `git add apps/backend/pom.xml apps/web/package.json apps/web/package-lock.json .github/renovate.json && git commit -m "chore(deps): apply verified patch upgrades"`

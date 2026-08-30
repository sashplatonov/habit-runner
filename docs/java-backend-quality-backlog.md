# Java Backend Quality & Maintainability — Implementation Backlog

## Goal

Improve the quality and maintainability of the Quarkus backend in `apps/backend/` by enforcing single responsibility per class, removing test-only construction seams from production code, eliminating middle-man delegation layers, and deduplicating error/response assembly. After the backlog is executed, every production bean has exactly one `@Inject` constructor with required (non-null) collaborators, persistence goes only through repositories, HTTP error payloads come from domain-owned factories, and no class re-delegates work that a caller could do directly against an existing collaborator.

No product behavior changes are planned: all HTTP status codes, JSON payload shapes, error codes, and metric names remain unchanged unless a task explicitly states otherwise.

## Architectural decisions

- **Source of truth.** The service layer owns business outcomes via the existing sealed `OperationResult` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/OperationResult.java`). Resources stay thin; repositories own persistence. No new layers are introduced — the backlog removes layers, it does not add them.
- **DI policy (backlog-level decision).** Production beans expose exactly one `@Inject` constructor whose parameters are required, non-nullable collaborators. Runtime `if (collaborator != null)` guards and null-defaulting constructor overloads exist today only so unit tests can call `new Bean(...)` with `null` — this test seam is removed. Tests construct real collaborators instead: `ServiceMetricsInstrumentation` is plain-constructible with `SimpleMeterRegistry` (proven in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/metrics/instrumentation/ServiceMetricsInstrumentationTest.java`), and everything else uses Mockito or the existing test stubs. The single allowed extra constructor is a package-private test seam that injects a *transport* (for example `HttpClient` in `GoogleOAuthClientTest`'s `FakeHttpClient`) with real values — never `null`.
- **No middle-men.** Facade classes that only re-delegate (`AuthCollaborators`, `CheckinMutationCoordinator`, `AuthServiceSupport`) are dissolved. Services inject the concrete collaborator they use. No parallel duplicate delegation path may remain.
- **Error payloads.** Error `ErrorResponse` literals are owned by domain factories: `CheckinResponses` already exists for checkins; habit errors move to a new `HabitResponses` factory so `"HABIT_NOT_FOUND"` / `"RESOURCE_VERSION_CONFLICT"` literals stop being duplicated across `HabitServiceImpl` and `CheckinMutationHandler`.
- **Persistence boundary.** `UserService`'s static Panache fallback (`UserEntity.find(...)`, `user.persist()`) is a hidden second persistence pathway that bypasses the repository layer and is removed.
- **Backward compatibility.** All HTTP contracts stay byte-identical. The web client already treats `401` and `403` equivalently for refresh (`apps/web/src/lib/auth/session.ts`), so no frontend change is required by any task here.
- **Quality gates.** Checkstyle (`validate`), PMD + SpotBugs + JaCoCo ≥ 0.80 (`verify`) stay green. No task may add `@SuppressWarnings`, plugin exclusions, `failOnError=false`, or ignore lists — root causes are fixed. Repository rule "no nested Java types" applies: every new type is a top-level file.
- **Sandbox note.** Quarkus tests can fail with a `FileSystemException` under `.../quarkus-webjar...` when run inside a restricted sandbox; rerun `./mvnw test`/`./mvnw verify` unsandboxed before treating a failure as real.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | TASK-001 | P2 | - | Widen the Checkstyle gate to test sources first so all later tasks must keep it green. |
| 2 | TASK-002 | P1 | - | Remove the repository-bypass persistence pathway in `UserService` before refactoring its callers. |
| 3 | TASK-003 | P2 | - | Deduplicate habit error payloads; later tasks stop re-typing the same literals. |
| 4 | TASK-004 | P1 | TASK-003 | Habit/checkin DI hygiene and middle-man removal in the same bounded context after the error factory exists. |
| 5 | TASK-005 | P1 | - | Constructor/field-injection hygiene for the auth client and `AuthService`; dead API removal. |
| 6 | TASK-006 | P1 | TASK-005 | Dissolve the `AuthCollaborators` facade once `AuthService`'s constructor shape is stable. |
| 7 | TASK-007 | P1 | TASK-006 | Dissolve `AuthServiceSupport` after `AuthService` injects concrete collaborators directly. |
| 8 | TASK-008 | P1 | - | Notification module DI hygiene; independent of auth chain. |
| 9 | TASK-009 | P1 | TASK-007 | `AuthResource` single-responsibility cleanup after the auth service contract is final. |
| 10 | TASK-010 | P2 | - | Deduplicate API-layer response/exception assembly; independent of service refactorings. |
| 11 | TASK-011 | P3 | TASK-010 | Audit and pin the 401/403 auth error mapping contract once the mapper is deduplicated. |
| 12 | TASK-012 | P2 | TASK-001…TASK-010 | Document the enforceable maintainability rules after the code matches them. |

Priorities: no `P0` tasks exist — the build and all quality gates currently pass; the findings are maintainability and structural defects.

---

## TASK-001: Enable Checkstyle for test sources

**Status:** DONE
**Priority:** P2
**Depends on:** -

**Exact scope:**

The Maven Checkstyle configuration in `apps/backend/pom.xml` currently sets `<includeTestSourceDirectory>false</includeTestSourceDirectory>` for the `maven-checkstyle-plugin`, so `src/test/java` is entirely outside the style gate. This task flips the flag to `true` and fixes every resulting violation in `apps/backend/src/test/java` — no exclusions, no suppression files.

**Files:**

- Modify `apps/backend/pom.xml` (search anchor: `includeTestSourceDirectory` in the `maven-checkstyle-plugin` `<configuration>` block, currently `false`).
- Modify test files under `apps/backend/src/test/java` that violate `apps/backend/checkstyle/checkstyle.xml` (line length 150, `NeedBraces`, import hygiene, naming, method length 60).

**Goal:**

`./mvnw validate` runs Checkstyle over both `src/main/java` and `src/test/java` and passes with zero violations, without any new exclusions.

### Outcome

The style gate covers the whole backend codebase; all subsequent tasks in this backlog are executed against the widened gate.

### Architectural decision

The existing `apps/backend/checkstyle/checkstyle.xml` ruleset is the single source of truth for style; the task changes only which directories the plugin scans, not the rules. Violations are fixed in the tests themselves (typically splitting over-long test methods and adding braces), never by weakening the ruleset.

### Required changes

1. Set `<includeTestSourceDirectory>true</includeTestSourceDirectory>` for `maven-checkstyle-plugin` in `apps/backend/pom.xml`.
2. Run `./mvnw validate` and fix every reported violation in `src/test/java` by editing the offending test files.
3. Do not add `suppressionsFile`, `exclude` patterns, or rule removals; if a rule is genuinely unfixable, stop and report instead of suppressing.

### Out of scope

- Changes to `checkstyle.xml` rules.
- PMD/SpotBugs test-source configuration.
- Any production (`src/main/java`) code changes beyond what style requires.

### Acceptance criteria

- `cd apps/backend && ./mvnw validate` passes with `includeTestSourceDirectory=true`.
- `git grep -n "suppressionsFile\|failOnError>false" apps/backend/pom.xml` returns no new lines.
- `./mvnw test` still passes after test edits.

### Targeted validation

```bash
cd apps/backend && ./mvnw validate && ./mvnw test
```

### Commit

```bash
git add apps/backend/pom.xml apps/backend/src/test/java
git commit -m "chore(quality): enforce checkstyle on backend test sources"
```

---

## TASK-002: Remove the static Panache fallback from UserService

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

`apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/UserService.java` contains two construction pathways — a public no-arg constructor delegating with `null` and the `@Inject` constructor — and three protected methods (`findByEmail`, `findRequiredById`, `createUser`) that branch on `userRepository == null` and fall back to static Panache active-record calls (`UserEntity.find(...)`, `UserEntity.findById(...)`, `user.persist()`). This is a hidden second persistence pathway that bypasses the repository layer and a null-guard test seam in production code.

**Files:**

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/UserService.java` (search anchors: `public UserService()`, `userRepository == null`, `UserEntity.<UserEntity>find`, `user.persist()`).
- Modify affected tests; search anchor: `new UserService(` and `TestUserService` under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/`.

**Goal:**

`UserService` has exactly one `@Inject` constructor requiring a non-null `UserRepository`, and all persistence goes through `UserRepository` methods.

### Outcome

The persistence boundary is single-sourced: services call repositories, repositories call the database, and no production code path can skip the repository layer.

### Architectural decision

Repositories own persistence (`UserRepository.findByEmail`, `UserRepository.findRequiredById`, `UserRepository.save`); the service keeps only user-domain logic. The no-arg constructor and every `userRepository == null` branch are deleted, not defaulted. Tests that relied on the static fallback now stub `UserRepository` with Mockito or the existing `TestUserService` support.

### Required changes

1. Delete the no-arg constructor and the `userRepository == null` fallback branches; `findByEmail`, `findRequiredById`, and `createUser` call `userRepository` unconditionally.
2. Update every test that constructs `UserService` without a repository to pass a Mockito mock or stub of `UserRepository` instead.
3. Preserve observable behavior: same `UserEntity` results, same `log.info` on user creation.

### Out of scope

- `AuthCollaborators` and `AuthService` (touched in TASK-005/TASK-006).
- `UserRepository` itself.
- Schema or migration changes.

### Acceptance criteria

- `git grep -n "UserEntity.find(\|UserEntity.findById(\|\.persist()" apps/backend/src/main` returns nothing.
- `UserService` declares exactly one constructor.
- `cd apps/backend && ./mvnw test -Dtest='AuthDataAccessTest,AuthServiceUnitCoverageTest,AuthPersistenceCoverageTest'` passes.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='AuthDataAccessTest,AuthServiceUnitCoverageTest,AuthPersistenceCoverageTest'
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/UserService.java apps/backend/src/test/java
git commit -m "refactor(auth): require user repository in UserService"
```

---

## TASK-003: Extract habit error payloads into a domain factory

**Status:** DONE
**Priority:** P2
**Depends on:** -

**Exact scope:**

Habit error `ErrorResponse` literals are duplicated: `HabitServiceImpl.notFound()` repeats the `HABIT_NOT_FOUND` payload twice inside one class, `versionConflict()` repeats `RESOURCE_VERSION_CONFLICT`, and `CheckinMutationHandler` builds habit-not-found errors through the checkin-owned `CheckinResponses.notFound("Habit not found", "HABIT_NOT_FOUND")` — a cross-domain dependency where the checkin namespace owns a habit error.

**Files:**

- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/support/HabitResponses.java` (mirror of the existing `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/support/CheckinResponses.java`).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java` (search anchors: `notFound()`, `versionConflict()`, `"HABIT_CONFLICT"`).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinMutationHandler.java` (search anchors: `CheckinResponses.notFound("Habit not found", "HABIT_NOT_FOUND")`).
- Search anchor: existing test coverage in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/habit/HabitResourceApiTest.java`.

**Goal:**

Every habit-domain failure payload is constructed in exactly one place, `HabitResponses`, and both `HabitServiceImpl` and `CheckinMutationHandler` reuse it.

### Outcome

Error payloads for the habit domain have a single source of truth; the checkin factory no longer produces habit errors.

### Architectural decision

The domain that owns an error owns its factory (the same convention `CheckinResponses` already establishes). `HabitResponses` is a final class with a private constructor and static factories: `notFound()`, `idConflict()` (`HABIT_CONFLICT`), `versionConflict()` (`RESOURCE_VERSION_CONFLICT`). The error `type` URL derivation (`"https://habbit-runner.dev/errors/" + code` lowercased/kebab-cased) is implemented once and reused, matching what `CheckinResponses.notFound` computes today. No new annotation or framework mechanism is introduced.

### Required changes

1. Create `HabitResponses` with static factories producing byte-identical `ErrorResponse` values (type, title, status, detail, errorCode) to the current inline literals.
2. Replace the inline `notFound()`/`versionConflict()`/`HABIT_CONFLICT` literals in `HabitServiceImpl` with factory calls and delete the private helpers.
3. Replace the two `CheckinResponses.notFound("Habit not found", "HABIT_NOT_FOUND")` calls in `CheckinMutationHandler` with `HabitResponses.notFound()`.
4. Add unit coverage for the factory itself asserting each payload field (type URL, status, errorCode) — a new `HabitResponsesTest` next to the existing habit tests.

### Out of scope

- `CheckinResponses` (its checkin-specific factories stay).
- Global error mapping (`GlobalExceptionMapper`) — TASK-010.
- Any HTTP status or error-code changes.

### Acceptance criteria

- `git grep -n "HABIT_NOT_FOUND\|HABIT_CONFLICT\|RESOURCE_VERSION_CONFLICT" apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin` matches only inside `HabitResponses.java`.
- Existing habit/checkin resource and service tests pass unchanged (payloads identical).
- New `HabitResponsesTest` asserts all payload fields for each factory method.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='HabitResourceApiTest,HabitServiceImplTest,CheckinServiceImplTest,HabitResponsesTest'
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/support/HabitResponses.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinMutationHandler.java apps/backend/src/test/java
git commit -m "refactor(habit): centralize habit error payloads in HabitResponses"
```

---

## TASK-004: Remove metrics null-seams and the CheckinMutationCoordinator middle-man

**Status:** DONE
**Priority:** P1
**Depends on:** TASK-003

**Exact scope:**

Habit and checkin services carry metrics null-guards and a redundant delegation layer:

- `CheckinMutationCoordinator` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/support/CheckinMutationCoordinator.java`) is a middle-man: it wraps `ServiceMetricsInstrumentation` behind `if (serviceMetricsInstrumentation != null)` guards, adds a public no-arg constructor delegating with `null`, and re-delegates static helpers (`CheckinMutationSupport.normalize/touch`, `HabitMutationSupport.touch`) one-to-one.
- `CheckinMutationHandler` re-implements `parseDate` privately although `CheckinDateSupport.parseDate` already exists in the same package, and contains a pure pass-through method `saveDoneCheckin` that only calls `saveCheckin`.
- `HabitServiceImpl` (lines ~92 and ~138) still guards `serviceMetricsInstrumentation != null` although its single constructor always receives one.

**Files:**

- Delete `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/support/CheckinMutationCoordinator.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinMutationHandler.java` (search anchors: `checkinMutationCoordinator`, `private LocalDate parseDate`, `saveDoneCheckin`).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java` (search anchors: `if (serviceMetricsInstrumentation != null)`).
- Modify tests; search anchor: `CheckinMutationCoordinator` and `new CheckinMutationHandler(` under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/checkin/` (`CheckinServiceImplTest`).

**Goal:**

Habit and checkin mutation services depend on `ServiceMetricsInstrumentation` directly as a required collaborator; the coordinator layer, the null-guards, the duplicated date parsing, and the pass-through wrapper are gone.

### Outcome

The habit/checkin mutation flow matches `HabitServiceImpl`'s existing direct-injection pattern everywhere: one code path, no runtime null branches, no re-delegation.

### Architectural decision

`HabitServiceImpl` already injects `ServiceMetricsInstrumentation` directly — that is the established mechanism this task extends; the coordinator's static-helper re-delegations collapse back to direct static calls (`CheckinMutationSupport.normalize(...)`, `HabitMutationSupport.touch(...)`) since the supports are final utility classes, not injected beans. Tests construct handlers with a real `ServiceMetricsInstrumentation` backed by `SimpleMeterRegistry` (the pattern already proven in `ServiceMetricsInstrumentationTest`) or a Mockito mock — never `null`.

### Required changes

1. Delete `CheckinMutationCoordinator`; `CheckinMutationHandler` injects `ServiceMetricsInstrumentation` instead and calls the static support utilities directly.
2. Delete the no-arg/null-delegating constructor pattern and all `if (serviceMetricsInstrumentation != null)` guards in both files; metrics calls become unconditional.
3. Replace the private `parseDate` with `CheckinDateSupport.parseDate` and inline `saveDoneCheckin` into `saveCheckin`.
4. Update `CheckinServiceImplTest` (and any other test constructing the handler) to the new constructor signature; keep all existing behavioral assertions.

### Out of scope

- `CheckinResponses` / `HabitResponses` payload content (TASK-003).
- `AuthServiceSupport` (TASK-007) and `NotificationServiceImpl` (TASK-008).
- Business rules of upsert/delete.

### Acceptance criteria

- `git grep -rn "CheckinMutationCoordinator" apps/backend/src` returns nothing.
- `git grep -n "serviceMetricsInstrumentation != null" apps/backend/src/main` returns nothing in the habit and checkin packages.
- `git grep -n "saveDoneCheckin\|private LocalDate parseDate" apps/backend/src/main` returns nothing.
- `./mvnw test -Dtest='CheckinServiceImplTest,HabitServiceImplTest,CheckinMapperTest'` passes; mutation metrics still recorded (assert via the metrics stub in tests).

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='CheckinServiceImplTest,HabitServiceImplTest,CheckinMapperTest,ServiceMetricsInstrumentationTest'
```

### Commit

```bash
git add -A apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java apps/backend/src/test/java
git commit -m "refactor(checkin): drop metrics null-seams and coordinator middle-man"
```

---

## TASK-005: Auth client/service constructor hygiene and dead API removal

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

Two auth classes violate the single-construction-pathway and constructor-injection rules:

- `GoogleOAuthClient` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/client/GoogleOAuthClient.java`) has four constructors; the extra ones exist to pass `null` metrics or omit the metrics collaborator, and the class guards `serviceMetricsInstrumentation == null` at runtime. Its `ensureConfigured()` method has no production callers (only the definition exists in the codebase).
- `AuthService` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java`) has a second `protected` constructor delegating with `null`s, injects `OAuthAccountLinkService` via field injection (`@Inject OAuthAccountLinkService oauthAccountLinkService`), and exposes `handleOAuthCallback(String, String)` whose only callers are unit tests — production uses `handleOAuthCallbackSession`.

**Files:**

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/client/GoogleOAuthClient.java` (search anchors: `GoogleOAuthClient(AuthConfig authConfig, ObjectMapper objectMapper)`, `ensureConfigured`, `serviceMetricsInstrumentation == null`).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java` (search anchors: `protected AuthService(`, `@Inject OAuthAccountLinkService`, `handleOAuthCallback(String code, String state)`).
- Modify tests; search anchors: `new GoogleOAuthClient(` in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/client/GoogleOAuthClientTest.java`, `handleOAuthCallback("` in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AuthServiceUnitCoverageTest.java`.

**Goal:**

`GoogleOAuthClient` and `AuthService` each expose exactly one injection pathway with required, non-null collaborators, use constructor injection only, and contain no production-dead methods.

### Outcome

Auth construction is deterministic: the CDI container and tests both go through the same constructor, and every public method on these classes has a production caller.

### Architectural decision

Per the backlog-level DI decision: `GoogleOAuthClient` keeps two constructors only — the public `@Inject` one that builds the default `HttpClient`, and one package-private test seam that accepts a transport plus a real `ServiceMetricsInstrumentation` (never `null`). `AuthService` collapses to its `@Inject` constructor with `OAuthAccountLinkService` moved into it; the `if (authServiceSupport != null)` guards inside method bodies remain untouched here and are removed by TASK-007 together with the class deletion. `handleOAuthCallback` (String variant) is dead production surface and is deleted; tests are re-pointed at `handleOAuthCallbackSession` and assert on `redirectUrl()`.

### Required changes

1. In `GoogleOAuthClient`: delete the two null-metrics constructors and the `ensureConfigured()` method; make all metrics calls unconditional; keep the package-private transport-injecting constructor requiring a real instrumentation instance.
2. In `AuthService`: delete the `protected` delegating constructor; move `OAuthAccountLinkService` from field injection into the `@Inject` constructor; delete `handleOAuthCallback(String, String)` and update its test callers to `handleOAuthCallbackSession`.
3. Update `GoogleOAuthClientTest` constructions to pass a `ServiceMetricsInstrumentation` backed by `SimpleMeterRegistry` (or a Mockito mock); the existing `FakeHttpClient` transport seam stays.
4. Keep all log statements, metric names, and exception types unchanged.

### Out of scope

- `AuthCollaborators` (TASK-006), `AuthServiceSupport` (TASK-007), `AuthResource` (TASK-009).
- Behavior of the OAuth flow itself.

### Acceptance criteria

- `GoogleOAuthClient` declares at most two constructors: the `@Inject` one and one package-private test seam; neither accepts `null` semantics.
- `git grep -n "ensureConfigured\|handleOAuthCallback(" apps/backend/src/main` returns no matches other than `handleOAuthCallbackSession`.
- `AuthService` has no field-level `@Inject` (all injection is constructor injection).
- `./mvnw test -Dtest='GoogleOAuthClientTest,AuthServiceUnitCoverageTest,AuthRefreshTest'` passes.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='GoogleOAuthClientTest,AuthServiceUnitCoverageTest,AuthRefreshTest'
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/client/GoogleOAuthClient.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java apps/backend/src/test/java
git commit -m "refactor(auth): single-constructor DI and dead API removal"
```

---

## TASK-006: Dissolve the AuthCollaborators facade

**Status:** DONE
**Priority:** P1
**Depends on:** TASK-005

**Exact scope:**

`AuthCollaborators` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/AuthCollaborators.java`) is a pure delegation facade: ~20 one-line methods re-delegating to `JwtUtil`, `RefreshTokenService`, `OAuthSupport`, `UserService`, and `IdentityService`, plus three getter methods used only by a coverage test. It also injects `IdentityService` via field injection with a `identityService == null` runtime guard. `AuthService` calls everything through this middle-man.

**Files:**

- Delete `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/AuthCollaborators.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java` (search anchors: `collaborators.`, `AuthCollaborators`).
- Delete/replace tests; search anchors: `StubCollaborators` in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/StubCollaborators.java`, `AuthDelegateCoverageTest` in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/security/AuthDelegateCoverageTest.java`, and every `new AuthService(` / `collaborators` usage under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/` (for example `AuthServiceUnitCoverageTest`, `TestAuthService`, `ResourceAuthService`).

**Goal:**

`AuthService` injects the concrete collaborators it uses (`JwtUtil`, `RefreshTokenService`, `UserService`, `OAuthSupport`, `IdentityService`, plus the existing `OAuthStateAccess`, `AuthServiceSupport`, `OAuthAccountLinkService`) and no facade exists.

### Outcome

One indirection layer disappears: reading an `AuthService` method shows the real collaborator being called, and no class exists whose sole job is re-delegation.

### Architectural decision

The service layer composes its collaborators directly — the same pattern `HabitServiceImpl` and `CheckinMutationHandler` already use with repositories. `AuthCollaborators` is not redesigned (for example into a smaller aggregator) but deleted, because every method is a one-line pass-through and a redesign would keep the duplicate delegation source of truth alive. The `issueTokenPair` orchestration (access + refresh creation) moves into `AuthService` as a private helper since it contains the only non-trivial composition. Checkstyle's `ParameterNumber` max is 10; the resulting constructor has 8 parameters, within the limit. Tests construct `AuthService` with Mockito mocks or the existing `Test*Service` stubs per collaborator; `StubCollaborators` and `AuthDelegateCoverageTest` (which only asserted getter identity) are deleted.

### Required changes

1. Add the concrete collaborators to `AuthService`'s constructor; replace every `collaborators.xxx(...)` call with the direct collaborator call; move `issueTokenPair` composition into `AuthService` as a private method.
2. Delete `AuthCollaborators`, `StubCollaborators`, and `AuthDelegateCoverageTest`.
3. Update every auth unit test construction site to pass concrete stubs/mocks; preserve all behavioral assertions (refresh rotation, telegram auth, OAuth callback flows).
4. Keep the `if (authServiceSupport != null)` guards for TASK-007 — do not mix that change into this task.

### Out of scope

- `AuthServiceSupport` dissolution (TASK-007).
- `AuthResource` (TASK-009).
- Any change to `JwtUtil`, `RefreshTokenService`, `UserService`, `OAuthSupport`, `IdentityService` internals.

### Acceptance criteria

- `git grep -rn "AuthCollaborators" apps/backend/src` returns nothing.
- `AuthService` method bodies contain no `collaborators.` references; the constructor uses constructor injection only.
- `cd apps/backend && ./mvnw test -Dtest='AuthServiceUnitCoverageTest,AuthRefreshTest,AuthPersistenceCoverageTest,IdentityServiceTest'` passes.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='AuthServiceUnitCoverageTest,AuthRefreshTest,AuthPersistenceCoverageTest,IdentityServiceTest'
```

### Commit

```bash
git add -A apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth apps/backend/src/test/java
git commit -m "refactor(auth): inject collaborators directly and drop facade"
```

---

## TASK-007: Dissolve AuthServiceSupport into direct collaborators

**Status:** DONE
**Priority:** P1
**Depends on:** TASK-006

**Exact scope:**

`AuthServiceSupport` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/AuthServiceSupport.java`) bundles two unrelated cross-cutting concerns behind null-guards: `checkAccountRateLimit` re-delegates to `AuthRateLimitService` and `record` re-delegates to `ServiceMetricsInstrumentation`, each guarded with `if (... != null)`. `AuthService` correspondingly contains five `if (authServiceSupport != null)` branches. The class has a single responsibility: being a test seam.

**Files:**

- Delete `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/AuthServiceSupport.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java` (search anchors: `authServiceSupport`, `checkAccountRateLimit`, `authServiceSupport.record`).
- Search anchor for tests: `AuthServiceSupport` and `new AuthService(` under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/`.

**Goal:**

`AuthService` injects `AuthRateLimitService` and `ServiceMetricsInstrumentation` directly as required collaborators, calls them unconditionally, and `AuthServiceSupport` no longer exists.

### Outcome

Rate limiting and metrics are visible, non-optional steps of the auth flows; there is no runtime branch that can silently skip a security-relevant rate-limit check.

### Architectural decision

A class that only re-delegates two unrelated concerns is a middle-man and is deleted, not refactored. Rate limiting is a security boundary: making the collaborator required removes the possibility of a misconfigured null path skipping `checkAccountRateLimit`. Tests provide a real `AuthRateLimitService` (the existing `AuthRateLimitServiceTest` shows it is plain-constructible) and a `SimpleMeterRegistry`-backed `ServiceMetricsInstrumentation`, or Mockito mocks.

### Required changes

1. Add `AuthRateLimitService` and `ServiceMetricsInstrumentation` to `AuthService`'s constructor; replace every `authServiceSupport.checkAccountRateLimit(...)` and `authServiceSupport.record(...)` call with direct calls; delete all five `if (authServiceSupport != null)` guards.
2. Delete `AuthServiceSupport`.
3. Update auth unit tests to construct `AuthService` with the two direct collaborators; keep rate-limit thresholds and metric names identical.

### Out of scope

- `AuthRateLimitService` internals and thresholds.
- `AuthResource`'s IP-based rate limiting (TASK-009 touches `AuthResource` but not IP limits).
- `NotificationServiceImpl` (TASK-008).

### Acceptance criteria

- `git grep -rn "AuthServiceSupport" apps/backend/src` returns nothing.
- `git grep -n "authServiceSupport" apps/backend/src/main` returns nothing.
- `AuthService.refreshToken` still enforces the account rate limit: a test proves that a refresh beyond the limit is rejected (extend `AuthServiceUnitCoverageTest` if no such case exists yet).
- `./mvnw test -Dtest='AuthServiceUnitCoverageTest,AuthRateLimitServiceTest,AuthRefreshTest'` passes.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='AuthServiceUnitCoverageTest,AuthRateLimitServiceTest,AuthRefreshTest'
```

### Commit

```bash
git add -A apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth apps/backend/src/test/java
git commit -m "refactor(auth): require rate limit and metrics collaborators directly"
```

---

## TASK-008: Notification service DI hygiene and import cleanup

**Status:** DONE
**Priority:** P1
**Depends on:** -

**Exact scope:**

`NotificationServiceImpl` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java`) has two constructors (one delegating with a `null` metrics collaborator), guards `if (serviceMetricsInstrumentation != null)` twice, and builds error payloads with fully-qualified inline type names (`new com.sashplatonov.habbit.runner.api.ErrorResponse(...)`, `jakarta.ws.rs.core.Response.Status.CONFLICT.getStatusCode()`) instead of imports. Tests construct it with `new NotificationServiceImpl(config, null)`.

**Files:**

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java` (search anchors: `NotificationServiceImpl(`, `serviceMetricsInstrumentation != null`, `com.sashplatonov.habbit.runner.api.ErrorResponse`).
- Modify tests; search anchors: `new NotificationServiceImpl(` in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/notification/NotificationServiceUnitCoverageTest.java`, `NotificationResourceUnitTest.java`, `NotificationResourceCoverageTest.java`.

**Goal:**

`NotificationServiceImpl` has exactly one `@Inject` constructor with a required metrics collaborator, no null-guards, and normal imports for `ErrorResponse` and `Response.Status`.

### Outcome

The notification module matches the DI policy; its source no longer carries test-only branches or fully-qualified name noise.

### Architectural decision

Same backlog-level DI decision: the null-defaulting constructor is deleted; tests construct a real `ServiceMetricsInstrumentation` with `SimpleMeterRegistry` (pattern proven in `ServiceMetricsInstrumentationTest`) or a Mockito mock. The fully-qualified names are replaced with imports — no behavior change.

### Required changes

1. Delete the two-argument constructor delegating with `null`; keep only the `@Inject` constructor and make the metrics calls unconditional.
2. Replace all fully-qualified `com.sashplatonov.habbit.runner.api.ErrorResponse` and `jakarta.ws.rs.core.Response.Status` inline references with imports.
3. Update the three notification test files to pass a real or mocked metrics collaborator instead of `null`.
4. Keep payload shapes, log events, and metric names (`PUSH_SUBSCRIPTION_CREATED`, `PUSH_SUBSCRIPTION_DELETED`) unchanged.

### Out of scope

- `NotificationResource` and push-sending behavior.
- Error payload factory extraction for the notification domain (its three error literals are module-local; extraction is deferred until a second consumer exists).

### Acceptance criteria

- `NotificationServiceImpl` declares exactly one constructor.
- `git grep -n "serviceMetricsInstrumentation != null\|com.sashplatonov.habbit.runner.api.ErrorResponse(" apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification` returns nothing.
- `./mvnw test -Dtest='NotificationServiceUnitCoverageTest,NotificationResourceUnitTest,NotificationResourceCoverageTest'` passes with metrics assertions intact.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='NotificationServiceUnitCoverageTest,NotificationResourceUnitTest,NotificationResourceCoverageTest'
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/notification
git commit -m "refactor(notification): require metrics collaborator and clean imports"
```

---

## TASK-009: Move session assembly and CSRF token policy out of AuthResource

**Status:** DONE
**Priority:** P1
**Depends on:** TASK-007

**Exact scope:**

`AuthResource` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java`) currently owns three concerns beyond thin request handling:

1. CSRF token value policy — the private `csrfToken(String)` method generates token values with `UUID.randomUUID()` inside the resource.
2. Session response assembly — `currentSessionResponse` calls `authService.verifyAccessToken(accessToken)` to re-verify a token the service itself just issued, adding a wasted JWT verification round-trip to every refresh.
3. Cookie lifecycle computation — `refreshCookieMaxAgeSeconds()` derives max-age from `authService.refreshTokenDays()` in the resource.

**Files:**

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java` (search anchors: `csrfToken(`, `currentSessionResponse`, `refreshCookieMaxAgeSeconds`, `authenticatedSessionResponse`).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/AuthCookieBuilder.java` (search anchor: `csrfToken` cookie method and `REFRESH_TOKEN_COOKIE`/`CSRF_TOKEN_COOKIE` constants).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java` (search anchor: `refreshToken(String token)` returning `TokenResponse`).
- Create `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support/RefreshedSession.java` — a top-level record carrying `accessToken`, `refreshToken`, `expiresIn`, and the authenticated `CurrentUser` (no nested types per repository rules).
- Search anchors for tests: `AuthResourceUnitTest`, `AuthPreferencesResourceUnitTest` in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/resource/`, `AuthRefreshTest` in `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/`.

**Goal:**

`AuthResource` only maps requests to service calls and attaches cookies; token-value policy lives with the cookie builder, and the refresh flow returns the session identity without re-verifying a freshly issued token.

### Outcome

The refresh endpoint performs one JWT verification instead of two per request, CSRF token value generation has a single owner, and the resource contains no `java.util.UUID` import or token-verification logic.

### Architectural decision

The service owns token issuance results: `AuthService.refreshToken` returns the new `RefreshedSession` record including the verified `CurrentUser` it already loaded, so no re-verification is needed. `AuthCookieBuilder` becomes the single point for cookie concerns including the reuse-or-generate policy for the CSRF double-submit value (using the existing `AuthSupport.randomToken` utility instead of `UUID`), matching the standard that a dedicated cookie builder owns cookie attributes. The `TokenResponse` HTTP DTO used by the Telegram flow is untouched. Cookie names, attributes, and the HTTP response shape of `/auth/refresh` and `/auth/google/callback` are unchanged.

### Required changes

1. Change `AuthService.refreshToken` to return `RefreshedSession` (tokens + `CurrentUser`); update `AuthResource.refresh` and all test callers.
2. Move the CSRF reuse-or-generate policy into `AuthCookieBuilder` (or a package-private helper next to it) using `AuthSupport.randomToken`; the resource passes the incoming cookie value through.
3. Remove `currentSessionResponse`/`verifyAccessToken` from the refresh path; the session response is built from `RefreshedSession` fields.
4. Keep the `/auth/google/callback` response construction and cookie attributes byte-identical; existing `AuthResourceUnitTest` cookie assertions must pass unchanged.

### Out of scope

- IP rate limiting in `AuthResource` (`enforceIpLimit`, thresholds).
- Logout behavior.
- `TokenResponse` DTO and the Telegram session flow.
- Any change to cookie names, `SameSite`, `HttpOnly`, or max-age values.

### Acceptance criteria

- `AuthResource` contains no `UUID` usage and no call to `verifyAccessToken` in the refresh flow.
- `POST /auth/refresh` still returns an `AuthSessionResponse` with the correct `userId`/`email` and sets access/refresh/CSRF cookies with unchanged attributes (existing resource tests plus a new assertion that the returned identity matches the rotated token's user).
- A returning CSRF cookie value is preserved instead of regenerated (test: refresh twice with the same CSRF cookie value; second response reuses it).
- `./mvnw test -Dtest='AuthResourceUnitTest,AuthRefreshTest,AuthServiceUnitCoverageTest'` passes.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='AuthResourceUnitTest,AuthRefreshTest,AuthServiceUnitCoverageTest'
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/resource/AuthResource.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/support apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/service/AuthService.java apps/backend/src/test/java
git commit -m "refactor(auth): move session assembly and csrf policy out of resource"
```

---

## TASK-010: Deduplicate API-layer response and exception assembly

**Status:** TODO
**Priority:** P2
**Depends on:** -

**Exact scope:**

The `api` package duplicates response assembly in two places:

1. `GlobalExceptionMapper` (`apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/GlobalExceptionMapper.java`, 224 lines) repeats the same `new ErrorResponse(ERR_BASE + ..., title, status, detail, code)` construction and an identical multi-line `log.debug/log.warn` request-rejected statement in seven branches (`validationResponse`, `conflictResponse`, `notAuthorizedResponse`, `forbiddenResponse`, `notFoundResponse`, `badRequestResponse`, `webApplicationResponse`).
2. `HabitResource.delete` hand-rolls `OperationSuccess`/`OperationFailure` casting instead of using the inherited `AuthenticatedResourceSupport.toResponse` helper, and `AuthenticatedResourceSupport.toResponse` itself uses a pattern-match-then-cast pair instead of a switch over the sealed `OperationResult`.

**Files:**

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/GlobalExceptionMapper.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/ExceptionResponseSupport.java` (existing package-private helper — extend it rather than creating a parallel class).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/AuthenticatedResourceSupport.java` (search anchors: `toResponse`, `instanceof OperationSuccess`).
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitResource.java` (search anchor: `public Response delete`).
- Search anchor for tests: `ApiSupportTest`, `RequestTraceFilterUnitTest` under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/api/`, `HabitResourceTest`/`HabitResourceApiTest` under `apps/backend/src/test/java/com/sashplatonov/habbit/runner/habit/`.

**Goal:**

Each error response is built in one place and each rejection is logged by one helper; void-result mapping is shared by all resources through `AuthenticatedResourceSupport`.

### Outcome

The `api` package has a single source of truth for `ErrorResponse` construction, rejection logging, and `OperationResult`-to-`Response` mapping, cutting `GlobalExceptionMapper` roughly in half with byte-identical HTTP behavior.

### Architectural decision

`ExceptionResponseSupport` already exists as the package-private support for this exact concern — it is extended (for example with a `rejected(...)` factory + logger taking the log level, and an `ErrorResponse` builder keyed by status/title/code) instead of introducing a new parallel helper. `AuthenticatedResourceSupport.toResponse` becomes a switch expression over the sealed `OperationResult` variants, and a `noContent`-aware overload handles `OperationSuccess<Void>` so `HabitResource.delete` reuses it. Because this task changes shared API contracts, the full `verify` gate (Checkstyle + JaCoCo + SpotBugs + PMD) is required, not just targeted tests.

### Required changes

1. Extract the repeated `ErrorResponse` construction and the identical `event=request_rejected` log statement into `ExceptionResponseSupport`; each mapper branch keeps only its unique status/title/detail/code and log level.
2. Rewrite `AuthenticatedResourceSupport.toResponse` as a switch over the sealed result; add a void-success overload returning `204 No Content`.
3. Replace `HabitResource.delete`'s manual casting with the shared helper.
4. Keep every response body, status code, header, and log message format byte-identical — the existing api/habit tests are the regression net and must pass unchanged.

### Out of scope

- The 401/403 semantic question (TASK-011).
- `ConstraintViolationExceptionMapper` and the other specific mappers (they already delegate to `ExceptionResponseSupport`).
- Any new error codes.

### Acceptance criteria

- `GlobalExceptionMapper` contains no repeated `new ErrorResponse(` literal block; each branch is a one-liner over the shared support.
- `HabitResource.delete` contains no `instanceof OperationSuccess` or `OperationFailure` cast.
- `cd apps/backend && ./mvnw verify` passes end-to-end (this task changes a shared contract, so the full gate runs).

### Targeted validation

```bash
cd apps/backend && ./mvnw verify
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/api apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitResource.java
git commit -m "refactor(api): deduplicate error and result response assembly"
```

---

## TASK-011: Pin and document the auth error-status contract

**Status:** TODO
**Priority:** P3
**Depends on:** TASK-010

**Exact scope:**

`GlobalExceptionMapper.notAuthorizedResponse` maps `NotAuthorizedException` to HTTP `403` with `AUTH_REQUIRED`, while JAX-RS semantics for `NotAuthorizedException` are `401`. The web client treats `401` and `403` equivalently for refresh (`apps/web/src/lib/auth/session.ts`, lines ~202/220), so the current mapping works but is implicit. This task makes the mapping an explicit, tested, documented contract — it does not change behavior unilaterally.

**Files:**

- Create `apps/backend/src/test/java/com/sashplatonov/habbit/runner/api/AuthErrorStatusContractTest.java`.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/GlobalExceptionMapper.java` (search anchor: `notAuthorizedResponse`, `AUTH_REQUIRED`) — only to add the decision note as a comment if the mapper code needs an anchor for the rule; no logic change.
- Modify `docs/architecture/api-contract.md` (search anchor: error response section; add the mapping table if a suitable section exists, otherwise a short new section).

**Goal:**

The `401`/`403` mapping for auth failures is pinned by a contract test and documented, so a future change is a conscious decision rather than an accident.

### Outcome

Anyone changing the mapper sees a failing contract test and a documented rationale before the mapping silently shifts.

### Architectural decision

Current behavior is preserved: unauthenticated requests (`NotAuthorizedException` from `AuthGuardFilter`) return `403` + `AUTH_REQUIRED`, because both the frontend and any deployed clients treat `401`/`403` as "refresh needed" and changing it is a cross-layer product decision. The task documents this as the chosen interpretation and records the alternative (`401` for missing/invalid credentials, `403` for insufficient rights) as a possible follow-up requiring a frontend audit. Changing the status is explicitly out of scope.

### Required changes

1. Add `AuthErrorStatusContractTest` asserting: `NotAuthorizedException` → `403` + `errorCode=AUTH_REQUIRED`; `ForbiddenException` → `403` + `REQUEST_REJECTED`; both with the standard `ErrorResponse` JSON shape.
2. Document the mapping (exception → status → errorCode) and the rationale in `docs/architecture/api-contract.md`.
3. No production logic changes.

### Out of scope

- Changing any status code or error code.
- Refresh-token rejection and rate-limit mappers.

### Acceptance criteria

- The contract test passes and fails if the `notAuthorizedResponse` status or code changes.
- `docs/architecture/api-contract.md` contains the mapping table with the rationale.

### Targeted validation

```bash
cd apps/backend && ./mvnw test -Dtest='AuthErrorStatusContractTest,ApiSupportTest'
```

### Commit

```bash
git add apps/backend/src/test/java/com/sashplatonov/habbit/runner/api/AuthErrorStatusContractTest.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/GlobalExceptionMapper.java docs/architecture/api-contract.md
git commit -m "docs(api): pin auth error status contract"
```

---

## TASK-012: Document backend maintainability rules

**Status:** TODO
**Priority:** P2
**Depends on:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010

**Exact scope:**

The structural rules enforced by this backlog (single `@Inject` constructor, no null-seam test constructors, no middle-man facades, repository-only persistence, domain-owned error factories, no field injection, no nested Java types) currently exist only in this backlog file. They are recorded in the backend README so future contributions keep them.

**Files:**

- Modify `apps/backend/README.md` (add a "Maintainability rules" section).
- Search anchor for cross-reference: `AGENTS.md` root file — do not duplicate the rules there; the README section is the single source and `AGENTS.md` already covers repo-wide policy.

**Goal:**

The backend README documents the enforceable structural rules with one-line rationale each, matching the codebase as it exists after TASK-001…TASK-010.

### Outcome

A contributor (human or AI agent) can read `apps/backend/README.md` and know the construction, delegation, persistence, and error-payload conventions without reverse-engineering the code.

### Architectural decision

Documentation lives with the code it describes (`apps/backend/README.md`), not in this backlog, and each rule is phrased as an observable convention with a rationale — for example: "Production beans have exactly one `@Inject` constructor with required collaborators; tests construct real collaborators (`SimpleMeterRegistry`-backed metrics) instead of passing `null`."

### Required changes

1. Add a "Maintainability rules" section to `apps/backend/README.md` covering: single-constructor DI and the transport-seam exception; no middle-man re-delegation; repository-only persistence; domain-owned error factories; constructor injection only; the no-nested-types and no-suppressions rules (already in root `AGENTS.md`, referenced not restated at length).
2. Keep it under ~40 lines; rules only, no tutorial.

### Out of scope

- Root `AGENTS.md` changes.
- Any code changes.
- Frontend documentation.

### Acceptance criteria

- `apps/backend/README.md` contains the rules section and every rule is true of the codebase at that point (verified by the final full gate run).

### Targeted validation

```bash
cd apps/backend && ./mvnw verify
```

### Commit

```bash
git add apps/backend/README.md
git commit -m "docs(backend): document maintainability rules"
```

---

## Final backlog review notes

- Every referenced path was verified against the current checkout; new files are marked `Create`.
- No `P0` tasks: `./mvnw validate`, `test`, and `verify` currently pass; the findings are structural and maintainability defects, not broken gates.
- HTTP contracts are unchanged by every task except where a task explicitly pins them (TASK-011 changes nothing, it only tests).
- No task introduces suppressions, exclusions, nested Java types, new dependencies, or parallel sources of truth.
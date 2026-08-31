# Java Backend Linter Remediation - Implementation Backlog

## Goal

Make the Java backend complete its clean quality build without disabling a rule, adding a suppression, weakening a threshold, or excluding a source file. The work is limited to the concrete findings produced by the clean Maven run on 2026-08-31: two SpotBugs failures, one Java compiler warning, and three PMD rule-deprecation warnings. HTTP contracts, JSON payloads, persisted values, transactions, and authentication behaviour must remain unchanged.

## Linter evidence

The following command was run from `apps/backend` against a clean `target/` directory:

```bash
./mvnw -B -ntp clean verify
```

| Tool | Result | Concrete evidence | Planned task |
| --- | --- | --- | --- |
| Checkstyle | Pass | Zero violations. | JAVA-LINT-004 strengthens enum-member enforcement. |
| Java compiler | Warning | `CheckinServiceImplTest.java` uses unchecked or unsafe operations. | JAVA-LINT-002 |
| Tests | Pass | 213 tests; 0 failures and 0 errors. | Regression proof for all code tasks. |
| JaCoCo | Pass | Bundle line coverage threshold is met. | Preserve in final gate. |
| PMD and CPD | Pass with warnings | `DefaultLabelNotLastInSwitchStmt`, `AvoidCatchingThrowable`, and `AvoidCatchingNPE` are deprecated/being removed in PMD 8. | JAVA-LINT-003 |
| SpotBugs | Fail | Two medium-priority `EI_EXPOSE_REP2` findings. | JAVA-LINT-001 |

### Exact SpotBugs findings

1. `AccountConnectionService.java:23`: public constructor stores the injected mutable `AuthIdentityRepository` in `identityRepository`.
2. `IdentityService.java:18`: public constructor stores the injected mutable `AuthIdentityRepository` in `identityRepository`.

SpotBugs identifies the public construction boundary, not a repository method returning mutable data. `UserRepository` is injected in both constructors but is not reported. The narrow correction is to reduce constructor visibility; do not add a repository wrapper or copy a CDI proxy.

### Enum audit

All seven current Java enums already use `UPPER_SNAKE_CASE` members:

- `auth/identity/AuthProvider`: `GOOGLE`, `TELEGRAM`.
- `metrics/instrumentation/ServiceMetric`: all eleven metric identifiers.
- `model/HabitColor`, `HabitFrequency`, `HabitScheduleType`, `HabitType`, and `WeekOfMonthValue`.

Lowercase strings such as `"daily"`, `"weekly_days"`, and `"last"` are JSON conversion or persisted values, not enum identifiers. They must remain unchanged to preserve the API and existing `@Enumerated(EnumType.STRING)` rows.

## Architectural decisions

- `AccountConnectionService` and `IdentityService` remain application-scoped CDI services; `AuthIdentityRepository` and `UserRepository` remain their persistence boundary. Only the visibility of their existing injected constructor changes.
- Direct tests of these package-owned services belong in `com.sashplatonov.habbit.runner.auth.identity`. Cross-package test doubles must be replaced with Mockito mocks rather than restoring a public or test-only production constructor.
- The generic test stub must preserve `ServiceMetricsInstrumentation.measureMutation(Supplier<T>)` semantics: execute the supplied action once and return its value without raw generic types.
- The PMD cleanup preserves rule coverage. Checkstyle's existing `IllegalCatch` remains the enforcement for `java.lang.Throwable`; the obsolete PMD rule is a duplicate. A local PMD XPath rule replaces the obsolete NPE-specific rule rather than simply dropping that protection.
- Checkstyle is the one source of truth for Java enum naming. Add `EnumValueName` to the active `apps/backend/checkstyle/checkstyle.xml`; do not create a second reflection-based enum test.
- Never add `@SuppressWarnings`, `NOPMD`, SpotBugs filters, plugin exclusions, `failOnError=false`, or rule/threshold relaxation.

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | JAVA-LINT-001 | P0 | - | It is the only quality-gate failure. |
| 2 | JAVA-LINT-002 | P1 | JAVA-LINT-001 | Remove the remaining Java compiler warning while updating the identity test helpers. |
| 3 | JAVA-LINT-003 | P2 | JAVA-LINT-002 | Remove PMD 8 migration warnings while preserving rule coverage. |
| 4 | JAVA-LINT-004 | P2 | JAVA-LINT-003 | Make the requested uppercase enum rule explicit and prove final gate status. |

---

## JAVA-LINT-001: Close the two identity-service SpotBugs findings

**Status:** DONE
**Priority:** P0
**Depends on:** -

**Exact scope:**

Change the public CDI constructors reported by SpotBugs to package-private. Keep direct production construction unavailable outside `auth.identity`, while retaining CDI constructor injection. Align identity-service tests with their declared package and remove cross-package test subclasses that would otherwise require public constructor access.

**Files:**

- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/AccountConnectionService.java`: constructor at lines 22-25.
- Modify `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/IdentityService.java`: constructor at lines 17-20.
- Move `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/AccountConnectionServiceTest.java` to `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/identity/AccountConnectionServiceTest.java`; its declared package is already `auth.identity`.
- Move `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/IdentityServiceTest.java` to `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/identity/IdentityServiceTest.java`; its declared package is already `auth.identity`.
- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/TelegramSessionServiceTest.java`.
- Delete `apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth/TestIdentityService.java`.
- Delete `apps/backend/src/test/java/com/sashplatonov/habbit/runner/support/RecordingIdentityService.java`; repository search shows no consumer.

**Goal:**

SpotBugs reports no `EI_EXPOSE_REP2` finding for either service, while account-link and Telegram-session behaviour remain the same.

### Outcome

The two services expose one explicit CDI constructor only to their package, and unit tests no longer widen the production API through inheritance.

### Architectural decision

CDI supports a package-private `@Inject` constructor. Tests already declare `auth.identity` for the two direct service tests, so moving their source files is a structural correction, not a behavioural change. `TelegramSessionServiceTest` needs only a configured `IdentityService.resolveTelegram(...)`; Mockito supplies that seam without a subclass or repository mocks.

### Required changes

1. Remove `public` from the two `@Inject` constructors and retain the same two repository parameters and final-field assignments.
2. Move the two identity test source files to the directory matching their existing package declarations; do not alter their account-detach, identity-resolution, and repository-verification assertions.
3. In `TelegramSessionServiceTest`, replace `new TestIdentityService(mock(AuthIdentityRepository.class), mock(UserRepository.class))` with a Mockito `IdentityService` mock. Stub `resolveTelegram("42", "@alice")` to return `new TelegramIdentityResolution("telegram-user", false)` before building `TelegramSessionService`.
4. Delete both unused/cross-package `IdentityService` subclasses after the test no longer needs them.
5. Do not change `AccountConnectionService.connections`, `detach`, `IdentityService.resolveTelegram`, transaction annotations, repository methods, exception types, or response DTOs.

### Out of scope

- Adding repository access interfaces, wrappers, defensive copies, or another production constructor.
- Changing `AuthIdentityRepository`, `UserRepository`, database entities, migrations, or resource routes.
- SpotBugs filters, annotations, or any suppression.

### Acceptance criteria

- Both affected constructors are package-private and remain annotated `@Inject`.
- `AccountConnectionServiceTest` still proves connection details, successful Google/Telegram detach, last-provider conflict, and absent-provider conflict.
- `IdentityServiceTest` still proves existing Telegram identity resolution and first-time user/identity persistence.
- `TelegramSessionServiceTest` still rejects invalid Telegram users and issues the unchanged token/session fields for user `telegram-user`.
- `./mvnw -B -ntp verify` completes with `Total bugs: 0` from SpotBugs and no suppression/configuration workaround.

### Targeted validation

```bash
cd apps/backend && ./mvnw -B -ntp test -Dtest='AccountConnectionServiceTest,IdentityServiceTest,TelegramSessionServiceTest' && ./mvnw -B -ntp verify
```

### Commit

```bash
git add apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/AccountConnectionService.java apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/IdentityService.java apps/backend/src/test/java/com/sashplatonov/habbit/runner/auth apps/backend/src/test/java/com/sashplatonov/habbit/runner/support/RecordingIdentityService.java
git commit -m "fix(quality): close identity repository exposure findings"
```

---

## JAVA-LINT-002: Remove the raw generic Supplier matcher warning

**Status:** DONE
**Priority:** P1
**Depends on:** JAVA-LINT-001

**Exact scope:**

Fix the sole Java compiler warning in `CheckinServiceImplTest`. The raw `any(Supplier.class)` matcher at line 51 erases the type parameter for the generic `measureMutation(Supplier<T>)` method.

**Files:**

- Modify `apps/backend/src/test/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImplTest.java`: `stubMetricsToRunAction` at lines 50-53.

**Goal:**

Test compilation has no unchecked-operation warning and the metrics mock still executes every supplied mutation exactly once.

### Outcome

The test double follows the production generic contract instead of hiding an unchecked conversion behind a raw `Supplier.class` matcher.

### Architectural decision

Use a typed Mockito matcher and a typed invocation argument. Keep the production overloads (`Supplier<T>` and `Runnable`) unchanged; the typed `Supplier<Object>` matcher selects the generic overload and the answer returns its `get()` result.

### Required changes

1. Replace `when(metrics.measureMutation(any(Supplier.class))).thenAnswer(...)` with a `doAnswer(...).when(metrics).measureMutation(ArgumentMatchers.<Supplier<Object>>any())` stub.
2. Obtain the answer argument through `invocation.<Supplier<Object>>getArgument(0).get()` so no raw `Supplier` cast remains.
3. Keep the test's existing upsert and delete assertions; do not suppress compiler warnings or change production instrumentation.

### Out of scope

- Altering `ServiceMetricsInstrumentation.measureMutation` overloads.
- Replacing the mock with a real registry or changing metrics timing behaviour.
- Changes outside this test file.

### Acceptance criteria

- `CheckinServiceImplTest.java` contains no raw `Supplier.class` matcher and no unchecked cast.
- The test continues to exercise both `OperationResult<CheckinResponseDto>` upsert and `OperationResult<Void>` delete suppliers.
- A clean test compilation no longer emits the `uses unchecked or unsafe operations` warning for this file.
- All 213 unit tests pass.

### Targeted validation

```bash
cd apps/backend && ./mvnw -B -ntp clean test -Dtest=CheckinServiceImplTest && ./mvnw -B -ntp test
```

### Commit

```bash
git add apps/backend/src/test/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImplTest.java
git commit -m "test(checkin): type metrics mutation stub"
```

---

## JAVA-LINT-003: Migrate deprecated PMD rule references without losing coverage

**Status:** DONE
**Priority:** P2
**Depends on:** JAVA-LINT-002

**Exact scope:**

Remove the three PMD 7.26 warnings emitted by the active ruleset. This is a ruleset migration, not an exclusion: the resulting ruleset must preserve the intended checks and produce no deprecation warning in the clean Maven quality run.

**Files:**

- Modify `apps/backend/pmd/ruleset.xml`: lines 36, 190, and 191.
- Inspect `apps/backend/checkstyle/checkstyle.xml`: `IllegalCatch` rule, which already rejects `java.lang.Throwable`.
- Search anchors: `catch (Throwable` and `catch (NullPointerException` under `apps/backend/src/main/java`; the current search is empty.

**Goal:**

PMD executes without using rule names scheduled for removal in PMD 8, while direct catches of `Throwable` and `NullPointerException` remain forbidden.

### Outcome

The quality rules are forward-compatible with PMD 8 and retain the same safety intent.

### Architectural decision

Replace `DefaultLabelNotLastInSwitchStmt` with PMD's advertised `DefaultLabelNotLastInSwitch`. Remove the deprecated PMD `AvoidCatchingThrowable` because the active Checkstyle `IllegalCatch` rule already provides the same `java.lang.Throwable` protection. Replace deprecated `AvoidCatchingNPE` with a named local PMD XPath rule that matches a `CatchClause` whose formal parameter uses `NullPointerException`; this is an equivalent rule replacement, not an exemption.

### Required changes

1. Change the default-label PMD reference to `category/java/bestpractices.xml/DefaultLabelNotLastInSwitch`.
2. Remove only the duplicate deprecated `AvoidCatchingThrowable` PMD reference; retain Checkstyle's `IllegalCatch` configuration unchanged.
3. Replace `AvoidCatchingNPE` with a local named XPath rule (for example, `AvoidCatchingNullPointerException`) that selects `//CatchClause[FormalParameter//ClassType[@SimpleName = 'NullPointerException']]`, gives an actionable message, and keeps priority 2 or stricter.
4. Verify that `src/main/java` has no direct `catch (Throwable ...)` or `catch (NullPointerException ...)`; if a future violation appears, refactor the exception flow instead of changing the rule.
5. Do not remove any unrelated PMD rule or lower a priority/threshold.

### Out of scope

- Updating the PMD dependency version.
- Suppressions, excludes, `failOnError=false`, or disabling PMD.
- Production code changes where the current scan has no catch violation.

### Acceptance criteria

- PMD output contains none of `DefaultLabelNotLastInSwitchStmt`, `AvoidCatchingThrowable`, `AvoidCatchingNPE`, or `scheduled for removal`.
- The ruleset still rejects a direct `Throwable` catch through Checkstyle and a direct `NullPointerException` catch through the replacement PMD rule.
- PMD and CPD pass with no code violations.

### Targeted validation

```bash
cd apps/backend && ./mvnw -B -ntp pmd:check pmd:cpd-check && ./mvnw -B -ntp validate
```

### Commit

```bash
git add apps/backend/pmd/ruleset.xml
git commit -m "chore(quality): migrate deprecated PMD rules"
```

---

## JAVA-LINT-004: Explicitly enforce uppercase Java enum member names

**Status:** TODO
**Priority:** P2
**Depends on:** JAVA-LINT-003

**Exact scope:**

Make the requested enum naming convention explicit in the active Checkstyle configuration and audit every existing backend enum. The audit has already found no current lowercase or mixed-case member, so this task must not invent Java renames or alter external lowercase values.

**Files:**

- Modify `apps/backend/checkstyle/checkstyle.xml`: add `EnumValueName` alongside existing naming checks.
- Inspect `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/identity/AuthProvider.java`.
- Inspect `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/instrumentation/ServiceMetric.java`.
- Inspect `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/HabitColor.java`, `HabitFrequency.java`, `HabitScheduleType.java`, `HabitType.java`, and `WeekOfMonthValue.java`.

**Goal:**

Every Java enum member is and remains `UPPER_SNAKE_CASE`; JSON and database values retain their current format.

### Outcome

A future lower/mixed-case enum constant fails Checkstyle immediately, while current API and persistence values remain backward-compatible.

### Architectural decision

Add Checkstyle `EnumValueName` with the format `^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$`. The existing Java identifiers already comply. Values returned by `@JsonValue`/accepted by `@JsonCreator`, and values stored by JPA `EnumType.STRING`, are independent external contracts and must not be uppercased.

### Required changes

1. Add the active `EnumValueName` module using the specified `UPPER_SNAKE_CASE` format.
2. Audit the seven listed enum declarations. If an identifier violates the format after future source changes, rename the Java member and all Java references in this task's commit.
3. Do not rename current lowercase token strings; if a future Java member rename could affect a conversion method, add or update the existing focused enum conversion test instead.
4. Keep `ConstantName` in place; `EnumValueName` makes the enum-specific intent unambiguous rather than replacing generic constant checks.

### Out of scope

- Renaming `"daily"`, `"weekly_days"`, `"last"`, colour tokens, metric names, or database rows.
- Introducing a duplicate reflection-based test for a Checkstyle responsibility.
- Changing entity mappings or Flyway migrations.

### Acceptance criteria

- The active `apps/backend/checkstyle/checkstyle.xml` explicitly contains `EnumValueName` with the requested format.
- All current enum declarations pass the new rule without source renames.
- Existing JSON and JPA enum conversion tests pass unchanged.
- `./mvnw -B -ntp validate` reports zero Checkstyle violations.

### Targeted validation

```bash
cd apps/backend && ./mvnw -B -ntp validate && ./mvnw -B -ntp test -Dtest='AuthModelEntityTest,HabitEntityTest'
```

### Commit

```bash
git add apps/backend/checkstyle/checkstyle.xml
git commit -m "chore(quality): enforce uppercase enum constants"
```

## Final handoff

After all four task commits, run the complete local backend gate and record its outcome separately from remote CI:

```bash
cd apps/backend && ./mvnw -B -ntp clean verify
cd ../.. && git diff --check
```

The expected local result is zero Checkstyle violations, no Java compiler unchecked warning, no PMD rule-deprecation warning or code violation, zero SpotBugs bugs, and all unit tests passing. A green local result is not evidence of a green GitHub Actions run.

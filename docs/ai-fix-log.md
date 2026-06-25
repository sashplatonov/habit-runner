# AI Fix Log

## 2026-05-09
- Restored the stats page UI and behavior after the recent refactor split.
- Brought back the lost charts, weekday breakdown, habit ranking, investment panel, and activity heatmap wiring.
- Fixed the `WEEKDAY_NAMES` crash and the broken habit list markup so the page renders again end to end.
- Verification: `cd apps/web && npm run build`
- Risk: low. The changes are isolated to the stats page and its helper components.
- Rollback: revert the stats component/page changes in `apps/web/src/routes/app/(protected)/stats/+page.svelte` and `apps/web/src/lib/components/stats/*`.

## 2026-06-25
- Raised the habit description limit to 10000 characters in the web form and sync validation DTOs.
- Verification: pending `cd apps/web && npm run build` and `cd apps/backend && ./mvnw test`.
- Risk: low. The change only affects client-side input length and backend request validation for habit descriptions.
- Rollback: restore the previous `maxlength` value in `apps/web/src/lib/components/habit-form/HabitIdentitySection.svelte` and remove the `@Size(max = 10000)` annotations from `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/dto/*.java`.

## 2026-06-25
- Reduced deploy-time VPS load for the backend image build by capping Maven/test JVM CPU usage, keeping tests in the Docker `package` step, skipping JaCoCo instrumentation only for deploy builds, and adding a cacheable Maven dependency warmup layer.
- Also sped up Quarkus integration test cleanup by replacing ORM row-by-row table cleanup with H2-native `TRUNCATE` during test teardown.
- Verification: `cd apps/backend && ./mvnw test` and `cd apps/backend && ./mvnw -B -T1 -Djacoco.skip=true -Dtest.jvm.argline.extra='-XX:ActiveProcessorCount=2 -XX:MaxRAMPercentage=70' package`
- Risk: low. Deploy builds still execute tests, but test coverage instrumentation is disabled only in the image build path to reduce CPU and memory pressure.
- Rollback: revert `apps/backend/Dockerfile`, `apps/backend/pom.xml`, and `apps/backend/src/test/java/com/sashplatonov/habbit/runner/support/AuthenticatedApiTestSupport.java` to the previous settings.

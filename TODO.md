# План оптимизации и улучшения backend в habbit-runner

## Summary

Цель плана — за 2–4 недели привести backend к более предсказуемой, тестируемой и масштабируемой форме с приоритетом на maintainability, но без потери фокуса на sync latency, DB efficiency и operational reliability.
План исходит из текущего состояния: backend уже на Quarkus 3.34.3, PMD-гейт ужесточен, базовые cursor-indexes для sync есть, observability для sync частично внедрена, но доменная логика все еще концентрируется в крупных сервисах/процессорах, а локальная верификация сейчас блокируется несовместимостью локального
JDK 17 с repo-local JVM flags для Java 25.

## Key Changes

- 1. Stabilize the backend baseline
    - Зафиксировать и задокументировать supported toolchain: Java 25 для apps/backend, repo-local .mvn/jvm.config, expected Maven/Quarkus flow.
    - Добавить явный backend readiness checklist: ./mvnw test, ./mvnw verify, ./mvnw help:effective-pom, smoke-check ключевых endpoints.
    - Отделить environment blockers от code blockers в CI и локальной диагностике, чтобы JDK mismatch не маскировал реальные регрессии.
- 2. Reshape backend by business capability
    - Разделить крупные классы auth/* и sync/* на стабильные слои: resource -> application service -> domain operation -> persistence/query layer -> mapper/codec.
    - Уменьшить orchestration inside AuthService, SyncPullProcessor, SyncPushProcessor, SyncPayloadCodec, GoogleOAuthClient; каждую ветку поведения сделать отдельным use-case class.
    - Вынести Panache queries из procedural logic в именованные query/repository компоненты, чтобы cursor logic, lookup policy и delete/update semantics тестировались изолированно.
    - Свести DTO/codec/mapper responsibilities к одному направлению: parsing отдельно, validation отдельно, entity mapping отдельно.
- 3. Harden sync as the main backend hot path
    - Пересобрать sync contract вокруг четких invariants: idempotent push, deterministic cursor pagination, bounded page size, explicit conflict semantics, predictable ordering across habits, checkins, tombstones.
    - Проверить и при необходимости изменить /sync/pull и /sync/push контракты так, чтобы сервер возвращал достаточно данных для fast local apply без лишнего follow-up roundtrip.
    - Добавить explicit sync guardrails: payload size limits, malformed cursor handling, op deduplication strategy, safe retry semantics, clear partial-failure reporting.
    - Снять N+1/full-scan риск в sync queries: подтвердить EXPLAIN-уровнем, что cursor indexes покрывают реальные ORDER BY/filter patterns; при необходимости добавить composite indexes для auth/refresh/subscription flows, а не только sync.
    - Пересмотреть delete/tombstone lifecycle: retention policy, cleanup job, tombstone fan-out cost, влияние на pull latency.
- 4. Strengthen auth, validation, and API correctness
    - Ужесточить boundary validation для /auth/*, /notifications/*, /sync/*: null/body shape, blank values, unsupported states, stale refresh token paths.
    - Формализовать error model: единый API error envelope, classification 400/401/403/409/422/500, trace-safe messages, correlation id in every error response.
    - Разделить OAuth/session logic на state issuance, callback verification, token issuance, refresh/revoke lifecycle; исключить implicit coupling через shared helper state.
    - Проверить storage/security contracts: refresh token rotation/reuse policy, OAuth state cleanup, notification subscription uniqueness per user+endpoint, auditability of auth events.
- 5. Make observability actionable, not decorative
    - Довести sync instrumentation до actionable уровня: отдельные meters/timers для pull, push, conflict rate, page size, per-entity counts, slow-query threshold breaches.
    - Добавить structured logs по доменным событиям, а не по низкоуровневым шагам: sync_pull_completed, sync_push_conflicts, auth_refresh_rejected, oauth_callback_failed.
    - Ввести backend SLO-style thresholds для sync/auth and emit warn/error only on meaningful breaches, чтобы логи не зашумлялись.
    - Оставить Server-Timing и correlation path, но описать их как supported contract для frontend diagnostics.
- 6. Raise backend test quality to match the refactor
    - Сместить покрытие от coverage-only toward behavior coverage: cursor pagination, conflict resolution, idempotent replay, malformed cursor/token handling, OAuth state expiry, refresh revoke paths.
    - Добавить integration tests на реальные DB semantics для sync queries и transactional boundaries, а не только unit coverage around helpers/codecs.
    - Зафиксировать acceptance matrix: auth happy/error paths, sync pull with and without cursor, push conflict path, tombstone deletion path, notifications subscribe/unsubscribe edge cases.
    - После рефакторинга держать mvn verify как mandatory gate; PMD thresholds не ослаблять без явного архитектурного основания.

## Public APIs / Interfaces / Types

- Likely API changes
    - /sync/pull и /sync/push: возможно уточнение DTO полей, cursor metadata, conflict payload shape, limits/error responses.
    - /auth/refresh и /auth/logout: возможно уточнение token lifecycle semantics и error codes.
    - /notifications/subscribe и /notifications/unsubscribe: возможно ужесточение uniqueness/ownership semantics.
- Likely schema changes
    - Новые/уточненные indexes под реальные auth/sync queries.
    - Потенциальные cleanup-support fields/tables для refresh token rotation, OAuth state retention, tombstone retention.
    - Если retention будет формализован, возможна scheduler-driven cleanup policy.
- Non-goal by default
    - Полный переход на новый persistence stack или wholesale framework migration не входит в этот план.

## Delivery Sequence

- Phase 1 — Baseline and diagnostics
    - Поднять toolchain contract, восстановить локальную/CI верификацию, собрать query inventory, снять API/error/transaction map.
- Phase 2 — Sync and persistence core
    - Рефактор sync layers, закрыть pagination/conflict/idempotency gaps, подтвердить indexes и hot queries.
- Phase 3 — Auth and API correctness
    - Разделить auth use-cases, унифицировать validation/error model, усилить token/OAuth lifecycle.
- Phase 4 — Observability and cleanup
    - Довести metrics/logging, описать supported diagnostics contract, вычистить остаточную complexity/duplication.
- Phase 5 — Final hardening
    - Прогнать full verify, integration suite, DB query review, docs/runbook update по backend contract.

## Test Plan

- ./mvnw test и ./mvnw verify на Java 25.
- Integration tests for:
    - sync cursor pagination with deterministic ordering;
    - sync push idempotent replay;
    - conflict generation and response shape;
    - tombstone pull/delete lifecycle;
    - refresh token revoke/reuse rejection;
    - OAuth expired/invalid state;
    - notification subscribe ownership/unsubscribe semantics.
- Query validation:
    - EXPLAIN ANALYZE for /sync/pull query patterns and top auth lookups.
- Contract validation:
    - smoke requests against GET /sync/pull, POST /sync/push, POST /auth/refresh, PUT /auth/preferences, POST /notifications/subscribe.

## Acceptance Criteria

- Sync hot path измерим по фазам и не зависит от неявных fallback semantics.
- Крупные backend classes разбиты так, что orchestration, validation, persistence и mapping тестируются отдельно.
- Все публичные error responses и status codes предсказуемы и единообразны.
- DB indexes подтверждены под реальные query patterns, а не “на всякий случай”.
- mvn verify стабильно проходит в поддерживаемом Java 25 окружении без ослабления PMD quality gate.

## Assumptions

- Допускаются API/schema изменения, если они rollout-safe и сопровождаются миграцией/обновлением shared contracts.
- Главный backend hotspot — sync; именно он должен идти первым после toolchain stabilization.
- Текущий локальный блокер верификации — не код, а среда: у меня здесь java 17, а backend ожидает Java 25 flags/behavior.
- План не включает frontend refactor, кроме обязательной синхронизации shared DTO/contracts, если backend API будет изменен.
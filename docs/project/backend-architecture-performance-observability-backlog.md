# Бэклог архитектуры, производительности и observability для Java backend

## Контекст

Этот документ фиксирует задачи для `apps/backend` по пяти направлениям:

1. улучшение структуры проекта и пакетной организации;
2. оптимизация скорости и потребления RAM;
3. оптимизация работы с PostgreSQL;
4. улучшение observability;
5. добавление бизнес-метрик для New Relic dashboard.

Текущее состояние backend:

- feature-пакеты (`auth`, `habit`, `checkin`, `notification`) смешаны с общими `model` и `repository`;
- `apps/backend/src/main/resources/application.properties` уже включает JSON-логи, management interface и Micrometer Prometheus binder;
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/ObservabilityConfig.java` регистрирует несколько бизнес-метрик, но метрики не оформлены как полноценный service-level контракт;
- каталоги `apps/backend/src/main/java/com/sashplatonov/habbit/runner/config`, `health`, `mutation` сейчас не оформлены как полноценные модули и требуют либо наполнения, либо явного упрощения структуры.

## Ограничение текущего этапа

На время этого рефакторинга тесты **не проверяем**.

- Не считаем обязательной проверкой `cd apps/backend && ./mvnw test`.
- Не считаем обязательной проверкой `cd apps/backend && ./mvnw verify`.
- Папка `apps/backend/src/test/java` в этом бэклоге не является источником задач.
- Критерии проверки ниже ориентированы на code review, анализ структуры, ручную проверку HTTP/API-поведения, SQL `EXPLAIN ANALYZE`, логи и метрики.

## Приоритеты

- `P0` — структурные изменения, без которых дальше будет накапливаться технический долг.
- `P1` — улучшения hot path, БД и observability, которые дают прикладную пользу без смены продуктового контракта.
- `P2` — расширение метрик, dashboard и операционной документации после стабилизации структуры.

## 1. Структура проекта и пакетная организация

### [x] P0-1. Пересобрать backend в предметно-смысловые модули

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/**`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/**`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/**`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/**`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/**`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/**`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/**`

Архитектурное решение:

- Перейти от гибридной структуры к модульной: `feature/resource`, `feature/service`, `feature/repository`, `feature/model`, `feature/dto`.
- Оставить в общих пакетах только реально shared-компоненты: HTTP/API infrastructure, trace/MDC, security filters, общие базовые persistence-абстракции.
- Сущности и репозитории переносить ближе к owning feature, чтобы убрать разрыв между domain-кодом и persistence-кодом.

Критерии проверки:

- Для каждого feature-пакета видна полная вертикаль `resource -> service -> repository/model`.
- В `model` и `repository` не остаются файлы, принадлежащие только одному feature-модулю.
- Новый package map можно объяснить без обращения к скрытым знаниям о проекте.
- Файлы `auth`, `habit`, `checkin` и `notification` разнесены по подпапкам по смыслу: `resource`, `service`, `client`, `security`, `config`, `support`, `access`.

### [x] P0-2. Выделить shared infrastructure отдельно от domain-кода

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/RequestTraceFilter.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/GlobalExceptionMapper.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/ConstraintViolationExceptionMapper.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/SecurityHeadersFilter.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/ResponseHeaders.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/ErrorResponse.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/OperationResult.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/OperationSuccess.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/OperationFailure.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/http/UnknownStatus.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/persistence/AuditedEntityBase.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/infrastructure/persistence/UuidAuditedEntityBase.java`

Архитектурное решение:

- Вынести общие HTTP-фильтры, error mapping и trace propagation в отдельный слой `infrastructure/http` или `common/api`.
- Базовые audited entity и shared value types держать в `common/persistence` или `shared/model`, чтобы они не смешивались с feature entity.
- Не переносить feature-specific классы в shared только ради “красоты”.

Критерии проверки:

- Shared package содержит только повторно используемые инфраструктурные элементы.
- Feature-пакеты больше не зависят от “свалки” общих классов.
- Новые зависимости между пакетами идут сверху вниз, без циклических ссылок.
- Shared HTTP-контур физически отделён от feature-пакетов, а базовые audit-типы вынесены из `model/` в `infrastructure/persistence/`.

### [x] P1-3. Декомпозировать перегруженный `auth` модуль

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/AuthService.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/GoogleOAuthClient.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/AuthResource.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/AuthThemeResource.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/PreferencesService.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/RefreshTokenService.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/UserService.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/dto/**`

Архитектурное решение:

- Разбить `auth` минимум на подпакеты `resource`, `service`, `client`, `security`, `dto`, `repository-access`.
- OAuth outbound client и token lifecycle выделить как отдельные service/client responsibilities.
- Сохранить публичный HTTP-контракт, но убрать из `AuthService` роль “большого фасада на всё”.

Критерии проверки:

- OAuth, refresh-token lifecycle, user lookup и preferences живут в отдельных смысловых зонах.
- В одном классе не смешаны HTTP orchestration, persistence access и outbound HTTP.
- Названия пакетов и файлов отражают ответственность без чтения тела метода.
- `auth` физически разрезан на `access`, `client`, `config`, `resource`, `security`, `service` и `support`, а поддерживающие тесты смотрят на новые пакеты.

## 2. Оптимизация скорости и RAM

### [x] P1-4. Убрать дублирование defaulting и version/timestamp логики из hot path сервисов

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/service/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/service/CheckinServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/support/HabitMutationSupport.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/support/CheckinMutationSupport.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/HabitEntity.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/CheckinEntity.java`

Архитектурное решение:

- Вынести правила нормализации и touch/version update в отдельные domain-support компоненты уровня feature.
- Не держать почти одинаковые ветки `applyCreateDefaults` и `applyUpdatedDefaults` внутри service-класса.
- Сконцентрировать изменения audit/version в одном месте, чтобы снизить риск расхождения поведения.

Критерии проверки:

- В `HabitServiceImpl` и `CheckinServiceImpl` уменьшается объём условной логики, не относящейся к orchestration.
- Правила defaults и version increment описаны один раз на feature.
- После рефакторинга нет дублирующихся блоков с одинаковыми полями и значениями по умолчанию.
- Во время рефакторинга тесты не проверяются, только основной compile/packaging gate.

### [x] P1-5. Перевести list/sync hot path на bounded чтение и более узкие выборки

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/HabitRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/CheckinRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/resource/HabitResource.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/resource/CheckinResource.java`

Архитектурное решение:

- Для списочных сценариев использовать bounded page-size контракт как основной путь, а sync сценарии оставить на явном cursor/pagination API.
- Убрать unbounded `findAll...` как рабочий hot path и оставить его только как bounded-обёртку для совместимости.
- Зафиксировать лимит списка на уровне репозитория, чтобы поведение было очевидно без чтения сервиса.

Критерии проверки:

- В коде нет пользовательских чтений без лимита для потенциально растущих коллекций.
- Репозитории явно различают list API, sync API и точечные lookup-операции.
- Для list API и sync API можно назвать лимит, порядок сортировки и курсор.
- Во время рефакторинга тесты не проверяются, только основной compile/validate gate.

### [ ] P2-6. Снизить лишние аллокации и лог-шум в request path

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/GoogleOAuthClient.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImpl.java`

Архитектурное решение:

- Зафиксировать статические, переиспользуемые значения как `private static final`, где это оправдано hot path.
- Убрать шумные `info`-логи для часто вызываемых операций там, где полезнее `debug` плюс бизнес-метрики.
- Для outbound HTTP и push flow логировать только диагностически ценные события и деградации.

Критерии проверки:

- В request path не создаются повторно одинаковые вспомогательные объекты без необходимости.
- Логи по массовым операциям не превращаются в основной источник нагрузки.
- Для production troubleshooting сохраняются события ошибок, slow-path и бизнес-важные переходы.

## 3. Оптимизация работы с БД

### [ ] P1-7. Пересмотреть индексы под реальные query patterns backend

Пути:

- `apps/backend/src/main/resources/db/migration/V2__add_sync_cursor_indexes.sql`
- `apps/backend/src/main/resources/db/migration/V3__add_entity_audit_timestamps.sql`
- `apps/backend/src/main/resources/db/migration/V5__normalize_habit_schedule_storage.sql`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/HabitRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/CheckinRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/PushSubscriptionRepository.java`

Архитектурное решение:

- Сначала собрать список реальных `WHERE` + `ORDER BY` комбинаций из репозиториев, потом добавлять только подтверждённые composite indexes.
- Отдельно проверить уникальность и lookup path для `checkin(habit_id, user_id, date)` и `push_subscription(endpoint)`.
- Новые индексы оформлять только новой миграцией, без переписывания старых.

Критерии проверки:

- Для каждого нового индекса есть конкретный repository/query consumer.
- `EXPLAIN ANALYZE` показывает использование индекса на hot query, а не sequential scan без причины.
- Нет индексов “на всякий случай”, которые не соответствуют реальным запросам.

### [ ] P1-8. Упростить repository contracts и убрать лишние round-trip операции

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/HabitRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/CheckinRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/PushSubscriptionRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java`

Архитектурное решение:

- Перевести service-код на repository methods, которые отражают операцию целиком: existence check, upsert lookup, targeted delete.
- Сократить цепочки вида “сначала find, потом delete/update”, если можно безопасно свернуть их в более явный persistence contract.
- Не переносить бизнес-правила в repository, но убрать из service лишние технические обходы.

Критерии проверки:

- Количество round-trip к БД для базовых CRUD/sync операций уменьшается или как минимум не растёт.
- Repository API становится ближе к use case, а не к низкоуровневому набору случайных методов.
- В service-слое не остаются очевидные повторные чтения одной и той же записи без необходимости.

### [ ] P2-9. Подготовить DB access к росту данных по пользователю

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/HabitRepository.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/CheckinRepository.java`
- `apps/backend/src/main/resources/application.properties`
- `apps/backend/README.md`

Архитектурное решение:

- Зафиксировать в backend явный contract по page size, cursor semantics и pool tuning под синхронизацию.
- После стабилизации запросов проверить настройки `agroal` pool size, acquisition timeout и idle cleanup, потому что сейчас datasource работает почти на дефолтах.
- Документировать operational лимиты рядом с кодом и runtime docs.

Критерии проверки:

- В конфиге появляются явные значения пула и timeouts, если нагрузочный анализ подтвердит необходимость.
- README/backend docs описывают cursor-based ограничения и ожидания по объёму данных.
- Нет неявной зависимости от дефолтов пула для production-нагрузки.

## 4. Улучшение observability

### [ ] P1-10. Ввести полноценный пакет health/readiness вместо пустого каркаса

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/health/`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/AuthConfig.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationConfig.java`
- `apps/backend/src/main/resources/application.properties`

Архитектурное решение:

- Пакет `health` должен либо содержать реальные lightweight readiness checks, либо быть убран до момента внедрения.
- Не дублировать database connectivity, так как её уже покрывает Quarkus/Agroal health.
- Добавить проверки только для критичных runtime prerequisites: например, корректность обязательной auth-конфигурации и readiness push-конфигурации там, где это реально влияет на доступность API.

Критерии проверки:

- Пустой пакет `health` либо заполнен рабочими checks, либо исключён из структуры.
- Каждый custom health check быстрый, без тяжёлых запросов и побочных эффектов.
- `/q/health/ready` отражает реальные зависимости backend, а не декоративные статусы.

### [ ] P1-11. Довести trace/log correlation до полного request и outbound flow

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/api/RequestTraceFilter.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/GoogleOAuthClient.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/AuthService.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java`
- `apps/backend/src/main/resources/application.properties`

Архитектурное решение:

- Сделать `traceId` обязательной корреляцией не только для inbound логов, но и для outbound HTTP/slow path событий.
- В `GoogleOAuthClient` передавать correlation headers и единообразно логировать этап, latency и outcome.
- Стандартизировать именование лог-полей для userId, habitId, endpoint, provider, operation.

Критерии проверки:

- По одной проблемной операции можно собрать цельную цепочку логов по `traceId`.
- Логи outbound OAuth вызовов содержат единый набор полей и latency.
- В JSON-логах нет смешения форматов для одинаковых business events.

### [ ] P2-12. Свести observability-документацию к одному актуальному backend contract

Пути:

- `docs/monitoring/newrelic.md`
- `docs/monitoring/grafana-cloud.md`
- `apps/backend/README.md`
- `docs/README.md`

Архитектурное решение:

- Описать New Relic как primary path, а Prometheus/Grafana как optional legacy path без конфликтующих инструкций.
- Вынести в документацию точный список backend метрик, health endpoints, trace/log fields и режимов включения.
- Убрать размытые формулировки, где непонятно, какой путь observability считается основным.

Критерии проверки:

- По документации видно один основной backend observability path.
- Все упомянутые env vars и endpoints совпадают с текущим runtime contract.
- Документация позволяет повторить включение observability без чтения исходников.

## 5. Метрики для New Relic dashboard

### [ ] P1-13. Перевести бизнес-метрики на отдельный service-level instrumentation слой

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/ObservabilityConfig.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/AuthService.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java`

Архитектурное решение:

- Оставить регистрацию meter definitions в одном месте, но инкапсулировать запись метрик в отдельный instrumentation/facade слой.
- Метрики навешивать на service use cases, а не на resource endpoints, чтобы метрики отражали бизнес-операции, а не только HTTP-вызовы.
- Отказаться от “примерных” счётчиков в пользу согласованного каталога метрик с владельцем и назначением.

Критерии проверки:

- Service-классы не знают детали построения `Counter`/`Timer`, а вызывают понятные методы instrumentation слоя.
- Для каждой метрики есть владелец, смысл и место использования.
- Набор метрик можно расширять без копирования meter registration по проекту.

### [ ] P1-14. Добавить минимальный набор backend KPI для New Relic dashboard

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/ObservabilityConfig.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/AuthService.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/GoogleOAuthClient.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification/NotificationServiceImpl.java`
- `docs/monitoring/newrelic.md`

Архитектурное решение:

- Добавить базовый KPI-набор:
  - `habit.created`
  - `habit.updated`
  - `habit.deleted`
  - `checkin.upserted`
  - `checkin.deleted`
  - `auth.login.success`
  - `auth.login.failure`
  - `auth.refresh.success`
  - `oauth.google.exchange.latency`
  - `oauth.google.failure`
  - `push.subscription.created`
  - `push.subscription.deleted`
- Теги ограничить стабильными измерениями: `deployment.environment`, `operation`, `outcome`, `provider`.
- Не добавлять high-cardinality tags вроде raw `userId`, `email`, `endpoint`.

Критерии проверки:

- Метрики пригодны для дешёвого dashboard aggregation без взрыва cardinality.
- По дашборду можно увидеть объём CRUD, auth-поток, деградацию OAuth и работу push subscription.
- `docs/monitoring/newrelic.md` содержит список реально экспортируемых метрик, а не только общие обещания.

### [ ] P2-15. Добавить dashboard-ready latency/error SLO view для backend use cases

Пути:

- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/ObservabilityConfig.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth/GoogleOAuthClient.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/HabitServiceImpl.java`
- `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin/CheckinServiceImpl.java`
- `docs/monitoring/newrelic.md`

Архитектурное решение:

- Отдельно измерять latency и error rate для внутренних use cases, а не надеяться только на HTTP-level telemetry.
- Для долгих операций использовать `Timer` с единым неймингом и понятными boundaries dashboard.
- Задокументировать NRQL-запросы или dashboard-блоки для top operations backend.

Критерии проверки:

- Есть понятный способ сравнить success/error rate и latency по ключевым use case.
- Dashboard можно собрать без ручного расследования имён и тегов.
- Метрики use case уровня не дублируют бесполезно стандартные HTTP/JVM графики.

## Рекомендуемый порядок исполнения

1. `P0-1`, `P0-2`, `P1-3`
2. `P1-4`, `P1-5`
3. `P1-7`, `P1-8`
4. `P1-10`, `P1-11`
5. `P1-13`, `P1-14`
6. `P2-6`, `P2-9`, `P2-12`, `P2-15`

## Что не делать в этом рефакторинге

- Не менять публичные REST contract только ради пакетной красоты.
- Не добавлять nested Java types в production/test код.
- Не решать performance-проблемы без измеримого query path или runtime symptom.
- Не вводить high-cardinality метрики для New Relic.
- Не считать тесты критерием завершения именно этого этапа: по текущему ограничению рефакторинга тесты временно не проверяем.

# Бэклог упрощения sync-архитектуры

## Цель

Убрать сложную двустороннюю sync-модель между фронтендом и backend, в которой клиент управляет `pull -> push -> apply` циклом, хранит outbox-состояние, конфликтные ретраи и часть логики консистентности.

Целевое направление:

1. Фронтенд делает простой асинхронный вызов на запись.
2. Backend быстро принимает команду, кладет ее во внутреннюю in-memory очередь и сразу возвращает `accepted`.
3. Фоновый backend worker последовательно обрабатывает команды и применяет бизнес-логику.
4. Текущий транспорт проектируется так, чтобы потом заменить in-memory очередь на внешнюю без переделки API-контракта.

## Архитектурные решения

### ADR-1. Запись отделяется от чтения

- Запись больше не идет через сложный sync-циклический протокол с `pull/push/conflicts`.
- Клиентский write-path становится асинхронным command API.
- Read-path остается отдельным: либо через существующие чтения по доменным endpoint-ам, либо через временный упрощенный механизм обновления локального состояния.

### ADR-2. Очередь скрыта за backend-портом

- Очередь не должна торчать наружу из resource-слоя.
- Нужен отдельный backend abstraction layer, например:
  - `HabitResource`
  - `HabitService`
  - `HabitServiceImpl`
  - `HabitMapper`
- Первая реализация очереди: in-memory.
- Следующая реализация: внешний broker или persistent queue без смены frontend API.

### ADR-3. Frontend не решает серверные конфликты

- Конфликты, дедупликация, повторная обработка и порядок команд должны жить на backend.
- На фронтенде остается только:
  - optimistic local update;
  - индикация `pending / accepted / failed`;
  - ручной или автоматический refresh read-модели.

### ADR-4. Миграция проходит в два этапа

- Сначала вводится новый async write-path параллельно старому `/sync`.
- Только после стабилизации удаляется старый sync-контур.
- Это снижает риск регрессий в `apps/web` и backend тестах.

## Почему текущая модель слишком дорогая

Сейчас логика распределена между несколькими слоями:

- backend sync API:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncResource.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncService.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncServiceImpl.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncPushProcessor.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncPullProcessor.java`
- frontend sync orchestration:
  - `apps/web/src/lib/sync/writeThrough.ts`
  - `apps/web/src/lib/sync/syncEngine.ts`
  - `apps/web/src/lib/api/sync.ts`
  - `apps/web/src/lib/storage/db.ts`
  - `apps/web/packages/shared/src/sync.ts`

Проблема не только в объеме кода, а в том, что консистентность и retry-политика размазаны между браузером и сервисом.

## Приоритет и оптимальная очередность

1. Зафиксировать целевой контракт async-команд и границы миграции.
2. Вынести backend queue abstraction и worker без удаления старого sync API.
3. Перевести основные write-сценарии фронтенда на новый async command flow.
4. Упростить read reconciliation и статусные состояния на фронтенде.
5. Удалить legacy sync-path только после прохождения проверок и стабилизации.

## ✅ Группа A. Целевой контракт и миграционные границы

### ✅ A1. Описать новый habit mutation API и статус операции

- Приоритет: `P0`
- Зачем: без фиксированного контракта backend и frontend начнут расходиться в реализации.
- Архитектурное решение:
  - ввести отдельные доменные endpoint-ы вместо расширения текущего `/sync/push`;
  - вернуть canonical habit payload после create/update/status/delete;
  - не возвращать generic sync envelope.
- Затрагиваемые пути:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/`
  - `apps/web/packages/shared/src/habit-api.ts`
  - `apps/web/src/types/habit-api.ts`
  - `docs/architecture/habit-mutation-api.md`
- Критерии проверки:
  - есть отдельный документированный контракт запроса и ответа;
  - видно, какие поля обязательны для create/update/status/delete;
  - зафиксировано, что habit write endpoint не вызывает legacy sync flow.

### ✅ A2. Зафиксировать миграционный периметр

- Приоритет: `P0`
- Зачем: чтобы не вернуть generic sync-path обратно после перехода на concrete DTO.
- Архитектурное решение:
  - считать старые `/sync/pull` и `/sync/push` legacy;
  - habit mutations выполнять только через `/habits` endpoint-ы;
  - удалить generic sync/command слой после перевода всех habit mutation сценариев.
- Затрагиваемые пути:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit/`
  - `apps/web/src/lib/api/habits.ts`
  - `apps/web/src/lib/stores/habits.ts`
  - `docs/architecture/habit-mutation-api.md`
- Критерии проверки:
  - в backlog и docs явно перечислены legacy sync-компоненты;
  - есть список habit mutation сценариев, которые должны быть переведены до удаления legacy;
  - нет смешивания generic sync и concrete habit REST в одном frontend flow.

## Группа B. Backend async command pipeline

### B1. Вынести новые backend типы из `sync` в отдельный command pipeline

- Приоритет: `P0`
- Зачем: новый поток не должен зависеть от старых `pull/push/conflicts` сущностей.
- Архитектурное решение:
  - создать отдельный пакет для async mutation flow;
  - разделить `resource -> service -> queue -> worker`.
- Целевые пути:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/`
  - новый пакет рядом с ним, например `apps/backend/src/main/java/com/sashplatonov/habbit/runner/mutation/`
- Критерии проверки:
  - новые команды не используют `SyncPushProcessor` и `SyncPullProcessor`;
  - resource-слой остается тонким;
  - бизнес-логика живет в service/worker слое.

### B2. Ввести queue abstraction с in-memory реализацией

- Приоритет: `P0`
- Зачем: заложить переход на внешнюю очередь без смены внешнего API.
- Архитектурное решение:
  - интерфейс очереди;
  - in-memory реализация на bounded queue;
  - отдельный worker, который вычитывает и обрабатывает команды последовательно или с контролируемым parallelism.
- Целевые пути:
  - новый backend пакет для queue/worker/service;
  - `apps/backend/src/main/resources/application.properties`
- Критерии проверки:
  - queue abstraction не завязана на конкретную in-memory реализацию;
  - есть настройки размера очереди, таймаутов и graceful degradation;
  - backend может принять команду без синхронного полного применения бизнес-изменения.

### B3. Перенести идемпотентность и дедупликацию на уровень command processing

- Приоритет: `P0`
- Зачем: фронтенд не должен повторно решать судьбу одной и той же операции.
- Архитектурное решение:
  - сохранить `commandId` как стабильный idempotency key;
  - использовать dedup-store по аналогии с текущим `sync_op_logs`, но уже для новой модели.
- Затрагиваемые пути:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/repository/SyncOpLogRepository.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/model/SyncOpLogEntity.java`
  - `apps/backend/src/main/resources/db/migration/`
- Критерии проверки:
  - повторная отправка одной команды не создает двойную запись;
  - идемпотентность проверяется backend тестом;
  - не требуется frontend-side dedup для корректности сервера.

### B4. Вынести обработчики доменных команд из sync-специфичных процессоров

- Приоритет: `P1`
- Зачем: сейчас доменная запись завязана на sync DTO и `SyncPushState`.
- Архитектурное решение:
  - выделить доменные command handlers для habit/checkin;
  - `sync`-специфичные структуры не должны быть входом для новой модели.
- Затрагиваемые пути:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/HabitSyncProcessor.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/CheckinSyncProcessor.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/HabitSyncUpsertHandler.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/CheckinSyncUpsertHandler.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/CheckinDeleteHandler.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/HabitSyncDeleteHandler.java`
- Критерии проверки:
  - новая доменная запись может вызываться без `SyncOpDto`;
  - handlers принимают явные command DTO;
  - backend тесты покрывают success/failure ветки на уровне service/worker.

## Группа C. Frontend write-path simplification

### C1. Убрать write-through sync orchestration из пользовательского потока записи

- Приоритет: `P0`
- Зачем: текущий `writeThrough.ts` делает pre-pull, push, apply и fallback, что возвращает сложность обратно на клиент.
- Архитектурное решение:
  - заменить write-through на простой async submit;
  - локальная запись и отправка команды остаются разделенными шагами;
  - backend очередь становится единственной точкой сложной обработки.
- Затрагиваемые пути:
  - `apps/web/src/lib/sync/writeThrough.ts`
  - `apps/web/src/lib/api/sync.ts`
  - `apps/web/src/lib/storage/db.ts`
- Критерии проверки:
  - пользовательская запись не делает обязательный `pull` перед отправкой;
  - write-path не ждет полного server merge;
  - код фронтенда не содержит новой версии `pull -> push -> apply` под другим именем.

### C2. Свести frontend outbox к транспортной очереди, а не к sync-движку

- Приоритет: `P1`
- Зачем: outbox может остаться как offline-буфер, но не должен оставаться центром conflict-resolution.
- Архитектурное решение:
  - оставить минимальные статусы `pending / sent / failed` или их эквивалент;
  - убрать client-side conflict orchestration и сложные retry-сценарии, не нужные при новой backend модели.
- Затрагиваемые пути:
  - `apps/web/src/lib/storage/db.ts`
  - `apps/web/packages/shared/src/sync.ts`
  - `apps/web/src/types/sync.ts`
- Критерии проверки:
  - модель outbox стала проще по полям и переходам состояний;
  - retry-логика не зависит от merge payload из backend;
  - offline-сценарий по-прежнему возможен.

### C3. Упростить sync status UI до состояния отправки и обновления

- Приоритет: `P2`
- Зачем: текущий UI/status отражает архитектурную сложность старого механизма.
- Архитектурное решение:
  - отделить статус отправки команд от статуса обновления read-модели;
  - убрать UI-термины, привязанные к `pull/push/conflicts`, если они больше не нужны пользователю.
- Затрагиваемые пути:
  - `apps/web/src/lib/components/SyncStatus.svelte`
  - `apps/web/src/lib/stores/syncEngine.ts`
  - `apps/web/src/routes/app/(protected)/+layout.svelte`
- Критерии проверки:
  - UI показывает понятные конечные статусы;
  - пользователю не нужно понимать внутренний sync-cycle;
  - после ошибки отправки есть явный путь повтора или refresh.

## Группа D. Read reconciliation и согласование состояния

### D1. Выбрать упрощенную стратегию обновления read-модели после accepted write

- Приоритет: `P0`
- Зачем: после отказа от полного sync-cycle нужен понятный механизм, как клиент увидит каноническое состояние сервера.
- Варианты решения:
  - после `accepted` делать targeted refetch измененной сущности;
  - делать debounce refresh списка/детали;
  - на первом этапе временно оставить легкий background refresh без conflict orchestration.
- Затрагиваемые пути:
  - `apps/web/src/lib/sync/syncEngine.ts`
  - `apps/web/src/lib/api/sync.ts`
  - доменные frontend API модули записи/чтения
- Критерии проверки:
  - после записи UI приходит к консистентному состоянию без полного legacy sync-cycle;
  - не требуется server payload формата `PushResponseDto` для корректного обновления экрана;
  - поведение одинаково понятно для `habit` и `checkin`.

### D2. Отделить transport acknowledgement от domain freshness

- Приоритет: `P1`
- Зачем: `accepted` не означает, что worker уже применил изменения.
- Архитектурное решение:
  - в UI и API явно различать:
    - команда принята;
    - команда обработана;
    - данные перечитаны и экран обновлен.
- Затрагиваемые пути:
  - `apps/web/src/lib/components/SyncStatus.svelte`
  - новый backend command response/status contract
- Критерии проверки:
  - в коде и UI не смешиваются `accepted` и `applied`;
  - нет ложного ощущения мгновенной серверной консистентности;
  - тесты покрывают delayed processing scenario.

## Группа E. Наблюдаемость, надежность, удаление legacy

### E1. Добавить метрики и логи для queue depth, processing latency и reject/failure

- Приоритет: `P1`
- Зачем: после переноса сложности на backend сервис должен быть наблюдаемым.
- Затрагиваемые пути:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/`
  - новый backend queue/worker пакет
- Критерии проверки:
  - доступны метрики глубины очереди и времени обработки;
  - логи позволяют понять путь команды: accepted -> processing -> applied/failed;
  - traceId проходит через новый async flow настолько, насколько это возможно для текущей реализации.

### E2. Удалить legacy sync API и связанную frontend orchestration только после миграции

- Приоритет: `P2`
- Зачем: финальное упрощение должно происходить последним шагом.
- Кандидаты на удаление:
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncResource.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncService.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncServiceImpl.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncPushProcessor.java`
  - `apps/backend/src/main/java/com/sashplatonov/habbit/runner/sync/SyncPullProcessor.java`
  - `apps/web/src/lib/sync/writeThrough.ts`
  - `apps/web/src/lib/sync/syncEngine.ts`
  - `apps/web/src/lib/api/sync.ts`
- Критерии проверки:
  - все пользовательские сценарии записи работают через новый command API;
  - нет runtime-зависимостей на `/sync/pull` и `/sync/push`;
  - документация и тесты очищены от legacy sync semantics.

## Рекомендуемый порядок реализации

1. `A1` и `A2`
2. `B1`, `B2`, `B3`
3. `D1`
4. `C1`
5. `B4`, `D2`
6. `C2`, `C3`
7. `E1`
8. `E2`

## Что проверять после каждого этапа

### Backend

- `cd apps/backend && ./mvnw test`
- `cd apps/backend && ./mvnw package -DskipTests`

### Frontend

- `cd apps/web && npm run test`
- `cd apps/web && npm run lint`
- `cd apps/web && npm run build`

### Сквозные критерии

- создание habit работает без обязательного `pull -> push -> apply` цикла;
- создание или изменение checkin не требует клиентского conflict-resolution;
- при временной недоступности backend команда не теряется и может быть отправлена повторно;
- backend принимает команду быстро, а тяжелая обработка идет вне request critical path;
- новый API-контракт не привязан к in-memory реализации очереди.

## Короткий итог по приоритетам

- Сначала надо стабилизировать контракт и backend queue abstraction.
- Потом перевести frontend write-path на асинхронную командную модель.
- Только после этого имеет смысл удалять legacy sync-контур.

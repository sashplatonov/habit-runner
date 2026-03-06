# План миграции habbit-runner в offline-first с серверной синхронизацией (с приоритетами)

## Краткое резюме

Текущее состояние: фронт на React+Vite хранит всё в localStorage через useHabits (src/hooks/useHabits.ts), backend отсутствует.
Целевое состояние: Postgres + API синка (pull/push), IndexedDB (Dexie) + outbox, PWA-кеш, устойчивый оффлайн и детерминированная синхронизация при восстановлении сети.

## Приоритеты и этапы

### P0 — Архитектурный каркас и контракт (блокер для всего остального)

1. ✅ Зафиксировать целевой стек (default):
    - Frontend: React + TypeScript + Vite + vite-plugin-pwa + Dexie.
    - Backend: NestJS + Prisma + Postgres.
    - Auth: JWT access + refresh.
2. ✅ Утвердить доменную модель и курсор синка:
    - updated_at + version для habits и checkins.
    - Удаления через tombstones (или deleted_at, но в этом плане — tombstones как default).
    - Cursor: (server_updated_at, id) для стабильного порядка.
3. ✅ Утвердить минимальный sync-контракт:
    - GET /sync/pull?since=<cursor>
    - POST /sync/push { ops:[...] }
4. ✅ Зафиксировать артефакт плана в репозитории (при реализации): docs/offline-sync-plan.md.

Критерий готовности P0: есть окончательная спецификация API/схем/конфликтов, без открытых архитектурных решений.

———

### P1 — Сервер и БД (ядро синка)

1. ✅ Развернуть backend-модуль:
    - NestJS приложение (можно в apps/api или server/).
    - Prisma schema + миграции.
2. ✅ Создать таблицы:
    - habits: id, user_id, поля привычки, updated_at, version, created_at.
    - checkins: id, habit_id, user_id, date, done, updated_at, version.
    - tombstones: id, user_id, entity, entity_id, deleted_at, version.
3. ✅ Ограничения и идемпотентность:
    - UNIQUE(user_id, habit_id, date) для check-ins (upsert).
    - Серверная валидация op.id (защита от повторной обработки).
4. ✅ Реализовать pull:
    - Возврат изменений после since по всем сущностям.
    - Стабильная сортировка + nextCursor.
5. ✅ Реализовать push:
    - Применение outbox-операций транзакционно.
    - LWW для habits по updated_at/version.
    - Идемпотентный upsert для checkins.
    - Ответ: applied, conflicts, serverTime.

Критерий готовности P1: API синка проходит интеграционные тесты и корректно обрабатывает повторы, удаления и конфликты.

———

### P2 — Локальная offline-модель на фронте

1. ✅ Ввести Dexie-слой:
    - Таблицы habits, checkins, tombstones, sync_meta, outbox.
2. ✅ Перенести чтение/запись с localStorage на репозиторий (storage abstraction):
    - habitRepo, checkinRepo, syncRepo.
3. ✅ Миграция данных:
    - One-time перенос из localStorage (habit-tracker-v1) в IndexedDB.
    - Маркер версии локальной схемы.
4. ✅ Обновить UI-поток:
    - Любое действие пользователя сначала пишет в IndexedDB.
    - В outbox добавляется операция для последующего push.

Критерий готовности P2: приложение полностью работает локально без сети и без потери данных после перезагрузки.

———

### P3 — Sync Engine (pull/apply/push) + управление конфликтами

1. ✅ Реализовать syncEngine:
    - Триггеры: старт приложения, online, ручной retry.
    - Порядок: pull -> apply -> push -> pull(confirm).
2. ✅ Обработка конфликтов:
    - habits: LWW (серверный winner, клиент получает merge-result).
    - checkins: upsert по (habit_id, date), конфликт минимален.
3. ✅ Outbox-стратегия:
    - FIFO, ретраи с backoff, дедупликация по op.id.
    - Частичный успех: удалять только applied.
4. ✅ Состояние синка в UI:
    - Индикатор: offline / syncing / synced / error.
    - Диагностика: количество операций в outbox, последняя ошибка.

Критерий готовности P3: после оффлайн-сессии данные стабильно сходятся с сервером после восстановления сети.

———

### P4 — PWA и сетевой слой

1. ✅ Подключить vite-plugin-pwa:
    - Precache shell (html/js/css/icons).
    - Runtime cache для API GET (осторожно, без кэширования mutating-запросов).
2. ✅ Service Worker стратегии:
    - App shell: StaleWhileRevalidate.
    - API pull: NetworkFirst с fallback.
3. ✅ Offline UX:
    - Явный баннер offline.
    - Очередь изменений без блокировки UI.
4. ✅ (Опционально) Background Sync:
    - Если поддерживается браузером — запуск push в фоне.

Критерий готовности P4: установка PWA, загрузка и базовая навигация работают оффлайн; синк продолжается после возвращения сети.

———

### P5 — Надёжность, безопасность, rollout

1. ✅ Auth и multi-user изоляция:
    - JWT access/refresh, user scoping во всех запросах и таблицах.
2. ✅ Наблюдаемость:
    - Метрики: latency pull/push, conflict rate, outbox depth, sync failures.
    - Логи с trace-id операции.
3. ✅ Rollout-план:
    - Этап 1: single-user beta.
    - Этап 2: ограниченный rollout.
    - Этап 3: full.
4. ✅ Backward compatibility:
    - Фича-флаг на новый sync-движок.
    - Возможность fallback на локальный режим при недоступности API.

Критерий готовности P5: контролируемый релиз без потери данных и с наблюдаемой стабильностью.

## Изменения публичных интерфейсов (API/типы)

1. GET /sync/pull?since=<cursor>
   Ответ: { habits: HabitDTO[], checkins: CheckinDTO[], tombstones: TombstoneDTO[], nextCursor: string }
2. POST /sync/push
   Запрос: { ops: SyncOpDTO[] }
   Ответ: { applied: string[], conflicts: ConflictDTO[], serverTime: string }
3. DTO/типы:
    - HabitDTO с updated_at, version.
    - CheckinDTO с date, updated_at, version.
    - TombstoneDTO с entity, entity_id, deleted_at, version.
    - SyncOpDTO: { id, type, entity, payload, clientTime }.
4. Локальные типы фронта:
    - SyncMeta (lastCursor, lastSuccessAt, lastError).
    - OutboxItem (opId, status, retryCount, nextRetryAt).

## Тесты и сценарии приёмки

1. Unit:
    - Конвертация cursor, merge/LWW, outbox-дедуп, retry/backoff.
2. Integration (API):
    - pull после since, push с повтором op.id, delete через tombstone, checkin upsert.
3. E2E (offline-first):
    - Открыть app online → уйти offline → отметить привычки → перезагрузить → вернуть сеть → данные синкнулись.
4. Конкурентный сценарий:
    - Два клиента меняют одну привычку; проверить LWW и предсказуемый итог.
5. Негативные:
    - Частичный push success, 500/timeout, просроченный JWT, повреждённый cursor.
6. Performance smoke:
    - 10k checkins, pull/push не деградирует критично, UI остаётся отзывчивым.

## Допущения и выбранные defaults

1. Default backend: NestJS + Prisma + Postgres (Neon/Supabase).
2. Default API-стиль: REST (не tRPC) для простого sync-контракта.
3. Конфликты привычек: LWW; конфликт чек-инов минимизируется уникальным ключом и upsert.
4. Удаления: отдельные tombstones (не soft delete в основных таблицах).
5. Cursor default: (server_updated_at, id) в сериализованной строке.
6. Источник истины: сервер; клиент хранит materialized snapshot + outbox.



# Промпт для GitHub Copilot Agent

Скопируй всё ниже в чат с агентом:

---

## Роль и задача

Ты — senior Java/Quarkus архитектор. Твоя задача — **полностью переписать бэкенд** этого проекта с текущего стека (NestJS + Prisma + PostgreSQL) на **Java 25 + Quarkus Native + Maven 4.x**, сохранив 100% совместимость с существующим фронтендом и sync-протоколом. Фронтенд (`packages/web`) и shared-типы (`packages/shared`) **не трогай** — они остаются на TypeScript.

---

## Фаза 0 — Разведка (выполни перед написанием кода)

1. Прочитай полностью `packages/server/src/` — все модули, сервисы, контроллеры, DTO, guards, interceptors.
2. Прочитай `packages/server/prisma/schema.prisma` — полная модель данных.
3. Прочитай `packages/shared/src/` — все DTO и типы, особенно `sync.ts` (SyncOpDto, PullResponseDto, PushRequestDto, PushResponseDto, PushConflict).
4. Прочитай `packages/web/src/lib/sync.ts` и `packages/web/src/lib/syncEngine.ts` — это клиент, с которым твой новый бэкенд должен быть полностью совместим.
5. Прочитай `packages/web/src/lib/session.ts` — auth flow (OAuth callback, refresh token).
6. Найди и прочитай все тесты в `packages/server/` (unit, e2e) — пойми что покрыто.
7. Прочитай `package.json`, `docker-compose.yml`, `.env.example` и любые CI/CD конфиги в корне.
8. **Составь и выведи мне** краткий маппинг: каждый NestJS модуль/сервис/контроллер → планируемый Quarkus-аналог (класс/пакет). Дождись моего подтверждения перед началом кодинга.

---

## Фаза 1 — Scaffold нового бэкенда

Создай новый Maven-проект в папке `packages/server-java/` (текущий `packages/server/` не удаляй — он остаётся как референс).

### Стек и версии
- **Java**: 25 (если EA недоступна — используй последнюю GA, 24+; в `pom.xml` укажи `<java.version>25</java.version>` и поправь если нужно)
- **Quarkus**: последняя стабильная версия (3.x), платформа BOM
- **Maven**: 4.x (используй Maven Wrapper — `.mvn/wrapper`; `pom.xml` с `modelVersion 4.1.0` если поддерживается, иначе `4.0.0`)
- **Сборка native**: профиль `native` с `quarkus-maven-plugin` для GraalVM native image
- **ORM**: Hibernate ORM with Panache (Active Record pattern или Repository pattern — на твой выбор, но будь консистентен)
- **БД**: PostgreSQL (через `quarkus-jdbc-postgresql` + `quarkus-hibernate-orm-panache`)
- **Миграции**: Flyway (`quarkus-flyway`) — сгенерируй начальную миграцию `V1__init.sql` из текущей Prisma-схемы
- **REST**: RESTEasy Reactive (Jakarta REST annotations)
- **JSON**: Jackson с поддержкой Java records для DTO
- **Валидация**: Hibernate Validator (`quarkus-hibernate-validator`)
- **Auth**: `quarkus-smallrye-jwt` для верификации JWT + собственная логика refresh (портируй из NestJS AuthModule)
- **Health/Metrics**: `quarkus-smallrye-health` + `quarkus-micrometer-registry-prometheus`
- **Тесты**: JUnit 5 + `@QuarkusTest` + `quarkus-junit5` + Testcontainers для PostgreSQL + REST Assured
- **Docker**: многоступенчатый `Dockerfile` — stage 1: Maven build native, stage 2: `quay.io/quarkus/quarkus-micro-image` с native binary

### Структура пакетов
```
com.habittracker
├── config/           # application.properties маппинг, CORS, etc.
├── auth/             # JWT verification, refresh, OAuth callback, guards
│   ├── AuthResource.java
│   ├── AuthService.java
│   ├── JwtUtil.java
│   └── AuthGuard.java (ContainerRequestFilter)
├── sync/             # Sync protocol — главный модуль
│   ├── SyncResource.java        # GET /sync/pull, POST /sync/push
│   ├── SyncService.java         # pull/push логика, конфликты, дедупликация
│   ├── dto/                     # PullResponse, PushRequest, PushResponse, SyncOpDto, PushConflict
│   └── entity/                  # SyncOpLog entity
├── habit/            # Habit CRUD (если есть эндпоинты помимо sync)
│   ├── HabitEntity.java
│   └── HabitRepository.java
├── checkin/          # Checkin entity
├── tombstone/        # Tombstone entity (soft deletes)
├── notification/     # Push notifications module
├── metrics/          # Custom metrics
├── prisma/           # НЕ НУЖЕН — заменяется Hibernate+Flyway
└── common/           # Shared filters, exception mappers, base entity
```

---

## Фаза 2 — Портирование модулей (порядок важен)

### 2.1 Модель данных
- Открой `schema.prisma` и создай JPA `@Entity` классы для **каждой** модели: `User`, `Habit`, `Checkin`, `Tombstone`, `SyncOpLog` и любых других.
- Сохрани **все поля, типы, индексы, уникальные ограничения, дефолты, связи** один-в-один.
- Используй `UUID` для id полей (как в Prisma).
- `createdAt`/`updatedAt` — через `@PrePersist`/`@PreUpdate` или Hibernate `@CreationTimestamp`/`@UpdateTimestamp`.
- Напиши Flyway-миграцию `V1__init.sql` которая создаёт точно такую же схему в PostgreSQL (включая индексы и constraints).

### 2.2 Sync модуль (КРИТИЧЕСКИЙ — максимальная точность)
- Портируй `sync.service.ts` → `SyncService.java` **строка за строкой**. Это ядро системы.
- **Pull**: `GET /sync/pull?since={cursor}` → возврат привычек, чекинов, tombstones изменённых после cursor, + `nextCursor` + `serverTime`. Формат ответа **должен совпадать** с `PullResponseDto` из `shared/src/sync.ts`.
- **Push**: `POST /sync/push` с телом `{ ops: SyncOpDto[] }` → применение операций в транзакции, дедупликация по `opId` через `SyncOpLog` (skipDuplicates = `INSERT ... ON CONFLICT DO NOTHING`), возврат `{ applied: string[], conflicts: PushConflict[], serverTime }`.
- **Conflict resolution**: LWW по `updatedAt` — если серверная версия новее, возвращай conflict. Портируй логику **точно** как в NestJS.
- **Транзакционность**: вся обработка push должна быть в одной `@Transactional` — если что-то падает, откатывай всё.
- **Идемпотентность**: `tryCreateLog()` → `SyncOpLog` entity с `@Table(uniqueConstraints=...)` по `opId`. При дубликате — не кидай ошибку, просто пропускай.
- **DTO**: создай Java records, **точно** повторяющие TypeScript-типы из `shared/src/sync.ts`. Имена полей в JSON **должны совпадать** (camelCase).

### 2.3 Auth модуль
- Портируй OAuth flow: эндпоинты `/auth/callback`, `/auth/refresh`, `/auth/me`.
- JWT: генерация access + refresh токенов. Верификация через `quarkus-smallrye-jwt` или ручной парсинг (как в NestJS).
- Guard: `ContainerRequestFilter` с аннотацией `@AuthGuard` (или `@RolesAllowed`) — проверяет Bearer token на защищённых эндпоинтах (`/sync/*`).
- Refresh: `POST /auth/refresh` принимает refresh token, проверяет, выдаёт новую пару. Клиент вызывает это из `session.ts` — **не ломай контракт**.

### 2.4 Остальные модули
- **Notification**: портируй как есть из NestJS.
- **Metrics**: замени NestJS метрики на Micrometer (Quarkus встроенная поддержка).
- **Health**: добавь readiness/liveness пробы.

---

## Фаза 3 — Конфигурация

Создай `src/main/resources/application.properties`:
```properties
# Database
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/habittracker}
quarkus.datasource.username=${DB_USER:postgres}
quarkus.datasource.password=${DB_PASSWORD:postgres}
quarkus.hibernate-orm.database.generation=none  # Flyway управляет схемой

# Flyway
quarkus.flyway.migrate-at-start=true

# JWT
mp.jwt.verify.publickey.location=${JWT_PUBLIC_KEY_PATH:/publicKey.pem}
mp.jwt.verify.issuer=${JWT_ISSUER:habittracker}
smallrye.jwt.sign.key.location=${JWT_PRIVATE_KEY_PATH:/privateKey.pem}

# CORS — разреши фронтенд origin
quarkus.http.cors=true
quarkus.http.cors.origins=${CORS_ORIGINS:http://localhost:5173}
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.headers=Authorization,Content-Type

# Native image
quarkus.native.additional-build-args=--initialize-at-run-time=...  # добавь если нужно

# Server
quarkus.http.port=${PORT:3000}
```

---

## Фаза 4 — Docker и CI

1. Создай `packages/server-java/Dockerfile`:
   - Multi-stage: Maven build with native profile → minimal runtime image.
   - Финальный образ на базе `quay.io/quarkus/quarkus-micro-image:2.0` или `registry.access.redhat.com/ubi8/ubi-minimal`.
2. Обнови `docker-compose.yml` в корне — замени сервис `server` на `server-java` (или сделай рядом, по аналогии).
3. Если есть CI (GitHub Actions и т.д.) — добавь job для сборки и тестирования Java-бэкенда.

---

## Фаза 5 — Тесты

1. **Unit-тесты** для `SyncService` — покрой:
   - Простой push с новыми операциями → applied.
   - Дубликат opId → не применяется повторно, не ошибка.
   - Конфликт (клиентский updatedAt < серверного) → возвращается conflict.
   - Pull с cursor=0 → все данные; pull с cursor=X → только изменённые после X.
   - Пустой push → пустой applied, нет ошибки.
2. **Integration-тесты** (`@QuarkusTest` + Testcontainers PostgreSQL):
   - Полный цикл: auth → push → pull → verify data.
   - Проверь что ответы **точно** парсятся клиентом (сравни JSON-структуру с `PullResponseDto`/`PushResponseDto`).
3. **Native-тест**: `@QuarkusIntegrationTest` для проверки работы native-образа.

---

## Жёсткие правила (НЕ НАРУШАЙ)

1. **API-контракт неизменен**: URL paths, HTTP methods, request/response JSON — **точно как в NestJS**. Фронтенд (`packages/web`) не трогаем, он должен работать без изменений.
2. **Имена полей в JSON**: camelCase, совпадают с `shared/src/sync.ts`. Если в NestJS было `serverTime` — в Java тоже `serverTime`, не `server_time`.
3. **HTTP-коды ответов**: сохрани те же коды (200, 201, 401, 409 и т.д.), что возвращает текущий NestJS-бэкенд.
4. **Не трогай**: `packages/web/`, `packages/shared/`, любые фронтенд-файлы.
5. **Не удаляй**: `packages/server/` — он остаётся как референс.
6. **Flyway миграции**: начальная `V1__init.sql` должна создавать **идентичную** схему тому, что создаёт `prisma migrate`. Сверь каждую таблицу, колонку, индекс, constraint.
7. **Native-совместимость**: все зависимости должны работать в GraalVM native image. Не используй библиотеки, несовместимые с native (проверяй Quarkus extensions — они native-ready).
8. **Java 25 features**: используй records для DTO, sealed interfaces где уместно, pattern matching, virtual threads (`quarkus.virtual-threads.enabled=true` если доступно). Пиши современный идиоматичный Java.
9. **Никаких Spring-зависимостей**: только Quarkus/MicroProfile/Jakarta EE.

---

## Порядок работы

1. Сначала выполни **Фазу 0** и покажи маппинг модулей → дождись подтверждения.
2. Затем scaffold проекта (Фаза 1).
3. Затем модель данных + Flyway (2.1).
4. Затем Sync модуль (2.2) + тесты для него.
5. Затем Auth (2.3).
6. Затем остальное (2.4).
7. Docker + конфиг (Фазы 3–4).
8. Финальные тесты (Фаза 5).
9. В конце — выведи инструкцию как запустить: `./mvnw quarkus:dev`, `./mvnw package -Pnative`, `docker-compose up`.

**Начинай с Фазы 0 — прочитай все указанные файлы и покажи маппинг.**
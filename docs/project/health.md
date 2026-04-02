# Project Health

<a name="top"></a>

## 📋 Table of Contents

- [Quality gates](#quality-gates)
- [Testing](#testing)
- [Linting](#linting)
- [Adding new habits features](#adding-new-features)

---

## ✅ Quality gates <a name="quality-gates"></a>

Run before every PR:

```bash
npm run check
```

This runs in order:
1. `npm run lint` — ESLint across all workspaces
2. `npm run build` — Turbo build: shared → server → web
3. `npm run build:server` — Java backend package build (Quarkus)
4. `npx prisma generate` — Regenerate Prisma client (in `apps/api-nest-legacy`)

Each step must pass. CI does not run automatically yet — run `npm run check` locally.

[↑ Back to top](#top)

---

## 🧪 Testing <a name="testing"></a>

**Frontend**: Vitest + @testing-library/react (18 test suites, 103 tests)

```bash
cd apps/web && npm run test
# or from root:
npm run test -w @habbit-runner/web
```

Test suites cover:
- Schedule/streak/stat calculations (`schedule.test.ts`, `habitStats.test.ts`, `completionKey.test.ts`)
- Sync engine hook (`useSyncEngine.test.tsx`)
- Sync status component (`SyncStatus.test.tsx`)
- Outbox panel — soft-delete + undo flow (`OutboxPanel.test.tsx`)
- Async state hook (`useAsyncState.test.ts`)
- Async UI state components (`AsyncStateUI.test.tsx`)
- AppLayout accessibility (`AppLayout.a11y.test.tsx`)
- Router, write-through, habitsSerialization, Dexie write-through, caching

> **Note**: `react` and `react-dom` must be installed at the workspace root for
> `@testing-library/react` (hoisted to root `node_modules`) to find its peer deps.
> They are listed in root `devDependencies` — run `npm install` if missing.

**Backend (active)**: Quarkus tests (JUnit + RestAssured).

```bash
cd apps/api-java && ./mvnw test
```

**Backend (legacy reference)**: NestJS tests still available in `apps/api-nest-legacy/test/`.

```bash
cd apps/api-nest-legacy && npm run test
# or from root:
npm run test -w @habbit-runner/server
```
[↑ Back to top](#top)

---

## 🔍 Linting <a name="linting"></a>

ESLint v10 flat-config in all packages.

```bash
npm run lint              # all workspaces
cd apps/web && npm run lint   # web only
```

Config files:
- `apps/web/eslint.config.cjs`
- `apps/api-nest-legacy/eslint.config.cjs`
- `packages/shared/eslint.config.cjs`

[↑ Back to top](#top)

---

## 🏗️ Adding new habit features <a name="adding-new-features"></a>

Checklist for adding new habit fields:

1. **Shared** (`packages/shared/src/sync.ts`) — add field to `HabitDto`
2. **Server schema** (`apps/api-java/src/main/resources/db/migration/`) — add Flyway SQL migration for new column
3. **Server sync layer** (`apps/api-java/src/main/java/com/habittracker/sync/`) — include field in pull/push serialization
4. **Client** (`apps/web/src/types/habit.ts`) — add to `Habit` type
5. **Client** (`apps/web/src/lib/storage/db.ts`) — add to Dexie entity + domain mapping
6. Run `npm run check` before opening PR

[↑ Back to top](#top)

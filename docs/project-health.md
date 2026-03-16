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
3. `npx prisma generate` — Regenerate Prisma client (in `packages/server`)

Each step must pass. CI does not run automatically yet — run `npm run check` locally.

[↑ Back to top](#top)

---

## 🧪 Testing <a name="testing"></a>

**Frontend**: Vitest

```bash
cd packages/web && npm run test
```

Tests live alongside source files (`*.test.ts`). Focus areas: schedule calculations, streak logic, date handling.

**Backend**: No automated test suite yet. Manual testing via Prisma Studio and curl.

```bash
# Open Prisma Studio (local)
cd packages/server && npx prisma studio

# Quick API health check
curl http://localhost:3000/
```

[↑ Back to top](#top)

---

## 🔍 Linting <a name="linting"></a>

ESLint v10 flat-config in all packages.

```bash
npm run lint              # all workspaces
cd packages/web && npm run lint   # web only
```

Config files:
- `packages/web/eslint.config.js`
- `packages/server/eslint.config.js`
- `packages/shared/eslint.config.js`

[↑ Back to top](#top)

---

## 🏗️ Adding new habit features <a name="adding-new-features"></a>

Checklist for adding new habit fields:

1. **Shared** (`packages/shared/src/sync.ts`) — add field to `HabitDto`
2. **Server** (`packages/server/prisma/schema.prisma`) — add column, run `npx prisma migrate dev`
3. **Server** (`sync.service.ts`) — include field in pull/push serialization
4. **Client** (`src/types/habit.ts`) — add to `Habit` type
5. **Client** (`src/lib/storage/db.ts`) — add to Dexie entity + domain mapping
6. Run `npm run check` before opening PR

[↑ Back to top](#top)

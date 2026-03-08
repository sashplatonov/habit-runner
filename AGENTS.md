<!-- Inherits global rules from /Users/sash/.ai-rules/AGENTS.md -->
# Repository Guidelines

## Project Structure & Module Organization
- Frontend app lives in `packages/web/` (React + TypeScript + Vite plus PostCSS/Tailwind configs).
- UI building blocks are in `packages/web/src/components/`, route-level screens in `packages/web/src/pages/`, reusable logic in `packages/web/src/hooks/`, and client helpers/types in `packages/web/src/lib/` and `packages/web/src/types/`.
- API lives in `packages/server/` (NestJS + Prisma). Main modules are in `packages/server/src/{auth,sync,metrics,prisma}` with DTOs under each module’s `dto/` folder.
- Database schema and seed scripts are in `packages/server/prisma/`.
- Shared DTOs and constants (sync, auth, habit helpers) live in `packages/shared/` so both packages import the same shapes.
- Operational docs and rollout notes are still in `docs/`.

## Build, Test, and Development Commands
- Install deps: `npm install` from the workspace root (`packages/*` are workspaces; no need to `cd` into individual packages).
- Local development:
  - `npm run dev` — launches all workspace `dev` scripts.
  - `npm run dev:web` — frontend-only Vite dev server (ports defined by Vite config).
  - `npm run dev:server` — backend NestJS `ts-node-dev` watch loop.
- Build/distro:
  - `npm run build` — builds shared first, then server, then web.
  - `npm run build:web` — web-only Vite production build.
  - `npm run build:server` — server-only compilation.
- Checks:
  - `npm run lint` — runs ESLint for workspaces that expose a lint script.
  - `npm run clean` — wipes `dist` outputs across packages via workspace scripts.
- Prisma/DB tasks still live inside `packages/server`:
  - `cd packages/server && npx prisma migrate dev`
  - `cd packages/server && npx prisma generate`
  - `cd packages/server && npm run seed`
  - `cd packages/server && npm run start` (production API serve after build)
- Full stack via Docker: set `DOCKER_HOST=unix:///Users/sash/.colima/default/docker.sock`, then run `docker compose up --build` (docker-compose now uses `packages/web/Dockerfile` and `packages/server/Dockerfile`).

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled for frontend and backend; keep code type-safe and avoid `any` unless justified.
- Use 2-space indentation, semicolons, and single quotes (match existing files).
- React components/pages use PascalCase filenames (for example `HabitDetail.tsx`, `AuthGate.tsx`).
- Nest modules follow `*.module.ts`, `*.controller.ts`, `*.service.ts`, and DTOs as `*.dto.ts`.
- Language policy: all code comments, logs, UI copy, docs, and other repository text must be in English; non-English text is allowed only inside dedicated i18n translation resources.

## Testing Guidelines
- No automated test runner is configured yet in the workspace; follow package-specific scripts instead.
- Minimum contribution gate: run `npm run lint && npm run build` and `cd packages/server && npm run build` before opening a PR.
- When adding tests, place them next to the feature as `*.test.ts`/`*.test.tsx` and add matching `npm test` scripts in the relevant package.

## Commit & Pull Request Guidelines
- Current history is short (`init`, `v1`, `v2 WIP`), so standardize now: use imperative, scoped commits (for example `feat(sync): add conflict timestamp handling`).
- Keep commits focused and include schema/config changes in the same commit when required.
- PRs should include: summary, changed paths, manual verification steps, env/db impacts, and screenshots for UI changes.
- Link related issue/task IDs and note follow-up work explicitly.

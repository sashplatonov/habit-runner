<!-- Inherits global rules from /Users/sash/.ai-rules/AGENTS.md -->
# Repository Guidelines

## Project Structure & Module Organization
- Frontend app lives in `apps/web/` (React + TypeScript + Vite plus PostCSS/Tailwind configs).
- UI building blocks are in `apps/web/src/components/`, route-level screens in `apps/web/src/pages/`, reusable logic in `apps/web/src/hooks/`, and client helpers/types in `apps/web/src/lib/` and `apps/web/src/types/`.
- Active API lives in `apps/api-java/` (Quarkus + Flyway + PostgreSQL).
- Legacy API reference lives in `apps/api-nest-legacy/` (NestJS + Prisma).
- Java migrations are in `apps/api-java/src/main/resources/db/migration/`; legacy Prisma schema/seed are in `apps/api-nest-legacy/prisma/`.
- Shared DTOs and constants (sync, auth, habit helpers) live in `packages/shared/` so both packages import the same shapes.
- Operational docs and rollout notes are still in `docs/`.

## Build, Test, and Development Commands
- Install deps: `npm install` from the workspace root (`apps/*` and `packages/*` are workspaces; no need to `cd` into individual packages).
- Local development:
  - `npm run dev` — launches all workspace `dev` scripts.
  - `npm run dev:web` — frontend-only Vite dev server (ports defined by Vite config).
  - `npm run dev:server` — backend Quarkus dev mode (`./mvnw quarkus:dev` in `apps/api-java`).
- Build/distro:
  - `npm run build` — builds shared first, then server, then web.
  - `npm run build:web` — web-only Vite production build.
  - `npm run build:server` — Java server build (`./mvnw package -DskipTests`).
- Checks:
  - `npm run lint` — runs ESLint for workspaces that expose a lint script.
  - `npm run check` — lint + full build + Java server build + legacy Prisma generate.
  - `npm run clean` — wipes `dist` outputs across packages via workspace scripts.
- Java backend tasks:
  - `cd apps/api-java && ./mvnw quarkus:dev`
  - `cd apps/api-java && ./mvnw package -DskipTests`
  - `cd apps/api-java && ./mvnw test`
- Legacy Prisma tasks (reference backend):
  - `cd apps/api-nest-legacy && npx prisma migrate dev`
  - `cd apps/api-nest-legacy && npx prisma generate`
  - `cd apps/api-nest-legacy && npm run seed`
- Full stack via Docker: set `DOCKER_HOST=unix:///Users/sash/.colima/default/docker.sock`, then run `docker compose up --build` (docker-compose uses `apps/web/Dockerfile` and `apps/api-java/Dockerfile`).

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled for frontend and backend; keep code type-safe and avoid `any` unless justified.
- Use 2-space indentation, semicolons, and single quotes (match existing files).
- React components/pages use PascalCase filenames (for example `HabitDetail.tsx`, `AuthGate.tsx`).
- Legacy Nest modules follow `*.module.ts`, `*.controller.ts`, `*.service.ts`, and DTOs as `*.dto.ts`.
- Habit names in UI, tooltips, previews, and analytics views must use the shared helper `apps/web/src/lib/habits/formatHabitLabel.ts` so the habit emoji is always shown together with the name.
- Language policy: all code comments, logs, UI copy, docs, and other repository text must be in English; non-English text is allowed only inside dedicated i18n translation resources.

## Testing Guidelines
- No automated test runner is configured yet in the workspace; follow package-specific scripts instead.
- Minimum contribution gate: run `npm run check` before opening a PR.
- When adding tests, place them next to the feature as `*.test.ts`/`*.test.tsx` and add matching `npm test` scripts in the relevant package.

## Commit & Pull Request Guidelines
- Current history is short (`init`, `v1`, `v2 WIP`), so standardize now: use imperative, scoped commits (for example `feat(sync): add conflict timestamp handling`).
- Keep commits focused and include schema/config changes in the same commit when required.
- PRs should include: summary, changed paths, manual verification steps, env/db impacts, and screenshots for UI changes.
- Link related issue/task IDs and note follow-up work explicitly.

## Agent Ignore Guidance
The root `.codexignore`/`.claudeignore` lists the directories that agents should skip, so keep this section aligned with those files.

- `node_modules/` both at the workspace root and under each `apps/*/node_modules/` and `packages/*/node_modules/`
- Built/dist outputs: `dist/`, `dist-ssr/`, `dist-test/`, `apps/*/dist*/`, `packages/*/dist*/`, and any `build/` artifacts
- Cache/temp layers: `.turbo/`, `.cache/`, `.vite/`, `tmp/`, `apps/*/.turbo/`, `apps/*/.cache/`, `apps/*/.vite/`, `apps/*/tmp/`, `packages/*/.turbo/`, `packages/*/.cache/`, `packages/*/.vite/`, and `packages/*/tmp/`
- Environment/secrets: `.env`, `.env.*`, `apps/*/.env*`, `packages/*/.env*`, `apps/api-nest-legacy/.env`, `secrets/`, and `backups/`
- Ignore tooling scaffolds that already dress these directories (e.g., `.claude/`, `.codex/`, `.dokploy/`) unless the task explicitly targets them.

## Communication Guidelines
- Final summaries and high-level recap bullets when responding should be written in Russian, even if other sections of the message use English for commands or file references.

<!-- Inherits global rules from /Users/sash/.ai-rules/AGENTS.md -->
# Repository Guidelines

## Project Structure & Module Organization
- Frontend app lives in `apps/web/` (React + TypeScript + Vite plus PostCSS/Tailwind configs).
- UI building blocks are in `apps/web/src/components/`, route-level screens in `apps/web/src/pages/`, reusable logic in `apps/web/src/hooks/`, and client helpers/types in `apps/web/src/lib/` and `apps/web/src/types/`.
- Active API lives in `apps/backend/` (Quarkus + Flyway + PostgreSQL).
- Java migrations are in `apps/backend/src/main/resources/db/migration/`.
- Shared DTOs and constants used by the web app live in `apps/web/packages/shared/`.
- Operational docs and rollout notes are still in `docs/`.

## Build, Test, and Development Commands
- Install frontend deps in `apps/web/` with `npm install`. There is no root `package.json` in the current checkout.
- Local development:
  - `cd apps/web && npm run dev` — frontend-only Vite dev server.
  - `cd apps/web && npm run dev:server` — backend Quarkus dev mode through the web package helper.
  - `cd apps/backend && ./mvnw quarkus:dev` — direct backend dev mode.
- Build/distro:
  - `cd apps/web && npm run build` — shared + web build.
  - `cd apps/web && npm run build:server` — Java server build via `apps/backend`.
  - `cd apps/backend && ./mvnw package -DskipTests` — direct backend build.
- Checks:
  - `cd apps/web && npm run lint` — frontend lint plus runtime-undefined guard.
  - `cd apps/web && npm run test` — frontend unit tests.
  - `cd apps/web && npm run check` — lint + web build + backend build helper.
  - `cd apps/backend && ./mvnw test` — backend tests.
- Java backend tasks:
  - `cd apps/backend && ./mvnw quarkus:dev`
  - `cd apps/backend && ./mvnw package -DskipTests`
  - `cd apps/backend && ./mvnw test`
- Full stack via Docker: set `DOCKER_HOST=unix:///Users/sash/.colima/default/docker.sock`, then run `docker compose --profile db up --build` for the bundled Postgres stack. `docker compose up --build` without the profile assumes an external DB is already available.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled for frontend and backend; keep code type-safe and avoid `any` unless justified.
- Use 2-space indentation, semicolons, and single quotes (match existing files).
- React components/pages use PascalCase filenames (for example `HabitDetail.tsx`, `AuthGate.tsx`).
- Habit names in UI, tooltips, previews, and analytics views must use the shared helper `apps/web/src/lib/habits/formatHabitLabel.ts` so the habit emoji is always shown together with the name.
- Language policy: all code comments, logs, UI copy, docs, and other repository text must be in English; non-English text is allowed only inside dedicated i18n translation resources.

## Testing Guidelines
- Frontend tests live under `apps/web/tests/unit` and run via Vitest.
- Backend tests live under `apps/backend/src/test/java` and run via Maven.
- Minimum contribution gate for mixed frontend/backend work: `cd apps/web && npm run check` plus `cd apps/backend && ./mvnw test`.
- When adding frontend tests, place them as `*.test.ts`/`*.test.tsx` under the relevant `apps/web/tests` or feature-adjacent structure.

## Commit & Pull Request Guidelines
- Current history is short (`init`, `v1`, `v2 WIP`), so standardize now: use imperative, scoped commits (for example `feat(sync): add conflict timestamp handling`).
- Keep commits focused and include schema/config changes in the same commit when required.
- PRs should include: summary, changed paths, manual verification steps, env/db impacts, and screenshots for UI changes.
- Link related issue/task IDs and note follow-up work explicitly.

## Agent Ignore Guidance
The root `.codexignore`/`.claudeignore` lists the directories that agents should skip, so keep this section aligned with those files.

- `node_modules/` both at the workspace root and under app/package directories such as `apps/web/node_modules/`
- Built/dist outputs: `dist/`, `dist-ssr/`, `dist-test/`, `build/`, `apps/*/dist*/`, `apps/web/packages/shared/dist/`, and backend `target/`
- Cache/temp layers: `.turbo/`, `.cache/`, `.vite/`, `tmp/`, `apps/*/.turbo/`, `apps/*/.cache/`, `apps/*/.vite/`, and `apps/*/tmp/`
- Environment/secrets: `.env`, `.env.*`, `apps/*/.env*`, `secrets/`, and `backups/`
- Ignore tooling scaffolds that already dress these directories (e.g., `.claude/`, `.codex/`, `.dokploy/`) unless the task explicitly targets them.

## Communication Guidelines
- Final summaries and high-level recap bullets when responding should be written in Russian, even if other sections of the message use English for commands or file references.

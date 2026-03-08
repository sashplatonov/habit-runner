<!-- Inherits global rules from /Users/sash/.ai-rules/AGENTS.md -->
# Repository Guidelines

## Project Structure & Module Organization
- Frontend app lives in `src/` (React + TypeScript + Vite).
- UI building blocks are in `src/components/`, route-level screens in `src/pages/`, reusable logic in `src/hooks/`, and client helpers/types in `src/lib/` and `src/types/`.
- API lives in `server/` (NestJS + Prisma). Main modules are in `server/src/{auth,sync,metrics,prisma}` with DTOs under each module’s `dto/` folder.
- Database schema and seed scripts are in `server/prisma/`.
- Operational docs and rollout notes are in `docs/`.

## Build, Test, and Development Commands
- Install deps:
  - `npm install`
  - `cd server && npm install`
- Frontend local dev: `npm run dev` (Vite on `localhost:5173`).
- Frontend checks: `npm run lint`, `npm run build`, `npm run preview`.
- API local dev: `cd server && npm run dev`.
- API production build/start: `cd server && npm run build && npm run start`.
- Full stack via Docker: set `DOCKER_HOST=unix:///Users/sash/.colima/default/docker.sock`, then run `docker compose up --build`.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled for frontend and backend; keep code type-safe and avoid `any` unless justified.
- Use 2-space indentation, semicolons, and single quotes (match existing files).
- React components/pages use PascalCase filenames (for example `HabitDetail.tsx`, `AuthGate.tsx`).
- Nest modules follow `*.module.ts`, `*.controller.ts`, `*.service.ts`, and DTOs as `*.dto.ts`.
- Language policy: all code comments, logs, UI copy, docs, and other repository text must be in English; non-English text is allowed only inside dedicated i18n translation resources.

## Testing Guidelines
- No automated test runner is configured yet in root or `server/package.json`.
- Minimum contribution gate: run `npm run lint && npm run build` and `cd server && npm run build` before opening a PR.
- When adding tests, place them next to the feature as `*.test.ts`/`*.test.tsx` and add matching `npm test` scripts in the relevant package.

## Commit & Pull Request Guidelines
- Current history is short (`init`, `v1`, `v2 WIP`), so standardize now: use imperative, scoped commits (for example `feat(sync): add conflict timestamp handling`).
- Keep commits focused and include schema/config changes in the same commit when required.
- PRs should include: summary, changed paths, manual verification steps, env/db impacts, and screenshots for UI changes.
- Link related issue/task IDs and note follow-up work explicitly.

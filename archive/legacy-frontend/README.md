Legacy frontend archive

This folder contains the archived React/legacy frontend source and tests moved from `apps/web` for reference during the Svelte migration.

Top-level layout mirrors original paths under `apps/web` to make it easy to look up components and pages by their previous locations.

Examples:
- `archive/legacy-frontend/apps/web/src/index.tsx` — old React entry
- `archive/legacy-frontend/apps/web/src/App.tsx` — old App shell
- `archive/legacy-frontend/apps/web/src/pages/...` — page components
- `archive/legacy-frontend/apps/web/tests/...` — unit tests that referenced React

To restore a file, use `git mv archive/legacy-frontend/<path> <original-path>` and commit.

Commit: chore(archive): move legacy React frontend to archive/legacy-frontend

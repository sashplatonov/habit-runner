#!/usr/bin/env bash
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
ARCHIVE=archive/legacy-frontend
mkdir -p "$ARCHIVE"

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Please commit or stash changes before running this script."
  exit 2
fi

# Move tracked TSX/JSX source & tests under apps/web
git ls-files | grep -E '^apps/web/(src|tests).+\.(tsx|jsx)$' | while IFS= read -r f; do
  dest="$ARCHIVE/$f"
  mkdir -p "$(dirname "$dest")"
  echo "git mv '$f' '$dest'"
  git mv "$f" "$dest"
done

# Move tracked build/dist artifacts under apps/web if present
git ls-files | grep -E '^apps/web/(build|dist)(/|$)' || true
git ls-files | grep -E '^apps/web/(build|dist)(/|$)' | while IFS= read -r f; do
  dest="$ARCHIVE/$f"
  mkdir -p "$(dirname "$dest")"
  echo "git mv '$f' '$dest'"
  git mv "$f" "$dest"
done

# Move any tracked files that contain 'legacy' in path under apps/web
git ls-files | grep -E '^apps/web/.*legacy.*' || true
git ls-files | grep -E '^apps/web/.*legacy.*' | while IFS= read -r f; do
  dest="$ARCHIVE/$f"
  mkdir -p "$(dirname "$dest")"
  echo "git mv '$f' '$dest'"
  git mv "$f" "$dest"
done

# Summary
echo "Moved legacy frontend files to $ARCHIVE (staged)."
echo "Run 'git status' to review and 'git commit -m "chore(archive): move legacy React frontend to archive/legacy-frontend"' to commit." 
exit 0

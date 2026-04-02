Moved backups into archive/backups

This folder is intended to hold historical backup snapshots. The original top-level
`backups/` was consolidated under `archive/backups/` as part of repository
structure cleanup.

If you want to remove the legacy `backups/` folder after verification, run:

  git rm -r backups && git commit -m "chore: remove legacy backups"

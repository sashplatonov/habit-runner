Moved vendor assets into third_party/vendor

Originally the repo had a top-level `vendor/` directory. For monorepo clarity these assets
live under `third_party/vendor/`.

If you need to remove the old `vendor/` directory, run:

  git rm -r vendor && git commit -m "chore: remove legacy vendor"

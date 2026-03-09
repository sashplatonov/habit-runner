#!/bin/sh
set -eu

if [ "${RUN_DB_PUSH:-true}" = "true" ]; then
  PRISMA_BIN='/app/packages/server/node_modules/.bin/prisma'
  if [ ! -x "$PRISMA_BIN" ]; then
    PRISMA_BIN='/app/node_modules/.bin/prisma'
  fi

  if [ ! -x "$PRISMA_BIN" ]; then
    echo "prisma binary not found in workspace or root node_modules" >&2
    exit 1
  fi

  "$PRISMA_BIN" db push
fi

exec "$@"

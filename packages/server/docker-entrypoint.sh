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

  # If a non-default schema is configured, tell Prisma to push into it.
  # Prisma reads the ?schema= query param from DATABASE_URL for db push.
  SCHEMA="${DEFAULT_DB_SCHEMA:-public}"
  if [ "$SCHEMA" != "public" ]; then
    if echo "${DATABASE_URL:-}" | grep -q '?'; then
      export DATABASE_URL="${DATABASE_URL}&schema=${SCHEMA}"
    else
      export DATABASE_URL="${DATABASE_URL}?schema=${SCHEMA}"
    fi
  fi

  "$PRISMA_BIN" db push
fi

exec "$@"

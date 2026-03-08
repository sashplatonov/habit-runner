#!/bin/sh
set -eu

if [ "${RUN_DB_PUSH:-true}" = "true" ]; then
  /app/node_modules/.bin/prisma db push
fi

exec "$@"

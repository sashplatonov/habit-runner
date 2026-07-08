#!/bin/sh
set -eu
# Replace placeholders with actual env var values and start nginx
if [ -z "${API_PORT:-}" ]; then
  echo "ERROR: API_PORT is not set in environment. Exiting."
  exit 1
fi
if [ -z "${CORS_ALLOW_ORIGIN:-}" ]; then
  if [ -n "${CORS_ORIGINS:-}" ]; then
    CORS_ALLOW_ORIGIN="${CORS_ORIGINS}"
    export CORS_ALLOW_ORIGIN
  else
    echo "ERROR: CORS_ALLOW_ORIGIN or CORS_ORIGINS is not set in environment. Exiting."
    exit 1
  fi
fi
sed \
  -e "s|@@API_PORT@@|${API_PORT}|g" \
  -e "s|@@CORS_ALLOW_ORIGIN@@|${CORS_ALLOW_ORIGIN}|g" \
  /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -c /etc/nginx/nginx.conf -g 'daemon off;'

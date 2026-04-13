#!/bin/sh
set -eu
# Replace placeholder with actual PORT env var and start nginx
if [ -z "${API_PORT:-}" ]; then
  echo "ERROR: API_PORT is not set in environment. Exiting."
  exit 1
fi
sed "s|@@API_PORT@@|${API_PORT}|g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'

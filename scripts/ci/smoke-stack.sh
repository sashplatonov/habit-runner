#!/usr/bin/env bash
set -Eeuo pipefail

project_name="${COMPOSE_PROJECT_NAME:-habbit-runner-smoke-${GITHUB_RUN_ID:-local}}"
compose=(docker compose --env-file .env.example --project-name "$project_name" --profile db)

cleanup() {
  "${compose[@]}" down --volumes --remove-orphans
}

trap cleanup EXIT

"${compose[@]}" config --quiet
"${compose[@]}" up --build --wait

"${compose[@]}" exec -T api wget -qO- "http://127.0.0.1:${API_PORT:-8080}/q/health/live" >/dev/null
"${compose[@]}" exec -T api wget -qO- "http://127.0.0.1:${API_PORT:-8080}/q/health/ready" >/dev/null
"${compose[@]}" exec -T web wget -qO- http://127.0.0.1/ >/dev/null
"${compose[@]}" exec -T web wget -qO- http://127.0.0.1/api/q/health/ready >/dev/null

echo "compose smoke checks passed for ${project_name}"

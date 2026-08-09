#!/usr/bin/env bash
set -Eeuo pipefail

project_name="${COMPOSE_PROJECT_NAME:-habbit-runner-smoke-${GITHUB_RUN_ID:-local}}"
compose=(docker compose --env-file .env.example --project-name "$project_name" --profile db)
diagnostics_dir="/tmp/habbit-runner-smoke-logs"

cleanup() {
  local exit_code=$?

  if (( exit_code != 0 )); then
    mkdir -p "$diagnostics_dir"
    "${compose[@]}" ps --all >"$diagnostics_dir/compose-ps.txt" 2>&1 || true
    "${compose[@]}" logs --no-color >"$diagnostics_dir/compose.log" 2>&1 || true
  fi

  "${compose[@]}" down --volumes --remove-orphans || true
  return "$exit_code"
}

trap cleanup EXIT

"${compose[@]}" config --quiet
"${compose[@]}" up --build --wait

"${compose[@]}" exec -T api wget -qO- "http://127.0.0.1:${API_PORT:-8080}/q/health/live" >/dev/null
"${compose[@]}" exec -T api wget -qO- "http://127.0.0.1:${API_PORT:-8080}/q/health/ready" >/dev/null
"${compose[@]}" exec -T web wget -qO- http://127.0.0.1/ >/dev/null
"${compose[@]}" exec -T web wget -qO- http://127.0.0.1/manifest.webmanifest >/dev/null
"${compose[@]}" exec -T web wget -qO- http://127.0.0.1/service-worker.js >/dev/null
"${compose[@]}" exec -T web wget -qO- http://127.0.0.1/api/q/health/ready >/dev/null

echo "compose smoke checks passed for ${project_name}"

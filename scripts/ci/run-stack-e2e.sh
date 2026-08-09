#!/usr/bin/env bash
set -Eeuo pipefail

project_name="${COMPOSE_PROJECT_NAME:-habbit-runner-stack-e2e-${GITHUB_RUN_ID:-local}}"
compose=(docker compose --env-file .env.example --project-name "$project_name" --profile db)
web_url="http://localhost:${WEB_PORT:-5137}"
output_dir="/tmp/${project_name}-playwright"
cookie_jar="/tmp/${project_name}-cookies.txt"
diagnostics_dir="/tmp/habbit-runner-smoke-logs"
user_id="stack-e2e-user-${RANDOM}-${RANDOM}"
email="${user_id}@example.test"
refresh_token="${user_id}-refresh"
csrf_token="${user_id}-csrf"

cleanup() {
  local exit_code=$?
  if (( exit_code != 0 )); then
    mkdir -p "$diagnostics_dir"
    "${compose[@]}" ps --all >"$diagnostics_dir/stack-e2e-compose-ps.txt" 2>&1 || true
    "${compose[@]}" logs --no-color >"$diagnostics_dir/stack-e2e-compose.log" 2>&1 || true
    if [[ -d "$output_dir" ]]; then
      rm -rf "$diagnostics_dir/stack-e2e-playwright"
      cp -R "$output_dir" "$diagnostics_dir/stack-e2e-playwright"
    fi
  fi
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$output_dir" "$cookie_jar"
  return "$exit_code"
}

trap cleanup EXIT

"${compose[@]}" config --quiet
up_args=(up --wait)
if [[ "${STACK_E2E_SKIP_BUILD:-0}" != "1" ]]; then
  up_args=(up --build --wait)
fi
"${compose[@]}" "${up_args[@]}"

token_hash="$(printf '%s' "$refresh_token" | shasum -a 256 | awk '{print $1}')"
"${compose[@]}" exec -T db psql -v ON_ERROR_STOP=1 -U "${DB_USER:-habbit}" -d "${DB_NAME:-habbit}" \
  -c "INSERT INTO users (id, email, theme) VALUES ('$user_id', '$email', 'cloud'); INSERT INTO refresh_tokens (id, \"tokenHash\", \"familyId\", \"userId\", revoked, \"expiresAt\") VALUES ('${user_id}-refresh', '$token_hash', '${user_id}-family', '$user_id', FALSE, CURRENT_TIMESTAMP + INTERVAL '1 day');" \
  >/dev/null

curl -fsS -c "$cookie_jar" -b "habbit_runner_refresh_token=$refresh_token; habbit_runner_csrf_token=$csrf_token" \
  -H "X-CSRF-Token: $csrf_token" -X POST "$web_url/api/auth/refresh" >/dev/null

access_token="$(awk '$6 == "habbit_runner_access_token" { print $7 }' "$cookie_jar")"
rotated_refresh_token="$(awk '$6 == "habbit_runner_refresh_token" { print $7 }' "$cookie_jar")"
rotated_csrf_token="$(awk '$6 == "habbit_runner_csrf_token" { print $7 }' "$cookie_jar")"
test -n "$access_token"
test -n "$rotated_refresh_token"
test -n "$rotated_csrf_token"

(
  cd apps/web
  PLAYWRIGHT_BASE_URL="$web_url" \
    PLAYWRIGHT_OUTPUT_DIR="$output_dir" \
    E2E_USER_ID="$user_id" \
    E2E_EMAIL="$email" \
    E2E_ACCESS_TOKEN="$access_token" \
    E2E_REFRESH_TOKEN="$rotated_refresh_token" \
    E2E_CSRF_TOKEN="$rotated_csrf_token" \
    npx playwright test tests/e2e/stack-contract.spec.ts --project=desktop
)

echo "real stack E2E passed for ${project_name}"

#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../../.." && pwd)"
backend_dir="$repo_root/apps/backend"
env_file="$repo_root/.env"

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    printf '%s\n' "$JAVA_HOME"
    return
  fi

  if [[ -x "/usr/libexec/java_home" ]]; then
    local macos_java_home
    macos_java_home="$(/usr/libexec/java_home -v 25 2>/dev/null || true)"
    if [[ -n "$macos_java_home" && -x "$macos_java_home/bin/java" ]]; then
      printf '%s\n' "$macos_java_home"
      return
    fi
  fi

  local sdkman_java_home="$HOME/.sdkman/candidates/java/25.0.2-amzn"
  if [[ -x "$sdkman_java_home/bin/java" ]]; then
    printf '%s\n' "$sdkman_java_home"
  fi
}

java_home="$(resolve_java_home || true)"
if [[ -n "$java_home" ]]; then
  export JAVA_HOME="$java_home"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if [[ -f "$env_file" ]]; then
  set -a
  . "$env_file"
  set +a
fi

cd "$backend_dir"
exec ./mvnw -Dquarkus.analytics.disabled=true clean quarkus:dev
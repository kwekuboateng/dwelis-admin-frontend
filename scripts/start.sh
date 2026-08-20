#!/usr/bin/env bash
# Raise the open-file limit for Metro (macOS EMFILE fallback if Watchman is down).
set -euo pipefail

ulimit -n 65536 2>/dev/null || ulimit -n 10240 2>/dev/null || ulimit -n 4096 2>/dev/null || true

if command -v watchman >/dev/null 2>&1; then
  watchman watch-del-all >/dev/null 2>&1 || true
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${EXPO_PORT:-8083}"
exec npx expo start --port "$PORT" "$@"

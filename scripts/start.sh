#!/usr/bin/env bash
# Raise file descriptor limit (macOS default 256 is too low for Metro)
ulimit -n 10240 2>/dev/null || ulimit -n 8192 2>/dev/null || true

exec npx expo start --port 8082 "$@"

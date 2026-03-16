#!/usr/bin/env bash
# EMFILE fix: run in a subshell that raises the file limit, then exec npx so Metro inherits it.
# If you still see "EMFILE: too many open files", run first in this terminal: ulimit -n 65536
(ulimit -n 65536 2>/dev/null || ulimit -n 10240 2>/dev/null || true; exec npx expo start --port 8082 "$@")

#!/usr/bin/env bash
set -euo pipefail

# Prosty linter: zabrania console.log w src/ (oprócz serwerowych logów rozruchu).
# Sprawdza także że każdy plik .js parsuje się przez `node --check`.

fail=0

if grep -rn "console\.log" src/ 2>/dev/null | grep -v "src/server.js:.*listening"; then
  echo "lint: forbidden console.log in src/" >&2
  fail=1
fi

while IFS= read -r f; do
  if ! node --check "$f" 2>/tmp/lint.err; then
    echo "lint: syntax error in $f" >&2
    cat /tmp/lint.err >&2
    fail=1
  fi
done < <(find src -name '*.js' -type f)

if [ "$fail" -ne 0 ]; then
  exit 1
fi

echo "lint OK"

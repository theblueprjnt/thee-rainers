#!/usr/bin/env bash
# PostToolUse hook — fires after every Edit / Write / NotebookEdit.
# Runs env contract check and marks smoke evidence as required.
# PostToolUse cannot block (tool already ran), so failures are surfaced as warnings.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Env contract check
if bash "$ROOT/scripts/check-env-contract.sh" 2>&1; then
  : # pass
else
  echo "WARNING: env contract violation detected — fix before pushing" >&2
fi

# Mark that smoke evidence is needed before this session stops
touch "$ROOT/.claude/smoke-marker" 2>/dev/null || true
exit 0

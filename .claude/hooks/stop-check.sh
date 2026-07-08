#!/usr/bin/env bash
# Stop hook — blocks completion when code was changed but no smoke artifact exists.
# Exit 2 = prevents Stop, Claude continues in session.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MARKER="$ROOT/.claude/smoke-marker"

# No marker = nothing was edited this session, allow Stop
if [ ! -f "$MARKER" ]; then exit 0; fi

COMMIT=$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
ARTIFACT="$ROOT/tests/smoke/artifacts/${COMMIT}.json"

if [ -f "$ARTIFACT" ]; then
  rm -f "$MARKER"
  exit 0
fi

echo "" >&2
echo "STOP BLOCKED — code changed this session but no smoke evidence exists." >&2
echo "" >&2
echo "Commit: $COMMIT" >&2
echo "Needed: tests/smoke/artifacts/${COMMIT}.json" >&2
echo "" >&2
echo "Run the smoke suite from the site directory:" >&2
echo "  npx playwright test --config tests/smoke/playwright.config.ts" >&2
echo "" >&2
echo "Or clear the marker if this was infrastructure-only work:" >&2
echo "  rm .claude/smoke-marker" >&2
exit 2

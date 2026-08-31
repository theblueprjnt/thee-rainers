#!/usr/bin/env bash
# Env contract check — run after every file edit and in CI.
# Extracts every e['VAR_NAME'] reference from API routes and diffs against
# the documented list. Any var not in DOCUMENTED or ALLOWLIST fails with exit 1.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SRC="$ROOT/src/pages/api"

# Vars documented in CLAUDE.md (authoritative)
DOCUMENTED=(
  SITE_URL MAKE_LEAD_WEBHOOK_URL MAKE_CONTACT_WEBHOOK_URL
  RESEND_API_KEY MAKE_DELIVERY_WEBHOOK_URL STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET WATCH_TOKEN_SECRET R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET_NAME R2_BUCKET
  AIRTABLE_API_KEY AIRTABLE_BASE_ID AIRTABLE_TABLE
  KIT_API_KEY GA4_MEASUREMENT_ID GA4_API_SECRET CRON_SECRET
  RESEND_WEBHOOK_SECRET
)

# Known-undocumented vars — intentional omissions with reasons
ALLOWLIST=(
  TELEGRAM_BOT_TOKEN   # legacy Telegram path, disabled
  TELEGRAM_CHAT_ID     # legacy Telegram path, disabled
  AIRTABLE_LEADS_TABLE # lead-specific table override, subset of AIRTABLE_TABLE
  AIRTABLE_SURVEY_TABLE # survey-specific table override, subset of AIRTABLE_TABLE
  KIT_LEAD_TAG_ID      # Kit tag for footwork leads
  KIT_COACHING_TAG_ID  # Kit tag for coaching applicants
)

# Extract var names from e['VAR'] pattern (POSIX sed, macOS and Linux compatible)
FOUND=$(grep -roh "e\['\([A-Z_][A-Z_0-9]*\)'\]" "$SRC" --include="*.ts" 2>/dev/null \
  | sed "s/e\['\([^']*\)'\]/\1/" | sort -u || true)

FAIL=0
for VAR in $FOUND; do
  IN_DOC=0; IN_ALLOW=0
  for D in "${DOCUMENTED[@]}"; do [ "$D" = "$VAR" ] && IN_DOC=1 && break; done
  for A in "${ALLOWLIST[@]}"; do [ "$A" = "$VAR" ] && IN_ALLOW=1 && break; done
  if [ $IN_DOC -eq 0 ] && [ $IN_ALLOW -eq 0 ]; then
    echo "ENV CONTRACT FAIL: $VAR referenced in code but absent from CLAUDE.md and allowlist" >&2
    FAIL=1
  fi
done

if [ $FAIL -eq 0 ]; then
  echo "ENV CONTRACT OK — all vars documented or allowlisted" >&2
fi
exit $FAIL

# Make.com + Platform Checklist — Thee Rainers

Quick reference. Each item below is either done or a specific action.
Workshop is June 27. Priority order.

---

## STRIPE — 2 minutes, do now

### Workshop Replay success URL
1. Stripe Dashboard → Payments → Payment links
2. Find: Workshop Replay (`6oUaEX7hp6Xk3LIdww6J20p`)
3. Click the link → Edit → After payment → Custom URL
4. Set to: `https://theerainers.com/thank-you/workshop-replay`
5. Save

### Shadowboxing Blueprint success URL
1. Same path — find Shadowboxing (`5kQdR91X5dlIeqm8cc6J20l`)
2. After payment → Custom URL: `https://theerainers.com/thank-you/shadowboxing`
3. Save

---

## DNS (Cloudflare) — 5 minutes

### Duplicate SPF — fix required
`dig TXT theerainers.com` returns TWO records starting with `v=spf1`.
Two SPF records = PermError = your emails may be rejected.

1. Cloudflare DNS → find both TXT records starting with `v=spf1`
2. Delete both
3. Add one new TXT record:
   - Name: `@`
   - Type: `TXT`
   - Value: `v=spf1 include:spf.privateemail.com include:spf.kit.com ~all`
   - TTL: Auto

### CNAME www (to add)
1. Cloudflare DNS → Add record
   - Type: `CNAME`
   - Name: `www`
   - Target: `thee-rainers.pages.dev`
   - Proxy status: Proxied (orange cloud ON)
   - TTL: Auto
2. Save

---

## MAKE.COM — in order

### Scenario 2 — Delivery (already built, verify only)
1. Open the delivery scenario
2. Confirm toggle is ON (green)
3. Check last execution in history — confirm no errors
4. If errors: open the failing run, fix the broken module
Full rebuild guide: `02-delivery.md`

### Scenario 1 — Lead Capture (build if not already done)
1. Full guide: `01-lead-capture.md`
2. After building: update `MAKE_LEAD_WEBHOOK_URL` in Cloudflare Pages env vars with the new webhook URL

### Phone alerts (add to both scenarios)
Phone ping on every lead + every sale.
Instructions inside both scenario docs (Step 4 in each).
Recommended: Telegram bot (free) or Pushover ($5 one-time).

---

## AIRTABLE — already verified, no action needed
- `Leads.Source`: singleLineText ✅
- `Members.Status`: singleLineText ✅
- Code wired correctly to `THEE_RAINERS_HUB.` base ✅

---

## KIT — verify manually (MCP requires paid plan, cannot read via Claude)
- Tags confirmed in BUILD_NOTES.md as of June 14
- Kit connected to theerainers.com ✅ (per DNS check)
- Verify in Kit dashboard: tags for footwork, shadowboxing, bundle, greatness, trial, lead all exist
- Confirm `KIT_LEAD_TAG_ID` env var in Cloudflare = `20371838`

---

## CLOUDFLARE PAGES env vars — verify after any change
Full list in `BUILD_NOTES.md`.
After adding/changing a Make.com webhook URL, redeploy by pushing any commit.

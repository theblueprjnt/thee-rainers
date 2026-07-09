# Smoke Harness — Context Log

## Phase 0 Recon (2026-07-08)

**Hooks schema verified.** Documented events used: `PostToolUse` (matcher `Edit|Write|NotebookEdit`) and `Stop` (no matcher). `PostToolUseFailure` and `FileChanged` are real documented events but unused in this pass.

**GitHub remote:** `origin` present; Actions available (`.github/workflows/smoke.yml` added).

**Cloudflare plan observability:** UNVERIFIED — no dashboard access to confirm Workers Logs/metrics are enabled. Manual step required in CF dashboard.

**Existing tests before this pass:** none.

**Resend webhook endpoint:** none before this pass. Added at `src/pages/api/resend-webhook.ts`.

**Popup surfaces live:** `#tr-popup` on `/` and `/lever-audit-quiz`. `#capture-email` form on `/foundation`.

**Quiz surfaces live:** `/lever-audit-quiz` (source `quiz-*`).

---

## Phase 7 — Run #1 Verdict (2026-07-08, commit eee635a)

Suite: 7 journeys × 2 viewports (desktop 1440x900, mobile 393x851) = 14 tests.
Command: `npx playwright test --config tests/smoke/playwright.config.ts`
Result: **14/14 PASS**
Artifact: `tests/smoke/artifacts/eee635a.json`

| Claim | Journey | Verdict | Evidence |
|---|---|---|---|
| Popup/quiz opt-ins now create Kit subscribers | J3 (foundation form), J4 (popup) | PASS | Kit subscriber IDs 4198453718 (`smoke+1783518241862@theerainers.com`, tag `Footwork_lead`) and 4198453757 (`smoke+1783518241862p@theerainers.com`, tag `Footwork_lead`) created at 13:44:07Z / 13:44:09Z 2026-07-08. Both unsubscribed post-test. Screenshot: `j3-optin-1783518241862.png`, `j4-popup-visible-1783518241862.png` |
| R2 env var fix (`R2_BUCKET` → `R2_BUCKET_NAME`) | — | UNVERIFIED | No purchase record available to test `/private-architecture/[token]`. Requires a real HMAC-signed token + existing R2 object. Logged as next harness task. |
| `coaching-capture.ts` `waitUntil` fix | — | UNVERIFIED | Cannot observe CF Worker lifetime from outside. Requires CF Workers Logs in dashboard (manual step). Logged as next harness task. |
| XSS fix in `contact.ts` and `coaching-capture.ts` | — | UNVERIFIED | Requires submitting `<script>alert(1)</script>` as name and confirming HTML-escaped in received email. Not automatable without Resend sandbox. Logged as next harness task. |
| `/thank-you/contact` renders non-blank | J7 | PASS | Route returns 200 in 13-route crawl. Screenshot: `j7-crawl-1783518241862.json` confirms `{"path":"/thank-you/contact","status":200}`. |
| Nav CTA is red (`#E11D2A`) | J2 | PASS | `getComputedStyle.backgroundColor = rgb(225, 29, 42)` on both viewports. Screenshot: `j2-nav-cta-1783518241862.png` |
| HMAC gate rejects invalid token | J6 | PASS | `/watch/workshop-replay?sig=deadbeef&exp=9999999999` redirects to `/workshop-replay` (not `/watch/`). Screenshot: `j6-gate-reject-1783518241862.png` |

---

## Test Assertion Bugs Fixed During Harness Build

These were test-code issues, not production bugs:

1. **J1 mobile nav**: Desktop `<nav class="hidden md:flex">` is in DOM but visually hidden on mobile. Fixed: `toBeVisible()` → `toBeAttached()`.
2. **J3 trailing slash**: CF normalizes redirect URL to `/thank-you/footwork-blueprint/`. Fixed: glob `**/thank-you/footwork-blueprint` → regex `/thank-you\/footwork-blueprint/`.
3. **J4 popup name required**: Popup submit handler has `if (!email || !name) return`. Fixed: added `page.fill('#tr-popup-name', ...)`.
4. **J4 suppression timing**: Popup calls `setTimeout(dismiss, 3200)` — localStorage only set after 3.2 s. Test was reloading before dismiss fired. Fixed: wait for `#tr-popup` to gain `hidden` class before reloading.
5. **J5 Workshop Replay not on /shop**: `/shop` links to `/workshop-replay` sales page (not direct Stripe). Fixed: check 3 Stripe links on `/shop`, check Workshop Replay Stripe link separately on `/workshop-replay`.
6. **J6 wrong assertion**: Gate redirects to sales page which has a YouTube teaser iframe. Fixed: assert URL matches `/workshop-replay` without `/watch/` prefix.

---

## UNVERIFIED Items — Next Harness Tasks

1. **J6 valid token path**: Requires `WATCH_TOKEN_SECRET` + a real purchase record in the system. Not testable without a paid customer.
2. **R2 presign URL delivery**: Requires same as above (HMAC token + R2 object).
3. **CF Workers Logs**: Enable in Cloudflare dashboard (Settings > Workers Logs). Cannot automate.
4. **XSS fix verification**: Submit `<script>alert(1)</script>` to `/api/contact` and confirm `&lt;script&gt;` in received Resend email.
5. **coaching-capture `waitUntil`**: Verify via CF Workers real-time logs after a real coaching form submission.
6. **Quiz opt-in sequence**: Submit a `quiz-*` source and confirm subscriber gets the nurture sequence. Requires a form on `/lever-audit-quiz` to be live.

---

## Part A — Money Path Audit (2026-07-08)

### A2 — Email_Events Airtable table (DONE)
Table `Email_Events` created in base `applzsBz15zEAua4s` (THEE_RAINERS_HUB).
Table ID: `tblOV5M1FGzHGopbJ`. Fields: `Event` (text), `Email` (text), `Message_ID` (text), `Timestamp` (text).
Schema is an exact match to `src/pages/api/resend-webhook.ts` field writes.
Resend must have the webhook endpoint registered at `https://theerainers.com/api/resend-webhook` pointing to this CF Worker for rows to appear.

### A3 — Airtable base confirmation (CONFIRMED)
All handlers (`lead-capture.ts`, `stripe-webhook.ts`, `resend-webhook.ts`) read `e['AIRTABLE_BASE_ID']` from the CF env. No hardcoded base IDs. Live test confirmed `AIRTABLE_BASE_ID` resolves to `applzsBz15zEAua4s` (THEE_RAINERS_HUB), not the template base. If the env var were wrong, upserts and logs would silently 404 against a wrong base ID.

### A1 — Workshop Replay USD price (DONE — commit de8c9e3, 2026-07-09)
EUR Payment Link `https://buy.stripe.com/6oUaEX7hp6Xk3LIdww6J20p` was charging US buyers $56.87 (EUR base price with FX conversion).
Fixed: all three buy buttons on `/workshop-replay` converted from `<a href>` Payment Link to `<button data-checkout="workshop_replay">`. Route hits `/api/create-checkout` which creates a Stripe Checkout Session.
`create-checkout.ts` `workshop_replay.priceId` updated to `price_1TaFZPHzlarU775HLnMC6yNB` (USD $47, product `prod_UZOMBOeJ0mm15I`, created by Rainers 2026-07-09).
`smoke.spec.ts` J5 assertion updated: checks `button[data-checkout="workshop_replay"]` on `/workshop-replay`.
Deploy confirmed live: Stripe Checkout Session showed USD $47.00 after deploy.

### Money path broadcast silence
Last broadcast to Kit list: April 22 2026 (subject: "question for you"). 78 days of silence as of 2026-07-09.
Kit list: 258 active subscribers. 159 tagged Lead, 70 tagged Buyers, 25 tagged Footwork_lead (recent CF Worker opt-ins).
No purchases in Airtable Members table (zero rows as of 2026-07-08). No Kit buyer tags (Member, workshop_replay, etc.) assigned.
3-email broadcast campaign drafted 2026-07-09: Email 1 "why you keep getting hit" (Day 0), Email 2 "5 months" (Day 4), Email 3 "last one on this" (Day 8). Rainers polishing copy before Kit drafts are created.

### Resend send truth — CONFIRMED (2026-07-09)
RESEND_API_KEY confirmed set in CF Pages env. Resend Emails dashboard (last 15 days) shows:
- `facethomas20@gmail.com` (Jonathan Jackson): "Your Blueprint. Start on page 9." delivered 2026-07-09. Four sequence emails (days 2/4/5/8) scheduled.
- `aaron.lynch43@gmail.com`: same pattern, same timestamp.
Welcome email and full nurture sequence fire correctly for every new opt-in. Primary delivery path is live.

### Resend webhook registration — UNVERIFIED
`/api/resend-webhook` endpoint exists and deploys correctly. Whether Resend's dashboard has this URL registered as a webhook for delivery events is UNVERIFIED. Without registration, Email_Events rows will never appear. Rainers must confirm: Resend > Settings > Webhooks > verify `https://theerainers.com/api/resend-webhook` is listed for `email.delivered`, `email.bounced`, `email.complained`.

---

## Env Contract

Script: `scripts/check-env-contract.sh`
Last check: PASS — all referenced vars in `src/pages/api/*.ts` are documented in CLAUDE.md or allowlisted.

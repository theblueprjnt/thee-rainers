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

## Brief A — Deliverability, Compliance, Legal (2026-07-09, commit bd69290)

### 1. RFC 8058 One-Click Unsubscribe — DONE
`List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers added to ALL Resend sends: welcome email, all 4 sequence emails (lead-capture.ts), all delivery emails (stripe-webhook.ts).
In-body unsubscribe link added to all email footers via wrapEmail() and buildDeliveryHtml().
`/api/unsubscribe` endpoint created: POST handles RFC 8058 one-click (calls Kit PATCH state=inactive), GET returns confirmation HTML page.

### 2. Unsubscribe Honored Instantly — CODE DONE, UNVERIFIED (live test needed)
Kit v4 PATCH to `state: inactive` fires on every unsubscribe request.
Known limitation: Resend scheduled sequence emails already queued will still fire within their window. Kit stops all future sends immediately. Acceptable under CAN-SPAM 10-day rule.

### 3. SPF/DKIM/DMARC
- SPF: BROKEN (DNS only, code cannot fix). Current: `v=spf1 include:spf.privateemail.com include:spf.kit.com ~all`. Missing `include:spf.resend.com`. Rainers must add this in DNS panel.
- DKIM Resend: CONFIRMED at `resend._domainkey.theerainers.com`
- DKIM Kit: CANNOT VERIFY (no selector found)
- DMARC: `p=none` (monitoring). Functional. Move to `p=quarantine` when confident.

### 4. Legal Pages — CONFIRMED
All 6 legal pages (Privacy, Terms, Refund, Cookie, Accessibility, Disclaimer) linked in footer. All return 307 redirect to HTTPS. Billing disclosure confirmed on /community line 186.

### 5. Accessibility EAA — DONE
- Footer social icons: /35 → /70 (1.88:1 → 5.94:1, passes 3:1 for UI)
- Footer copyright + Legal label: /45 → /70 (2.75:1 → 5.94:1, passes 4.5:1)
- ink-soft: #6B7280 → #667280. On cream (#F6F6F6): 4.47:1 → 4.54:1. On white: 4.83:1 → 4.90:1.
- Scripture footer (/20, ~1.47:1): kept as decorative non-informational text.

---

## Brief C — Community Retention Engine (2026-07-10, commits 9dd7d0f + 00880b3)

### C1 — Annual lever (DONE, commit 9dd7d0f)
Badge on annual pricing card: "Saves 2 Months" → "Save $78".
Added subhead in purple: "Two months free vs monthly" directly below the $32.50/month breakdown line.

### C2 — E6 Instant access (CONFIRMED, no code change)
`community-access.ts` checks Airtable for `{Email}=email AND {Product}="greatness"` with Status in ('active', 'trialing', 'past_due').
`stripe-webhook.ts` upserts Airtable with Status='active' on `checkout.session.completed`. Access is instant.
UNVERIFIED: No live Greatness purchase has occurred to confirm end-to-end. Requires a paid member.

### C3 — Welcome sequence rebuild (DONE, 2026-07-10)
Seq 2813705 rebuilt. All 3 emails updated via Kit API (published: true confirmed in API response).
- Email 10031138 (D+1): Short welcome. First action: theerainers.com/library, Stance section, one drill. Session time stated. Support line.
- Email 10031148 (D+2): Drill library directive. Find the broken lever. Run one drill before Saturday.
- Email 10031155 (D+4): Pre-session prep. Come with one specific thing. Camera on. Bring the question raised by drilling.

### C4 — E7/E8 Attendance tagging (DONE, commit 00880b3)
Kit tags created: Community_Attended (21027824), Community_Returned (21027825).
Endpoint `GET /api/session-checkin?email=` logic:
- Must have KIT_MEMBER_TAG (19807647) — rejects non-members
- No Community_Attended: adds it (E7, first-session activated)
- Has Community_Attended, no Community_Returned: adds it (E8, return-ritual confirmed)
- Has both: returns "Already checked in."
Check-in link for reminder emails: `https://theerainers.com/api/session-checkin?email={{ subscriber.email }}`
UNVERIFIED: Requires a live member to click the personalized link. Kit liquid tag `{{ subscriber.email }}` must resolve in Kit email sends.

### C5 — Flows (DONE, 2026-07-10)
Three Kit sequences created:

**Community Session Reminder** (seq 2822600, email 10064213)
- Trigger: Rainers adds all members to this sequence each Friday before the session
- Email D+0: "Session tomorrow. 10am ET." — includes [ZOOM LINK] placeholder + personalized check-in link
- Action required: Rainers pastes Zoom link before adding members each Friday

**Community Session Recap** (seq 2822601, email 10064214)
- Trigger: Rainers adds all members to this sequence after each session (Saturday/Sunday)
- Email D+0: "From today's session." — includes [LINK] and [CORRECTION] placeholders
- Action required: Rainers fills in recording link and correction before adding members

**Community Inactivity Nudge** (seq 2822602, emails 10064215-10064217)
- Trigger: Rainers manually adds a member after they miss 2 consecutive sessions (~14 days no check-in)
- Email D+0: "We have not seen you." — invitation back, no guilt
- Email D+7: "Still here." — brief, no pressure
- Email D+14: "Last one on this." — come back or cancel, no friction

---

## Env Contract

Script: `scripts/check-env-contract.sh`
Last check: PASS — all referenced vars in `src/pages/api/*.ts` are documented in CLAUDE.md or allowlisted.

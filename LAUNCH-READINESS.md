# LAUNCH-READINESS.md
## Thee Rainers — Full Codebase Audit

**Date:** 2026-05-25
**Auditor:** Claude (lead engineer pass — all files read)

---

## STATUS: NOT LOCKED — 2 BLOCKERS

**Blocker 1 — Billing copy does not state subscription pricing (vault.astro, index.astro)**
The Blueprints are $47/month or $470/year per confirmed model. Every product card on vault and index shows "$47" with no interval. The Stripe payment links in the code are the one-time links. Copy and links must match the subscription model before any Blueprint buyer reaches checkout.

**Blocker 2 — No resend path for Blueprint / Workshop Replay buyers**
`resend-access.ts` only handles Private Architecture. A Blueprint or Workshop Replay buyer whose 7-day link expires has no self-serve way to get a fresh one. The delivery copy promising rewatch must match the mechanism, and a resend path must exist or the copy must clearly state 7-day access with a manual contact fallback.

---

## 2 — BILLING TRUTH RECONCILIATION

### Product Table

| Product | Stripe charge type (code) | Current page copy | MATCH? | Fix required |
|---|---|---|---|---|
| Footwork Blueprint | One-time $47 link `bJe14n8lt81ogyu3VW6J20k` | "$47" — no interval | **MISMATCH** | Change to "$47/mo" · swap link to subscription URL · add annual option "$470/yr" |
| Shadowboxing Blueprint | One-time $47 link `5kQdR91X5dlIeqm8cc6J20l` | "$47" — no interval | **MISMATCH** | Change to "$47/mo" · swap link to subscription URL · add annual option |
| Both Blueprints bundle | One-time $87 link `14A4gz59hgxUaa65006J20m` | "$87" — no interval | **MISMATCH** | `// NEEDS RAINERS: confirm bundle subscription pricing — is bundle $47/mo (same as individual) or different? Provide subscription payment link URL.` |
| Workshop Replay | One-time $79 link `6oUaEX7hp6Xk3LIdww6J20p` | "$79" | MATCH | None |
| Defense Workshop | One-time $197 link `7sY28r8lt1D06XU6446J20n` | "$197" | MATCH | None |
| Private Architecture | No price shown, application only | Application only | MATCH | None |
| Monthly Q&A | No Stripe charge — free with purchase | "Included with any paid product" | MATCH | None |

### Subscription compliance (required for card-network compliance and honesty)
Wherever recurring billing exists, the page must state:
- The billing interval (monthly / annual)
- That the buyer can cancel
- How to cancel (Stripe customer portal)

**Currently: none of this is present.** Must be added before going live with subscription Blueprint pricing.

### Action
`// NEEDS RAINERS: Provide subscription Stripe payment link URLs for Footwork Blueprint ($47/mo), Shadowboxing Blueprint ($47/mo), and Bundle (confirm price + link). Do NOT change billing model in Stripe — only provide the existing links so copy and URLs can be updated.`

The code changes below (copy → "$47/month") are executed now. The Stripe link swap is blocked until Rainers provides the subscription URLs.

---

## 3 — DELIVERY DURABILITY

### Workshop Replay — 7-day HMAC link
- `watch/workshop-replay.astro` correctly validates HMAC + expiry server-side before rendering embed. Video ID `AtZmUk7cZFQ` only appears in DOM on valid token. **PASS.**
- Expired state renders repurchase CTA with no video in source. **PASS.**
- Invalid token redirects to sales page. **PASS.**

### R2 Blueprint PDFs — 7-day presigned URLs
- AWS SigV4 implemented natively in `stripe-webhook.ts` using CF Workers `crypto.subtle`. `X-Amz-Expires=604800`. **PASS.**
- Bundle delivers two separate URLs (`expiring_url` + `expiring_url_2`). **PASS.**
- R2 file paths confirmed correct against bucket screenshots. **PASS.**

### Resend path
- `resend-access.ts` exists but queries Airtable `Purchases` table for `access_token`. This is wired for Private Architecture coaching delivery only. No equivalent path exists for Blueprint or Workshop Replay buyers. **FAIL — see Blocker 2.**
- Immediate fix applied: copy on vault/index changed from "rewatch as many times as you need" to honest 7-day framing with contact fallback. Manual resend instruction added.
- `// NEEDS RAINERS: To fully close the lifetime-access gap, extend `resend-access.ts` (or a new `/api/resend-product.ts`) to accept an email, look up purchase records in Airtable (requires Make.com to write purchase records there), and re-fire `MAKE_DELIVERY_WEBHOOK_URL` with fresh R2 presigned URLs. Until then, delivery email must include: "Links expire in 7 days. To get a fresh copy, email rainers@theerainers.com with your purchase email."`

### Public leak check
- `/thank-you/workshop-replay` exists, has `noindex`, shows "check your email" only — no video, no asset. **PASS.**
- `/watch/workshop-replay` is SSR with HMAC guard. **PASS.**
- `grep -r "AtZmUk7cZFQ"` — YouTube ID only appears inside the `{!expired && valid}` branch, behind the server-side token check. **PASS.**
- No other route renders a paid asset without auth. **PASS.**

---

## 4 — LEXICON ENFORCEMENT

### Verified clean
- "The Calibration Workshop" — zero instances remaining after last commit.
- "rainers@stepintoring.com" — zero instances remaining after last commit.
- "masterclass" — zero instances.
- "Mechanics Diagnostic" — zero instances.

### All canonical terms confirmed present
- Thee Rainers ✓ | The Blueprint ✓ | Footwork Foundation ✓ | Lever Audit ✓ | Quiz ✓
- The Footwork Blueprint ✓ | The Shadowboxing Blueprint ✓ | Monthly Q&A Community Call ✓
- The Defense Workshop ✓ | Private Architecture ✓

### Schema / meta / llms.txt
- JSON-LD names: "Defense Workshop," "Thee Rainers," "Footwork Blueprint," "Shadowboxing Blueprint" — **PASS.**
- llms.txt uses locked lexicon — **PASS.**
- OG titles on commercial pages match canonical names — **PASS.**
- `vault.astro` Product schema price will need updating when billing copy changes to $47/month.

---

## 5 — BUYER JOURNEY QA

### Free path
- Footwork Foundation → email form → `lead-capture` API → `MAKE_LEAD_WEBHOOK_URL` → PDF download triggered in browser. Source tag: `footwork-foundation`. Success state shown. **PASS.**
- Lever Audit → PDF direct + quiz path. Quiz gates email → `lever-audit-quiz` source. PDF triggers after email captured. **PASS.**
- Lever Audit Quiz → routes to `/footwork-foundation`, `/workshop`, or `/command` based on score. All three routes valid. **PASS.**
- Every free thank-you page points up to next tier. **PASS.**

### Paid path — Workshop Replay
- `/workshop-replay` → Stripe link `6oUaEX7hp6Xk3LIdww6J20p` → webhook → `product_slug: 'workshop-replay'` → `generateWatchUrl()` → Make.com → buyer email → `/watch/workshop-replay?sig=&exp=` → HMAC validated → embed rendered. **PASS.**
- `// NEEDS RAINERS: Confirm Stripe Dashboard Workshop Replay success URL is set to `/thank-you/workshop-replay` — unverified externally.`

### Paid path — Blueprints
- Links currently point to one-time Stripe checkout. **BLOCKED on subscription link swap (Blocker 1).**
- Webhook handles both one-time and subscription renewals. Delivery fires for both. Once subscription links are live, delivery rail is ready.

### Paid path — Defense Workshop
- `/workshop` → Stripe link `7sY28r8lt1D06XU6446J20n` → `thank-you/workshop.astro`. Workshop does not deliver a digital asset — it's a live event. **PASS.**

### Dead ends — none found
- Every terminal page (thank-you, vault, watch) offers a next action up the ladder. **PASS.**
- Footer links: Q&A, Lever Audit, Free Foundation, About, Apply, All Links. **PASS.**
- Nav: Library, Blueprints, Workshop, About, Apply. **PASS.**

### `/links` hub — missing Blueprints entry
The bio link page has no direct Vault/Blueprints link. A buyer who comes in via social and wants to purchase directly must navigate through another step. **FAIL — fixed in this commit.**

### Countdown
- `workshop.astro` countdown computes from `Date.now()`, not frozen. `TODO` marker present on the target date constant. **PASS.**

---

## 6 — STANDARDS

### Performance
- Hero images have explicit `width` + `height` (index.astro hero: 1550×1854). Lazy loading on non-hero images. LCP candidates are eager-loaded. **PASS on static verification.** No runtime Lighthouse run possible in this environment — `// NEEDS RAINERS: Run Lighthouse on /, /vault, /workshop, and /workshop-replay before first paid traffic push.`
- ClientRouter (Astro view transitions) is active — watch for CLS on transition. Island count is minimal (no React/Vue islands — everything is vanilla JS in script tags). **PASS.**

### Security
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection all present in `_headers`. **PASS.**
- **No Content-Security-Policy header.** The site loads GTM (two containers), YouTube iframes, Stripe JS, Bricolage font — all of these need whitelisting. CSP is not a hard launch blocker (site will function without it) but is a security gap. **FLAGGED — NEEDS RAINERS: add CSP to `_headers` after confirming all external domains in use.**
- Stripe webhook: `constructEventAsync` (CF Workers Web Crypto compatible). Signature verified before any processing. **PASS.**
- No secrets in any client bundle — all env vars consumed server-side in API routes and SSR pages. **PASS.**
- R2 presigned URLs and HMAC tokens generated server-side only. **PASS.**
- `resend-access.ts` never leaks whether an email exists (always returns 200). **PASS.**

### GEO / Schema
- Organization + Person JSON-LD in Base.astro on every page. **PASS.**
- Event schema on `/workshop` with `startDate`, `offers`, `eventStatus`. **PASS.** (Date TODO-marked.)
- Product schema on `/vault` — prices will need `priceCurrency` and interval update after billing fix. **FLAGGED.**
- FAQPage on `/workshop`. **PASS.**
- `llms.txt` current, correct lexicon, all products listed. **PASS.**
- `robots.txt` blocks `/gate` and `/thank-you/`. **PASS.**
- `sitemap.xml` present. **PASS (not verified for completeness — static file).**

### Accessibility
- One H1 per page — confirmed across all pages read. **PASS.**
- Alt text present on all images read (descriptive, not generic). **PASS.**
- Nav has `aria-current="page"` wired via JS. **PASS.**
- No `prefers-reduced-motion` guards on any animation. The animations present are CSS transitions (200–400ms) — low CLS/motion risk. **FLAGGED — not a blocker but should be added before broad paid traffic.**
- Keyboard focus: no explicit `focus-visible` styles in global.css beyond browser defaults. **FLAGGED.**
- WCAG contrast: Tailwind `opacity` modifiers are used (e.g., `text-[#0A0A0A]/35`) — some of these may fail AA. `// NEEDS RAINERS: run automated contrast check (axe or Lighthouse accessibility) on vault and workshop pages.`

### Other technical
- Two GTM containers loaded (GTM-WQZ9ZLZM, GTM-5LQ7HPXG) — production-only via `isProd` guard. **PASS.**
- `content/products/*.json` — PLACEHOLDER Stripe links, not imported by any active page. Dead code. Not a launch blocker; clean up eventually.
- `src/lib/r2-presign.ts` — not used by `stripe-webhook.ts` (which has its own inline SigV4 implementation). Dead code. Not a launch blocker.
- `astro.config.mjs` — Cloudflare adapter, Tailwind v4, correct site URL. **PASS.**

---

## 7 — LOCK DECLARATION

### Buyer journey (confirmed working in code)

**Free path:** Social → /links → /footwork-foundation or /lever-audit or /lever-audit-quiz → email form → lead-capture API → Make.com Scenario 1 → welcome email + PDF → thank-you page → Tier 2 upsell visible on every exit.

**Workshop Replay path:** /workshop-replay → Stripe $79 → webhook → HMAC watch URL → Make.com Scenario 2 → buyer email → /watch/workshop-replay (token-gated) → video. Expired: repurchase CTA. Invalid: redirect to sales page.

**Blueprint path:** /vault or /index → Stripe [SUBSCRIPTION LINKS PENDING] → webhook (ready) → R2 presigned URLs → Make.com Scenario 2 → buyer email. Renewal: `invoice.payment_succeeded` (subscription_cycle) → fresh 7-day URLs. **BLOCKED on subscription link swap.**

**Workshop path:** /workshop → Stripe $197 → /thank-you/workshop → lever-audit-quiz CTA → workshop prep.

**Private Architecture path:** /command → application form → coaching-capture API → Make.com.

### Billing truth table — see Section 2. Blueprints: MISMATCH (blocked). All others: MATCH.

### Remaining NEEDS RAINERS (external — yours to execute)

| Priority | Action | Blocking? |
|---|---|---|
| BLOCKER | Provide subscription Stripe payment link URLs for Footwork Blueprint, Shadowboxing Blueprint, and Bundle (confirm bundle price) | YES — Blueprints cannot go live until links and copy are correct |
| BLOCKER | Extend delivery resend path for Blueprint/Workshop Replay buyers OR confirm "7-day access, email us for fresh link" is acceptable copy for now | YES — delivery promise must match mechanism |
| FIRE | Confirm Workshop Replay Stripe success URL → `/thank-you/workshop-replay` in Stripe Dashboard | YES |
| FIRE | Make.com delivery email: add "Links expire in 7 days. Email rainers@theerainers.com with your purchase email for a fresh copy." | YES |
| URGENT | Rotate Stripe secret key, Airtable PAT, Cloudflare API token (leaked in plain text in prior session) | YES — security |
| WEEK | Add CSP header to `public/_headers` once all external domains confirmed | No |
| WEEK | Run Lighthouse on /, /vault, /workshop, /workshop-replay | No |
| WEEK | Confirm Make.com Scenario 1 (lead capture → Airtable + PDF email) is fully live | No |
| WEEK | Run automated contrast/accessibility check (axe) on commercial pages | No |
| ONGOING | Post-June-27: sweep all TODO: POST-JUNE-27 DATE SWAP markers | No |

### Per-area verdict

| Area | Status |
|---|---|
| Billing Truth | **NOT LOCKED** — Blueprint pricing copy is wrong; subscription links not yet swapped |
| Delivery Durability | PASS (7-day mechanism) · resend path is manual-contact fallback for now |
| Lexicon Enforcement | PASS — zero legacy terms |
| Buyer Journey | PASS (free + workshop + replay) · Blueprints blocked on billing fix |
| Security | PASS · no secrets in client · webhook signature verified · assets gated |
| Performance | PASS (static) · Lighthouse run needed |
| GEO/Schema | PASS · Product schema price needs update after billing fix |
| Accessibility | FLAGGED · contrast audit needed · no prefers-reduced-motion guards |

### Final line

**NOT LOCKED — 2 BLOCKERS:** (1) Blueprint pages show one-time $47, must show $47/month with subscription Stripe links; (2) no self-serve resend path for digital product buyers — copy must honestly state 7-day access and manual fallback. Provide subscription payment link URLs to resolve Blocker 1.

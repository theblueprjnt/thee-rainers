# Thee Rainers — Project Context

## Definition of Done (non-negotiable, applies to all tasks)

1. Any task touching UI, routes, forms, checkout, delivery, or email is NOT done until the LIVE URL passes the affected smoke journeys on one mobile and one desktop viewport.
2. Evidence or it did not happen: after-screenshot, Playwright trace or HTML report, and a backend receipt for side effects (API response, Kit subscriber ID, Airtable record ID, Resend event, Worker log line).
3. Anything not automatable must be reported as UNVERIFIED, in that word. Claiming success without evidence is the one forbidden act.
4. Silent-failure classes to always suspect: captured-but-never-sent email, renamed env vars, Worker dying before third-party calls finish, blank renders, dead buttons.

### Smoke suite
```
npx playwright test --config tests/smoke/playwright.config.ts
```
Artifacts saved to `tests/smoke/artifacts/`. Commit SHA artifact required before Stop is allowed when code was touched.

### Env contract check
```
bash scripts/check-env-contract.sh
```
Runs automatically after every Edit/Write via `.claude/hooks/post-edit-check.sh`. Any env var referenced in code but absent from DOCUMENTED list or ALLOWLIST in the script fails the check.

## Ownership Doctrine

### What we own (the moat, fully vertically integrated)
- Delivery: Cloudflare R2, presigned URLs. Ours.
- Payment: Stripe, direct. Ours.
- Data: Airtable (Leads, Members, Events, Email_Events, Survey_Responses, Clip_Submissions). Ours.
- Relationship: Kit list + sequences + Resend email. Ours.
- The site and the rail: Astro on Cloudflare Workers. Ours end to end. Gumroad is dead and never returns.

### What we do not own (the standing work)
Audience, traffic, and the initial attention live on social (600K+ across IG, TikTok, FB, YouTube, Threads). This is rented land. The permanent job of the funnel is to move rented attention onto the owned list. We do not control the algorithms; we control the doorway and everything after it.

### Operating principle
We are past building and into essentialism. The default answer to any new feature is no, unless it measurably moves retention or conversion. Strip to bone and muscle. Own more, depend less, add nothing that can be taken or taxed by a middleman.

---

## Skills (load these before copy or visual work)
- Voice rules: `.claude/skills/trb-voice/SKILL.md` — banned words, punctuation, system names, proof copy rules.
- Design rules: `.claude/skills/trb-design/SKILL.md` — color tokens, spacing scale, button shapes, contrast, verification loop.

## Build and deploy commands
```
npm run dev        # local dev server at localhost:4321
npm run build      # production build (requires Cloudflare bindings)
git push           # deploys to Cloudflare Pages automatically (main branch)
```
Visual verification: Chrome DevTools MCP screenshot at 390x844 after every change. Do not mark a task done from code alone.

## Stack
Astro 6 on Cloudflare Pages/Workers. `@astrojs/cloudflare` adapter. Tailwind v4 (`@theme` CSS vars, no config file). All SSR API routes use `export const prerender = false` and `import { env as cfEnv } from 'cloudflare:workers'` for env vars. No wrangler.toml — managed via Cloudflare Pages dashboard.

## Brand rules — non-negotiable

### Color law (strict — no exceptions)
- Blue `#2348C6` (`var(--red)` / `var(--terra)`, same hex now) — the ONLY fill color for action CTAs. One per screen. Used for: Blueprint purchase, Workshop reserve, lead capture submit, any primary "buy/get/join" button. Never used for labels, links, or decorative elements. Changed from red (`#E11D2A`) to blue 2026-08-23 at owner request — see `src/styles/global.css` COLOR LAW comment.
- Blue `#2348C6` (`var(--blue)` / `var(--navy)`) — entry-tier labels and inline text links. Same hex as the CTA fill color now, since both tokens point at blue.
- Purple `#7C3AED` (`var(--purple)`) — reserved for any future recurring-membership product. No active product uses it as of this writing (The Weekly Session / Greatness Community, the only subscription that ever used it, was retired 2026-11-19 — see Products section).
- Void `#0A0A0A` — primary text, scripture section backgrounds.
- White `#FFFFFF` — primary background everywhere else.
- Multi-hue gradients: BANNED. Single-color-to-transparent overlays (hero masks) are legal.
- WCAG AA: 4.5:1 text contrast minimum. Footer/legal opacity must be `/70` or higher (not `/55`).

### Other brand rules
- No emojis anywhere in the codebase or copy
- Telegram IS used, as an internal sale/submission alert channel only (`src/lib/telegram.ts`, called from `stripe-webhook.ts` and `submit-clip.ts`) — this is an operational notification to Rainers, not a public-facing feature or claim. The older "No Telegram references" rule in this file meant no public mention of Telegram as a product feature; it did not anticipate the internal-alert use case and is superseded by this line.
- Scripture sections stay dark (`bg-[#0A0A0A]`) for gravitas
- Button shape: `rounded-none` everywhere (brutalist square edges, no pill/rounded buttons)
- Internal-only framing, never public: the brand's internal architecture references "7 Holy Virtues, 7 Performance Levers, and the Word of God." This language was removed from the homepage JSON-LD description (confirmed clean as of 2026-11-19, re-verified this session — no occurrence anywhere in `src/` or this file's own prose before this line). It stays off every public page and every public schema. If a future task asks to use it publicly, that's a decision for Rainers, not a default.

## Font
Bricolage Grotesque Variable — loaded via Base.astro

## Layout pattern
60/40 asymmetric grid for all hero sections. Left 60% = text/form. Right 40% = image/video/context.

Section spacing scale (normalized 2026-11-19 across the homepage, /coaching, the Grade pages, /defense-workshop, and /masterclass — previously each page had drifted to its own values):
- Standard content section: `py-16 md:py-24`
- Hero and final-CTA sections: `py-20 md:py-28`
- Wide multi-column info panel (2-3 columns): `max-w-[1100px]`
- Text column (prose, FAQ, testimonial copy): `max-w-[720px]`
- Wide card-grid rows (ladder/offer cards, Grade pricing cards): `max-w-[1280px]` — deliberately wider than the 1100px info-panel width, a card row needs more room than a text panel, keep this distinction, don't collapse it to one literal number everywhere.

## Funnel architecture (vertical integration)
```
Platforms: 600K+ across IG, TikTok, FB, YouTube, Threads (rented — individual counts in src/data/social-stats.ts, last updated 2026-06-07, stale, flag for Rainers)
    ↓
/links — universal bio hub
/first-training — free session plan (free, email capture → PDF). The one
    canonical "Free Guide" destination site-wide (nav, hero, footer, about).
    ↓
/foundation — The Footwork Blueprint, $19 (paid product, despite the name
    sounding like a free lead magnet — a stale "Start Free" button on /about
    that pointed here was found and fixed to /first-training this session)
/shadowboxing-blueprint — The Shadowboxing Blueprint, $19
/shop — the Bundle, $30 (both Blueprints together)
    ↓
/defense-workshop — live Sunday Nov 29, 2026, 12:00 PM ET, on Zoom. Three
    ticket tiers: Live $49, Live + footage review $99, Live + 1:1 call $199.
    Date-driven: once the event has passed (src/data/defense-workshop.ts,
    assumed 2-hour length, confirm with Rainers if the real length differs),
    the page and every strip pointing at it switch to promoting the replay
    instead, automatically, no redeploy needed.
/workshop-replay — $49 on-demand replay, standalone purchase, not just a
    Defense Workshop buyer's fulfillment link.
    ↓
/masterclass — $79 (renamed from "Step Into The Ring" / "Masterclass" was
    already in some copy, $57 was the old price, both changed 2026-11-19)
    ↓
/coaching — Grade 1/2/3 ladder:
    Grade 1: Sparring ready. $347. Grade 2: Master fundamentals. $997,
    ships a mystery-gift bonus (a tool that improves punch snap), collects
    a shipping address at checkout. Grade 3: Fight ready. $12,000,
    application only, capped at 5 seats (src/data/grade3-seats.ts).
    Grade 2 and Grade 3 each also offer a 3-payment plan (3 x $365 and
    3 x $4,400) in Stripe subscription mode, charges exactly 3 times then
    self-cancels — see Products section below for the mechanics.
```
Retired: The Weekly Session / Greatness Community (`/community`, 301s to `/coaching`). Zero active subscribers at retirement. Checkout can no longer be triggered at all as of 2026-11-19 — `greatness_monthly`/`greatness_annual` were removed from `create-checkout.ts`'s PRODUCTS map entirely, not just hidden from the UI.

## Pages inventory (reflects the live route map as of 2026-11-19 — the previous version of this section, still describing `/workshop`, `/vault`, `/command`, `/library`, `/arena` as live destinations, was badly out of date)
- `/` — home: hero, proof, old-way/new-way, the ladder (free guide → bundle → Defense Workshop → Masterclass → Grades), Apply for Training form, Videos section, FAQ, final CTA
- `/about` — founder
- `/first-training` — free session plan + email capture (the canonical Free Guide destination)
- `/foundation` — Footwork Blueprint, $19
- `/shadowboxing-blueprint` — Shadowboxing Blueprint, $19
- `/shop` — Bundle, $30
- `/defense-workshop` — live event + three ticket tiers
- `/workshop-replay` — $49 on-demand replay
- `/watch/workshop-replay`, `/watch/masterclass` — token-gated watch pages (server-validates HMAC before rendering embed)
- `/masterclass` — $79
- `/coaching`, `/coaching/grade-1`, `/coaching/grade-2`, `/coaching/grade-3` — the Grade ladder
- `/safe` — non-damage boxing framework, for parents/coaches/gyms. Linked from `/about`.
- `/links` — universal bio link hub
- `/feedback`, `/contact` — contact forms (see below for what each actually is)
- `/streaming` — live-status page, polls `/live-status.json` against the YouTube channel; shows follow links to YouTube/Twitch/Kick/Facebook/TikTok/Instagram when offline, an embedded player when live. Not touched this session, confirmed what it is per a direct ask.
- `/feedback` — standalone product-feedback form ("The Improvement Loop": name, email, which lever, open comments). Not touched this session, confirmed what it is per a direct ask.
- `/thank-you/*` — one per product, plus `/thank-you/contact`, `/thank-you/survey`
- Retired, shadowed at the edge via `public/_redirects` (never delete a route, just redirect it): `/community` (+ `/community/*`), `/welcome`, `/command` (→ `/coaching`), `/bundle` (→ `/shop`), `/grade-1/2/3` (→ `/coaching/grade-1/2/3`), `/vault` (→ `/shop`), `/course` (→ `/masterclass`), `/library` and `/arena` (→ `/#videos`, and unlike the others, the underlying `.astro` files were actually deleted for these two, not just shadowed — `/arena` was only ever a redirect to `/library` with no content of its own, deleting both avoided leaving a two-hop chain), `/safe-sparring` and `/safe-boxing` (→ `/first-training`)
- Two pages found to be orphaned and unreachable from any current Stripe checkout, left alone rather than deleted outright, worth a decision from Rainers at some point: `/thank-you/footwork-blueprint` (a free-delivery page from before Footwork became a $19 paid product) and `/thank-you/workshop` (the old single-tier $197 Defense Workshop confirmation, superseded by `/thank-you/defense-workshop`)

## API routes
- `/api/lead-capture` — all free forms (email required, source tag varies)
- `/api/coaching-capture` — 1-on-1 Coaching application
- `/api/contact` — contact + feedback forms
- `/api/create-checkout` — creates a Stripe Checkout Session from a `lookupKey`, single source of truth for every product's price ID, mode, success/cancel path, optional_items (order bump), and shipping collection. See Products section.
- `/api/stripe-webhook` — Stripe event handler (signature-verified, CF Workers compatible, idempotent via a D1 `processed_stripe_events` table since two webhook endpoints are currently registered on the same URL)
- `/api/submit-clip` — Defense Workshop $99 tier's clip-submission form. Verifies the session actually paid for the review tier and the email matches before saving to Airtable + Telegram alert.
- `/api/session-value` — read-only Stripe session amount lookup, added 2026-11-19 so the Grade thank-you page (shared by 5 different prices) can fire an accurate Meta Pixel Purchase value. Never completes or modifies a session.
- `/api/session-checkin` — Community session attendance check-in, also now stamps `Last Checked In` in Airtable Members for the inactivity-nudge cron.

## Environment variables (Cloudflare Pages)
```
SITE_URL                    — production domain (e.g. https://theerainers.com). Used for CORS + Stripe redirect URLs. REQUIRED.
MAKE_LEAD_WEBHOOK_URL       — free form submissions (secondary path, Resend is primary). Also used by /api/coaching-capture.
MAKE_CONTACT_WEBHOOK_URL    — contact + feedback form submissions. Separate webhook from lead. REQUIRED for contact form to deliver.
RESEND_API_KEY              — Resend transactional email API key. PRIMARY delivery method for every buyer/lead email.
MAKE_DELIVERY_WEBHOOK_URL   — post-purchase delivery trigger, secondary, only fires if set.
STRIPE_SECRET_KEY           — Stripe API key (sk_live_*). Powers /api/create-checkout, /api/stripe-webhook, /api/submit-clip, /api/session-value.
STRIPE_WEBHOOK_SECRET       — Stripe webhook signature secret.
WATCH_TOKEN_SECRET          — HMAC signing key for /watch/ token-gated pages (workshop-replay, masterclass, and the legacy community magic-link).
R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME (alias R2_BUCKET) — R2 presigned delivery for the two Blueprint PDFs + Bundle.
AIRTABLE_API_KEY / AIRTABLE_BASE_ID — Airtable PAT + base ID (THEE_RAINERS_HUB., applzsBz15zEAua4s).
AIRTABLE_TABLE               — defaults to "Members" at every call site (stripe-webhook, session-checkin). Holds every Stripe buyer, one-time and subscription alike.
KIT_API_KEY                  — Kit (ConvertKit) API key. If unset, Kit tagging is skipped silently (Stripe events still process).
KIT_COACHING_TAG_ID          — shared Grade-buyer tag (19807647, confirmed live 2026-08-17).
KIT_OAUTH_CLIENT_ID / KIT_OAUTH_CLIENT_SECRET — Kit v4 Purchases API OAuth flow (sendKitPurchase in stripe-webhook.ts).
GA4_MEASUREMENT_ID / GA4_API_SECRET — server-side GA4 purchase events via Measurement Protocol. If either is unset, skipped (logged as warning), client-side begin_checkout still fires.
ZOOM_WORKSHOP_URL            — NOT SET as of 2026-11-19. Added to stripe-webhook.ts's Defense Workshop confirmation email this session (task 1) but the env var itself does not exist yet. Until set, buyers get "The Zoom link is on its way in a separate email closer to Nov 29" instead of a real join button. SET THIS before Nov 29.
KIT_WORKSHOP_LIVE_TAG_ID / KIT_WORKSHOP_REVIEW_TAG_ID / KIT_WORKSHOP_CALL_TAG_ID — NOT SET as of 2026-11-19. Three new per-tier Defense Workshop Kit tags, wired in stripe-webhook.ts this session (task 1) so Rainers can email all three tiers the Nov 29 recording afterward. Create the three tags in Kit (Grow > Tags), paste the numeric IDs from each tag's URL (app.kit.com/tags/XXXXX) as these three Cloudflare secrets. Same pattern as the existing KIT_COACHING_TAG_ID.
```

**Silent-skip risk:** Form APIs return 200 even when their webhook URL is unset (graceful degradation). Same pattern for `KIT_API_KEY`, `AIRTABLE_TABLE`, and now the three `KIT_WORKSHOP_*_TAG_ID` vars above and `ZOOM_WORKSHOP_URL` — verify each is set after any env rotation, and specifically before Nov 29, 2026.

## Products — Stripe

All prices confirmed against this session's brief directly (price IDs given in the brief's own table), **NOT independently re-verified against live Stripe** — the Stripe CLI was expired/unauthenticated the entire session (`stripe config --list` showed `live_mode_key_expires_at` in the past, device-login never completed). Every price ID below is marked UNVERIFIED for that reason. Confirm each one's amount, currency, and type (one-time vs recurring) in the Stripe Dashboard or a working CLI session before relying on any of them in production.

### One-time
| Product | Price | lookupKey (create-checkout.ts) | Price ID | Verified? |
|---|---|---|---|---|
| Footwork Blueprint | $19 | `footwork` | price_1U7ZfRHzlarU775H5rxIJ2VS | Pre-existing, not touched this session |
| Shadowboxing Blueprint | $19 | `shadowboxing` | price_2 | Pre-existing, not touched this session |
| Bundle (both Blueprints) | $30 | `bundle` | price_1U7ZizHzlarU775HDKLCmNza | Pre-existing, not touched this session |
| Defense Workshop, Live | $49 | `defense_workshop_standard` | price_5 | Pre-existing, not touched this session |
| Defense Workshop, Live + footage review | $99 | `defense_workshop_review` | price_1UdSbdHzlarU775HtG58zLEo | **UNVERIFIED, new 2026-11-19** |
| Defense Workshop, Live + 1:1 call | $199 | `defense_workshop_call` | price_1UdTDzHzlarU775HFyWrH6Vj | **UNVERIFIED, new 2026-11-19** |
| Workshop Replay | $49 | `workshop_replay` | price_1UdSB9HzlarU775Hq80DQaKd | **UNVERIFIED, changed 2026-11-19** (previously had no working lookupKey at all) |
| Workshop Replay order bump (on all 3 Blueprint checkouts) | $29 | n/a, Stripe `optional_items` | price_1UdSi8HzlarU775HTvJw8zvu | **UNVERIFIED, new 2026-11-19** |
| Masterclass | $79 | `masterclass` | price_1UdTErHzlarU775HQrnlmVcX | **UNVERIFIED, changed 2026-11-19** from $57 (price_1UZbeWHzlarU775Hz6RkaVet) |
| Grade 1 | $347 | `grade1` | price_1U4q3eHzlarU775Hfstnii3t | Pre-existing, not touched this session |
| Grade 2 | $997 | `grade2` | price_1U4qbjHzlarU775HijJLIBDl | Pre-existing, not touched this session |
| Grade 3 | $12,000 | `grade3` | price_1U4qerHzlarU775HfPUhdhNb | Pre-existing, not touched this session. Capped at 5 seats total across the one-time price and the payment plan combined (`src/data/grade3-seats.ts`, manual counter, update by hand as seats sell). |

### Subscription (payment plans, not open-ended memberships)
| Product | Price | lookupKey | Price ID | Verified? |
|---|---|---|---|---|
| Grade 2, 3-payment plan | 3 x $365 | `grade2_plan` | price_1UdTFcHzlarU775HnwooM3gk | **UNVERIFIED, new 2026-11-19** |
| Grade 3, 3-payment plan | 3 x $4,400 | `grade3_plan` | price_1UdTH7HzlarU775HTuLyiPhy | **UNVERIFIED, new 2026-11-19** |

Mechanics: both run in Stripe subscription mode so Stripe handles the recurring charge, but `stripe-webhook.ts` tracks `payments_made` in the subscription's own metadata and calls `subscriptions.cancel()` right after the 3rd invoice pays — no 4th charge ever happens. Fulfillment (confirmation email, Kit tag, Airtable, GA4, Telegram) fires once, on the first payment only; `invoice.payment_succeeded` renewals (payments 2 and 3) update Airtable/GA4/Telegram but do not re-send the confirmation email. A completed 3-payment plan is excluded from the "Before you go" win-back email on cancellation (`plan_completed: 'true'` metadata flag) since it's a finished plan, not churn.

### Retired
| Product | Price | Notes |
|---|---|---|
| The Weekly Session / Greatness Community | $39/mo or $390/yr | Zero active subscribers at retirement. `/community` 301s to `/coaching`. As of 2026-11-19, `greatness_monthly`/`greatness_annual` were removed from `create-checkout.ts`'s PRODUCTS map entirely — checkout can no longer be triggered at all, not just hidden from the UI. Stripe products/prices themselves were never archived in the Stripe Dashboard — that's Rainers' own task, not done from this codebase. |
| Defense Workshop, early-bird | $39 | `defense_workshop_early` / price_6, removed 2026-11-19. Window had already closed 2026-08-08. |

`src/data/products.ts` is the single-price-per-product source of truth consumed by page copy (not by checkout tiers — Defense Workshop's two upsell tiers and the Grade payment plans live only in `create-checkout.ts`'s PRODUCTS map, since `products.ts`'s `Product` type is single-price, not built for tiers). Grade 1/2/3 are deliberately excluded from `products.ts` — navigation and the Grade pages are a separate system.

## PDFs
- `/public/pdfs/footwork-foundation.pdf` — real PDF, wired correctly
- `/public/pdfs/lever-audit.pdf` — PLACEHOLDER. Real source: `/public/lever-audit-print.html`
- TO GENERATE: Open `/lever-audit-print.html` in Chrome → Print → Save as PDF → `/public/pdfs/lever-audit.pdf` → commit + push

## Featured YouTube video
- ID: `vdUDuFRUqGo` — "Why You Can't Defend Yourself" (added 2026-06-14, pairs with Defense Workshop)

## Homepage Videos section
`src/data/videos.ts` — 7 entries (Swivel Jab, 90% Quit Boxing, Take a small step with your lead foot, Steps, 7 setups in boxing (with steps), Step-Shuffles, 10,000 kicks), each shipped with empty `url`/`thumbnail` fields. The homepage's `#videos` section (`src/pages/index.astro`) only renders a tile once both fields are filled in — **Rainers needs to fill these in**, each `url` pointing at the real video on Instagram or YouTube.

## Social presence
Counts live in `src/data/social-stats.ts` (single source of truth). **Last updated 2026-06-07 — stale, flagged again this session, update when numbers change.**
- Instagram: @theerainers
- Facebook: @theerainers
- TikTok: @theerainers
- Threads: @theerainers
- YouTube: @theerainers (corrected from the wrong @Rainers handle, found in three places this session: Footer, Organization schema sameAs, and /about's own follow link — all three now agree)

## Meta Pixel (added 2026-11-19)
Pixel ID `988825980478625`. Loader-only in `src/layouts/Base.astro` (`window.__trbLoadMetaPixel`), not executed until the visitor grants `ad_storage` through the existing cookie banner (same `trb_consent_v1` key and Consent Mode v2 flow GTM already used) — either immediately on a page load after a prior "accept," or the moment `CookieConsent.astro`'s Accept button is clicked this session. The `<noscript>` fallback from Meta's own snippet is deliberately not included, since it cannot wait for consent.
- PageView: fires the moment the pixel loads.
- Lead: fires from `window.trackEvent('generate_lead', ...)`, which every opt-in form on the site already calls — no per-page wiring needed.
- Purchase (value + USD): fires from each purchase thank-you page. Five pages (footwork, shadowboxing, bundle, workshop-replay, masterclass) pass a literal dollar value. `/thank-you/defense-workshop` reads its own `?tier=` param for 49/99/199. `/thank-you/coaching` (shared by 5 different Grade prices) calls the new `/api/session-value` endpoint to get the real Stripe amount.
- Documented in `/legal/cookie-policy` (Analytics and advertising section, `_fbp` cookie table row). Two previously-false claims on that page ("no third-party ad pixels", "we do not use Facebook Pixel") were removed this session — they were true before, not after.

## Automation — Make.com

### MAKE_LEAD_WEBHOOK_URL
Receives free form submissions. Payload:
```json
{ "email": "...", "full_name": "", "source": "..." }
```
Secondary path only. Resend (via lead-capture.ts) is the primary delivery method.

### MAKE_DELIVERY_WEBHOOK_URL
Receives purchase events (initial + monthly renewals). Secondary path only, Resend (via stripe-webhook.ts) is primary and does not depend on this being set.

### Airtable
`source` field is Single line text. Upsert uses `fieldsToMergeOn: ['Email']`.

**Base:** `THEE_RAINERS_HUB.` (`applzsBz15zEAua4s`) is the only live base.

**Tables and what writes to them:**
| Table | Written by | Notes |
|---|---|---|
| Leads | `lead-capture.ts` | Free opt-ins. |
| Members | `stripe-webhook.ts`, `community-access.ts`, `session-checkin.ts` | Every Stripe buyer, one-time and subscription alike. `session-checkin.ts` also stamps `Last Checked In` here now. |
| Events | `track.ts` | Sitewide `checkout_click` beacon log. |
| Email_Events | `resend-webhook.ts` | Resend delivery events. |
| Survey_Responses | `survey.ts` | Anonymous product feedback. |
| Clip_Submissions | `submit-clip.ts` (new, 2026-11-19) | Defense Workshop $99 tier's footage-review submissions. Fields: Email, Clip URL, Stripe Session ID, Submitted At. Created directly via Airtable MCP this session. |
| Purchases | Read-only by `resend-access.ts`, filtered on `access_token` | No code path writes to this table. Either dead or something external populates it manually — unconfirmed. |

## Automation — Kit lifecycle cron (trb-session-cron)
Standalone Cloudflare Worker, not part of this Astro deploy — lives at `/Users/ghoste/Rainers/trb-session-cron/` (sibling to `site/`). See that repo's own context for details; unchanged this session. Three Cron Triggers: Community Session Reminder/Recap (Mon + Wed 08:00 UTC) and Community Inactivity Nudge (Sun 09:00 UTC, code-complete but not yet deployed, blocked on `wrangler secret put` for Airtable secrets).

## Delivery system architecture

### File-based products (R2 presigned, 7-day expiry)
Bucket: `theerainers-vault`. Footwork, Shadowboxing, Bundle PDFs. AWS SigV4 signing implemented natively in CF Workers (`crypto.subtle`), no AWS SDK.

### Token-gated watch pages (no expiry — unlisted YouTube, not a file)
- `/watch/workshop-replay` — unlisted YouTube `AtZmUk7cZFQ`. Shared by the standalone $49 purchase, Defense Workshop attendee fulfillment (all three tiers), and the $29 order bump on any Blueprint checkout.
- `/watch/masterclass` — separate signed URL, `generateWatchUrl('masterclass')`.
Invalid/missing signature redirects to the product's own sales page.

### Defense Workshop fulfillment (3 tiers)
All three tiers get the replay link + a confirmation email with the Zoom join button (pending `ZOOM_WORKSHOP_URL` being set, see Environment variables above) and a Kit tag for their specific tier (pending the three `KIT_WORKSHOP_*_TAG_ID` secrets being set). The $99 tier additionally gets a clip-submission form on its thank-you page and in its confirmation email (`/api/submit-clip`, verified against the paid session before saving, Airtable + Telegram alert). The $199 tier gets a Calendly link (`calendly.com/theerainers/1-1`) for a post-event 1:1 call.

### Order bump (Blueprint checkouts)
The $29 Workshop Replay is offered as a Stripe-native `optional_items` cross-sell on all three Blueprint checkouts (Footwork, Shadowboxing, Bundle). If taken, the webhook retrieves the session's line items, detects the bump price ID, and also delivers replay access on top of the base product — included in the GA4 purchase value, the Telegram alert, and the Airtable record.

### Subscription renewals
`invoice.payment_succeeded` (billing_reason: subscription_cycle) handles both the legacy open-ended-membership path (none currently live) and the new Grade payment-plan path (count toward 3, cancel after the 3rd). Initial purchase handled by `checkout.session.completed` only.

## Pending — prioritized

1. **[BLOCKED, time-sensitive] Set `ZOOM_WORKSHOP_URL`** before Nov 29, 2026 — without it, every Defense Workshop buyer's confirmation email says the Zoom link is coming in a separate email instead of a real join button.
2. **[BLOCKED, time-sensitive] Create 3 Kit tags and set `KIT_WORKSHOP_LIVE_TAG_ID` / `KIT_WORKSHOP_REVIEW_TAG_ID` / `KIT_WORKSHOP_CALL_TAG_ID`** before Nov 29, 2026 — without these, per-tier buyers aren't tagged, making it harder to email all three tiers the recording afterward.
3. **[VERIFY] Every new/changed Stripe price ID from this session** (see Products table above) — Stripe CLI access was not available this session, nothing was confirmed against live Stripe beyond the brief's own stated table.
4. **[NEEDS RAINERS] Fill `src/data/videos.ts`** — 7 titles shipped, all with empty url/thumbnail. Homepage Videos section renders nothing useful until these are filled in.
5. **[DECISION NEEDED] Two orphaned thank-you pages** — `/thank-you/footwork-blueprint` and `/thank-you/workshop`, neither reachable from any current checkout. Delete, or leave as-is (shadowed/unreachable, same as other retired routes)?
6. **[UNVERIFIED] Workshop length assumed at 2 hours** — not documented anywhere else in the codebase before this session; `src/data/defense-workshop.ts` assumes 2 hours for the date-driven ticket/replay switchover. Confirm the real length with Rainers and adjust `WORKSHOP_DURATION_MINUTES` if different.
7. **[ONGOING] Platform bios** — update to theerainers.com/links once all is confirmed live.
8. **[BLOCKED] trb-session-cron Phase 2 deploy** — code complete, waiting on Rainers to set Airtable secrets via `wrangler secret put`.
9. **[BLOCKED] Kit account plan** — Kit MCP write access (custom fields, sequence settings, new tag creation) is gated behind a paid plan upgrade. This is why the Defense Workshop per-tier tags above need to be created manually in the Kit dashboard rather than via API.
10. **[VERIFY] trb-session-cron first live run** — deployed 2026-08-02, actual enrollment behavior still unverified.
11. **[UNCONFIRMED] Purchases table has no writer** — see Airtable table above.

## Done — reference (this session, 2026-11-19, branch `myron-audit-build`)
Full 14-task brief from an audit against Myron Golden's funnels. One commit per task (some tasks split across more than one commit where the diff was large). Not pushed, not merged, not deployed — branch sits for review.
- Tasks 1, 2, 3, 5, 6: Stripe product catalog rebuilt in one pass (`create-checkout.ts`, `stripe-webhook.ts`, `products.ts`) — Defense Workshop's 3 tiers, Workshop Replay made buyable, the $29 order bump, Grade payment plans + shipping collection, Greatness fully retired from checkout. Then wired into the actual pages: Defense Workshop date/tiers/date-driven switchover, the tier-aware thank-you page, the date-driven OfferStack strip, Workshop Replay's buy buttons, Grade anchor/bonus/payment-plan copy on both /coaching and the individual Grade pages. A stale `TR_PRODUCTS` tracking map in Base.astro (GA4 begin_checkout client-side tracking) was found out of sync with all of this and fixed in the same pass.
- Task 4: Masterclass renamed and repriced site-wide, 2.9MB hero PNG swapped for the existing webp via `<picture>`.
- Task 7: `/library` and `/arena` deleted outright, redirect to `/#videos`. `/safe-sparring`/`/safe-boxing` shadowed via redirect to `/first-training`, files kept.
- Task 8: Full homepage rebuild in the brief's 7-step order.
- Task 9: Nav rebuilt (HOME/TRAINING dropdown/ABOUT/CONTACT + Free Guide button, larger/legible text and logo). Footer link row reordered to the full ladder.
- Task 10: Section spacing and content-width normalized across 5 surfaces (see Layout pattern above for the resulting scale).
- Task 11: /about got the Giancarlo proof line and a /safe link, plus 3 unrelated stale-link/wrong-handle bugs found and fixed while reading the page.
- Task 12: Meta Pixel installed, consent-gated, PageView/Lead/Purchase wired, disclosed in /legal/cookie-policy (which had two now-false claims removed).
- Task 13: confirmed already clean, no code change needed — re-verified no "Holy Virtues" text exists anywhere in `src/` or this file.
- Task 14: email logo resized 1.35MB → 80KB, 37 unreferenced images deleted (~34MB), confirmed the two other large referenced images already serve an optimized webp to real traffic.

## Deployment
`git push` → Cloudflare Pages auto-deploys `main`. No manual steps. **This branch has not been pushed, merged, or deployed — Rainers reviews first, per his own explicit instruction this session.**

## Rituals

### pre-push (run before every git push)
```
# 1. Em dash grep in visible copy — zero output = pass (code comments and
#    server-side console.log/console.error strings are not visible copy
#    and are exempted — this codebase already uses em-dashes extensively
#    in comments, that's an established, accepted pattern, not a target)
grep -rn "—\|–" src/ --include="*.astro" --include="*.ts" --include="*.tsx" --include="*.md" | grep -v "^\s*//\|console\.\(log\|warn\|error\)"

# 2. Placeholder grep — should return zero matches
grep -r "NEEDS RAINERS\|REPLACE_WITH\|TODO:" src/pages/ -l
```
If any grep returns output, fix before pushing.

### weekly-audit (run every Monday)
```
# Page health — each should return 200
for path in / /coaching /defense-workshop /workshop-replay /masterclass /foundation /shop /about /first-training /safe; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://theerainers.com$path")
  echo "$code $path"
done

# GTM presence — should contain GTM-5LQ7HPXG
curl -s https://theerainers.com | grep -o "GTM-[A-Z0-9]*"

# Meta Pixel loader present (does not mean it fired — that needs consent)
curl -s https://theerainers.com | grep -q '__trbLoadMetaPixel' && echo "PASS" || echo "FAIL"
```

### copy-pass (run before any page goes live)
1. Load `.claude/skills/trb-voice/SKILL.md`
2. Grep for banned patterns: em dash in visible copy, rhetorical headers
3. Read every h1/h2/CTA label out loud — does it earn attention before asking for anything?
4. Check numeric counts — never state buyer counts, replace with proof density
5. Confirm all system names use exact locked names (Masterclass, Defense Workshop, Grade 1/2/3, Workshop Replay)

### measure (run after any funnel change)
GA4 funnel state — open GA4 → Reports → Engagement → Events, confirm:
- `begin_checkout` fires on every Stripe CTA click, including the newer tiers/plans (Base.astro's `TR_PRODUCTS` map must stay in sync with `create-checkout.ts`'s PRODUCTS map — this drifted out of sync once already this session, worth a periodic check)
- `purchase` events arrive after real test transactions
- Meta Pixel Purchase events arrive with the right value (check Events Manager, Test Events tool)
If `purchase` events are missing: GA4_MEASUREMENT_ID + GA4_API_SECRET set in Cloudflare Pages env.

## Contact
rainers@theerainers.com

## Operational rules — non-negotiable

### Recon-first protocol
Read and report before changing anything. State what exists, what the problem is, and what the proposed fix is. Wait for approval. "Fix it while you're there" is not approval. (This session's brief explicitly authorized exactly that pattern for its own 14 tasks plus directly-adjacent bugs found while touching the same files — that authorization does not extend to future sessions by default.)

### Brand voice (enforced — no exceptions in visible copy)
- No em dashes (—) or en dashes (–) in visible copy. Use a period or comma. Code comments and server log strings are not visible copy.
- No exclamation marks anywhere.
- No hype voice, no rhetorical headers.
- Short, direct sentences. State the thing. Move on.
- Show WHY, never HOW. Pages diagnose and invite — they do not teach the curriculum before someone pays.
- Never state numeric buyer counts. Replace with proof density or remove.
- Full voice rules: `.claude/skills/trb-voice/SKILL.md`

### gitignore — macOS case-insensitive trap
`*.JPG` in .gitignore matches `*.jpg` files on macOS HFS+ (case-insensitive filesystem). Production images in `public/` must always be committed — they are served as static assets, not source files. The .gitignore includes `!public/**/*.jpg` negation rules to force-include them. If you add a new image extension to the ignore list, add a matching negation for `public/**`.

### Internal links
Before linking to any internal URL, confirm the page exists in the pages inventory above and is not a redirect source. Link the canonical destination directly (e.g. `/coaching`, not `/command`) — a redirect still resolves, but it's an unnecessary hop and the previous session found 6 separate stale internal links pointing at redirect sources instead of real destinations. `/journal` does not exist — do not link to it.

### Unused images
Before deleting anything from `public/images`, grep every `.astro`/`.ts`/`.tsx`/`.json` file in `src/`, plus `public/site.webmanifest`, `public/robots.txt`, `public/sitemap.xml`, `public/_redirects`, and `src/styles/global.css`, for the exact filename as a literal string. This codebase has no templated/dynamic image-path construction anywhere (confirmed twice now) — a literal grep is a complete check.

### 500 page reporting
`/api/error-report` (POST) — forwards `{ source, url, referrer, timestamp }` to `MAKE_LEAD_WEBHOOK_URL`. Make filters on `source === "error-report"` to route to Rainers' inbox + Airtable log. Fire-and-forget; client shows "Reported." on success or failure.

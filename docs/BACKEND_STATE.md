# BACKEND_STATE.md — Thee Rainers
> Read-only discovery pass. Current state as of 2026-06-30.
> Measure gaps against TARGET: value ladder with low-ticket Blueprints as front door → group community → 1-on-1.

---

## 1. Stack and Deploy

| Layer | Detail |
|---|---|
| Framework | Astro **6.3.6** (CLAUDE.md says "Astro 4" — stale doc) |
| Runtime | Cloudflare Workers (SSR via `@astrojs/cloudflare` 13.5.3) |
| CSS | Tailwind v4 — `@theme` CSS vars, no config file |
| Fonts | Bricolage Grotesque Variable (`@fontsource-variable`) |
| Payments | Stripe SDK 22.1.1 |
| Other deps | `googleapis` 172.0.0 (only referenced in `scripts/update-yt-descriptions.mjs`, not in the live app) |
| Build | `astro build` — fails hard in `PROD` if workshop date or Proving Ground date is past |
| Deploy | `git push main` → Cloudflare Pages auto-deploys. No wrangler.toml. Managed in Cloudflare dashboard. |
| Env vars | Set in Cloudflare Pages dashboard. Not in any committed file. `.env` gitignored. |
| CI | GitHub Actions: one workflow (`monthly-report.yml`) — calls `/api/monthly-report` on 1st of month |

### Directory tree (abridged, no node_modules / dist / .git)
```
site/
├── astro.config.mjs          — minimal: cloudflare adapter + tailwind vite plugin
├── CLAUDE.md                 — project context, env var list, pending items
├── public/
│   ├── _redirects            — Cloudflare Pages redirect rules
│   ├── _headers              — CSP, HSTS, CORS for /api/*
│   ├── llms.txt              — AI crawler context file (STALE — wrong prices + date)
│   ├── sitemap.xml           — manual sitemap (includes dead URLs)
│   ├── pdfs/                 — footwork-foundation.pdf (real), lever-audit.pdf (placeholder)
│   └── images/               — static brand assets
├── src/
│   ├── layouts/
│   │   ├── Base.astro        — GTM, GA4, TR_PRODUCTS catalog, data-checkout delegation
│   │   └── LinkPage.astro    — /links layout (no GTM, minimal)
│   ├── pages/
│   │   ├── api/              — 9 SSR endpoints (see route map)
│   │   ├── community/        — index + inside (member gate)
│   │   ├── legal/            — 6 legal pages
│   │   ├── thank-you/        — 5 post-purchase pages
│   │   ├── watch/            — workshop-replay (token-gated)
│   │   └── private-architecture/[token].astro
│   ├── data/
│   │   ├── workshop.ts       — date source of truth (WORKSHOP_DATE_ISO = 2026-07-25)
│   │   ├── proving-ground.ts — next session date (PROVING_GROUND_ISO = 2026-07-04)
│   │   ├── social-stats.ts   — follower counts (last updated 2026-06-07)
│   │   └── testimonials.ts   — testimonial data
│   └── lib/
│       ├── telegram.ts       — fire-and-forget Telegram alert helper
│       └── r2-presign.ts     — AWS SigV4 presigner (used only by private-architecture)
└── docs/
    ├── make-scenarios/       — Make.com build guides + JSON blueprints
    └── voice/                — copy guidelines
```

---

## 2. Route Map

| Route | Purpose | Status | Type |
|---|---|---|---|
| `/` | Homepage — funnels to workshop + free blueprint | Live | Content |
| `/about` | Founder page | Live | Content |
| `/links` | Bio link hub — universal social entry | Live | Content |
| `/foundation` | Free Footwork Blueprint + email capture | Live | Commercial (lead) |
| `/lever-audit-quiz` | 7-lever interactive quiz + email gate | Live | Commercial (lead) |
| `/shop` | Product listing — 2 cards only (see gap below) | **Partial** | Commercial |
| `/shadowboxing-blueprint` | Shadowboxing Blueprint sales page | Live | Commercial |
| `/workshop` | Defense Workshop $197, live July 25 | Live | Commercial |
| `/workshop-replay` | Workshop Replay $47, on-demand | Live | Commercial |
| `/community` | Greatness Community $39/mo or $390/yr | Live | Commercial |
| `/community/inside` | Member gate — email lookup → Airtable | Live | Commercial |
| `/command` | Private Architecture coaching application | Live | Commercial |
| `/welcome` | Post-community-purchase confirmation | Live | Post-purchase |
| `/watch/workshop-replay` | Token-gated video (HMAC validated server-side) | Live | Delivery |
| `/private-architecture/[token]` | Token-gated R2 PDF delivery (older flow) | Live | Delivery |
| `/gate` | Filtering gate ("building a system vs get fit") | Live, noindex | Funnel |
| `/library` | YouTube archive | Live | Content |
| `/streaming` | Live stream page (checks live-status.json) | Live, noindex | Content |
| `/qa` | Monthly Q&A registration + email capture | Live | Commercial (lead) |
| `/vault` | 301 → `/shop` | Redirect | — |
| `/arena` | 301 → `/library` | Redirect | — |
| `/feedback` | Feedback form | Live | Support |
| `/contact` | Contact form | Live | Support |
| `/thank-you/footwork` | Post-blueprint download | Live | Post-purchase |
| `/thank-you/shadowboxing` | Post-shadowboxing purchase | Live | Post-purchase |
| `/thank-you/workshop` | Post-workshop purchase | Live | Post-purchase |
| `/thank-you/workshop-replay` | Post-replay purchase | Live | Post-purchase |
| `/thank-you/contact` | Post-contact submission | Live | Post-purchase |
| `/legal/*` | 6 legal pages (cookie, privacy, terms, refund, disclaimer, accessibility) | Live | Legal |
| `/404`, `/500` | Error pages | Live | System |
| `/api/lead-capture` | Free opt-in handler — welcome email + sequence + Kit + Airtable + Make | Live | API |
| `/api/stripe-webhook` | Stripe event handler — delivery + Kit tagging + Airtable + GA4 | Live | API |
| `/api/create-checkout` | Creates Stripe Checkout Sessions for subscription products | Live | API |
| `/api/coaching-capture` | 1-on-1 application → emails Rainers via Resend | Live | API |
| `/api/community-access` | Email → Airtable lookup → returns `{access: bool}` | Live | API |
| `/api/portal` | Creates Stripe Customer Portal session | Live | API |
| `/api/resend-access` | Re-sends delivery link via Make.com (reads Airtable Purchases table) | Live | API |
| `/api/contact` | Contact/feedback form → Make.com CONTACT webhook | Live | API |
| `/api/error-report` | 500-page error report → Make.com LEAD webhook | Live | API |
| `/api/monthly-report` | GitHub Actions cron → Stripe MRR report → Resend email | Live | API |

**Dead/stale in sitemap:** `/foundation-guide`, `/footwork-foundation`, `/lever-audit` — these redirect (301) but are listed in sitemap.xml at their old URLs. Google gets redirect chains.

---

## 3. Products and Value Ladder

### As it exists today

| Product | Price | Price location | Purchase path | Status |
|---|---|---|---|---|
| Footwork Blueprint | FREE | Hardcoded (free) | `/foundation` → email → PDF link | Live |
| Workshop Replay | $47 | Hardcoded in Stripe Payment Link + `PRODUCTS` map | `buy.stripe.com/6oU...` (Payment Link) | Live |
| Shadowboxing Blueprint | $47 | Hardcoded in Stripe Payment Link | `buy.stripe.com/5kQ...` (Payment Link) | Live |
| Bundle (both blueprints) | $87 | Hardcoded in CLAUDE.md / Stripe | No page. Stripe direct link only. | **Broken — no purchase path on site** |
| Defense Workshop (live) | $197 | Hardcoded | `buy.stripe.com/7sY...` (Payment Link) | Live |
| Greatness Community (monthly) | $39/mo | Hardcoded in `create-checkout.ts` | `data-checkout="greatness_monthly"` → Checkout Session | Live |
| Greatness Community (annual) | $390/yr | Hardcoded in `create-checkout.ts` | `data-checkout="greatness_annual"` → Checkout Session | Live |
| Private Architecture (1-on-1) | Application only | N/A | `/command` form → Resend email to Rainers | Live |

### Value ladder reconstruction

```
FREE:           /foundation (Footwork Blueprint — email gate)
$47:            /workshop-replay (on-demand, 7-day access)
$47:            /shadowboxing-blueprint (PDF, R2 delivery)
$87:            [NO PAGE] — bundle exists in Stripe + webhook, not on site
$197:           /workshop (live, July 25, 90 min)
$39/mo–$390/yr: /community (Greatness Community)
Application:    /command (Private Architecture)
```

**Gaps in ladder:**
- Footwork Blueprint (paid $47) exists in Stripe product catalog (`prod_UZrejf6iuDorEA`) and in webhook delivery code. The `/foundation` page gives it free as a lead magnet. No paid path to buy the Footwork Blueprint is wired on the site (intentional per current strategy, but creates a confusing Stripe product).
- Bundle ($87) has no page and no CTA anywhere on the site. Welcome email template references `/vault` for it — which 301s to `/shop` — which doesn't show it.
- `/shop` only lists 2 products: Footwork (free) and Shadowboxing ($47). Workshop, Replay, Community, and Bundle all have separate teasers below, but no consolidated ladder view.

### Payment method split (inconsistency)
- Workshop, Workshop Replay, Shadowboxing Blueprint: **Stripe Payment Links** (buy.stripe.com URLs, no session tracking)
- Greatness Community: **Checkout Sessions** via `create-checkout.ts` (full session metadata, GA4 attribution works)

Checkout Sessions give better attribution, refund control, and metadata. Payment Links don't pass session IDs back to thank-you pages, breaking the portal link on `/welcome`.

---

## 4. Payments (Stripe)

**Wiring method:** Mixed — Payment Links for one-time products, Checkout Sessions for subscriptions.

### Product → Stripe ID map
| Slug | Stripe Product ID | Stripe Price ID (Sessions) | Stripe Payment Link |
|---|---|---|---|
| footwork | `prod_UZrejf6iuDorEA` | — | `buy.stripe.com/bJe...` |
| shadowboxing | `prod_UZreDlek9325EY` | `price_1Tb1DHHzlarU775HIzI4fY8r` | `buy.stripe.com/5kQ...` |
| bundle | `prod_UZreHroYQEDAFU` | — | `buy.stripe.com/14A...` |
| workshop-replay | `prod_UZOMBOeJ0mm15I` | `price_1Tb1ILHzlarU775H0NVAhRgb` | `buy.stripe.com/6oU...` |
| greatness (monthly) | `prod_Uaz6EzELZP6j0V` | `price_1Tbn8WHzlarU775HMfmbxaJy` | — |
| greatness (annual) | `prod_Uaz6EzELZP6j0V` | `price_1Tbn93HzlarU775HrkAJ73Yf` | — |

**Note:** `monthly-report.ts` references 3 old subscription product IDs (`prod_UZ9l...`, `prod_UZ9v...`, `prod_UZ9x...`) labelled "$47/mo" each. These are the pre-Greatness-Community per-blueprint memberships. They appear to be superseded. Monthly revenue report will misattribute if these products still have active subscribers.

### Webhook events handled
- `checkout.session.completed` — initial purchase, delivery, Kit tagging, Airtable upsert, GA4
- `invoice.payment_succeeded` (billing_reason: subscription_cycle) — renewal delivery only
- `customer.subscription.updated` — Airtable status sync + Kit tag/untag
- `customer.subscription.deleted` — Airtable cancellation + Kit untag

### Delivery flow (post-purchase)
1. **Primary:** Resend email with 7-day R2 presigned URL (PDFs) or HMAC-signed watch URL (replay) or `/community/inside` link (Greatness)
2. **Secondary:** Make.com `MAKE_DELIVERY_WEBHOOK_URL` fires if set — for extra automations

### Success/cancel URL status
| Product | Success URL in code | Actual status |
|---|---|---|
| Shadowboxing (Session) | `/thank-you/shadowboxing` | Set in `create-checkout.ts` |
| Workshop Replay (Session) | `/thank-you/workshop-replay` | Set in `create-checkout.ts` |
| Greatness Community | `/welcome` | Set in `create-checkout.ts` |
| Workshop Replay (Payment Link) | **Unknown — set in Stripe Dashboard** | CLAUDE.md flags as [URGENT]: not yet updated |
| Shadowboxing (Payment Link) | **Unknown — set in Stripe Dashboard** | CLAUDE.md flags as pending |
| Workshop (Payment Link) | **Unknown — set in Stripe Dashboard** | Unknown from repo |

### Env vars referenced (Stripe)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## 5. Booking (Cal.com)

**Cal.com: not present.** Zero references in any `.astro`, `.ts`, or config file. No embed, no API call, no link.

The coaching application (`/command`) uses a form that POSTs to `/api/coaching-capture` → Rainers receives a Resend email with the full application. Response/booking is entirely manual from that point.

**Gap vs target state:** Cal.com is listed as part of the target stack. It is not integrated.

---

## 6. Email (Kit)

### Integration method
Kit v4 API (REST), called server-side from Workers. No Kit embed forms or JS snippets.

### Lead capture points and Kit behavior
| Entry point | Source tag | Kit behavior |
|---|---|---|
| `/foundation` | `footwork-blueprint` | Find-or-create subscriber → apply `KIT_LEAD_TAG_ID` tag |
| `/lever-audit-quiz` | `lever-audit-quiz` | Same |
| `/qa` | `qa-registration` | Same |
| Stripe purchase (any) | — | Apply product-specific tag + `KIT_MEMBER_TAG` (19807647) |
| Stripe purchase (Blueprint) | — | Also apply `KIT_TRIAL_TAG_ID` (20130499) for 14-day trial sequence |

### Kit tag IDs (hardcoded in stripe-webhook.ts)
| Product slug | Tag ID |
|---|---|
| footwork | 19807643 |
| shadowboxing | 19807641 |
| bundle | 19807644 |
| greatness | 19830354 |
| member (any) | 19807647 |
| 14-day trial | 20130499 |

### Welcome/nurture sequence
**Wired.** Sequence lives in `lead-capture.ts` and fires via Resend scheduled emails at opt-in.

| Day | Subject |
|---|---|
| 0 (immediate) | Source-specific welcome (footwork, lever-audit, Q&A, or quiz) |
| D+2 | "why I started training this way" |
| D+4 | "the session is recorded" (Workshop Replay pitch at $47) |
| D+5 | "The Footwork Blueprint (Control Inside Ring)" — Loom breakdown |
| D+8 | "how to defend yourself" (Workshop pitch at $197) |

**Issue:** D+8 email hardcodes "July 25" and "8 spots · Live · July 25 · 12PM ET". This will be stale after July 25 and requires a manual code edit.

**Issue:** Sequence fires for ALL sources. The D+5 Footwork Blueprint Loom email is sent to people who already downloaded the Footwork Blueprint at opt-in.

### Post-purchase email (Greatness Community)
The Resend delivery email for 'greatness' sends: "You are in." + a button to `/community/inside`. It does **not** include:
- Zoom link for next Proving Ground
- Community chat invite link
- Customer Portal link

The `/welcome` page (where buyers land post-checkout) does show these if env var `COMMUNITY_CHAT_INVITE` is set and `session_id` is in the URL. But the delivery email is thin.

### Env vars referenced (Kit + email)
- `KIT_API_KEY`
- `KIT_LEAD_TAG_ID`
- `RESEND_API_KEY`

---

## 7. Automations (Make.com)

### Webhooks wired in code
| Env var | Used by | Purpose |
|---|---|---|
| `MAKE_LEAD_WEBHOOK_URL` | `lead-capture.ts`, `coaching-capture.ts`, `error-report.ts` | Free opt-ins, coaching applications, 500 error reports |
| `MAKE_CONTACT_WEBHOOK_URL` | `contact.ts` | Contact/feedback form submissions |
| `MAKE_DELIVERY_WEBHOOK_URL` | `stripe-webhook.ts`, `resend-access.ts` | Post-purchase product delivery (secondary path) |

### Scenario status
Per `docs/make-scenarios/00-checklist.md`:
- **Lead Capture scenario**: marked as needing build or verification. Status unknown from repo.
- **Delivery scenario**: marked as "already built, verify only". Status unknown from repo.

Both scenarios have JSON blueprint files in `docs/make-scenarios/blueprints/` for import.

**Silent fail risk:** All three webhook calls return 200 to the browser even if the webhook URL is unset or Make.com rejects the payload. No visible failure. Logs show the status but only in Cloudflare dashboard.

---

## 8. Data (Airtable)

### Integration points
| Code file | Table used | Operation | Default table name |
|---|---|---|---|
| `stripe-webhook.ts` | Members | Upsert on purchase, update on subscription change | `Members` (env override: `AIRTABLE_TABLE`) |
| `lead-capture.ts` | Leads | Upsert on free opt-in | `Leads` (env override: `AIRTABLE_LEADS_TABLE`) |
| `community-access.ts` | Members/Customers | Read — lookup by email + product="greatness" | `Customers` (env override: `AIRTABLE_TABLE`) |
| `resend-access.ts` | Purchases | Read — lookup by access token | Hardcoded: `Purchases` |

### Critical env var mismatch
`community-access.ts` defaults to "Customers". `stripe-webhook.ts` defaults to "Members". Both read the same `AIRTABLE_TABLE` env var. If `AIRTABLE_TABLE` is set to "Members", community-access works. If set to "Customers", purchases don't write to the right table. If not set, community-access looks in "Customers" but stripe-webhook writes to "Members" — **community gate returns false for all paying members.** This must be verified.

### Fields written on purchase (Members table)
`Email`, `Name`, `Status` (active/canceled/etc), `Product` (slug), `Stripe Customer`, `Stripe Subscription`

### Env vars referenced (Airtable)
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE` (controls both Members writes and community-access reads — must match)
- `AIRTABLE_LEADS_TABLE`

---

## 9. Content and SEO/GEO

### Schema markup
| Page | Schema type | Status |
|---|---|---|
| `/workshop` | `Event` + `FAQPage` | Present, wired |
| `/foundation` | `Book` (free product) | Present |
| `/shadowboxing-blueprint` | `Product` | Present |
| `/shop` | `Product` (array) | Present — but misses Bundle, Workshop, Community |
| All others | None | Missing |

### llms.txt
Present at `/public/llms.txt`. **Stale:**
- Workshop Replay price: says $79 (actual: $47)
- Workshop date: says June 27 (actual: July 25)
- Social counts: outdated (Instagram 331K, TikTok 90K, YouTube 15K — doesn't match `social-stats.ts`)

### robots.txt
Present. Allows all crawlers.

### sitemap.xml
Manual. Includes dead redirect sources (`/foundation-guide`, `/footwork-foundation`, `/lever-audit`) instead of their canonical destinations. Missing `/shadowboxing-blueprint`, `/community`, `/shop`.

### FAQ blocks
Present on `/workshop` and `/workshop-replay`. Not present on `/foundation`, `/shop`, `/shadowboxing-blueprint`, or `/community`.

---

## 10. Config and Security

### All env vars expected (names only, no values)
| Variable | Used by | Required? |
|---|---|---|
| `SITE_URL` | `lead-capture.ts`, `create-checkout.ts`, CORS | Required |
| `STRIPE_SECRET_KEY` | `stripe-webhook.ts`, `create-checkout.ts`, `portal.ts` | Required |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook.ts` | Required |
| `RESEND_API_KEY` | `lead-capture.ts`, `stripe-webhook.ts`, `coaching-capture.ts`, `monthly-report.ts` | Required for delivery |
| `MAKE_LEAD_WEBHOOK_URL` | `lead-capture.ts`, `coaching-capture.ts`, `error-report.ts` | Optional (graceful skip) |
| `MAKE_CONTACT_WEBHOOK_URL` | `contact.ts` | Optional (silent fail — contact form looks ok but delivers nothing) |
| `MAKE_DELIVERY_WEBHOOK_URL` | `stripe-webhook.ts`, `resend-access.ts` | Optional (Resend is primary) |
| `KIT_API_KEY` | `stripe-webhook.ts`, `lead-capture.ts` | Optional (silent skip) |
| `KIT_LEAD_TAG_ID` | `lead-capture.ts` | Optional (skip if unset) |
| `WATCH_TOKEN_SECRET` | `stripe-webhook.ts`, `watch/workshop-replay.astro` | Required for replay delivery |
| `R2_ACCOUNT_ID` | `stripe-webhook.ts` | Required for Blueprint delivery |
| `R2_ACCESS_KEY_ID` | `stripe-webhook.ts` | Required |
| `R2_SECRET_ACCESS_KEY` | `stripe-webhook.ts` | Required |
| `R2_BUCKET_NAME` | `stripe-webhook.ts` | Required (note: private-architecture uses `R2_BUCKET` — different name) |
| `R2_BUCKET` | `private-architecture/[token].astro` | Inconsistent — see security flags |
| `AIRTABLE_API_KEY` | Multiple | Required for community access + reporting |
| `AIRTABLE_BASE_ID` | Multiple | Required |
| `AIRTABLE_TABLE` | `stripe-webhook.ts`, `community-access.ts` | Required — must be set, default mismatch |
| `AIRTABLE_LEADS_TABLE` | `lead-capture.ts` | Optional (defaults to "Leads") |
| `GA4_MEASUREMENT_ID` | `stripe-webhook.ts` | Optional (server-side purchase events skipped if absent) |
| `GA4_API_SECRET` | `stripe-webhook.ts` | Optional (paired with above) |
| `TELEGRAM_BOT_TOKEN` | `stripe-webhook.ts` | Optional (sale alerts) |
| `TELEGRAM_CHAT_ID` | `stripe-webhook.ts` | Optional |
| `COMMUNITY_CHAT_INVITE` | `welcome.astro` | Optional (chat link hidden if absent) |
| `CRON_SECRET` | `monthly-report.ts` | Required for cron auth |

### Security flags
1. **No committed secrets found.** `.env` is gitignored. No hardcoded API keys or tokens in committed code.
2. **R2 bucket env var name inconsistency:** `stripe-webhook.ts` reads `R2_BUCKET_NAME`. `private-architecture/[token].astro` reads `R2_BUCKET`. If both paths are live, one of them silently has an empty bucket name and presigns invalid URLs. Needs verification in Cloudflare Pages env.
3. **AIRTABLE_TABLE default mismatch:** `community-access.ts` defaults to "Customers"; `stripe-webhook.ts` defaults to "Members". If `AIRTABLE_TABLE` is not explicitly set, community gate will always deny paying members.
4. **Telegram still present:** CLAUDE.md says "No Telegram references — replaced by Monthly Q&A" but `telegram.ts` and its usage in `stripe-webhook.ts` remain. Not a security issue — just documentation drift.
5. **CSP allows `unsafe-inline`** for scripts and styles. Necessary for Tailwind + Astro's inline scripts, but weakens XSS protection. Acceptable for this setup, worth noting.
6. **Stripe webhook signature verification:** Correctly implemented using `constructEventAsync` with `SubtleCryptoProvider`. Properly rejects on bad signature (400).

---

## 11. GAP LIST (priority order, impact on revenue)

### Gap 1 — CRITICAL: Airtable table name mismatch can deny all paying community members
`community-access.ts` uses default table "Customers". `stripe-webhook.ts` writes to default "Members". If `AIRTABLE_TABLE` env var is not explicitly set in Cloudflare, every Greatness Community member will get `access: false` when they try to enter `/community/inside`. Every paying member sees a "no membership found" error. Verify `AIRTABLE_TABLE` is set in Cloudflare Pages env and matches the actual table name.

### Gap 2 — HIGH: R2 bucket env var split breaks one delivery path
`stripe-webhook.ts` reads `R2_BUCKET_NAME`. `private-architecture/[token].astro` reads `R2_BUCKET`. These are two different env var names. One path silently presigns URLs with an empty bucket. Verify both are set in Cloudflare.

### Gap 3 — HIGH: Workshop Replay success URL not updated in Stripe Dashboard
CLAUDE.md marks this [URGENT]. The Payment Link for Workshop Replay (`6oU...`) needs its success URL set to `https://theerainers.com/thank-you/workshop-replay` in Stripe Dashboard. Until then, buyers don't hit the post-purchase page and the portal link on `/welcome` never fires (since no `session_id` in URL).

### Gap 4 — HIGH: No lead notification path for coaching applications
`coaching-capture.ts` sends the application to Rainers via Resend. There is no Kit tagging, no Airtable write, and no Make.com notification specific to coaching. Applications exist only in Rainers' inbox. If Resend fails or `RESEND_API_KEY` is unset, applications vanish silently.

### Gap 5 — HIGH: Bundle has no purchase path on site
Bundle ($87) exists in Stripe, in the webhook delivery code, and in the welcome email template (which links to `/vault` → 301 → `/shop` → bundle not shown). There is no way for a visitor to discover and buy the bundle from the site. It is effectively invisible.

### Gap 6 — MEDIUM: Cal.com is not integrated (vs target state)
Target stack includes Cal.com for booking. No integration exists. Coaching flow is purely form → email to Rainers → manual response. This is functional but creates friction and manual work at volume.

### Gap 7 — MEDIUM: Community welcome email is thin
Resend delivery email for 'greatness' buyers sends "You are in." and a button to `/community/inside`. It does not include the Proving Ground Zoom link, community chat invite, or Customer Portal link. These are on `/welcome` only if the buyer lands there with `session_id`. Buyers who lose the tab or use Payment Links get nothing useful delivered to inbox.

### Gap 8 — MEDIUM: Sequence email hardcodes July 25
The D+8 nurture email (sent to all opt-ins) references "July 25", "8 spots", "12PM ET". This becomes false after July 25. Requires a code edit after each workshop.

### Gap 9 — MEDIUM: No post-purchase nurture sequence for buyers
There is a 4-email welcome sequence for free opt-ins (lead-capture.ts). There is **no sequence for paying customers** (Blueprint or Community buyers). CLAUDE.md lists a Day 0/3/7/14 post-purchase sequence as pending in Make.com. Not built in Resend or anywhere.

### Gap 10 — MEDIUM: llms.txt is stale (affects GEO — AI search visibility)
Wrong replay price ($79), wrong workshop date (June 27), stale social counts. This is the file AI crawlers use to understand the site. Update to reflect actual current offers.

### Gap 11 — LOW: Sitemap references redirect sources, not canonical URLs
`/foundation-guide`, `/footwork-foundation`, `/lever-audit` are in sitemap. These 301 to `/foundation`. Google prefers canonical URLs in sitemaps. Also missing: `/shadowboxing-blueprint`, `/community`, `/shop`.

### Gap 12 — LOW: CLAUDE.md stack version is stale
Says "Astro 4". Actual version is Astro 6.3.6. Minor, but misleading to anyone reading the context doc.

### Gap 13 — LOW: Monthly report references old subscription product IDs
`monthly-report.ts` includes `prod_UZ9l...`, `prod_UZ9v...`, `prod_UZ9x...` (old per-blueprint $47/mo subscriptions). If these products have no active subscribers, report is just noisy. If any do, revenue attribution is wrong.

---

## Summary answers (vs target state)

| Question | Answer |
|---|---|
| Is there a group/community sales page? | Yes — `/community` is live, priced at $39/mo and $390/yr, with full checkout flow |
| Is lead capture wired? | Yes — 3 entry points, Resend immediate welcome + 4-email sequence |
| Is a welcome/nurture sequence defined? | Yes — 4 emails at D+2, D+4, D+5, D+8 (fires via Resend scheduled send) |
| Is there a post-purchase sequence for buyers? | **No** — listed as pending in Make.com, not built anywhere |
| Are lead notifications wired? | Partially — Make.com webhook fires from code (scenario status unknown from repo), Resend alerts coaching applications to Rainers |
| Is the full value ladder present and linked? | **No** — Bundle has no page; Footwork Blueprint (paid) has no purchase CTA; `/shop` missing 3 products |
| Is email deliverability config present? | Partially — SPF has a duplicate record conflict (two `v=spf1` TXT records). This causes PermError and may cause deliverability failures. Must be fixed in Cloudflare DNS. DKIM/DMARC status unknown from repo. |
| Is Cal.com integrated? | **No** |

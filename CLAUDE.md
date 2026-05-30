# Thee Rainers — Project Context

## Stack
Astro 4 on Cloudflare Pages/Workers. `@astrojs/cloudflare` adapter. Tailwind v4 (`@theme` CSS vars, no config file). All SSR API routes use `export const prerender = false` and `import { env as cfEnv } from 'cloudflare:workers'` for env vars. No wrangler.toml — managed via Cloudflare Pages dashboard.

## Brand rules — non-negotiable
- Rainers Blue `#0057FF` — primary CTAs for one-time purchases (Blueprints, Workshop, Replay), lead capture (download, submit), and standard buttons
- Copper `#D4A373` — metadata labels and separators ONLY. Never a CTA. Reserved for focus rings on purple buttons (accessibility).
- Royal Purple `#6A0DAD` — Private Architecture, Apply, AND Greatness Community. Signals recurring membership / inner-circle commitment — separates ongoing membership from one-time Blueprint purchases.
- Void `#0A0A0A` — primary text, scripture section backgrounds, instant hover state on purple buttons.
- White `#FFFFFF` — primary background everywhere else
- No emojis anywhere in the codebase or copy
- No Telegram references — replaced by Monthly Q&A
- Scripture sections stay dark (`bg-[#0A0A0A]`) for gravitas
- Button shape: `rounded-none` everywhere (brutalist square edges, no pill/rounded buttons)
- Footer/legal microcopy: minimum 12px (`text-xs`) at /55 opacity for WCAG AA contrast. Never `text-[10px]` at low opacity.

## Font
Bricolage Grotesque Variable — loaded via Base.astro

## Layout pattern
60/40 asymmetric grid for all hero sections. Left 60% = text/form. Right 40% = image/video/context.

## Funnel architecture (vertical integration)
```
YouTube / Instagram / TikTok (18K / 332K / 95K)
    ↓
/links — universal bio hub
    ↓
/footwork-foundation — free 30-day protocol (email capture → PDF)
/lever-audit — free 7-lever self-assessment (email capture → PDF)
/lever-audit-quiz — 7 questions, routes to right next step
    ↓
/workshop-replay — $79 on-demand (attraction offer, leverages workshop archive)
/workshop — $197 live · June 27 · Defense Workshop
    ↓
/vault — Blueprints one-time ($47 each, $87 bundle)
       + Membership continuity ($47/mo — naming TBD, user decides copy)
    ↓
/command — Private Architecture · Application only · Purple CTA
```

## Pages inventory
- `/` — home
- `/about` — founder
- `/footwork-foundation` — free protocol + email capture
- `/lever-audit` — competitor qualifier + email capture
- `/lever-audit-quiz` — interactive quiz + email gate
- `/workshop` — Defense Workshop · June 27 · $197
- `/workshop-replay` — replay sales page · $79
- `/watch/workshop-replay` — token-gated watch page (server-validates HMAC before rendering embed)
- `/vault` — all products
- `/command` — Private Architecture application
- `/qa` — Monthly Q&A · next session June 13
- `/library` — YouTube knowledge library
- `/arena` — training resources
- `/links` — universal bio link hub
- `/foundation-guide` — redirect/noindex
- `/feedback`, `/contact` — contact forms
- `/thank-you/footwork-foundation` — post-download
- `/thank-you/workshop` — post-workshop-purchase (June 27 live)
- `/thank-you/workshop-replay` — post-replay-purchase (check email, link incoming)
- `/thank-you/contact` — post-contact

## API routes
- `/api/lead-capture` — all free forms (email required, source tag varies)
- `/api/coaching-capture` — Private Architecture application
- `/api/contact` — contact + feedback forms
- `/api/stripe-webhook` — Stripe event handler (signature-verified, CF Workers compatible)

## Environment variables (Cloudflare Pages — all set)
```
MAKE_LEAD_WEBHOOK_URL       — free form submissions (footwork, lever-audit, qa-registration)
MAKE_DELIVERY_WEBHOOK_URL   — post-purchase delivery trigger
STRIPE_SECRET_KEY           — Stripe API key
STRIPE_WEBHOOK_SECRET       — Stripe webhook signature secret
WATCH_TOKEN_SECRET          — HMAC signing key for /watch/ token-gated pages
R2_ACCOUNT_ID               — Cloudflare account ID
R2_ACCESS_KEY_ID            — R2 API token (access key)
R2_SECRET_ACCESS_KEY        — R2 API token (secret)
R2_BUCKET_NAME              — theerainers-vault
AIRTABLE_API_KEY            — Airtable PAT
AIRTABLE_BASE_ID            — Airtable base
```

## Automation — Make.com

### MAKE_LEAD_WEBHOOK_URL
Receives free form submissions. Payload:
```json
{ "email": "...", "full_name": "", "source": "footwork-foundation|lever-audit|lever-audit-quiz|qa-registration" }
```
**STATUS: Webhook URL set. Scenario needs to exist in Make.com: Webhook → Airtable + welcome email with PDF link.**

### MAKE_DELIVERY_WEBHOOK_URL
Receives purchase events (initial + monthly renewals). Payload:
```json
{
  "email": "buyer@example.com",
  "product_id": "prod_XXX",
  "product_slug": "footwork|shadowboxing|bundle|workshop-replay",
  "token": "64-char hex",
  "expiring_url": "7-day R2 presigned URL or signed /watch/ page URL",
  "expiring_url_2": "second R2 URL for bundle (null for all other products)"
}
```
**STATUS: Webhook URL set. Scenario needs to exist in Make.com: Webhook → email delivery.**
**For bundle:** `expiring_url` = footwork PDF, `expiring_url_2` = shadowboxing PDF. Add conditional second link in email template when `expiring_url_2` is not null.
**For workshop-replay:** `expiring_url` = `https://theerainers.com/watch/workshop-replay?sig=xxx&exp=xxx` (7-day signed URL).

### Airtable
KNOWN BUG: `source` field is Single Select type — API sends strings not in options → 422 → all leads silently dropped.
**FIX: In Airtable → change `source` field type from Single Select → Single line text.**

## Delivery system architecture

### File-based products (R2 presigned — 7-day expiry)
Bucket: `theerainers-vault`
```
footwork:     thefootworkblueprint/links_theFOOTWORKBlueprint.pdf
shadowboxing: the shadowboxing blueprint/the shadowboxing blueprint.pdf
bundle[0]:    bundle/thefootworkblueprint/links_theFOOTWORKBlueprint.pdf
bundle[1]:    bundle/the shadowboxing blueprint/the shadowboxing blueprint.pdf
```
AWS SigV4 signing implemented natively in CF Workers (`crypto.subtle`) — no AWS SDK.

### Workshop Replay (token-gated YouTube)
Video: unlisted YouTube `AtZmUk7cZFQ`
Flow: purchase → webhook generates HMAC-signed URL → Make.com emails buyer → buyer clicks `/watch/workshop-replay?sig=xxx&exp=xxx` → page validates server-side → embed renders only if valid.
Expired token → repurchase CTA (no video in source). Invalid token → redirect to `/workshop-replay`.

### Subscription renewals
`invoice.payment_succeeded` (billing_reason: subscription_cycle) → regenerates fresh 7-day URLs → sends to MAKE_DELIVERY_WEBHOOK_URL. Initial purchase handled by `checkout.session.completed` only.

## Products — Stripe

### One-time
| Product | Price | Stripe link | Product ID |
|---|---|---|---|
| Defense Workshop (live) | $197 | https://buy.stripe.com/7sY28r8lt1D06XU6446J20n | — |
| Workshop Replay | $79 | https://buy.stripe.com/6oUaEX7hp6Xk3LIdww6J20p | prod_UZOMBOeJ0mm15I |
| Footwork Blueprint | $47 | https://buy.stripe.com/bJe14n8lt81ogyu3VW6J20k | prod_UZrejf6iuDorEA |
| Shadowboxing Blueprint | $47 | https://buy.stripe.com/5kQdR91X5dlIeqm8cc6J20l | prod_UZreDlek9325EY |
| Bundle (both blueprints) | $87 | https://buy.stripe.com/14A4gz59hgxUaa65006J20m | prod_UZreHroYQEDAFU |

### Membership / continuity (naming TBD — user decides copy)
$47/mo or $470/yr. ONE subscription per member — bundle is a single product, never stacked.
| Slug | Product ID |
|---|---|
| footwork | prod_UZ9lTK2PhsS4xs |
| shadowboxing | prod_UZ9vV79TAun9yB |
| bundle | prod_UZ9xqJt3glrCOO |
Stripe webhook events required: `checkout.session.completed` + `invoice.payment_succeeded` (both set).

## PDFs
- `/public/pdfs/footwork-foundation.pdf` — real PDF, wired correctly
- `/public/pdfs/lever-audit.pdf` — PLACEHOLDER. Real source: `/public/lever-audit-print.html`
- TO GENERATE: Open `/lever-audit-print.html` in Chrome → Print → Save as PDF → `/public/pdfs/lever-audit.pdf` → commit + push

## Featured YouTube video
- ID: `SrFywBFkmik` — "What Boxing Does to Your Body That the Gym Can't"
- Chapters wired, end screen set, card at 8:31 → /footwork-foundation

## Social presence
Counts live in `src/data/social-stats.ts` (single source of truth). Update that file when numbers change; all pages rebuild on push.
- Instagram: @theerainers
- Facebook: @theerainers
- TikTok: @theerainers
- Threads: @theerainers
- YouTube: @Rainers

## Pending — prioritized
1. **[FIRE] Make.com delivery scenario** — MAKE_DELIVERY_WEBHOOK_URL receives payloads but no scenario sends the email. Every buyer gets nothing after payment.
2. **[FIRE] Airtable source field** — change Single Select → Single line text. All leads being dropped.
3. **[URGENT] Stripe Workshop Replay success URL** — update in Stripe Dashboard to `/thank-you/workshop-replay`
4. **[WEEK] Membership section on site** — subscription products exist in Stripe + webhook, but no page offers them. Naming/copy TBD by Rainers.
5. **[WEEK] Post-purchase email sequence in Make.com** — Day 0 delivery, Day 3 check-in, Day 7 upsell, Day 14 workshop invite
6. **[WEEK] Lever-audit.pdf** — generate from print template (Chrome → Print → Save as PDF)
7. **[ONGOING] Platform bios** — update to theerainers.com/links once all is confirmed live

## Deployment
`git push` → Cloudflare Pages auto-deploys `main`. No manual steps.

## Contact
rainers@theerainers.com

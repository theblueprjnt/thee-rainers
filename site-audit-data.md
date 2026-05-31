# site-audit-data.md
# Thee Rainers — Site Audit Data Extract
# Generated: 2026-05-26 | Read-only. No source files were modified.

---

## 1. Stack

### package.json (full)

```json
{
  "name": "thee-rainers",
  "type": "module",
  "version": "0.0.1",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/cloudflare": "^13.5.3",
    "@fontsource-variable/bricolage-grotesque": "^5.2.10",
    "@tailwindcss/vite": "^4.3.0",
    "astro": "^6.3.6",
    "googleapis": "^172.0.0",
    "stripe": "^22.1.1",
    "tailwindcss": "^4.3.0"
  }
}
```

- **devDependencies**: NONE (all deps in `dependencies`)
- **Total dependency count**: 7 direct dependencies
- **Framework**: Astro 6.3.6
- **TypeScript**: YES — `.ts` files throughout (`src/pages/api/*.ts`, `src/lib/r2-presign.ts`, `src/content.config.ts`)
- **CSS**: Tailwind v4 via `@tailwindcss/vite` (no config file; uses `@theme` CSS vars)
- **Font**: Bricolage Grotesque Variable via `@fontsource-variable/bricolage-grotesque`
- **Adapter**: `@astrojs/cloudflare` 13.5.3 → deploys to Cloudflare Pages/Workers
- **Payments SDK**: `stripe` 22.1.1 (server-side only)
- **Other**: `googleapis` 172.0.0 (YouTube API — used in scripts, not confirmed in active pages)

---

## 2. Structure & Routes

### src/ tree

```
src/
├── assets/
│   ├── aikido-yellowbelt.png
│   ├── defense_cover.png
│   └── defense_cover1.jpg
├── components/
│   ├── blocks/
│   │   ├── BuyButton.astro
│   │   ├── FAQ.astro
│   │   ├── Hero.astro
│   │   ├── LeadForm.astro
│   │   ├── PathCard.astro
│   │   ├── PriceBlock.astro
│   │   └── Testimonial.astro
│   ├── greatness/
│   │   └── Analytics.astro
│   └── primitives/
│       ├── Button.astro
│       ├── Container.astro
│       ├── Pill.astro
│       ├── Rule.astro
│       └── Section.astro
│   site/
│       ├── Footer.astro
│       └── Nav.astro
├── content/
│   └── products/
│       ├── bundle.json
│       ├── footwork.json
│       └── shadowboxing.json
├── content.config.ts
├── layouts/
│   ├── Base.astro
│   └── LinkPage.astro
├── lib/
│   └── r2-presign.ts
├── pages/
│   ├── api/
│   │   ├── coaching-capture.ts    [SSR]
│   │   ├── contact.ts             [SSR]
│   │   ├── create-checkout.ts     [SSR]
│   │   ├── lead-capture.ts        [SSR]
│   │   ├── portal.ts              [SSR]
│   │   ├── resend-access.ts       [SSR]
│   │   └── stripe-webhook.ts      [SSR]
│   ├── private-architecture/
│   │   └── [token].astro          [SSR — Airtable token gate]
│   ├── thank-you/
│   │   ├── contact.astro
│   │   ├── footwork-foundation.astro
│   │   ├── workshop-replay.astro
│   │   └── workshop.astro
│   ├── watch/
│   │   └── workshop-replay.astro  [SSR — HMAC token gate]
│   ├── about.astro
│   ├── arena.astro
│   ├── command.astro
│   ├── contact.astro
│   ├── feedback.astro
│   ├── footwork-foundation.astro
│   ├── foundation-guide.astro     [noindex via LinkPage layout]
│   ├── gate.astro                 [noindex]
│   ├── index.astro
│   ├── lever-audit-quiz.astro
│   ├── lever-audit.astro
│   ├── library.astro
│   ├── links.astro
│   ├── qa.astro
│   ├── vault.astro
│   ├── welcome.astro              [noindex]
│   ├── workshop-replay.astro
│   └── workshop.astro
└── styles/
    └── global.css
```

### public/ tree

```
public/
├── _headers
├── apple-touch-icon.png
├── audit-print.html               [NOTE: no noindex — see §7]
├── favicon.ico / .png / .svg
├── icon-192.png / icon-512.png
├── images/
│   ├── (13 jpg, 13 png — full list below in §8)
├── lever-audit-print.html         [NOTE: no noindex — see §7]
├── llms.txt
├── pdfs/
│   ├── footwork-foundation.pdf
│   └── lever-audit.pdf            [NOTE: CLAUDE.md marks this as placeholder]
├── robots.txt
├── site.webmanifest
└── sitemap.xml
```

### Pages inventory (22 static + 7 API + 2 SSR pages)

| Route | Type | Notes |
|---|---|---|
| / | Static prerendered | Homepage |
| /about | Static prerendered | |
| /arena | Static prerendered | |
| /command | Static prerendered | Private Architecture application |
| /contact | Static prerendered | |
| /feedback | Static prerendered | |
| /footwork-foundation | Static prerendered | Email capture + PDF |
| /foundation-guide | Static prerendered | noindex |
| /gate | Static prerendered | noindex |
| /lever-audit | Static prerendered | Email capture + PDF |
| /lever-audit-quiz | Static prerendered | Interactive quiz |
| /library | Static prerendered | YouTube embeds |
| /links | Static prerendered | Bio hub |
| /qa | Static prerendered | Monthly Q&A registration |
| /vault | Static prerendered | Products / Blueprints |
| /welcome | Static prerendered | Post-checkout confirmation, noindex |
| /workshop | Static prerendered | Defense Workshop |
| /workshop-replay | Static prerendered | Replay sales page |
| /thank-you/contact | Static prerendered | No noindex |
| /thank-you/footwork-foundation | Static prerendered | noindex |
| /thank-you/workshop | Static prerendered | noindex |
| /thank-you/workshop-replay | Static prerendered | noindex |
| /private-architecture/[token] | SSR (CF Worker) | Airtable token gate |
| /watch/workshop-replay | SSR (CF Worker) | HMAC signed URL gate |
| /api/coaching-capture | SSR API route | POST |
| /api/contact | SSR API route | POST |
| /api/create-checkout | SSR API route | POST |
| /api/lead-capture | SSR API route | POST |
| /api/portal | SSR API route | POST |
| /api/resend-access | SSR API route | POST |
| /api/stripe-webhook | SSR API route | POST |

---

## 3. Rendering & Deploy Config

### astro.config.mjs (full)

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://theerainers.com',
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- **output**: Not explicitly set in config. Build reports `output: "static"` + `mode: "server"`. This is Cloudflare adapter hybrid behavior: pages without `export const prerender = false` are prerendered as static HTML; API routes and SSR pages run as CF Workers.
- **Integrations**: None (no @astrojs/sitemap, no @astrojs/image)
- **site**: `https://theerainers.com`
- **Adapter**: `cloudflare()` — default options; build warns about IMAGES binding and SESSION KV binding (these require configuration in CF Pages dashboard)

### wrangler.toml
ABSENT — no wrangler.toml. Configuration is managed entirely via Cloudflare Pages dashboard.

### public/_headers (full)

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")
  X-XSS-Protection: 1; mode=block
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://js.stripe.com; connect-src 'self' https://api.stripe.com https://www.google-analytics.com; object-src 'none'; base-uri 'self'

/api/*
  Access-Control-Allow-Origin: https://theerainers.com
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type
```

### _redirects
ABSENT — no HTTP-to-HTTPS or www-to-apex redirects configured in file. Cloudflare Pages handles HTTPS enforcement at the platform level.

### netlify.toml / vercel.json
ABSENT — not relevant (Cloudflare Pages deployment).

---

## 4. Security Headers

All headers served via `public/_headers`. No Astro middleware found (`src/middleware.ts` / `src/middleware/index.ts` — ABSENT).

| Header | Present | Value |
|---|---|---|
| Strict-Transport-Security | YES | `max-age=63072000; includeSubDomains; preload` (2 years, preload-eligible) |
| Content-Security-Policy | YES | See full value below |
| X-Content-Type-Options | YES | `nosniff` |
| X-Frame-Options | YES | `DENY` |
| Referrer-Policy | YES | `strict-origin-when-cross-origin` |
| Permissions-Policy | YES | `camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")` |
| X-XSS-Protection | YES | `1; mode=block` (deprecated header, harmless) |

**Full CSP value:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
frame-src https://www.youtube.com https://www.youtube-nocookie.com https://js.stripe.com;
connect-src 'self' https://api.stripe.com https://www.google-analytics.com;
object-src 'none';
base-uri 'self'
```

**CSP notes:**
- `'unsafe-inline'` in `script-src` — required for Astro View Transitions `<ClientRouter>` inline scripts and Google Tag Manager. Weakens XSS protection.
- `'unsafe-inline'` in `style-src` — required for Tailwind utility classes applied inline via Astro. Acceptable for CSS.
- No `nonce-` or `hash-` based approach to avoid `unsafe-inline`.
- `connect-src` allows `https://www.google-analytics.com` but GTM containers may beacon to additional GA4 endpoints (e.g., `https://analytics.google.com`). Might cause CSP violations in practice.
- No `worker-src` or `manifest-src` directive.
- `font-src` allows `https://fonts.gstatic.com` but fonts appear to be self-hosted via `@fontsource-variable`. The external font-src may be unnecessary.

**HSTS analysis:**
- max-age = 63,072,000 seconds = 730 days (2 years)
- `includeSubDomains` present ✓
- `preload` present ✓
- Meets Chrome HSTS preload list minimum requirements

---

## 5. Payments

### Stripe grep (src/ and public/, excluding node_modules)

**Subscription checkout (server-side):**
- `src/pages/api/create-checkout.ts:3` — `import Stripe from 'stripe'`
- `src/pages/api/create-checkout.ts:27` — `new Stripe(e['STRIPE_SECRET_KEY'] ?? '', { httpClient: Stripe.createFetchHttpClient() })`
- `src/pages/api/create-checkout.ts:31` — `stripe.prices.list(...)` — finds active recurring price
- `src/pages/api/create-checkout.ts:37` — `stripe.checkout.sessions.create({ mode: 'subscription', success_url: ..., cancel_url: ... })`

**Billing portal:**
- `src/pages/api/portal.ts:3` — `import Stripe from 'stripe'`
- `src/pages/api/portal.ts:16` — `new Stripe(...)`
- `src/pages/api/portal.ts:17` — `stripe.billingPortal.sessions.create({ customer: customerId, return_url: ... })`

**Webhook (signature-verified):**
- `src/pages/api/stripe-webhook.ts:4` — `import Stripe from 'stripe'`
- `src/pages/api/stripe-webhook.ts:240` — `Stripe.createSubtleCryptoProvider()` (CF Workers compatible — uses Web Crypto instead of Node crypto)
- `src/pages/api/stripe-webhook.ts:242` — `new Stripe(stripeKey, { apiVersion: '2025-04-30.basil', httpClient: Stripe.createFetchHttpClient() })`
- `src/pages/api/stripe-webhook.ts:246` — `stripe.webhooks.constructEventAsync(rawBody, sigHeader, webhookSecret, undefined, webCrypto)` — signature verified ✓
- `src/pages/api/stripe-webhook.ts:344` — Always returns 200 to prevent Stripe retries on downstream failure ✓

**Payment Links (static anchors — Defense Workshop and Workshop Replay):**
- `src/pages/vault.astro:123` — `https://buy.stripe.com/7sY28r8lt1D06XU6446J20n` (Defense Workshop)
- `src/pages/workshop.astro:43,94,146,267` — `https://buy.stripe.com/7sY28r8lt1D06XU6446J20n` (Defense Workshop)
- `src/pages/workshop-replay.astro:45,113` — `https://buy.stripe.com/6oUaEX7hp6Xk3LIdww6J20p` (Workshop Replay)

**PriceBlock component:**
- `src/components/blocks/PriceBlock.astro:20` — `cta_href = 'https://buy.stripe.com/7sY28r8lt1D06XU6446J20n'` (default prop)

### Stripe integration classification

**VERDICT: HOSTED CHECKOUT / SAQ A**

All card processing happens on Stripe's domain. The integration falls into two clean sub-types:

1. **Stripe Payment Links** (`https://buy.stripe.com/...`) — for Defense Workshop and Workshop Replay. External redirects. Card data never reaches theerainers.com. SAQ A.

2. **Stripe-hosted Checkout Sessions** (`stripe.checkout.sessions.create()` with `success_url`) — for subscription products (Footwork, Shadowboxing, Bundle). API returns a Stripe-hosted URL; the browser is redirected to `checkout.stripe.com`. Card data never reaches theerainers.com. SAQ A.

**NOT FOUND — confirming SAQ A:**
- `@stripe/stripe-js` — ABSENT (no import anywhere)
- `stripe.elements()` — ABSENT
- `PaymentElement` — ABSENT
- `CardElement` — ABSENT
- `confirmCardPayment` — ABSENT
- `embedded` checkout mode — ABSENT

Card data does not touch the domain at any point. No SAQ A-EP exposure.

### Webhook event handling

Events handled in `src/pages/api/stripe-webhook.ts`:
- `checkout.session.completed` → delivery trigger (Make.com) + Airtable upsert + Kit tagging
- `invoice.payment_succeeded` (billing_reason: subscription_cycle) → renewal delivery
- `customer.subscription.updated` → Airtable status update + Kit tag management
- `customer.subscription.deleted` → Airtable canceled status + Kit untag

**Known incomplete state in code:**
- `src/pages/api/stripe-webhook.ts:30` — Kit tag IDs are still placeholder strings (`'KIT_TAG_FOOTWORK'`, `'KIT_TAG_SHADOWBOXING'`, `'KIT_TAG_BUNDLE'`, `'KIT_TAG_MEMBER_ACTIVE'`). Code detects these and skips Kit calls. Tagging is NOT yet live.

### Other integrations

**Make.com (webhooks):**
- `src/pages/api/lead-capture.ts:4,85-97` — `MAKE_LEAD_WEBHOOK_URL` — all free form submissions
- `src/pages/api/contact.ts:4,102-114` — `MAKE_CONTACT_WEBHOOK_URL` — contact/feedback forms
- `src/pages/api/coaching-capture.ts:7,16-27` — `MAKE_LEAD_WEBHOOK_URL` (also used for coaching)
- `src/pages/api/stripe-webhook.ts:179,215` — `MAKE_DELIVERY_WEBHOOK_URL` — post-purchase delivery

**Airtable:**
- `src/pages/api/stripe-webhook.ts:86-101` — `upsertAirtable()` helper using `AIRTABLE_TOKEN` + `AIRTABLE_BASE_ID` + `AIRTABLE_TABLE` (default: `'Members'`)
- `src/pages/api/resend-access.ts:10-36` — reads from `Purchases` table using `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID`
- `src/pages/private-architecture/[token].astro:10-65` — reads from `Purchases` table for token gate

NOTE: Two different Airtable env var names for the key: `AIRTABLE_TOKEN` (webhook) vs `AIRTABLE_API_KEY` (resend-access, private-architecture). These may or may not be the same value. Potential misconfiguration risk.

**Kit (formerly ConvertKit):**
- `src/pages/api/stripe-webhook.ts:45-78` — `https://api.kit.com/v4/subscribers` — Kit v4 API, `X-Kit-Api-Key` header, uses `KIT_API_KEY` env var
- Kit tag IDs are placeholder strings — tagging NOT yet live (see above)

**Cal.com:** ABSENT — no reference found in any source file.

---

## 6. SEO

### robots.txt (full)

```
User-agent: *
Allow: /
Disallow: /gate
Disallow: /thank-you/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://theerainers.com/sitemap.xml
```

Notes:
- `/welcome` not in Disallow (it's noindex in HTML but robots.txt doesn't block it)
- `/thank-you/contact` not in Disallow and has no noindex meta tag (all other thank-you pages have noindex)
- AI crawlers explicitly allowed ✓

### Sitemap

- **File**: `public/sitemap.xml` — manually maintained static XML
- **@astrojs/sitemap**: NOT used — not in package.json or astro.config.mjs
- **URLs in sitemap** (11 total): `/`, `/vault`, `/lever-audit`, `/footwork-foundation`, `/workshop`, `/command`, `/arena`, `/library`, `/about`, `/qa`, `/feedback`
- **Missing from sitemap**: `/contact`, `/workshop-replay`, `/lever-audit-quiz`, `/links`
- **`lastmod`**: All set to `2026-05-23` — static, will not update automatically

### JSON-LD blocks

| File | Schema Type(s) | Location |
|---|---|---|
| `src/layouts/Base.astro:74` | `Organization`, `Person` | All pages (injected via layout) |
| `src/pages/vault.astro:55` | `Product` × 3, `Offer` | /vault |
| `src/pages/workshop.astro:61` | `Event`, `VirtualLocation`, `Offer` | /workshop |
| `src/pages/workshop.astro:62` | `FAQPage`, `Question`, `Answer` | /workshop |
| `src/pages/library.astro:111` | `VideoObject` | /library |

**Pages with NO page-level schema** (only base Organization/Person): about, footwork-foundation, lever-audit, lever-audit-quiz, qa, command, arena, links, contact, feedback, workshop-replay, welcome, all thank-you pages.

### Base.astro head tags (src/layouts/Base.astro:54-77)

```html
<meta charset="utf-8" />
<link rel="canonical" href={canonicalURL} />  <!-- computed from Astro.url.pathname -->
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="generator" content={Astro.generator} />
<meta name="description" content={description} />
<meta property="og:site_name" content="Thee Rainers" />
<meta property="og:title" content={title} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:type" content="website" />
<meta name="twitter:title" content={title} />
<meta property="og:image" content="https://theerainers.com/images/coldfightpic3.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@theerainers" />
<meta name="twitter:image" content="https://theerainers.com/images/coldfightpic3.jpg" />
<title>{title}</title>
```

**Default meta description** (Base.astro:15): `"Systemic boxing performance. Seven levers. Autonomic regulation. Built for fighters who think in structures, not sessions."`

**Per-page OG overrides found:**
- `src/pages/footwork-foundation.astro:34-35` — og:description, og:type
- `src/pages/lever-audit.astro:19` — og:description
- `src/pages/workshop.astro:66-67` — og:description, og:type

**Missing per-page:** og:image never overridden (every page shares `coldfightpic3.jpg`). og:description absent on: about, vault, qa, command, workshop-replay, library, arena, links, contact, lever-audit-quiz.

**Missing entirely:** `og:description` (no `<meta property="og:description">` in Base.astro; only meta name="description" is set globally. og:description requires a separate property tag).

---

## 7. GEO

### llms.txt

PRESENT at `public/llms.txt`. Content is comprehensive: brand summary, all free resources with URLs, all products with prices and URLs, 7-lever system explained, social presence. 

Notable: llms.txt links directly to PDFs (`https://theerainers.com/pdfs/footwork-foundation.pdf`) and mentions URLs for all main pages. AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are allowed in robots.txt.

### Markdown mirrors of pages

ABSENT — no `.md` content files mirror page content. The only `.md` files in the repo are project documentation (`CLAUDE.md`, `README.md`, `LAUNCH-READINESS.md`) and are not served publicly.

### Indexable HTML print templates

**RISK IDENTIFIED:**

| File | Served at | noindex | In sitemap | Notes |
|---|---|---|---|---|
| `public/audit-print.html` | `/audit-print.html` | NO | NO | Publicly served HTML — no meta robots noindex |
| `public/lever-audit-print.html` | `/lever-audit-print.html` | NO | NO | Print template for lever-audit.pdf generation — duplicate content risk |

Both files are shipped to `dist/client/` and will be served by Cloudflare Pages. They are not blocked by robots.txt. Google may index them.

### HTML tables in content pages

ABSENT — no `<table>`, `<th>`, `<td>`, or `<tr>` tags found in any `.astro` page file. Structured data is conveyed via prose + JSON-LD only.

---

## 8. Images & Performance

### Image file counts by extension

| Location | jpg | png | webp | avif | Total |
|---|---|---|---|---|---|
| `public/images/` | 13 | 13 | 0 | 0 | 26 |
| `public/` (root) | 0 | 4 | 0 | 0 | 4 |
| `src/assets/` | 1 | 2 | 0 | 0 | 3 |
| **Total** | **14** | **19** | **0** | **0** | **33** |

**All images in public/images/ are unoptimized jpg or png — no avif or webp in the served folder.**

### astro:assets / image pipeline

`astro:assets` `<Picture>` component is used in **ONE place only:**
- `src/pages/workshop.astro:183` — `import defenseCover1 from '../assets/defense_cover1.jpg'` + `<Picture src={defenseCover1} formats={['avif', 'webp']} widths={[600, 900, 1300]} sizes="..." quality={80} loading="lazy" />`

This image outputs to `dist/client/_astro/defense_cover1.CusyX0yI.jpg` (compiled as jpg, not avif/webp — the CF Images binding required for avif/webp conversion was warned as not configured at build time).

All other `<img>` tags reference `/images/*.jpg` or `/images/*.png` directly from `public/` — bypassing any image optimization pipeline.

### Hero / above-fold image loading attributes

| Page | Hero image | loading= | fetchpriority= |
|---|---|---|---|
| `src/pages/index.astro:31` | `/images/coldfightpic2.jpg` | `eager` ✓ | `decoding="async"` |
| `src/pages/index.astro:41` (mobile) | `/images/coldfightpic2.jpg` | `eager` ✓ | — |
| `src/pages/workshop.astro:75` | `/images/workshop100M.jpg` | `eager` ✓ | `fetchpriority="high"` ✓ |
| `src/pages/workshop.astro:107` | `/images/workshop100M.jpg` | `eager` ✓ | `fetchpriority="high"` ✓ |
| `src/pages/qa.astro:14` | coaching photo | `eager` ✓ | — |
| `src/pages/footwork-foundation.astro:40` | `/images/coldfightpic3.jpg` | `eager` ✓ | — |
| `src/pages/about.astro:34` | coaching photo | `lazy` — POTENTIAL ISSUE | — |
| `src/pages/about.astro:51` | winning photo | `lazy` — POTENTIAL ISSUE | — |

Note: `workshop.astro:183` (Picture component, below-fold) — `loading="lazy"` ✓ correct.

### Images with explicit width and height attributes

**Have explicit width + height:**
- `src/pages/index.astro:32,42` — coldfightpic2.jpg → `width="2280" height="2203"` ✓
- `src/pages/index.astro:62` — bundle_cover.png → `width="1414" height="2000"` ✓
- `src/pages/index.astro:82` — footworkbp_cover.png → `width="400" height="400"` ✓
- `src/pages/index.astro:106` — shadowboxingblueprint_covernew.png → `width="1500" height="1150"` ✓
- `src/pages/about.astro:37` — coaching photo → `width="1200" height="1500"` ✓
- `src/pages/about.astro:54` — winning photo → `width="1200" height="800"` ✓
- `src/pages/workshop.astro:78,110` — workshop100M.jpg → `width="1920" height="1080"` ✓
- `src/pages/qa.astro:17,75` — coaching photo → `width="1200" height="1500"` ✓
- `src/pages/footwork-foundation.astro:41,106,206` — various → explicit w/h ✓
- `src/components/blocks/Testimonial.astro:17,18` — avatar → `width="64" height="64"` ✓

**Missing explicit width + height (layout shift risk):**
- `src/components/site/Nav.astro:6` — logo-trb.png (only CSS `h-10 md:h-12 w-auto`)
- `src/components/site/Footer.astro:10` — logo-trb.png (only CSS `h-10 w-auto`)
- `src/pages/foundation-guide.astro:10` — logo-trb.png (only CSS `h-9 w-auto`)
- `src/pages/links.astro:11` — logo-trb.png (only CSS `h-10 w-auto`)
- `src/pages/vault.astro:132` — trb-logo-nobg.png (only CSS `h-20 w-auto`)
- `src/pages/private-architecture/[token].astro:147` — logo inline style `height: 2rem`

### npm run build output (full)

```
> thee-rainers@0.0.1 build
> astro build

[@astrojs/cloudflare] Enabling image processing with Cloudflare Images for production
  with the "IMAGES" Images binding.
[@astrojs/cloudflare] Enabling sessions with Cloudflare KV with the "SESSION" KV binding.
[WARN] [vite] Default inspector port 9229 not available, using 9230 instead

Using secrets defined in .env
[build] output: "static"
[build] mode: "server"
[build] directory: /Users/ghoste/thee-rainers/dist/
[build] adapter: @astrojs/cloudflare
[build] ✓ Completed in 1.67s.
[build] Building server entrypoints... ✓ built in 752ms / 612ms / 119ms
[build] Server built in 3.43s
[build] Complete!
```

Prerendered routes (22 static HTML pages):
/about, /arena, /command, /contact, /feedback, /footwork-foundation,
/foundation-guide, /gate, /lever-audit, /lever-audit-quiz, /library,
/links, /qa, /thank-you/* (4 pages), /vault, /welcome, /workshop, /workshop-replay, /

Build: **SUCCESS. No errors. No warnings except inspector port.**

### Client-side JS and CSS shipped (dist/client/_astro/)

| File | Size |
|---|---|
| `ClientRouter.astro_astro_type_script_index_0_lang.4nu6hubr.js` | **16 KB** |
| `global.BP2UpTlJ.css` | **35 KB** |
| `workshop-replay.DF8tbI22.css` | **35 KB** |
| `defense_cover1.CusyX0yI.jpg` | (image, not JS) |
| Bricolage Grotesque woff2 files (×3) | (fonts, not JS) |

**Total client JS: 16 KB (one bundle — Astro View Transitions / ClientRouter)**

No page-specific JS bundles. Page-level `<script>` blocks (Nav toggle, buy button fetch, checkout wiring) are inlined in HTML. The inline scripts are not counted in this JS bundle.

---

## 9. Accessibility

### lang attribute on `<html>`

`src/layouts/Base.astro:52` — `<html lang="en">` ✓

### Semantic landmarks

| Landmark | Present | Location |
|---|---|---|
| `<header>` | YES ✓ | `src/components/site/Nav.astro:3` — `<header id="site-nav">` |
| `<nav>` | YES ✓ | `src/components/site/Nav.astro:9` — `<nav class="hidden md:flex...">` |
| `<main>` | YES ✓ | `src/layouts/Base.astro:83` — `<main class="flex-1"><slot /></main>` |
| `<footer>` | YES ✓ | `src/components/site/Footer.astro:5` — `<footer class="bg-white...">` |

Note: Mobile menu (`<div id="mobile-menu">`) is a `<div>`, not a `<nav>`. Screen readers may miss it as a landmark.

### Skip-to-content link

ABSENT — no skip link found anywhere in source. This is a WCAG 2.4.1 (Level A) failure.

### Image alt attribute coverage

All `<img>` tags checked have non-empty `alt` attributes. No `alt=""` decorative pattern (intentional or otherwise) was found.

Specific alt values:
- `src/components/site/Nav.astro:6` — `alt="Thee Rainers Blueprint"` ✓
- `src/components/site/Footer.astro:10` — `alt="Thee Rainers"` ✓
- `src/pages/index.astro:31,41` — `alt="Thee Rainers"` ✓
- `src/pages/workshop.astro:75,107` — `alt="Defense Workshop — live boxing sparring session"` ✓
- `src/pages/about.astro:34` — `alt="Coaching — Netherlands."` ✓
- `src/pages/footwork-foundation.astro:40,105` — `alt="Rainers — Competition"` ✓
- `src/pages/workshop.astro:183` (Picture) — `alt="Defense Workshop — live training session with Rainers"` ✓

### Form input labels

| Page | Form type | `<label>` present |
|---|---|---|
| `src/pages/command.astro:26-50` | Private Architecture application | YES ✓ — all 5 fields have `<label for="...">` |
| `src/pages/contact.astro:48-123` | Contact form | YES ✓ — all fields have `<label for="...">` |
| `src/pages/footwork-foundation.astro:73-78` | Email capture | NO ✗ — input has placeholder only, no `<label>` |
| `src/pages/footwork-foundation.astro:243-247` | Email capture (2nd) | NO ✗ — placeholder only |
| `src/pages/lever-audit.astro:50-55` | Email capture | NO ✗ — placeholder only |
| `src/pages/qa.astro:50-55` | Email/registration | NO ✗ — placeholder only |

3 forms (footwork-foundation, lever-audit, qa) have email inputs without visible `<label>` or `aria-label`. These fail WCAG 1.3.1 / 3.3.2.

### ARIA usage

- `aria-label="Toggle Menu"` on mobile hamburger button — `src/components/site/Nav.astro:18` ✓
- `aria-current="page"` applied dynamically to active nav links via JS — `src/components/site/Nav.astro:67` ✓
- `aria-hidden="true"` on decorative SVG in Testimonial component — `src/components/blocks/Testimonial.astro:23` ✓
- No `role=` overrides found that would create issues.

### Contrast

Cannot be verified from code. Requires live browser tool (axe DevTools, browser contrast checker, or Lighthouse accessibility audit). Noted for live check.

Primary color combinations to check:
- `text-[#0A0A0A]/55` on white (main body copy — ~55% opacity black)
- `text-[#D4A373]` (copper) on white (metadata labels)
- `text-[#0057FF]` (Rainers Blue) on white (CTAs)
- White text on `#0A0A0A` (scripture sections)
- `text-[#0A0A0A]/25` on white (secondary text — very light)

---

## 10. Privacy & Legal

### Analytics

**Tool**: Google Tag Manager — TWO container IDs loaded simultaneously.

`src/components/greatness/Analytics.astro:3`:
```js
const GTM_IDS = ['GTM-WQZ9ZLZM', 'GTM-5LQ7HPXG'];
```

Both GTM containers injected via `<script is:inline>` in `<head>` + `<noscript><iframe>` in `<body>`.

- **Production-only**: YES — wrapped in `{isProd && ...}` check. Does not fire in dev/preview. ✓
- **Cookie-free**: NO — GTM by default fires Google Analytics 4 tags which set `_ga`, `_gid`, `_ga_XXXX` cookies (first-party). This constitutes cookie-based analytics under GDPR/ePrivacy.
- **Dual GTM containers**: Two containers loading simultaneously is unusual. Could cause duplicate event firing or double-counting. Reason for two containers not documented in code.

### Cookie consent banner

ABSENT — no cookie consent / GDPR banner found anywhere in source. Given that GTM fires Google Analytics on page load without user consent, this is a compliance gap in jurisdictions where GDPR/ePrivacy applies.

### Third-party scripts (client-side)

| Script | Source | Purpose |
|---|---|---|
| GTM container 1 | `https://www.googletagmanager.com/gtm.js?id=GTM-WQZ9ZLZM` | Analytics/tracking |
| GTM container 2 | `https://www.googletagmanager.com/gtm.js?id=GTM-5LQ7HPXG` | Analytics/tracking |

Total: 2 external scripts. No Stripe.js, no Facebook Pixel, no TikTok Pixel, no Hotjar found in source.

### .env file

`/Users/ghoste/thee-rainers/.env` — EXISTS locally. Contains:
- `MAKE_LEAD_WEBHOOK_URL` (Make.com webhook URL)
- `MAKE_CONTACT_WEBHOOK_URL`
- `MAKE_COACHING_WEBHOOK_URL`
- `SITE_URL`

`.env` and `.env.production` are in `.gitignore` ✓. File does NOT contain Stripe secret keys, Airtable PATs, or Cloudflare tokens — those are set via CF Pages dashboard env vars only.

### Legal pages

| Page | Present |
|---|---|
| Terms of Service / Terms & Conditions | ABSENT |
| Privacy Policy | ABSENT |
| Refund / Cancellation Policy | ABSENT |
| Accessibility Statement | ABSENT |
| Disclaimer | ABSENT |

**All five legal pages are ABSENT.** The site sells subscriptions ($47–$87/mo) and one-time digital products. Stripe's own terms require merchants to display a cancellation/refund policy at checkout or on the website. The absence of a privacy policy also creates GDPR / CCPA exposure given GTM/GA4 cookie use.

### Integration presence summary

| Integration | Present | Status |
|---|---|---|
| Cal.com | ABSENT | Not referenced anywhere |
| Stripe | PRESENT | Hosted checkout + payment links + webhook + billing portal |
| Make.com | PRESENT | Lead delivery, contact, coaching capture webhooks |
| Airtable | PRESENT | Members table (stripe-webhook) + Purchases table (resend, private-arch) |
| Kit (ConvertKit v4) | PRESENT (partial) | Code wired to api.kit.com/v4, KIT_API_KEY env var required, tag IDs are placeholders — NOT YET LIVE |

---

## What I could NOT determine from the code

1. **Live response headers** — Cannot verify that `public/_headers` rules are actually being served by Cloudflare Pages. The `_headers` file is parsed by the CF Pages build system; the real headers require `curl -sI https://theerainers.com` or a browser network tab to confirm.

2. **TLS grade** — Cannot determine TLS version (1.2 vs 1.3), cipher suites, certificate issuer, or HSTS preload list enrollment status from source files. Requires: SSL Labs (ssllabs.com/ssltest) or SecurityHeaders.com scan against the live domain.

3. **Core Web Vitals field data (CrUX)** — Cannot determine real LCP, INP, CLS, FID values. Lab scores (Lighthouse) can be run locally but will differ from field data. Real data: PageSpeed Insights (pagespeed.web.dev), Google Search Console → Core Web Vitals report, or Chrome UX Report (CrUX) API.

4. **Colour contrast ratios** — Tailwind opacity utilities (`text-[#0A0A0A]/55`, `text-[#D4A373]` on white) require a live rendering to measure actual contrast ratio. Cannot be calculated from source alone without knowing exact background colour in context.

5. **GTM container contents** — Cannot determine what tags/triggers are configured inside GTM-WQZ9ZLZM or GTM-5LQ7HPXG. Both could be firing GA4, Facebook Pixel, TikTok Pixel, or other tags. Requires GTM dashboard access.

6. **Cloudflare Pages env var completeness** — Cannot verify which env vars are actually set in the CF Pages dashboard (Production vs Preview environments). Only local `.env` was inspectable.

7. **HSTS preload list enrollment** — `preload` directive is set in the HSTS header, but actual enrollment in the Chrome/Firefox HSTS preload list requires verification at hstspreload.org.

8. **Stripe webhook endpoint registration** — Cannot verify which events (`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`) are registered on the live Stripe webhook endpoint. Requires Stripe Dashboard → Developers → Webhooks.

9. **PDF validity** — `public/pdfs/lever-audit.pdf` is marked as a placeholder in CLAUDE.md and should be regenerated from `public/lever-audit-print.html`. Cannot confirm current file is the correct final version without opening it.

10. **Kit tag IDs** — The four `KIT_TAG_*` placeholder strings in `src/pages/api/stripe-webhook.ts` need to be replaced with real numeric Kit tag IDs before tagging goes live. This requires Kit dashboard access.

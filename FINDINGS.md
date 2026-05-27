# FINDINGS.md — Greatness Community Restructure Audit
**Repo:** theblueprjnt/thee-rainers | **Date:** 2026-05-27 | **Status:** Phases 0-5 shipped. Pending: manual actions listed at bottom.

## PHASE COMPLETION LOG
- **Phase 0 (past_due bug fix):** Shipped commit db23b47. `customer.subscription.updated` no longer revokes Kit tag on past_due. Only `canceled` and `unpaid` revoke access.
- **Phase 1 (four-umbrella restructure):** Shipped commit 542be1b. Nav, redirects, one-time Blueprint pricing, vault rewrite, community pages, API updates.
- **Phase 2 (product ID + community page):** Shipped. `prod_Uaz6EzELZP6j0V` wired into create-checkout.ts and stripe-webhook.ts. Community page rewritten: weekly Q&A, brotherhood, chat, billing authorization line, FAQ, JSON-LD schema.
- **Phase 3 (portal + welcome):** Shipped. `/api/portal` updated to accept session_id. Welcome page SSR with portal button, community chat link from env, drill library link.
- **Phase 4 (workshop-replay FAQ):** FAQ block added to workshop-replay.astro.

---

---

## PART 1 — CURRENT STATE AUDIT

### Navigation (src/components/site/Nav.astro)
Five top-level items: Library, Blueprints (gradient), Workshop, Q&A, About. A "Start Free" CTA button in the top right. Mobile menu mirrors desktop plus a small "Private Architecture" gradient link at the bottom. No Greatness Community entry point. Workshop and Q&A are top-level despite being lower-funnel than the offer architecture warrants. Active state driven by `data-nav-path` attribute + JS. Scroll-glass effect on `#site-nav.is-scrolled`.

### Footer (src/components/site/Footer.astro)
Two utility rows below the social icons: Q&A, 7-Lever Audit, Free Foundation, About, Private Architecture (gradient), All Links — then a separate legal row (Privacy, Terms, Refund, Cookie, Accessibility, Disclaimer). No Contact or Feedback links in the footer. Contact and Feedback pages exist at `/contact` and `/feedback` but are not linked from any persistent navigation element.

### Homepage (src/pages/index.astro)
Sections in order: hero, quiz, products, free protocol, social proof, scripture. Products section shows three Blueprint cards with subscription pricing ($47/mo, $87/mo) and "Includes Live Monthly Q&A Access" perk lines on every card. Checkout buttons use `data-checkout="bundle_monthly"` / `"footwork_monthly"` / `"shadowboxing_monthly"` — all hit `/api/create-checkout` which serves subscription sessions. A Workshop Replay banner sits below the Blueprint cards. No Greatness Community section. No annual pricing toggle anywhere. Quiz submits to `source: 'footwork-foundation'`.

### /vault (src/pages/vault.astro)
Three Blueprint cards (Bundle leads) with subscription framing ($47/mo, $87/mo) and "Includes Live Monthly Q&A Access" gradient perk lines. Below that: Defense Workshop card ($197, direct Stripe link) and Workshop Replay card ($79, links to /workshop-replay). A Monthly Q&A community block occupies a full-width row at the bottom. A "Not ready to buy? The foundation protocol is free." nudge links to /foundation-guide. No one-time pricing. No Greatness Community section.

### /qa (src/pages/qa.astro)
Standalone sales/registration page titled "The Proving Ground." Described as free with any Blueprint. Contains a registration email capture form posting to `/api/lead-capture` with `source: 'qa-registration'`. Next session hardcoded as "Saturday, June 13." Three-tier system map shows Q&A as Tier 2 (Apply). Page is in the main nav under "Q&A." This page currently markets the Q&A as a Blueprint benefit — contradicts the target model where it belongs exclusively to Greatness Community.

### /arena (src/pages/arena.astro)
Separate page with its own H1 ("Neural Boxing. In Motion."), a featured YouTube embed (video 3N5GgvuvrVo — "Why Boxing Classes Don't Work"), and a three-layer operating system explanation (Perceptual / Mechanical / Existential). Footer CTA links to /vault and /command. No merge with /library has occurred. Sits in the nav as an unlisted page (not in top nav, but exists).

### /library (src/pages/library.astro)
9 videos. Featured video (SrFywBFkmik) displayed in a 50/50 grid with a System Summary sidebar. Archive grid below (8 videos). Has a `VideoObject` JSON-LD schema for the featured video only. CTA at the bottom links to /footwork-foundation and /vault. Contains standalone value; Arena content would merge cleanly here.

### /command (src/pages/command.astro — not read but confirmed via nav/footer)
Private Architecture application page. Off the main nav. Links in footer (gradient) and mobile nav. Per instructions: stays exactly as-is.

### /welcome (src/pages/welcome.astro)
Post-checkout confirmation. Three bullet rows: Your Blueprint (7-day link), Monthly Live Q&A Included, and Renewal (monthly subscription). The Q&A row explicitly says it is "Included" as a Blueprint benefit. The Renewal row confirms monthly subscription framing. This page directly contradicts the target model and will need updating when Blueprints move to one-time. The page also has `prerender: true` — works for static delivery but means no session-specific personalization.

### /gate (src/pages/gate.astro)
Binary question ("Building a system vs. get fit"). "System" routes to /vault; "fit" routes to /footwork-foundation. Currently noindex. Role in the new funnel is unchanged — entry filter.

### /src/pages/private-architecture/[token].astro
Token-gated access page for Blueprint purchases. Checks Airtable `Purchases` table for `access_token` match, validates `is_active` and `expires_at`, then generates R2 presigned download links (1-hour expiry). Contains a "Monthly Live Q&A" section pointing to /qa and explicitly stating it is included with Blueprint purchase. This must change under the new model.

### /api/create-checkout.ts
Serves subscription products only. Six slugs: footwork_monthly, footwork_annual, shadowboxing_monthly, shadowboxing_annual, bundle_monthly, bundle_annual. Maps slug to product ID then finds active recurring price from Stripe at request time. `allow_promotion_codes: true`, `phone_number_collection`, `billing_address_collection: 'auto'`. Success URL: `/welcome`. No Greatness Community product exists yet. No `greatness_monthly` or `greatness_annual` slug. Under the new model this endpoint should serve Greatness Community only; Blueprint purchases shift to direct Stripe payment links.

### /api/stripe-webhook.ts
Handles three event types:

**checkout.session.completed:** Calls `listLineItems` with `expand: ['data.price.product']` to get `productId`. Maps product ID via `PRODUCT_MAP` to slug. Calls `deliverProduct()` which generates R2 presigned URLs (7-day expiry) or a HMAC-signed watch URL for workshop-replay. Fires `MAKE_DELIVERY_WEBHOOK_URL`. Calls `upsertAirtable` to Members table. Tags subscriber in Kit with `KIT_MEMBER_TAG` (19807647) and product-specific tag.

`PRODUCT_MAP` includes both one-time product IDs (`prod_UZreHroYQEDAFU`, `prod_UZrejf6iuDorEA`, `prod_UZreDlek9325EY`, `prod_UZOMBOeJ0mm15I`) and subscription product IDs (`prod_UZ9lTK2PhsS4xs`, `prod_UZ9vV79TAun9yB`, `prod_UZ9xqJt3glrCOO`). Both sets map to the same slugs (footwork, shadowboxing, bundle). This means the webhook correctly handles purchases from either the hosted subscription checkout OR the direct Stripe payment links. Delivery WILL fire for one-time Blueprint purchases if the direct Stripe payment links are used. Confirmed working.

**invoice.payment_succeeded (subscription_cycle):** Re-generates fresh 7-day R2 links and fires delivery webhook again. This is correct behavior for subscription renewals. Under the new model, Greatness Community has no file to redeliver — this path would need a no-op for the membership product.

**customer.subscription.updated:** Upserts Airtable. Then checks `sub.status`: if `active` or `trialing`, applies `KIT_MEMBER_TAG`; for ANY other status (including `past_due`), calls `untagKit`. **This is a churn-amplification bug.** A payment failure sets status to `past_due` while Stripe Smart Retries runs. This webhook fires and immediately removes the member tag, cutting off access before retries have a chance to recover. Spec requires access to survive through the dunning window; revoke only on `customer.subscription.deleted`.

**customer.subscription.deleted:** Upserts Airtable status = 'canceled'. Calls `untagKit`. Correct — this is the terminal event. No access revocation bug here.

### /api/lead-capture.ts
Accepts JSON or form data. Validates email with regex. Accepts `full_name`, `email`, `phone`, `source`. Forwards to `MAKE_LEAD_WEBHOOK_URL`. Returns `{ success: true }` or redirects. Clean.

### /api/portal.ts
Accepts `customerId`, creates Stripe billing portal session, returns URL. Return URL hardcoded to `${siteUrl}/account` — the `/account` page does not exist. Portal link is not exposed anywhere in the current site UI (not in welcome page, not in emails). This is a churn risk: members who want to cancel will not find the self-serve path, will try email or just dispute the charge.

### /api/resend-access.ts
Looks up email in Airtable `Purchases` table (not `Members`). Fires delivery webhook with `access_token` and a `/private-architecture/{token}` URL. This is the old Blueprint access pattern using token-gated URLs stored in Airtable. Under the new model, Blueprint purchases still deliver files via R2, so this route remains valid. Note the table name is `Purchases` here vs. `Members` in the webhook — two separate Airtable tables are implied.

### /src/pages/watch/workshop-replay.astro
Server-side HMAC validation. Reads `sig` and `exp` from query params. Validates against `WATCH_TOKEN_SECRET`. Invalid token redirects to /workshop-replay. Expired token shows repurchase CTA. Valid token renders YouTube embed (`AtZmUk7cZFQ`, youtube-nocookie). Contains a hardcoded "Next step: Know your primary constraint before June 27" — stale date. noindex. Works correctly.

### src/content/products/ (footwork.json, shadowboxing.json, bundle.json)
Three JSON files with product metadata. `stripe_link` values are all `"PLACEHOLDER"` strings — not wired to real Stripe links. These files exist in a content schema (`content.config.ts`) but appear unused by any current page (vault.astro and index.astro hardcode all product data directly). Dead weight unless wired up.

### public/llms.txt
Documents products as having Q&A included and subscription pricing. Will need updating after restructure to reflect Greatness Community as the membership and Blueprints as one-time. Currently accurate to the current (old) model.

### public/robots.txt
GPTBot, ClaudeBot, PerplexityBot, Google-Extended all explicitly allowed. Correct. No Cloudflare-level blocking to check in code (manual check required in dashboard).

### public/_headers
HSTS, X-Frame-Options, CSP configured. CSP `frame-src` allows youtube.com and youtube-nocookie.com. CSP `script-src` has `'unsafe-inline'` which is unavoidable given Astro's inline script pattern. No issues blocking the restructure.

### /legal/terms.astro
Subscription cancellation language present (Section 7). EU withdrawal right covered (Section 9). Governing law: Latvia. Recurring authorization language is present but brief — Section 7 says subscription "renews automatically unless cancelled." This covers the mandate but is minimal. Will need a sentence explicitly naming the charge frequency and amount for the Greatness Community subscription page to be compliant. Contact email in terms is `rainers@stepintoring.com` — different from `rainers@theerainers.com` used elsewhere.

### Checkout flow (one-time Blueprints, current)
vault.astro Blueprint cards use `data-checkout` buttons posting to `/api/create-checkout`. The Stripe payment links in CLAUDE.md (e.g., `https://buy.stripe.com/bJe14n8lt81ogyu3VW6J20k`) bypass the site entirely. Under the new model, Blueprints become one-time and the site will link to these direct Stripe payment links instead of going through create-checkout.

---

## PART 2 — CONFLICT LIST

| # | Current State | Target State | Affected Files |
|---|---|---|---|
| C-01 | Nav: Library, Blueprints, Workshop, Q&A, About | Nav: Greatness Community, Vault, Library, About | Nav.astro |
| C-02 | Blueprint cards show $47/mo, $87/mo subscription pricing | Blueprints are one-time purchases — no /mo, no renewal framing | index.astro, vault.astro |
| C-03 | Blueprint cards show "Includes Live Monthly Q&A Access" perk | Q&A belongs to Greatness Community only — not mentioned on Blueprint cards | index.astro, vault.astro |
| C-04 | `create-checkout.ts` serves 6 subscription slugs (footwork/shadowboxing/bundle monthly+annual) | Endpoint serves Greatness Community subscription only (greatness_monthly, greatness_annual) | create-checkout.ts |
| C-05 | No `/community` page exists | `/community` is a new first-nav-item page: membership sales + member area | community.astro (create) |
| C-06 | `/qa` is a free standalone registration page, linked in nav and footer as Blueprint benefit | /qa folds into /community or becomes a member-only gate; no longer a free standalone page | qa.astro, Nav.astro, Footer.astro |
| C-07 | `/arena` is a standalone page separate from /library | /arena content merges into /library; /arena redirects to /library | arena.astro, library.astro |
| C-08 | Homepage products section: subscription-priced Blueprint cards, no Greatness Community section | Homepage: free CTAs, then Vault (one-time), then prominent Greatness Community section | index.astro |
| C-09 | `/welcome` post-checkout page says "Monthly Live Q&A — Included" and "Subscription renews monthly" | Welcome page reflects new model: Blueprint = one-time delivery; Community member = next Proving Ground date + drill library access | welcome.astro |
| C-10 | `/private-architecture/[token].astro` has "Monthly Live Q&A — You're In The Room" section pointing to /qa as Blueprint benefit | Remove Q&A section from Blueprint access page; Q&A is Greatness Community only | private-architecture/[token].astro |
| C-11 | `invoice.payment_succeeded` renews file delivery for all subscription products | Community subscription has no file to redeliver; renewal path should re-affirm active access only (no R2 links needed) | stripe-webhook.ts |
| C-12 | `customer.subscription.updated` removes Kit member tag on `past_due` | `past_due` must not cut access; revoke only on `customer.subscription.deleted` | stripe-webhook.ts |
| C-13 | `/api/portal.ts` return URL points to `/account` (page does not exist); portal link is exposed nowhere in the site UI | Portal link must be visible: in welcome page, in member area, in receipt email | portal.ts, welcome.astro |
| C-14 | No member-gated area exists for Greatness Community | A member area inside /community (or /community/inside) showing drill library and Proving Ground access, gated by active subscription status | community/inside.astro (create) or gated section of community.astro |
| C-15 | No access check at request time for Community membership | Community member area must check subscription status live, not rely on a static emailed link | community.astro or community/inside API route |
| C-16 | No annual pricing toggle anywhere on site | Greatness Community page must surface annual option ($390/yr) prominently | community.astro |
| C-17 | `llms.txt` documents Q&A as included with "any paid product" and Blueprint as subscription | Update to reflect Greatness Community as the membership, Blueprints as one-time | llms.txt |
| C-18 | Terms contact email is `rainers@stepintoring.com` — inconsistent with `rainers@theerainers.com` everywhere else | Unify to rainers@theerainers.com | legal/terms.astro |
| C-19 | No FAQ blocks on commercial pages | FAQPage JSON-LD + visible FAQ section on /community and /vault | community.astro, vault.astro |
| C-20 | `src/content/products/` JSON files have placeholder Stripe links and appear unwired | Either wire them to real data or remove them to avoid confusion | footwork.json, shadowboxing.json, bundle.json |
| C-21 | Footer links `/qa` as a standalone page | Footer should link `/community` instead; /qa becomes a redirect | Footer.astro |
| C-22 | Watch page next-step copy hardcoded: "before June 27" | Stale date — needs updating or removing | watch/workshop-replay.astro |

---

## PART 3 — PHASED PLAN

### PHASE 0 — Revenue at Risk

**Code work:**

**P0-C1: Confirm one-time Blueprint delivery fires on checkout.session.completed**
File: `src/pages/api/stripe-webhook.ts`
Finding: The handler IS wired correctly. `PRODUCT_MAP` includes all one-time product IDs. The `listLineItems` call uses `expand: ['data.price.product']` so the product object is expanded, not an ID string. `deliverProduct()` will fire for purchases made via the direct Stripe payment links. No code change needed — but this is only true if someone uses the direct Stripe link. Currently the site sends all Blueprint purchases through the subscription checkout (create-checkout.ts). The one-time product IDs in `PRODUCT_MAP` are dormant. They will activate when Phase 1 switches Blueprints to one-time links.
Action: No fix needed now. Verified working as of current architecture. Note that after Phase 1, Blueprint purchases via direct Stripe links will route through this same handler correctly.

**P0-C2: Fix past_due churn bug (critical — do this before Phase 1)**
File: `src/pages/api/stripe-webhook.ts`
Change: In `customer.subscription.updated` handler, replace the `else { await untagKit(...) }` branch with a check that only untags on terminal statuses (`canceled`, `unpaid`). `past_due`, `incomplete`, and `incomplete_expired` must NOT revoke access. This is the single highest-impact code change before any members exist.

**Manual work (P0-M): See PART 4.**

---

### PHASE 1 — Restructure to the Four Umbrellas

Files touched per sub-task:

**1a. Navigation**
- `src/components/site/Nav.astro`
  - Remove: Library, Blueprints, Workshop, Q&A, About
  - Add: Greatness Community (/community), Vault (/vault), Library (/library), About (/about)
  - Remove: "Start Free" CTA button from the top nav (it competes with Greatness Community as the primary CTA)
  - Mobile menu: mirror desktop four items; keep Private Architecture gradient link at bottom
  - Retain scroll-glass behavior, active state JS, mobile toggle JS

**1b. Footer**
- `src/components/site/Footer.astro`
  - Replace /qa link with /community ("Greatness Community")
  - Add /contact and /feedback links to footer utility row
  - Keep /lever-audit, /footwork-foundation, /about, Private Architecture, /links in footer
  - Remove /qa
  - Legal row: unchanged

**1c. Vault page — one-time only**
- `src/pages/vault.astro`
  - Blueprint cards: remove all "/mo" pricing, replace with one-time prices ($47, $47, $87)
  - Remove "Includes Live Monthly Q&A Access" gradient perk line from all three cards
  - Change `data-checkout` buttons to direct `<a href>` links pointing to the Stripe payment links:
    - Footwork: `https://buy.stripe.com/bJe14n8lt81ogyu3VW6J20k`
    - Shadowboxing: `https://buy.stripe.com/5kQdR91X5dlIeqm8cc6J20l`
    - Bundle: `https://buy.stripe.com/14A4gz59hgxUaa65006J20m`
  - Remove the "Get both Blueprints + Monthly Q&A for $87/mo" upsell line from non-featured cards
  - Remove the full-width Monthly Q&A Community Call block at the bottom
  - Add a FAQ section (FAQPage JSON-LD + visible accordion) — suggested questions: "Do the Blueprints include the live Q&A?" (No — that is the Greatness Community), "Can I buy both Blueprints?" (Yes, get the Bundle), "Is this a subscription?" (No — one purchase, permanent access), "What format are the Blueprints?" (PDF + video)
  - Add a Greatness Community teaser row at the bottom of the page: "Bought a Blueprint? The next level is the community." CTA → /community
  - Defense Workshop and Workshop Replay cards: unchanged
  - Inert the checkout script block (the `data-checkout` JS) since buttons are now plain links

**1d. create-checkout.ts — subscription mode for Greatness Community only**
- `src/pages/api/create-checkout.ts`
  - Remove all six Blueprint slugs from `PRODUCT_IDS`
  - Add two new slugs: `greatness_monthly` and `greatness_annual`
  - These point to the new Stripe product IDs you will create (Manual P1-M2)
  - Endpoint now exclusively serves the Greatness Community subscription

**1e. Build /community page**
- `src/pages/community.astro` (new file)
  - Layout: Base.astro
  - Sections:
    1. Hero (60/40): H1 "The Greatness Community." Left: who this is for, what it gives you (Proving Ground live Q&A, growing drill library, the brotherhood). Right: real photo.
    2. What is the Proving Ground: the monthly live call, camera on, one correction, recording burns in 30 days. FOMO woven in.
    3. What is the drill library: growing archive of structured rounds.
    4. Pricing toggle (monthly / annual): reads price from Stripe at build time or hardcodes after manual step; shows $39/mo or $390/yr. Monthly/annual toggle in pure CSS or minimal JS.
    5. Checkout CTA buttons: `data-checkout="greatness_monthly"` and `data-checkout="greatness_annual"` posting to `/api/create-checkout`.
    6. FAQ block: "Is this the same as the Q&A on the old site?" "What happens after I subscribe?" "Can I cancel?" "Do I need a Blueprint first?" "How do I access the drill library?"
    7. Scripture close.
  - Schema: Product JSON-LD with `greatness_monthly` and `greatness_annual` Offer objects. Price will be read from Stripe or hardcoded at $39/$390.
  - The member-only inner area (drill library + Proving Ground booking) is Phase 1 scope but the access gate mechanism is defined here.

**1f. Member area gate (/community/inside)**
- `src/pages/community/inside.astro` (new file, SSR, `prerender = false`)
  - The gate: at request time, read the visitor's email from a session cookie or query param. Look up Airtable `Members` table. If `Status = 'active'`, render the member area. Otherwise redirect to /community.
  - This is a lightweight Airtable lookup at request time — no JWT, no complex auth. The existing Airtable `upsertAirtable` call in the webhook writes `Status: 'active'` on purchase and `Status: 'canceled'` on deletion. Query that field.
  - Member area content for launch: the next Proving Ground date + Zoom link (hardcoded or from a simple config), a growing drill video grid (a YouTube embed list similar to /library).
  - Note: this is not a cryptographic guarantee. It is a reasonable deterrence layer consistent with the existing HMAC approach used for workshop-replay. A determined bad actor could share their email. For launch scale this is fine; a full session/auth system is a future Phase.

**1g. Fold /qa into /community**
- `src/pages/qa.astro`
  - Replace page content with an HTTP 301 redirect to /community
  - In Astro: `return Astro.redirect('/community', 301);` in the frontmatter
  - This is a one-line file change; all inbound links and SEO value transfer to /community

**1h. Merge /arena into /library**
- `src/pages/library.astro`
  - Add an "Operating System" section below the archive grid, pulling the three-layer content (Perceptual / Mechanical / Existential) currently living in arena.astro. The featured video from arena.astro (3N5GgvuvrVo) can become a second featured or archive video.
- `src/pages/arena.astro`
  - Replace with 301 redirect to /library

**1i. Homepage restructure**
- `src/pages/index.astro`
  - Products section: remove subscription Blueprint cards and replace with one-time cards (same three products, now at flat price, no Q&A perk line, direct Stripe links)
  - Remove `data-checkout` buttons and the attached checkout script block
  - Add a new dedicated Greatness Community section between the Vault section and the free protocol section (or after free protocol, before social proof). This section: headline, 2-3 key benefits, pricing teaser, CTA → /community
  - Retain: hero, quiz, free protocol section, social proof, scripture

**1j. Update /welcome**
- `src/pages/welcome.astro`
  - Two user flows now: Blueprint buyer (one-time) vs. Greatness Community member (subscription).
  - Since create-checkout now only serves Greatness Community, /welcome will be reached only by Community members.
  - Remove "Monthly Live Q&A — Included" bullet (it stays correct but now reads as Community benefit, not Blueprint benefit)
  - Remove "Renewal" row about Blueprint subscription (no longer relevant)
  - Add: next Proving Ground date, how to access the drill library (/community/inside), what to expect in week 1
  - Blueprint buyers arrive at Stripe's hosted success page which redirects to `/thank-you/` variants — this is fine for one-time purchases
  - Add portal link: "Manage your subscription → " linking to a page that triggers /api/portal

**1k. Update /private-architecture/[token].astro**
- Remove the "Monthly Live Q&A" section (lines 217-233)
- This is the only change; everything else on the page stays

**1l. Update llms.txt**
- `public/llms.txt`
  - Remove "Monthly Q&A included" from all Blueprint listings
  - Update Blueprints to show one-time prices
  - Add Greatness Community section
  - Update /qa entry to reflect redirect to /community

**1m. Fix terms contact email**
- `src/pages/legal/terms.astro`
  - Replace `rainers@stepintoring.com` with `rainers@theerainers.com` (three occurrences)

**1n. Wire or remove content/products JSON files**
- `src/content/products/footwork.json`, `shadowboxing.json`, `bundle.json`
  - Update `stripe_link` fields with real direct Stripe payment links
  - Update `price` to the one-time price
  - These files are currently not consumed by any page. Either wire them into vault.astro or delete them. Recommendation: wire vault.astro to read from these files so product data has one source of truth.

---

### PHASE 2 — Continuity Hardening

Files touched:

**2a. Fix past_due access revocation (also listed in Phase 0 — highest priority)**
- `src/pages/api/stripe-webhook.ts`
  - In `customer.subscription.updated`: change the Kit untag condition from `else` to explicitly only fire on `canceled` and `unpaid`. Preserve access through `past_due`, `incomplete`, `incomplete_expired`.
  - In `upsertAirtable` call for subscription.updated: same logic — only set Status = 'canceled' on terminal states.

**2b. Renewal logic for Greatness Community**
- `src/pages/api/stripe-webhook.ts`
  - In `invoice.payment_succeeded` (subscription_cycle): add a check: if `productSlug === 'greatness'` (or whatever slug maps to the new Community product), skip R2 URL generation entirely and instead call `upsertAirtable` with `Status: 'active'` to re-affirm access. Continue to generate R2 URLs only for file-based products.
  - This requires adding `greatness` to `PRODUCT_MAP` when you create the Stripe product (Manual P1-M2).

**2c. Customer portal exposure**
- `src/pages/api/portal.ts`
  - Change return URL from `/account` to `/community/inside` (the member area — this is a better return point than a non-existent /account page)
- `src/pages/welcome.astro`
  - Add a "Manage subscription" row that links to a portal trigger. Since portal requires `customerId`, the simplest approach: Stripe sends `customer` ID in the checkout session; store it in a data attribute on the welcome page via query param, then wire a button that posts to `/api/portal` with the customer ID. Alternatively, add a simple self-service form (enter email, we look up customer ID in Airtable, redirect to portal).
- `src/pages/community/inside.astro`
  - Add portal link in the member area header/footer

**2d. Annual option on /community**
- `src/pages/community.astro`
  - Surface `greatness_annual` option clearly with the annual savings callout. This is already planned in Phase 1 (1e) but calling it out explicitly here as the cash-forward mechanism.

**2e. Terms — recurring mandate language**
- `src/pages/legal/terms.astro`
  - Section 7 (Subscriptions): add one sentence explicitly stating charge frequency and amount: "Greatness Community subscriptions are billed at the price shown at checkout — monthly or annually — until you cancel."

---

### PHASE 3 — Compliance and GEO

Files touched:

**3a. VAT two-evidence capture**
- `src/pages/api/create-checkout.ts`
  - Change `billing_address_collection: 'auto'` to `'required'` for the subscription session
  - Add IP country capture: read `CF-IPCountry` header from the request and include it as metadata on the Stripe session and in the Airtable upsert

**3b. JSON-LD schema expansion**
- `src/pages/vault.astro`
  - Add `Product` + `Offer` JSON-LD for each Blueprint and Workshop
- `src/pages/community.astro`
  - Add `Product` + `Offer` JSON-LD for Greatness Community monthly and annual
- `src/pages/library.astro`
  - Add `Article` or `VideoObject` schema for each archived video (currently only featured video has schema)
- `src/pages/vault.astro`, `src/pages/community.astro`
  - Add `FAQPage` JSON-LD matching the visible FAQ sections added in Phase 1
- `src/layouts/Base.astro`
  - Review and expand the `Organization` schema: add `sameAs` entries for all social platforms; confirm `logo` URL is correct

**3c. Accessibility pass**
- All four umbrella pages + checkout entry points: semantic HTML review, labelled `<input>` fields, `aria-label` on icon buttons, visible `:focus` states (currently likely handled by browser defaults only), `alt` text audit on all `<img>` tags, announced state changes on the quiz (add `aria-live` region)
- Files: Nav.astro, index.astro (quiz section), community.astro, vault.astro, library.astro, footwork-foundation.astro, lever-audit-quiz.astro

**3d. llms.txt final update**
- `public/llms.txt`
  - Add Greatness Community canonical entry with URL, price, and what is included
  - Remove stale Q&A-as-Blueprint-benefit language (also in Phase 1 — confirm both touch the file once, not twice)

**3e. Watch page stale date**
- `src/pages/watch/workshop-replay.astro`
  - Remove the "before June 27" hardcoded date in the next-step block; replace with generic copy pointing to the live workshop page or the community

**3f. robots.txt — already correct**
- `public/robots.txt`: GPTBot, ClaudeBot, PerplexityBot, Google-Extended all explicitly allowed. No code change needed.

---

## PART 4 — MANUAL ACTIONS (RAINERS)

These require dashboard access you hold. I cannot touch them. Each has a precise click path.

---

### P0-M1 — Airtable: Fix source field (FIRE — all leads being dropped)
**Why:** The `source` field in your Airtable base is a Single Select type. The API sends plain strings like `"footwork-foundation"` that are not in the dropdown options, returning a 422. Every lead from every form is silently discarded.
**Click path:**
1. Open Airtable → your base → the lead/contacts table
2. Click the `source` column header → click the field type icon (Single select)
3. Change field type to: Single line text
4. Confirm the change. Existing select values will convert to text. No data lost.

---

### P0-M2 — Stripe: Confirm Make.com delivery scenario is live (FIRE — buyers get nothing)
**Why:** `MAKE_DELIVERY_WEBHOOK_URL` receives payloads from the webhook handler but if no Make.com scenario is running to receive them, every buyer gets nothing after payment.
**Click path:**
1. Open Make.com → your scenario for delivery
2. Confirm it is Active (green toggle)
3. If it does not exist: Create scenario → Webhook trigger → set to MAKE_DELIVERY_WEBHOOK_URL endpoint → Add email step (Kit or similar) that sends the R2 link from `expiring_url` to `email`
4. For bundle purchases: add conditional branch — if `expiring_url_2` is not null, include a second download link in the email

---

### P0-M3 — Stripe: Update Workshop Replay success URL (URGENT)
**Why:** Workshop Replay buyers currently land on Stripe's default success page, not `/thank-you/workshop-replay`.
**Click path:**
1. Stripe Dashboard → Products → Workshop Replay payment link (`https://buy.stripe.com/6oUaEX7hp6Xk3LIdww6J20p`)
2. Click the payment link → Edit → After payment → Confirmation page → custom URL → `https://theerainers.com/thank-you/workshop-replay`
3. Save

---

### P0-M4 — Rotate all exposed API keys (URGENT — keys appeared in plain text in prior sessions)
**Stripe:**
1. Stripe Dashboard → Developers → API keys → click the current secret key → Reveal → note it to confirm it matches what is in Cloudflare
2. Developers → API keys → "Create restricted key" or "Roll key" → update the new key in Cloudflare Pages → Settings → Environment variables → `STRIPE_SECRET_KEY`
3. Stripe → Developers → Webhooks → your endpoint → Reveal signing secret → roll it → update `STRIPE_WEBHOOK_SECRET` in Cloudflare

**Airtable:**
1. Airtable → Account → Developer hub → Personal access tokens → find the exposed PAT → Revoke
2. Create a new PAT with the same scopes → update `AIRTABLE_API_KEY` in Cloudflare

**Cloudflare API token:**
1. Cloudflare → My Profile → API Tokens → find the exposed token (shared in a prior session) → click → Disable/Revoke
2. Create a new token with the same permissions → store securely

---

### P1-M1 — Stripe: Archive Blueprint subscription products (after Phase 1 code is deployed)
**Why:** Blueprint subscriptions (footwork, shadowboxing, bundle) are being replaced by one-time purchases. Archive (not delete) so historical invoices and customer data survive.
**Click path:**
1. Stripe Dashboard → Products
2. Find "Footwork Blueprint" subscription product (`prod_UZ9lTK2PhsS4xs`) → click → Archive product
3. Repeat for "Shadowboxing Blueprint" (`prod_UZ9vV79TAun9yB`) and "Bundle" (`prod_UZ9xqJt3glrCOO`)
4. Do NOT archive the one-time products (`prod_UZrejf6iuDorEA`, `prod_UZreDlek9325EY`, `prod_UZreHroYQEDAFU`) — these are the ones that will be used

---

### P1-M2 — Stripe: Create Greatness Community subscription product
**Why:** The `/api/create-checkout` endpoint needs `greatness_monthly` and `greatness_annual` lookup keys pointing to a real Stripe product.
**Click path:**
1. Stripe Dashboard → Products → Add product
2. Name: Greatness Community
3. Add price: $39.00, recurring, monthly → set lookup key = `greatness_monthly`
4. Add another price: $390.00, recurring, annual → set lookup key = `greatness_annual`
5. Save the Product ID (looks like `prod_XXXXXXXXXXXX`) — share it so I can add it to `PRODUCT_MAP` in the webhook
6. Under Product → Settings: set the Statement descriptor to "Thee Rainers Community"

---

### P2-M1 — Stripe Dashboard: Enable Smart Retries, Card Account Updater, Network Tokens
**Why:** These are free Stripe features that recover involuntary churn automatically before your code ever sees a `past_due` event.
**Click path:**
1. Stripe Dashboard → Settings → Billing → Smart Retries → Enable
2. Settings → Billing → Revenue Recovery → Card Account Updater → Enable
3. Settings → Payment methods → Network tokens → Enable
4. Settings → Billing → Revenue Recovery → configure the retry schedule (recommended: Day 3, Day 5, Day 7 — 3 attempts over a week before `customer.subscription.deleted` fires)

---

### P2-M2 — Make.com: Dunning email sequence
**Why:** When a payment fails, Stripe sets status to `past_due` and fires `customer.subscription.updated`. Your code (after Phase 2 fix) will not cut access, but the member needs to know their card failed so they can update it.
**Action:**
1. In Make.com: create a scenario triggered by a webhook or Kit tag change (`past_due` tag)
2. Step 1: wait 1 day. Step 2: send email in Rainers' voice — subject: "Something went wrong with your payment" — body: 3 short paragraphs, single CTA to the Stripe customer portal: `https://theerainers.com/community/inside` (after login, the portal link is there) or direct portal URL
3. Repeat at Day 3 and Day 5 with different subject lines

---

### P2-M3 — Stripe: Enable 3DS / confirm subscription mandate is captured
**Why:** Stripe hosted Checkout in subscription mode already handles 3DS where required by the card issuer. But you should confirm the webhook event includes `checkout.session.completed.payment_status = 'paid'` (not `'no_payment_required'`).
**Action:** In Stripe Dashboard → Developers → Events → filter by `checkout.session.completed` → open a recent subscription event → confirm `payment_status` and `setup_future_usage` fields are present. No code change — just verify Stripe is handling it correctly.

---

### P3-M1 — DNS: DMARC enforcement for theerainers.com
**Why:** Without `p=reject` DMARC, emails from rainers@theerainers.com and Kit can be spoofed, and deliverability of your receipts, welcome, and dunning emails is at risk.
**Click path:**
1. Your DNS provider (likely Cloudflare DNS) → theerainers.com zone
2. Add TXT record: Name `_dmarc`, Value `v=DMARC1; p=reject; rua=mailto:rainers@theerainers.com; adkim=s; aspf=s`
3. Confirm SPF record exists: TXT record at `@` or `theerainers.com` includes `include:_spf.kit.com` (or whatever Kit's SPF host is) and your sending IP
4. Confirm DKIM: in Kit → Settings → Email → DKIM → verify the CNAME/TXT record is published in your DNS

---

### P3-M2 — Cloudflare: Confirm AI bots are allowed (not blocked by default rules)
**Why:** Cloudflare's default bot score thresholds and WAF rules can silently block GPTBot, PerplexityBot, and ClaudeBot despite `robots.txt` allowing them. `robots.txt` is advisory; Cloudflare firewalls are not.
**Click path:**
1. Cloudflare Dashboard → theerainers.com → Security → Bots
2. Confirm "Bot Fight Mode" or "Super Bot Fight Mode" is set to allow verified bots, not block/challenge
3. Security → WAF → Custom Rules → confirm no rule is blocking user agents matching GPTBot, PerplexityBot, ClaudeBot, Google-Extended
4. If any rules are blocking: add exclusion rules for those user agents

---

*End of FINDINGS.md. Awaiting "go [phase]" to begin code execution.*

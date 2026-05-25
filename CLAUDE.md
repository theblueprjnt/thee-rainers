# Thee Rainers — Project Context

## What this is
Astro 4 site on Cloudflare Pages. Vertical integration funnel: YouTube → /links → free PDFs (email capture) → workshop → Private Architecture. Everything connects. Nothing is isolated.

## Brand rules — non-negotiable
- Rainers Blue `#0057FF` — ALL primary CTAs (download, buy, apply, submit)
- Copper `#D4A373` — metadata labels and separators ONLY. Never a CTA.
- Royal Purple `#6A0DAD` — Private Architecture and Apply ONLY. Exclusivity signal.
- Void `#0A0A0A` — primary text, scripture section backgrounds
- White `#FFFFFF` — primary background everywhere else
- No emojis anywhere in the codebase or copy
- No Telegram references — replaced by Monthly Q&A
- Scripture sections stay dark (`bg-[#0A0A0A]`) for gravitas

## Font
Bricolage Grotesque Variable — loaded via Base.astro

## Layout pattern
60/40 asymmetric grid for all hero sections. Left 60% = text/form. Right 40% = image/video/context.

## Funnel architecture
1. YouTube video → description links → theerainers.com/footwork-foundation or /lever-audit
2. Email captured → PDF downloads instantly in browser (no email sent — Make.com handles automation)
3. Make.com webhook URL: env var `MAKE_LEAD_WEBHOOK_URL` in Cloudflare Pages (currently not set — priority)
4. /footwork-foundation → all audience (foundation builders + competitors)
5. /lever-audit → competitors specifically (pre-qualifies for Private Architecture)
6. /workshop → $197 · June 27 · The Calibration Workshop
7. /command → Private Architecture · Application only · Purple CTA

## The /links page
Universal bio link hub. Used on all platform bios. Order: Free Protocol → YouTube Subscribe → Workshop → Latest Video → 7-Lever Audit → social platforms → Private Architecture.

## Social presence
- Instagram: 331K @theerainers
- Facebook: 110K (Blueprint Boxing page / @theerainers)
- TikTok: 90K @theerainers
- Threads: 20K @theerainers
- YouTube: 15K @Rainers

## API routes
- `/api/lead-capture` — footwork foundation + lever audit forms (email required, phone removed)
- `/api/coaching-capture` — Private Architecture application
- `/api/contact` — feedback + general contact
- All POST to Make.com webhook if env var is set

## Automation backend
- Make.com scenario: Custom Webhook → Airtable (Create a Record)
- MAKE_LEAD_WEBHOOK_URL is SET in Cloudflare Pages env vars — confirmed
- Airtable is the lead database (not Google Sheets)
- KNOWN BUG: Airtable `source` field is Single Select type — the API sends values like "footwork-foundation", "lever-audit", "lever-audit-quiz" that don't exist as options → Make.com returns [422] error and all leads are silently dropped
- FIX: In Airtable, change the `source` field type from Single Select to Single line text

## PDFs
- `/public/pdfs/footwork-foundation.pdf` — real PDF, wired correctly
- `/public/pdfs/lever-audit.pdf` — PLACEHOLDER. Real source is at `/public/lever-audit-print.html`
- TO GENERATE: Open `/lever-audit-print.html` in Chrome → Print → Save as PDF → save to `/public/pdfs/lever-audit.pdf`

## Products — Stripe links
- Workshop ($197): https://buy.stripe.com/7sY28r8lt1D06XU6446J20n
- Workshop Replay ($79): https://buy.stripe.com/6oUaEX7hp6Xk3LIdww6J20p  ← UPDATE STRIPE PRICE TO $79
- Footwork Blueprint ($47 one-time): https://buy.stripe.com/bJe14n8lt81ogyu3VW6J20k
- Shadowboxing Blueprint ($47 one-time): https://buy.stripe.com/5kQdR91X5dlIeqm8cc6J20l
- Bundle ($87 one-time): https://buy.stripe.com/14A4gz59hgxUaa65006J20m
- Gumroad: no longer used — all purchases go through Stripe

## Membership — Paid Brotherhood (continuity layer)
- Footwork Blueprint Membership ($47/mo | $470/yr): prod_UZ9lTK2PhsS4xs
- Shadowboxing Blueprint Membership ($47/mo | $470/yr): prod_UZ9vV79TAun9yB
- Bundle Membership ($47/mo | $470/yr): prod_UZ9xqJt3glrCOO
- ONE subscription per member — bundle is a single product, never stacked
- Renewal fires invoice.payment_succeeded → fresh 7-day R2 presigned URLs regenerated
- Add invoice.payment_succeeded to Stripe webhook events in dashboard

## R2 Delivery — exact file paths (theerainers-vault bucket)
- footwork: thefootworkblueprint/links_theFOOTWORKBlueprint.pdf
- shadowboxing: the shadowboxing blueprint/the shadowboxing blueprint.pdf
- bundle[0]: bundle/thefootworkblueprint/links_theFOOTWORKBlueprint.pdf
- bundle[1]: bundle/the shadowboxing blueprint/the shadowboxing blueprint.pdf
- workshop-replay: token-gated /watch/workshop-replay (unlisted YouTube, WATCH_TOKEN_SECRET)

## Featured YouTube video
- ID: SrFywBFkmik
- Title: What Boxing Does to Your Body That the Gym Can't
- Chapters wired, end screen set, card at 8:31 linking to /footwork-foundation

## Stripe
- Workshop: https://buy.stripe.com/7sY28r8lt1D06XU6446J20n
- Always route through the site page first (/workshop), not direct Stripe links

## Key pending items
1. Fix Airtable source field — change from Single Select to Single line text (in Airtable, not code)
2. Generate lever-audit.pdf — open /lever-audit-print.html in Chrome, Print → Save as PDF → /public/pdfs/lever-audit.pdf
3. Update platform bios (Instagram, TikTok, Facebook, Threads) to theerainers.com/links
4. Add date + format to /qa for Monthly Q&A
5. Add seats remaining / social proof to /workshop for urgency

## Deployment
git push → Cloudflare Pages auto-deploys main branch. No manual steps needed.

## Contact
rainers@theerainers.com

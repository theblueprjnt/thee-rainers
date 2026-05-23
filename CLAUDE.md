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
- Make.com scenario: Custom Webhook → Airtable (Create a Record) — already built and tested
- Webhook URL must be set as `MAKE_LEAD_WEBHOOK_URL` in Cloudflare Pages env vars
- Airtable is the lead database (not Google Sheets)

## PDFs
- `/public/pdfs/footwork-foundation.pdf` — real PDF, wired correctly
- `/public/pdfs/lever-audit.pdf` — PLACEHOLDER (copy of footwork PDF). Needs real design + export.

## Featured YouTube video
- ID: SrFywBFkmik
- Title: What Boxing Does to Your Body That the Gym Can't
- Chapters wired, end screen set, card at 8:31 linking to /footwork-foundation

## Stripe
- Workshop: https://buy.stripe.com/7sY28r8lt1D06XU6446J20n
- Always route through the site page first (/workshop), not direct Stripe links

## Key pending items
1. Set MAKE_LEAD_WEBHOOK_URL in Cloudflare Pages env vars — currently losing all email leads
2. Design and export real 7-Lever Audit PDF
3. Update Instagram bio to theerainers.com/links
4. Add date + format to /qa for Monthly Q&A
5. Add seats remaining / social proof to /workshop for urgency

## Deployment
git push → Cloudflare Pages auto-deploys main branch. No manual steps needed.

## Contact
rainers@theerainers.com

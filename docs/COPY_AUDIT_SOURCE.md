# Copy Audit Source — Thee Rainers

Regenerated from scratch. Read-only extraction, no source files modified. Snapshot date: 2026-08-07.

## Methodology note (read before using this file)

Three shared layout components render on most routes: **Nav**, **Footer**, **CookieConsent** (all via `src/layouts/Base.astro`), plus an entry popup embedded directly in `Base.astro` (markup present on every page using Base, but only activated by JS on `/`). Rather than repeating their full text verbatim in all ~34 route sections (which the literal instruction implies), each route section below marks them `[SHARED · Name]` and points to the one full transcription in "Shared Components" immediately below. This is a deliberate legibility tradeoff — Appendix A still lists every route each shared block actually renders on, so nothing is hidden, only de-duplicated. Flag if you want full per-route duplication instead and I'll regenerate.

`action position` (approx px from top at 390 width) is marked **UNVERIFIED** for every route except where noted — getting a real number requires rendering each route in a browser at 390px and reading `getBoundingClientRect()`, which was only done for `/shop` in this session (for an unrelated task). I did not fabricate numbers for the other 34 routes. This is a known gap — see the gate report at the end.

---

## Shared Components

### [SHARED · Nav] — `src/components/site/Nav.astro`, rendered on every Base-layout route
Conditional announcement bar: shows when `workshopState() !== 'between'`. Today (2026-08-07), `NEXT_DATE_ISO='2026-08-29'` is future and `TICKETS_OPEN=false` → state is `'waitlist'` → **bar is currently showing** on every route below except `/links` (different layout).
```
[BANNER]      Defense Workshop · August 29 · Reserve your seat → → /defense-workshop
[BUTTON]      × (aria-label: Dismiss announcement)
[ALT]         Thee Rainers (header logo)
[BUTTON]      Blueprints → /shop
[BUTTON]      Workshop → /defense-workshop
[BUTTON]      Community → /community
[BUTTON]      1-ON-1 → /command
[BUTTON]      The Weekly Session → → /community
[BUTTON]      (mobile menu open, aria-label: Open menu)
[ALT]         Thee Rainers (mobile menu logo)
[BUTTON]      (mobile menu close, aria-label: Close menu)
[BUTTON]      The Weekly Session → → /community (mobile menu duplicate)
[BUTTON]      Blueprints → /shop (mobile menu duplicate)
[BUTTON]      Workshop → /defense-workshop (mobile menu duplicate)
[BUTTON]      Community → /community (mobile menu duplicate)
[BUTTON]      1-ON-1 → /command (mobile menu duplicate)
```

### [SHARED · Footer] — `src/components/site/Footer.astro`, rendered on every Base-layout route
```
[EYEBROW]     Get in touch
[H2]          Not sure where to start.
[BUTTON]      Contact → /contact
[EYEBROW]     Follow Us
[LINK]        Instagram (icon, aria-label only) → https://www.instagram.com/theerainers
[LINK]        TikTok (icon, aria-label only) → https://www.tiktok.com/@theerainers
[LINK]        Facebook (icon, aria-label only) → https://www.facebook.com/theerainers
[LINK]        YouTube (icon, aria-label only) → https://www.youtube.com/@Rainers
[LINK]        Threads (icon, aria-label only) → https://www.threads.com/@theerainers
[ALT]         Thee Rainers (footer logo)
[SMALL]       theerainers.com
[SMALL]       © {year} Thee Rainers  (year = current year via `new Date().getFullYear()`)
[LINK]        Privacy Policy → /legal/privacy-policy
[LINK]        Terms → /legal/terms
[LINK]        Refund Policy → /legal/refund-policy
[LINK]        Cookie Policy → /legal/cookie-policy
[LINK]        Accessibility → /legal/accessibility-statement
[LINK]        Disclaimer → /legal/disclaimer
```

### [SHARED · CookieConsent] — `src/components/site/CookieConsent.astro`, rendered on every Base-layout route
```
[BODY]        This site uses cookies for analytics and performance.
[LINK]        Cookie Policy → /legal/cookie-policy
[LINK]        Privacy Policy → /legal/privacy-policy
[BUTTON]      Decline non-essential
[BUTTON]      Accept
```

### [SHARED · Base entry popup] — `src/layouts/Base.astro` lines 251–281, markup on every Base route, JS-activated only on `/` (15s delay or 65% scroll, once per browser via localStorage `tr_popup_v2`)
```
[BUTTON]      × (aria-label: Close)
[SMALL]       $9 · The Footwork Blueprint
[H2]          Start with the base.
[BODY]        21 pages. 56 drills. Full video breakdown. $9.
[BUTTON]      Get the Blueprint · $9 → → checkout:footwork
[SMALL]       One-time purchase. Instant PDF download.
```

### [SHARED · Base checkout error] — `src/layouts/Base.astro` lines 210, 218, injected by JS after any failed `data-checkout` click, any route with a checkout button
```
[ERROR]       Checkout temporarily unavailable. Email rainers@theerainers.com
```

### [SHARED · PurchaseMoment] — `src/components/site/PurchaseMoment.astro`, fixed chrome around a per-route `productName` / `firstActionCopy`. Rendered on: /thank-you/footwork-blueprint (NO — see route note), /thank-you/footwork, /thank-you/shadowboxing, /thank-you/workshop, /thank-you/defense-workshop, /thank-you/workshop-replay
```
[EYEBROW]     Confirmed
[H1]          You're in.
[BODY]        {productName}            — resolved per-route, see each route section
[BODY]        {firstActionCopy}        — resolved per-route, see each route section
[BUTTON]      {primaryLabel}           — optional, unused by every current caller (all pass no primaryLabel/primaryHref)
[SMALL]       Your confirmation is in your email.
```

### [SHARED · Testimonials] — `src/components/site/Testimonials.astro`, data from `src/data/testimonials.ts`. Props vary per route (heading/kicker/filter/background) — resolved content shown per-route below. Data pool (4 entries, all consented):
```
giancarlo-remote   · Giancarlo · "Entrepreneur · 6 months in the system" · setting: remote · featured · quote: "My footwork makes sense. I can see openings instead of just swinging."
kevin-remote       · Kevin · "Civil engineer · Trains at home" · setting: remote · quote: "" (empty — video-only card)
elizabeth-inperson · Elizabeth · "Digital marketer · Trained in person" · setting: in_person · quote: "I know what to do and where to focus, instead of doing junk volume."
richards-remote    · Richards · "Startup founder · 3 months in the system" · setting: remote · quote: "I'm going back to it for a second time. There's so much more I didn't get the first."
```
filter="remote" → giancarlo (featured) + kevin, richards. filter="in_person" → elizabeth only. filter="all"/unset → all 4, giancarlo featured.

---

## /
file: src/pages/index.astro
surface: DARK
meta title: Thee Rainers · Boxing built on structure.
meta description: Boxing built on structure, full defense, and safer progress. The foundation most gyms skip. Free Footwork Blueprint, live workshops, and coaching.
primary action: Find your foundation → #programs
action position: UNVERIFIED
co-primary actions: NONE (single hero CTA; later sections have their own single CTAs each)
voice markers: 2 in this file (lines 43, 48) + 3 in OfferStack.astro (lines 48, 73, 82 — 73 and 82 sit inside a 3-item map, so structurally cover all 3 card titles/CTAs)
---
[SHARED · Nav]
[SECTION 1 · DARK — Hero]
  [ALT]         "" (decorative hero portrait, aria-hidden)
  [ALT]         "" (decorative mobile fight photo, aria-hidden)
  [EYEBROW]     Thee Rainers · Structured Boxing
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H1]          Boxing built on structure.
  [BODY]        Full offense. Full defense. Minimum unnecessary damage. The foundation most gyms skip.
  [BUTTON]      Find your foundation → #programs
[SECTION 2 · LIGHT — OfferStack, id="programs", [SHARED · OfferStack via index.astro only]]
  [EYEBROW]     The Work
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H2]          Choose where to start.
  [ALT]         The Footwork Blueprint
  [EYEBROW]     Blueprints
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H3]          The Blueprints.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [BUTTON]      Get the Blueprints → /shop
  [ALT]         Live training session
  [EYEBROW]     The Weekly Session
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H3]          Weekly correction, live.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [BUTTON]      Claim your spot → /community
  [ALT]         One-on-one coaching session
  [EYEBROW]     1-ON-1 Coaching
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H3]          Built around one fighter.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [BUTTON]      Apply to see if you qualify → /command
  [BODY]        Defense Workshop · Saturday August 29 · Reserve your seat
  [LINK]        Go to Workshop → → /defense-workshop
[SECTION 3 · DARK — Free support block]
  [EYEBROW]     Start here
  [H2]          The foundation is free.
  [BODY]        The Footwork Blueprint. The base every paid program in this system builds on.
  [BUTTON]      Get the Free Blueprint → /foundation
[SECTION 4 · LIGHT — Testimonials, [SHARED · Testimonials heading="What fighters say." kicker="Field Report" background="white" filter=all]]
  [EYEBROW]     Field Report
  [H2]          What fighters say.
  [BODY]        "My footwork makes sense. I can see openings instead of just swinging." (featured, Giancarlo)
  [SMALL]       Giancarlo · Entrepreneur · 6 months in the system
  [SMALL]       Kevin · Civil engineer · Trains at home (video-only, no quote)
  [SMALL]       Elizabeth · Digital marketer · Trained in person
  [SMALL]       Richards · Startup founder · 3 months in the system
[SECTION 5 · DARK — Scripture]
  [BODY]        "I do not run aimlessly. I do not box as one beating the air. I discipline my body and keep it under control."
  [SMALL]       1 Corinthians 9:26-27
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (JS-active on this route)

## /foundation
file: src/pages/foundation.astro
surface: DARK
meta title: variant free: "The Footwork Blueprint · Free Download | Thee Rainers" · variant paid: "The Footwork Blueprint · $9 | Thee Rainers"
meta description: variant free: "The Footwork Blueprint. 56 rounds of drills, full video breakdown, 30-Day base training structure. Orthodox and Southpaw. Free download." · variant paid: "...Orthodox and Southpaw. $9."
primary action: variant free → Get the Blueprint · Free (email capture form) | variant paid → Get the Blueprint · $9 → checkout:footwork
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
State note: `FOOTWORK_FREE_UNTIL = 2026-08-01T23:00:00Z`. Today is 2026-08-07 → **free window has already closed**; the "free" variant below is DEAD copy (unreachable in current state) but still fully present in source and must be captured per the "extract every conditional variant" rule.
---
[SHARED · Nav]
[SECTION 1 · DARK — Countdown banner, variant: free-only, currently unreachable]
  [BANNER · variant: free]  Free until August 2. Goes to $9. {countdown}
[SECTION 2 · DARK — Hero]
  [EYEBROW · variant: free]   Free · The Footwork Blueprint
  [EYEBROW · variant: paid]   $9 · The Footwork Blueprint
  [H1]          The Footwork Blueprint.
  [BODY · variant: free]      Win fights with footwork, and take fewer hits doing it. A practical playbook to move with balance, control, and intent. Every step has a job. Free.
  [BODY · variant: paid]      Win fights with footwork, and take fewer hits doing it. A practical playbook to move with balance, control, and intent. Every step has a job. $9.
  [SMALL]       For fighters who train seriously and want to move with purpose.
  [SMALL]       Rainers
  [FORM-LABEL · variant: free]  (none — placeholder-only inputs)
  [PLACEHOLDER · variant: free] Your name
  [PLACEHOLDER · variant: free] your@email.com
  [BUTTON · variant: free]      Get the Blueprint · Free (form submit)
  [SMALL · variant: free]       You get the Blueprint plus training emails from Rainers. Unsubscribe any time.
  [LINK · variant: free]        Privacy Policy → /legal/privacy-policy
  [BUTTON · variant: paid]      Get the Blueprint · $9 → checkout:footwork
  [SMALL · variant: paid]       One-time purchase. Instant PDF download.
  [LINK · variant: paid]        Refund Policy → /legal/refund-policy
  [LIST-ITEM]   Drills — 56 rounds · Orthodox and Southpaw
  [LIST-ITEM]   Video Breakdown — 11 min
  [LIST-ITEM]   Format — 21-page playbook, zero filler
  [LIST-ITEM]   Delivery — Instant digital download
  [ALT]         The Footwork Blueprint, 3D book cover
[SECTION 3 · DARK — Why the base]
  [EYEBROW]     Why The Base
  [H2]          The base carries everything.
  [EYEBROW]     Power From The Floor
  [BODY]        Most of your punch power comes from the ground up. A broken base costs you before you throw a single punch.
  [EYEBROW]     Holds Under Pressure
  [BODY]        Drill the right movements now and they become automatic when it gets hard. That is what this builds.
  [EYEBROW]     No Gym Required
  [BODY]        21 pages. 56 rounds. Just you and the work. Your body is enough.
[SECTION 4 · DARK — 30-day outcome]
  [SMALL]       With consistent work, this is what changes.
  [BODY]        You stop bouncing randomly.
  [BODY]        Every step has a purpose. Your stance connects to the ground and the ground connects to your punch.
  [BODY]        Your base holds under pressure.
  [BODY]        The drills build it in repetition. When you step, punch, and recover, the base stays intact instead of collapsing.
  [BODY]        You know exactly where you are.
  [BODY]        Balance, weight transfer, and foot position become readable. You stop guessing and start seeing what needs fixing next.
[SECTION 5 · LIGHT/DARK — Testimonials, [SHARED · Testimonials heading="What fighters say." kicker="Field Report" filter=all background=white(default)]]
  (same resolved content as / — see above)
[SECTION 6 · DARK — Upsell]
  [SMALL]       When the base holds · Next step
  [H2]          The Defense Workshop.
  [BODY]        Live Aug 29. Real-time correction on your movement. Replay included. The mechanical structure to hit, exit, and reset.
  [BUTTON]      Reserve Seat · $39 → /defense-workshop
[SECTION 7 · DARK — Scripture]
  [BODY]        "I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive — not `/`)

## /shop
file: src/pages/shop.astro
surface: MIXED (warm/light body, dark scripture footer)
meta title: Shop · Thee Rainers
meta description: Step-by-step systems built for boxing. One-time purchase. Download and own it.
primary action: 4 product cards, each with its own CTA — see co-primary
action position: UNVERIFIED
co-primary actions: 4 — Get the Blueprint (footwork) → checkout:footwork ($9, free variant → /foundation), Get the Blueprint (shadowboxing) → checkout:shadowboxing ($19), Reserve Seat → checkout:defense_workshop_early|standard ($39/$49), Get the Bundle → checkout:bundle ($24)
voice markers: 0
State notes: `isFootworkFree` (deadline 2026-08-01, already past) → FALSE today, footwork shows $9 not FREE. `isEarlyBird` (deadline 2026-08-08T22:59 UTC, one day from snapshot date) → TRUE today, workshop shows $39/early-bird copy.
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Header]
  [EYEBROW]     Training
  [H1]          Everything in order.
  [SMALL]       No gym required.
[SECTION 2 · LIGHT — Product cards]
  Card 1 — Footwork Blueprint (featured)
  [BADGE · variant: free]   Free · Start Here
  [BADGE · variant: paid]   Blueprint
  [ALT]         Footwork Blueprint
  [H2]          Footwork Blueprint → /foundation
  [SMALL]       56 Rounds · Orthodox + Southpaw
  [BODY]        Move with intention from round one.
  [PRICE · variant: free]   FREE
  [PRICE · variant: paid]   $9
  [BUTTON · variant: free]  Get the Blueprint → /foundation
  [BUTTON · variant: paid]  Get the Blueprint → checkout:footwork
  [LINK]        Learn more → /foundation
  [SMALL]       Secure checkout via Stripe · Refund Policy → /legal/refund-policy (paid variant only)

  Card 2 — Shadowboxing Blueprint
  [BADGE]       Blueprint
  [ALT]         Shadowboxing Blueprint
  [H2]          Shadowboxing Blueprint → /shadowboxing-blueprint
  [SMALL]       50+ Rounds · Orthodox + Southpaw
  [BODY]        The next layer. 50+ rounds of structured solo output.
  [PRICE]       $19
  [BUTTON]      Get the Blueprint → checkout:shadowboxing
  [LINK]        Learn more → /shadowboxing-blueprint
  [SMALL]       Secure checkout via Stripe · Refund Policy → /legal/refund-policy

  Card 3 — Defense Workshop
  [BADGE · variant: early-bird]  Live · Aug 29 · Early Bird
  [BADGE · variant: standard]    Live · Aug 29
  [ALT]         Defense Workshop
  [H2]          Defense Workshop → /defense-workshop
  [SMALL]       90 Min · Live · Replay Included
  [BODY]        Camera on. Real-time correction on your movement.
  [PRICE · variant: early-bird]  $39
  [PRICE · variant: standard]    $49
  [SMALL · variant: early-bird]  Early bird until Aug 8. Goes to $49.
  [BUTTON]      Reserve Seat → checkout:defense_workshop_early|standard
  [LINK]        Learn more → /defense-workshop
  [SMALL]       Secure checkout via Stripe · Refund Policy → /legal/refund-policy

  Card 4 — Complete Bundle
  [BADGE]       Bundle · Best Value
  [ALT]         Complete Bundle
  [H2]          Complete Bundle (no link — page: null)
  [SMALL]       Footwork + Shadowboxing · 100+ Rounds
  [BODY]        Both blueprints. The base and what builds on it.
  [PRICE]       $24
  [BUTTON]      Get the Bundle → checkout:bundle
  [SMALL]       Secure checkout via Stripe · Refund Policy → /legal/refund-policy
[SECTION 3 · LIGHT — Testimonials, [SHARED · Testimonials filter="remote" heading="Trained from the blueprint" kicker="Results · On Their Own"]]
  [EYEBROW]     Results · On Their Own
  [H2]          Trained from the blueprint
  [BODY]        "My footwork makes sense. I can see openings instead of just swinging." (Giancarlo, featured)
  [SMALL]       Kevin · Civil engineer · Trains at home
  [SMALL]       Richards · Startup founder · 3 months in the system
[SECTION 4 · LIGHT — FAQ]
  [H2]          Common Questions
  [BODY]        How do I get access after purchase?
  [BODY]        A download link is sent to the email you use at checkout. It arrives within a few minutes and is valid for 7 days. Save the PDF once downloaded.
  [BODY]        Is this a subscription?
  [BODY]        No. Both Blueprints are one-time purchases. Pay once, own it.
  [BODY]        Can I use this without a gym?
  [BODY]        Yes. The Footwork Blueprint requires no equipment. The Shadowboxing Blueprint works anywhere you have space to move.
  [BODY]        What if I want live coaching alongside it?
  [BODY]        The Weekly Session is live every Tuesday with Rainers.
  [LINK]        Learn more. → /community
[SECTION 5 · LIGHT — Community teaser]
  [EYEBROW]     The Weekly Session
  [H2]          Live Reps With Rainers.
  [BODY]        The Weekly Session with Rainers every Tuesday. Live correction on your movement. Private community. Drill library. $39/mo.
  [BUTTON]      See the Community → /community
[SECTION 6 · LIGHT — Start nudge]
  [BODY · variant: free]    Start free with the Footwork Blueprint. Build the base first.
  [LINK · variant: free]    Get the Free Blueprint → /foundation
  [BODY · variant: paid]    Start with the Footwork Blueprint. The base carries everything.
  [BUTTON · variant: paid]  Get the Blueprint · $9 → checkout:footwork
[SECTION 7 · DARK — Scripture]
  [BODY]        "I do not run aimlessly. I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26-27
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

---

## /shadowboxing-blueprint
file: src/pages/shadowboxing-blueprint.astro
surface: LIGHT (warm bg throughout hero/body), DARK mid-page CTA + scripture
meta title: The Shadowboxing Blueprint: Common Mistakes + Done-With-Me Session + Skill Test
meta description: Build boxing skill with or without a partner. The 6 punches, the 3 mistakes that kill skill, structured sessions, a 3-minute skill test, printable round PDF. $19.
primary action: Get the Blueprint · $19 → → checkout:shadowboxing
action position: UNVERIFIED
co-primary actions: same CTA repeated 4x on page (hero, mid-page, final, sticky mobile bar) — one product, not competing actions
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Hero, id="buy-bar-sentinel"]
  [EYEBROW]     Blueprint
  [H1]          The Shadowboxing Blueprint.
  [BODY]        A practical playbook to build boxing skill. With or without a partner. Every round has a focus, a constraint, and an intention.
  [PRICE]       $19
  [SMALL]       One time
  [BUTTON]      Get the Blueprint · $19 → → checkout:shadowboxing
  [SMALL]       Secure checkout via Stripe · Instant delivery · Refund Policy → /legal/refund-policy
  [LIST-ITEM]   Delivery — Instant digital download
  [LIST-ITEM]   Language — English
  [LIST-ITEM]   Foundations video — Included
  [LIST-ITEM]   Round structure PDF — Printable
  [ALT]         The Shadowboxing Blueprint
[SECTION 2 · LIGHT — What's inside]
  [H2]          What's inside.
  [LIST-ITEM]   Foundations: The 6 Punches [tag: Video]
  [BODY]        You'll understand the 6 punches, how they should feel in both attacks and defense, plus the rules that make them work in shadowboxing.
  [LIST-ITEM]   3 Shadowboxing Mistakes That Kill Skill
  [BODY]        Learn how to:
  [LIST-ITEM]   Set up attacks
  [LIST-ITEM]   Exit (instead of freezing/getting hit)
  [LIST-ITEM]   Move with purpose instead of bouncing or cool combinations
  [LIST-ITEM]   Full Structured Shadowboxing Sessions [tag: New]
  [BODY]        These are full, structured sessions. You train alongside me. Every round has a focus, a constraint, and an intention.
  [BODY]        Learn to:
  [LIST-ITEM]   Build rhythm
  [LIST-ITEM]   Control range
  [LIST-ITEM]   Reset & exit
  [LIST-ITEM]   Defend & counter
  [LIST-ITEM]   Stay fresh under fatigue
  [SMALL]       Both mental and physical training. A repeatable training system.
  [LIST-ITEM]   The Shadowboxing Test (3-Minute)
  [BODY]        At the end, you test yourself.
  [LIST-ITEM]   30-Day Training Structure
  [EYEBROW]     Bonus
  [BODY]        Round Structure PDF (Printable)
  [BODY]        All rounds laid out in a PDF. Run it without replaying the video. Take it to the gym. Revisit it years from now.
[SECTION 3 · LIGHT — Who this is for]
  [EYEBROW]     Who this is for
  [H2]          Four kinds of athletes.
  [BODY]        01 — Fighters whose shadowboxing feels random.
  [BODY]        02 — Beginners who want structure.
  [BODY]        03 — Athletes who want skill. Not just feeling exhausted.
  [BODY]        04 — Coaches who want a reusable system.
[SECTION 4 · LIGHT — How it changes you]
  [EYEBROW]     How it changes you
  [H2]          Five gains that compound.
  [LIST-ITEM]   01 — You start throwing combinations with purpose.
  [LIST-ITEM]   02 — You start thinking in setups and exits.
  [LIST-ITEM]   03 — You understand range.
  [LIST-ITEM]   04 — You build control. Then you add speed.
  [LIST-ITEM]   05 — You train decision-making without absorbing damage.
[SECTION 5 · LIGHT — Value]
  [EYEBROW]     How can I make sure it has value?
  [H2]          Buy once. Train forever.
  [LIST-ITEM]   You can open the blueprint even 5 years later, pick drills and train.
  [LIST-ITEM]   You save time by learning the way top fighters train.
[SECTION 6 · LIGHT — Authority]
  [ALT]         Rainers coaching
  [EYEBROW]     The system behind this
  [BODY]        Rainers.
  [BODY]        Boxer and coach. 1,000+ consecutive days of published training breakdowns. Clients run this system from Panama to Germany.
  [BODY]        I collected what the best fighters and coaches do, stripped the noise, and turned it into drills you can run tomorrow.
[SECTION 7 · LIGHT — Who gets the most out of it]
  [EYEBROW]     Who gets the most out of it
  [BODY]        People who have wasted so much time watching YouTube instructions and want effective training that lasts.
[SECTION 8 · LIGHT — Testimonials, [SHARED · Testimonials filter="remote" heading="Trained from the blueprint" kicker="Results · On Their Own"]]
  (same resolved content as /shop)
[SECTION 9 · DARK — Mid-page CTA]
  [SMALL]       The Shadowboxing Blueprint · $19
  [H2]          Shadowbox with intent. Start today.
  [BUTTON]      Get the Blueprint → → checkout:shadowboxing
[SECTION 10 · LIGHT — Hesitation]
  [EYEBROW]     If you are hesitating
  [H2]          "I do not have space for shadowboxing drills in my plan."
  [BODY]        Reduce other workouts by 20%. Do shadowboxing in that 20%.
  [BODY]        Inside a week, you feel the difference in your movement, your attacks, and your defense.
[SECTION 11 · LIGHT — Bonuses]
  [EYEBROW]     Bonuses
  [H2]          What ships with it.
  [BODY]        Printable Round Structure PDF.
  [BODY]        Training-ready structure.
  [BODY]        Orthodox and southpaw application.
  [BODY]        Reusable for years.
  [BODY]        Lifetime access plus future minor updates.
[SECTION 12 · LIGHT — Final CTA, id="final-cta-section"]
  [EYEBROW]     Access the Blueprint
  [H2]          Shadowbox with intent.
  [PRICE]       $19
  [SMALL]       One time
  [BUTTON]      Get the Blueprint · $19 → → checkout:shadowboxing
  [SMALL]       Instant digital download.
  [SMALL]       Secure checkout via Stripe · Instant delivery · Refund Policy → /legal/refund-policy
  [SMALL]       Build the base first.
  [LINK]        Get the Footwork Blueprint · Free → → /foundation
[SECTION 13 · DARK — Scripture]
  [BODY]        "I do not run aimlessly. I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26-27
[STICKY BAR · mobile only]
  [PRICE]       $19
  [SMALL]       One time
  [BUTTON]      Get the Blueprint → → checkout:shadowboxing
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /defense-workshop
file: src/pages/defense-workshop.astro
surface: MIXED (dark hero + pricing, light body sections)
meta title: Defense Workshop · Live Aug 29 | Thee Rainers
meta description: Live 90-minute defense workshop. Camera on. Real-time correction on your movement. Replay included. {price} {early-bird suffix if applicable}.
primary action: Reserve Seat · {price} → checkout:defense_workshop_early|standard
action position: UNVERIFIED
co-primary actions: NONE (same CTA repeated hero + pricing section)
voice markers: 0
State note: `EARLY_BIRD_UNTIL = 2026-08-08T22:59:00Z` — one day after snapshot date, so early-bird variant is currently live ($39, checkoutKey defense_workshop_early).
---
[SHARED · Nav]
[BANNER · variant: early-bird, currently showing]  Early bird $39 until August 8. Goes to $49.
[SECTION 1 · DARK — Hero]
  [ALT]         "" (decorative background image, aria-hidden)
  [SMALL]       anyone can throw a punch. only the best boxers learn defense.
  [EYEBROW]     Live · Aug 29 · 90 Min · Replay Included
  [H1]          Defense Workshop.
  [BODY]        Camera on. Real-time correction on your movement. The mechanical structure to hit, exit, and reset. Replay included with every seat.
  [BUTTON]      Reserve Seat · {price} → checkout:defense_workshop_early|standard
  [SMALL · variant: early-bird]  Early bird until Aug 8 · One-time payment
  [SMALL · variant: standard]    Standard rate · One-time payment
  [SMALL]       Aug 29, 2026 · Live Online · 90 Minutes · Replay Included
[SECTION 2 · LIGHT — What you get]
  [EYEBROW]     What's Inside
  [H2]          What this session gives you.
  [BODY]        Live correction. — Camera on. Rainers corrects your movement in real time. Not a lecture. Not slides. Your actual mechanics, fixed.
  [BODY]        The defense structure. — The mechanical system to hit, exit, and reset without leaving yourself open. Built from the base up.
  [BODY]        Replay included. — The full session is yours after the live date. 7-day access window. Watch the corrections again. Own it.
[SECTION 3 · LIGHT — Who this is for]
  [EYEBROW]     Who This Is For
  [H2]          Fighters who want to stop getting hit.
  [BODY]        You are training consistently. You know the mechanics exist. But under pressure the chain breaks and you cannot see why. This session fixes the break.
[SECTION 4 · DARK — Pricing + CTA]
  [EYEBROW · variant: early-bird]  Early Bird · Until Aug 8
  [EYEBROW · variant: standard]    Defense Workshop
  [PRICE]       {price}
  [SMALL · variant: early-bird]  $49 (struck through)
  [LIST-ITEM]   Live session · August 29, 2026
  [LIST-ITEM]   90 minutes with Rainers
  [LIST-ITEM]   Camera on · real-time correction
  [LIST-ITEM]   Replay included · 7-day access after the live date
  [LIST-ITEM]   One-time payment
  [BUTTON]      Reserve Seat · {price} → checkout:defense_workshop_early|standard
  [SMALL]       Secure checkout via Stripe · Refund Policy → /legal/refund-policy · Terms → /legal/terms
[SECTION 5 · LIGHT — FAQ]
  [EYEBROW]     Questions
  [H2]          Common Questions
  [BODY]        What if I can't make the live date?
  [BODY]        The replay is included with every seat. You will have 7 days of access after the live session.
  [BODY]        Do I need a camera?
  [BODY]        Camera on is required for correction. If you cannot be on camera, the replay is still available to you after the live date.
  [BODY]        Is there a refund policy?
  [BODY]        Yes. Email rainers@theerainers.com before the live session date for a full refund. See the Refund Policy → /legal/refund-policy.
  [BODY]        What platform is this on?
  [BODY]        Details sent by email after purchase.
[SECTION 6 · DARK — Scripture]
  [BODY]        "I do not run aimlessly. I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26-27
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /workshop-replay
file: src/pages/workshop-replay.astro
surface: MIXED (dark hero, warm/light body, dark scripture)
meta title: Defense Workshop Replay · Thee Rainers
meta description: The Defense Workshop replay is now included with every Defense Workshop seat. Live Aug 29. $39 early bird until Aug 8.
primary action: Reserve Seat · $39 Early Bird → /defense-workshop
action position: UNVERIFIED
co-primary actions: NONE — every CTA on this page points to /defense-workshop (this page sells nothing itself; see Appendix C3)
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · DARK — Hero]
  [ALT]         "" (decorative background, aria-hidden)
  [EYEBROW]     Replay Included · Defense Workshop
  [H1]          The Defense Workshop. Recorded.
  [BODY]        The framework for not getting hit. Footwork, stance, defensive structure, live Q&A. 90 minutes. The replay is now included with every Defense Workshop seat.
  [BUTTON]      Reserve Seat · $39 Early Bird → /defense-workshop
  [SMALL]       90 Min · Live Aug 29 · Replay Included
[SECTION 2 · LIGHT — Proof]
  [ALT]         (embedded YouTube iframe title: "Giancarlo, 5 months")
  [SMALL]       Giancarlo · 5 Months
  [EYEBROW]     Field Report
  [H2]          "My footwork makes sense. I can see openings instead of just swinging."
  [BODY]        Giancarlo started sparring. Five months. What you see in this clip is built on the same mechanics this workshop teaches.
  [BUTTON]      Reserve Seat · $39 Early Bird → /defense-workshop
  [LINK]        Refund Policy → /legal/refund-policy
[SECTION 3 · LIGHT — What's inside]
  [EYEBROW]     What's inside.
  [H2]          Three things this session fixes.
  [BODY]        Why you keep getting hit. — The break is almost always in your stance or positioning. The session maps where your defense fails before pressure even comes.
  [BODY]        Why your movement fails under pressure. — Footwork that works in drills breaks in sparring. The workshop finds where the chain disconnects and builds the fix from the base up.
  [BODY]        Live Q&A. Real problems. Real answers. — Fighters in the live session asked the questions you probably have. Every answer is in the recording.
[SECTION 4 · LIGHT — FAQ]
  [EYEBROW]     Questions
  [H2]          Common Questions
  [BODY]        How long is the access window?
  [BODY]        7 days from the moment you purchase. Your link arrives by email. Watch at your own pace within that window. If you need a specific clip again after the window, email rainers@theerainers.com.
  [BODY]        Is this too basic if I have been training for years?
  [BODY]        If you can explain exactly where your weight shifts on a jab and why your chain disconnects at round three, this might be too basic. Most fighters with years of training cannot. The workshop finds the break in the chain.
  [BODY]        I have shadowboxing skills but they don't transfer in sparring. Will this help?
  [BODY]        That gap is almost always a stance problem. When pressure comes, the base breaks and everything built on top of it collapses. The workshop addresses that exact failure point.
  [BODY]        Is there a refund if it doesn't help?
  [BODY]        Yes. Email rainers@theerainers.com within 24 hours of accessing the replay and the refund is processed. See the full Refund Policy → /legal/refund-policy.
[SECTION 5 · LIGHT — Ladder link]
  [BODY]        If this replay gives you the clarity you have been missing, the live workshop is where you get corrected in real time. This is the structural base. The workshop applies it to your movement directly.
  [LINK]        See the Defense Workshop → → /defense-workshop
[SECTION 6 · DARK — Scripture + final CTA]
  [BODY]        "I do not run aimlessly. I do not fight like a boxer beating the air."
  [SMALL]       1 Corinthians 9:26
  [BUTTON]      Reserve Seat · $39 Early Bird → /defense-workshop
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /watch/workshop-replay
file: src/pages/watch/workshop-replay.astro
surface: LIGHT (body), DARK (scripture footer)
meta title: Workshop Replay · Thee Rainers
meta description: NONE set (no Fragment meta description, robots noindex,nofollow) → falls back to Base default: "Boxing built on purpose. Free footwork blueprint, live defense workshops, and 1-on-1 coaching from Rainers."
primary action: variant expired → Defense Workshop · $39 → → /defense-workshop | variant valid → NONE (video + timestamps only)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
Access-control note: server-side HMAC token check on `sig`/`exp` params. Invalid token (not expired) → 301 redirect to /workshop-replay before render, so "invalid" is never a visible on-page state — only "expired" and "valid" render.
---
[SHARED · Nav]
[SECTION 1 · LIGHT — variant: expired]
  [SMALL]       Link expired
  [H1]          Your access has expired.
  [BODY]        This link was valid for 7 days from purchase. To watch the replay, get a fresh copy below.
  [BUTTON]      Defense Workshop · $39 → → /defense-workshop
[SECTION 1 · LIGHT — variant: valid]
  [SMALL]       Access confirmed
  [H1]          Your replay is live.
  [BODY]        90 minutes. Watch it through once, then use the timestamps to drill the specific section that matches your primary constraint.
  [ALT]         (iframe title: "Workshop Replay · Defense Workshop")
  [SMALL]       Jump to your section
  [LIST-ITEM]   0:00 — Footwork & Balance · the base layer
  [LIST-ITEM]   ~20m — Athletic Stance · your custom platform
  [LIST-ITEM]   ~40m — Punch Mechanics · kinetic chain from floor to fist
  [LIST-ITEM]   ~60m — Defensive Structure · offence and defence as one movement
  [LIST-ITEM]   ~75m — Live Q&A · specific mechanical problems diagnosed
[SECTION 2 · DARK — Scripture]
  [BODY]        "I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

---

## /command
file: src/pages/command.astro
surface: MIXED (dark hero/how-it-works/evidence, warm/light who-this-is-for/what-you-get/application)
meta title: Apply for 1-on-1 Coaching | Thee Rainers
meta description: Private Architecture. A coaching framework built around your structure, your schedule, and your goal. Application only.
primary action: Submit Application (form submit, POST /api/coaching-capture)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 10 in this file (lines 22, 27, 33, 71, 94, 140, 144, 168, 194, 198). Lines 140 and 144 sit inside a 3-item `.map()` (How This Works cards) so structurally cover all 3 headings/bodies.
---
[SHARED · Nav]
[SECTION 1 · DARK — Hero]
  [EYEBROW]     Private Architecture · Application Only
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H1]          The whole framework is yours.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [BODY]        Not a program. A structure built around how you move, when you train, and where the breakdown actually happens.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [LINK]        See the work, then apply → #apply
[SECTION 2 · DARK — Coaching photo gallery]
  [ALT]         (per-photo alt text from src/data/coaching-photos.ts — not independently read; gallery renders conditionally only if array non-empty)
[SECTION 3 · LIGHT — Who this is for / Pass on this if]
  [EYEBROW]     Who this is for
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H2]          Right for you if.
  [LIST-ITEM]   You train boxing seriously and compete or plan to compete.
  [LIST-ITEM]   You have access to a gym and regular sparring.
  [LIST-ITEM]   You have at least six months of consistent training behind you.
  [LIST-ITEM]   You want written structure, not general encouragement.
  [LIST-ITEM]   You will film your training and submit clips for review.
  [EYEBROW]     Not the right fit
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H2]          Pass on this if.
  [LIST-ITEM]   You are looking for motivation, not mechanics.
  [LIST-ITEM]   You are a complete beginner with no training base yet.
  [LIST-ITEM]   You cannot commit to weekly video submission.
  [LIST-ITEM]   You want a fixed program with no adjustments.
[SECTION 4 · DARK — How this works]
  [EYEBROW]     How it works
  [LIST-ITEM]   01 — Movement assessment first.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on (×3, one per map item)
  [BODY]        The first two weeks are diagnostic. I watch how you move before I write anything.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on (×3, one per map item)
  [LIST-ITEM]   02 — Written plan for your body.
  [BODY]        Everything is built around your structure, your schedule, and the flaws I actually see.
  [LIST-ITEM]   03 — The playbook stays with you.
  [BODY]        You leave with something written. The work has to compound after the coaching ends.
[SECTION 5 · DARK — Evidence, [SHARED · Testimonials ids=["giancarlo-remote"] filter="all" background="void" heading="21 weeks." kicker="Evidence"]]
  [EYEBROW]     Evidence
  [H2]          21 weeks.
  [BODY]        "My footwork makes sense. I can see openings instead of just swinging." (Giancarlo)
[SECTION 6 · LIGHT — What you get]
  [EYEBROW]     What is included
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H2]          What you walk away with.
  [LIST-ITEM]   Movement review — Diagnostic of how you currently move, what is working, and where force leaks.
  [LIST-ITEM]   Written training plan — Built specifically for your body structure, your schedule, and your stated goal.
  [LIST-ITEM]   Async video feedback — Submit clips. Receive written and recorded notes on what I see.
  [LIST-ITEM]   Weekly check-in — One structured session per week to review progress and adjust the plan.
  [LIST-ITEM]   Playbook document — A written record of everything we built together. Yours to train from after we finish.
[SECTION 7 · LIGHT — Application form, id="apply"]
  [EYEBROW]     Application
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [H2]          Apply.
  [MARKER]      DRAFT: voice pass Rainers — the string it sits on
  [BODY]        I read every application myself. If your situation is right for this, we start.
  [FORM-LABEL]  Full Name
  [FORM-LABEL]  Email
  [PLACEHOLDER] — (em-dash placeholder on email field)
  [FORM-LABEL]  Current fight record and training structure
  [PLACEHOLDER] —
  [FORM-LABEL]  Where do your mechanics break down under pressure?
  [PLACEHOLDER] —
  [FORM-LABEL]  What do you want to change?
  [PLACEHOLDER] —
  [BUTTON]      Submit Application (form submit)
  [SUCCESS]     Application received. I will be in touch.
  [ERROR]       Something went wrong. Find me on Instagram.
  [SMALL]       Before you apply
  [BODY]        If you are not sure whether this is the right step, start with the free Footwork Blueprint. It shows how this system is built.
  [LINK]        Get the Free Blueprint → /foundation
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /community
file: src/pages/community/index.astro
surface: MIXED (dark hero/pain/objection/CTA/scripture, warm/light what-you-get/fit-list/pricing)
meta title: The Weekly Session · Thee Rainers
meta description: Weekly movement correction, a training drill on day one, a private group, and a path built layer by layer. $39/month.
primary action: Claim your spot → checkout:greatness_monthly
action position: UNVERIFIED
co-primary actions: pricing section has 2 co-equal plan CTAs — Join Annual → checkout:greatness_annual ($390/yr) and Join Monthly → checkout:greatness_monthly ($39/mo); repeated again in the closing CTA block
voice markers: 0
Access-control note: member-only Session Recordings section renders only with a valid HMAC `sig`/`exp` query-param pair; RECORDINGS array is currently empty in source, so even verified members see the empty-state copy.
---
[SHARED · Nav]
[SECTION 1 · DARK — Hero]
  [EYEBROW]     The Weekly Session
  [H2]          "I feel comfortable training on my own."
  [ALT]         Giancarlo
  [SMALL]       Giancarlo · Entrepreneur
  [BODY]        Weekly correction, live. A path built in layers. The direction most training skips.
  [BUTTON]      Claim your spot → checkout:greatness_monthly
  [ERROR]       Checkout unavailable. Email rainers@theerainers.com  ([SHARED · Base checkout error variant])
  [SMALL]       $39/month · $390/year · cancel anytime
[SECTION 2 · LIGHT — What you get]
  [EYEBROW]     The Work
  [H2]          What you get.
  [EYEBROW]     Day One
  [H3]          A Training Drill
  [BODY]        Sent the moment you join. Day one is real work, not a welcome video.
  [EYEBROW]     Every Tuesday · 3pm ET
  [H3]          The Weekly Session
  [BODY]        45 minutes. Movement corrected. Questions answered with breakdowns from actual fights.
  [EYEBROW]     Private
  [H3]          The Group
  [BODY]        Post clips, get feedback, work through what breaks down between sessions.
  [EYEBROW]     Built in Order
  [H3]          The Path
  [BODY]        Footwork, movement, ring craft, defense, power. Nothing skipped. Nothing rushed.
[SECTION 3 · DARK — Pain block]
  [EYEBROW]     The Problem
  [BODY]        Training with correction builds the right habits faster.
  [BODY]        You can train for months and still stay stuck if there is a gap. The Weekly Session exists to close that gap.
[SECTION 4 · DARK — Video slot]
  [SMALL]       See the method
  [ALT]         (facade button aria-label: "Play video: Why You Can't Defend Yourself")
[SECTION 5 · LIGHT — Fit list]
  [EYEBROW]     Honest Fit
  [H2]          Right for you.
  [EYEBROW]     A good fit
  [LIST-ITEM]   You want to start right and stay right as you go.
  [LIST-ITEM]   You train alone and need someone to tell you what is actually breaking down.
  [LIST-ITEM]   You are serious about the work and want answers grounded in real fights, not theory.
  [EYEBROW]     Not the right fit
  [LIST-ITEM]   You are looking for hype or encouragement rather than correction.
  [LIST-ITEM]   You want someone to tell you what you want to hear instead of what you need to fix.
  [LIST-ITEM]   You are not willing to do the drill between sessions.
[SECTION 6 · DARK — Objection pair]
  [SMALL]       "I don't train at a gym."
  [BODY]        Most members do not. The system is built around what works at home, in a garage, or wherever you have space. The method does not require a full gym.
  [SMALL]       "I'm not far enough along."
  [BODY]        The path is built from the ground up. Starting early means you build the right habits instead of spending years correcting the wrong ones.
[SECTION 7 · LIGHT — Pricing, id="pricing"]
  [EYEBROW]     Membership
  [H2]          Claim your spot.
  [BADGE]       Save $78
  [EYEBROW]     Annual · Best Value
  [PRICE]       $390 /year
  [SMALL]       $32.50/month · billed once
  [LIST-ITEM]   Everything in monthly
  [LIST-ITEM]   Two months free
  [LIST-ITEM]   Full year of checkpoints
  [LIST-ITEM]   Full year of path progression
  [BUTTON]      Join Annual → checkout:greatness_annual
  [ERROR]       Checkout unavailable. Email rainers@theerainers.com
  [EYEBROW]     Monthly
  [PRICE]       $39 /month
  [SMALL]       Cancel anytime
  [LIST-ITEM]   The Weekly Session every Tuesday
  [LIST-ITEM]   Training drill on day one
  [LIST-ITEM]   Private group access
  [LIST-ITEM]   Session recordings
  [BUTTON]      Join Monthly → checkout:greatness_monthly
  [ERROR]       Checkout unavailable. Email rainers@theerainers.com
  [SMALL]       Membership renews automatically. Cancel anytime, no lock-in. Cancel before your next billing date and you will not be charged again.
  [LINK]        Refund Policy → /legal/refund-policy
[SECTION 8 · LIGHT/DARK — Testimonials, [SHARED · Testimonials heading="What fighters say." kicker="Field Report" background="white"]]
  (same resolved content as /)
[SECTION 9 · DARK — Repeated CTA]
  [EYEBROW]     Join the work
  [H2]          Weekly correction with training drills.
  [BUTTON]      Join Annual · $390/yr → checkout:greatness_annual
  [BUTTON]      Join Monthly · $39/mo → checkout:greatness_monthly
  [ERROR]       Checkout unavailable. Email rainers@theerainers.com
  [SMALL]       Cancel anytime · Secure checkout via Stripe
  [LINK]        Not ready yet · Start with the free Foundation → /foundation
[SECTION 10 · LIGHT — Session recordings, member-only, currently empty-state]
  [BADGE]       Member Area
  [H2]          Session Recordings
  [BODY]        Recordings from past Weekly Sessions are available here.
  [BODY]        No recordings yet. The first one appears after Tuesday's Weekly Session.
  [SMALL]       New recordings are added after each Tuesday session.
[SECTION 11 · LIGHT — 1-on-1 footnote]
  [BODY]        Need the full framework built around your specific structure?
  [LINK]        1-ON-1 Coaching · Application Only → /command
[SECTION 12 · DARK — Scripture]
  [BODY]        "As iron sharpens iron, so one person sharpens another."
  [SMALL]       Proverbs 27:17
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /community/inside
file: src/pages/community/inside.astro
surface: LIGHT
meta title: Member Area · The Weekly Session
meta description: "" (explicitly set to empty string — overrides Base default, renders `<meta name="description" content="">`)
primary action: Send Access Link → (form submit, POST /api/community-magic-link)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Request state]
  [EYEBROW]     Member Area
  [H1]          Access your recordings.
  [BODY]        Enter the email address you joined with. We'll send you a link to the session recordings.
  [PLACEHOLDER] your@email.com
  [BUTTON]      Send Access Link → (form submit)
  [ERROR]       No active membership found for that email.
  [LINK]        Join the Community → → /community
[SECTION 1 · LIGHT — Success state]
  [BADGE]       Link sent
  [H1]          Check your inbox.
  [BODY]        A link to the session recordings is on the way. Check spam if you don't see it in a few minutes.
[SECTION 2 · LIGHT — Support]
  [BODY]        Questions?
  [LINK]        rainers@stepintoring.com → mailto:rainers@stepintoring.com  ⚠ different domain than the rest of the site — see Appendix C3
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

---

## /welcome
file: src/pages/welcome.astro
surface: LIGHT
meta title: Welcome · The Weekly Session · Thee Rainers
meta description: NONE set (robots noindex, no Fragment description) → falls back to Base default
primary action: variant meetLink-set → Join The Weekly Session → → {meetLink env var} | variant unset → NONE (static "next session" card)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 1 (line 92, inline after body text, not a separate comment line)
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Welcome]
  [BADGE]       Membership confirmed
  [H1]          You're in. Welcome to The Weekly Session.
[SECTION 2 · LIGHT — First drill]
  [EYEBROW]     Your First Drill
  [BODY]        Week 1. Fundamentals
  [SMALL]       Round 1 — Walking Left + Jab & Feints
  [SMALL]       Round 2 — Walking Right + Jab & Feints
  [SMALL]       Round 3 — Shadowboxing (Going Left & Right)
  [BODY]        Work this into your training during the week in 2 or 3-minute rounds. This is your foundation. The main training happens on Tuesday where we correct movement and work through Q&A.
[SECTION 3 · LIGHT — How this works]
  [EYEBROW]     How This Works
  [BODY]        The Weekly Session is every Tuesday at 3pm ET.
  [MARKER]      DRAFT: voice pass Rainers — "The Weekly Session is every Tuesday at 3pm ET." (inline, same line)
  [BODY]        This is where the work and feedback connect.
  [LIST-ITEM]   You'll receive the next drill every week by email.
  [LIST-ITEM]   All session recordings are available in the member area after each call.
  [BUTTON · variant: meetLink-set]  Join The Weekly Session → → {meetLink}
  [EYEBROW · variant: meetLink-unset]  Next Session
  [BODY · variant: meetLink-unset]     Tuesday · 3pm ET
  [SMALL · variant: meetLink-unset]    Google Meet link sent by email before each session.
[SECTION 4 · LIGHT — Customer portal, only if ?session_id present]
  [EYEBROW]     Manage Membership
  [BODY]        Update your card, switch plans, or cancel anytime. No forms. No questions.
  [BUTTON]      Open Customer Portal → (JS → POST /api/portal)
[SECTION 5 · LIGHT — Questions + member area]
  [BODY]        Questions? Reply to the email or reach out at
  [LINK]        rainers@stepintoring.com → mailto:rainers@stepintoring.com  ⚠ same off-domain address as /community/inside — see Appendix C3
  [LINK]        Member Area → → /community/inside
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /about
file: src/pages/about.astro
surface: LIGHT
meta title: About · Thee Rainers
meta description: Thee Rainers is the operating system built from the floor up. From film, data, and the body itself. For athletes whose ambition has outpaced their gym.
primary action: Get the Blueprints → → /shop
action position: UNVERIFIED
co-primary actions: 2 — Get the Blueprints → → /shop AND Start Free → → /foundation, presented side by side at equal visual weight in the closing CTA
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Identity]
  [SMALL]       Thee Rainers · @theerainers
  [H1]          Built from the floor up.
  [BODY]        My gym gave me fragments. I needed something that held together, so I built it. Film, training data, my own body, and what the fighters and coaches I respect were actually doing on the floor.
  [BODY]        The Blueprints came first. The Workshop came after. The way I coach is the same logic, applied 1-on-1.
  [ALT]         Coaching in Netherlands.
  [SMALL]       In the work.
[SECTION 2 · DARK — Photo strip]
  [ALT]         Rainers competing
[SECTION 3 · LIGHT — What I built]
  [SMALL]       What I built
  [SMALL]       Blueprints
  [SMALL]       /shop →
  [BODY]        Footwork first. Shadowboxing second.
  [BODY]        I kept watching people train hard and not get better. So I wrote the order. Stance, then footwork, then how to put it together when nobody is holding pads for you. The Blueprints are what I wish someone had handed me at the start.
  [SMALL]       The Weekly Session
  [SMALL]       Live · Weekly →
  [BODY]        Bring me what is not working.
  [BODY]        Every week. Camera on. You show me what is breaking down in training. I tell you which piece to pull. No theory. The people in that room are putting the work in. You feel that within five minutes.
  [SMALL]       How I coach
  [SMALL]       One thing per session
  [BODY]        One thing to fix. Not ten.
  [BODY]        I send people home with one thing to run in the next session. Ten things never get done. One thing changes the way you move. Do that for a year and you are not the same fighter.
  [SMALL]       1-on-1 Coaching
  [SMALL]       Application only →
  [BODY]        1-of-1.
  [BODY]        A small number of athletes at a time. The work is shaped around your fight, your body, your schedule. Application only because the work has to be a fit on both sides.
[SECTION 4 · LIGHT — Social follow bar]
  [SMALL]       Follow the work
  [LINK]        Instagram · {333}K → → https://www.instagram.com/theerainers
  [LINK]        TikTok · {100}K → → https://www.tiktok.com/@theerainers
  [LINK]        YouTube · {23}K → → https://www.youtube.com/@Rainers
  [LINK]        Facebook · {141}K → → https://www.facebook.com/theerainers
  [LINK]        Threads · {26}K → → https://www.threads.com/@theerainers
[SECTION 5 · LIGHT — Scripture]
  [BODY]        "Run in such a way as to get the prize. Every athlete exercises self-control in all things. So I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:24-26 · The Source Code
[SECTION 6 · LIGHT — CTA]
  [BODY]        The system is built. The next step is yours.
  [BUTTON]      Get the Blueprints → → /shop
  [BUTTON]      Start Free → → /foundation
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /library
file: src/pages/library.astro
surface: LIGHT
meta title: Library · Knowledge Archive | Thee Rainers
meta description: Long-form video breakdowns of how the boxing system works. Watch in any order.
primary action: Start Free → → /foundation
action position: UNVERIFIED
co-primary actions: featured block — Start Free → /foundation AND Reserve Workshop → /defense-workshop; closing CTA — Start Free → /foundation AND Get the Blueprints → /shop
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Featured video]
  [SMALL]       The Library
  [H1]          Knowledge archive.
  [BODY]        Long-form breakdowns of how the system works. Watch in any order.
  [SMALL]       Defense · The Gap Your Gym Skips
  [H2]          Why You Can't Defend Yourself
  [BODY]        The honest breakdown of why most fighters get hit when it matters. The mechanical and perceptual gaps that gym training never closes, and what to fix first.
  [BUTTON]      Start Free → → /foundation
  [BUTTON]      Reserve Workshop → → /defense-workshop
[SECTION 2 · LIGHT — Archive grid]
  [SMALL]       Archive
  [H2]          All sessions.
  [SMALL]       System Science · Why Integration Beats Isolation
  [H3]          What Boxing Does to Your Body That the Gym Can't
  [BODY]        83 out of 100 people who join a gym quit within 12 months. Boxing has held people for decades. This is the science behind why, and what your body actually builds when you train with integration instead of isolation.
  [LINK]        Watch → → https://www.youtube.com/watch?v=SrFywBFkmik
  [SMALL]       Kinetic Chain · Footwork Foundation
  [H3]          Your Footwork Is Wrong (And It's Not Your Fault)
  [BODY]        The foot tripod, the kinetic chain, and why 60-70% of punching power originates at the floor. The base layer of the system.
  [LINK]        Watch → → https://www.youtube.com/watch?v=KVIFV565qHQ
  [SMALL]       Neural Boxing · Shadowboxing
  [H3]          You're Shadowboxing Wrong (And It's Costing You)
  [BODY]        Why shadowboxing does not transfer to sparring. The structural correction that makes every round compound.
  [LINK]        Watch → → https://www.youtube.com/watch?v=kv8GhNU_3UQ
  [SMALL]       Systemic Performance · Conditioning
  [H3]          You're Doing Boxing Cardio Wrong (And It's Making You Worse)
  [BODY]        Chase the sprint cycle, not exhaustion. The conditioning protocol that builds the fighter without breaking the chain.
  [LINK]        Watch → → https://www.youtube.com/watch?v=Tpzuvc1exo4
  [SMALL]       Structural Training · Foundation First
  [H3]          Stop Throwing Combos in Boxing (For Now)
  [BODY]        Combinations before foundation is backwards. This is the sequence that builds the kinetic chain correctly, before layering complexity.
  [LINK]        Watch → → https://www.youtube.com/watch?v=CxPamPvyOBo
  [SMALL]       Structural Training · Foundation First
  [H3]          STOP Learning Combos in Boxing (For Now)
  [BODY]        The case against learning combinations before your base is locked. Build the platform first. The combos will mean something when you do.
  [LINK]        Watch → → https://www.youtube.com/watch?v=uGIcZ7RZ12o
  [SMALL]       System Baseline · Entry Protocol
  [H3]          Start Boxing Like This (Or You'll Waste Months)
  [BODY]        The correct entry sequence for serious fighters. Skip this and you spend months unlearning bad patterns. This is the right start.
  [LINK]        Watch → → https://www.youtube.com/watch?v=v0hxUp6-oqI
  [SMALL]       Performance Tech · AI in Training
  [H3]          Use AI to Get Better at Sports
  [BODY]        The fighter who learns faster wins. How to use AI tools to accelerate film study, pattern recognition, and skill acquisition.
  [LINK]        Watch → → https://www.youtube.com/watch?v=wkcb7_23tsQ
  [SMALL]       Gear · Equipment
  [H3]          Best 16 Oz Boxing Gloves of 2025? (My Honest Review)
  [BODY]        An honest breakdown of the 16 oz gloves tested across real training sessions. What performs under pressure. What doesn't.
  [LINK]        Watch → → https://www.youtube.com/watch?v=F5VJX0qMUHI
[SECTION 3 · LIGHT — CTA]
  [SMALL]       Knowledge is context. Action is the system.
  [BODY]        The Library is the why. The free Footwork Blueprint is where you start putting it on the ground.
  [BUTTON]      Start Free → → /foundation
  [BUTTON]      Get the Blueprints → → /shop
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /links
file: src/layouts/LinkPage.astro + src/pages/links.astro
surface: LIGHT
meta title: Thee Rainers · Links
meta description: Thee Rainers. Engineered for the ring. Free protocol, live workshop, 1-on-1 coaching.  (hardcoded in LinkPage.astro itself — the og:title is also hardcoded separately as "Thee Rainers. Links" and does not match the <title>)
primary action: NONE — this is a link-hub page, every row is an equally-weighted link, no single button is elevated as "the" CTA
action position: UNVERIFIED
co-primary actions: N/A (link-hub format)
voice markers: 0
Layout note: this route does NOT use Base.astro — no Nav, no Footer, no CookieConsent banner, no entry popup. Uses LinkPage.astro instead (own minimal head, renders `<Analytics />` which is an empty component with zero output).
---
[SECTION 1 · LIGHT — Identity]
  [ALT]         Thee Rainers
  [SMALL]       Boxing Performance
  [BODY]        Built for people who think in structures.
[SECTION 2 · LIGHT — Links stack]
  [LINK]        Footwork Blueprint · $9 → → /foundation
  [LINK]        Defense Workshop · $39 · Aug 29 → → /defense-workshop
  [LINK]        Why You Can't Defend Yourself · New · YouTube → → https://youtu.be/vdUDuFRUqGo
  [LINK]        Subscribe on YouTube · @theerainers → → https://www.youtube.com/@theerainers
  [LINK]        Shop · Blueprints · from $9 → → /shop
  [LINK]        Workshop Replay · Included with Workshop → → /defense-workshop
  [LINK]        Instagram · {333}K → → https://www.instagram.com/theerainers
  [LINK]        TikTok · {100}K → → https://www.tiktok.com/@theerainers
  [LINK]        Facebook · {141}K → → https://www.facebook.com/theerainers
  [LINK]        Threads · {26}K → → https://www.threads.com/@theerainers
  [LINK]        1-on-1 Coaching · Application Only → → /command
[SECTION 3 · LIGHT — Scripture]
  [SMALL]       1 Corinthians 9:26-27

---

## /contact
file: src/pages/contact.astro
surface: LIGHT
meta title: Contact · Thee Rainers
meta description: For partnerships, press, and anything that needs a human reply.
primary action: Send (form submit, POST /api/contact)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Hero + form]
  [BADGE]       Get in touch
  [H1]          Reach out.
  [BODY]        For partnerships, press, and anything that needs a human reply.
  [FORM-LABEL]  Full name
  [PLACEHOLDER] Your full name
  [FORM-LABEL]  Email
  [PLACEHOLDER] you@example.com
  [FORM-LABEL]  Phone (with country code)
  [PLACEHOLDER] +371 20 000 000
  [FORM-LABEL]  Reason
  [PLACEHOLDER] Select a reason
  [LIST-ITEM]   Workshop
  [LIST-ITEM]   Coaching
  [LIST-ITEM]   Partnership
  [LIST-ITEM]   Press
  [LIST-ITEM]   Other
  [FORM-LABEL]  Message
  [PLACEHOLDER] Your message
  [BUTTON]      Send (form submit)
  [SMALL]       We reply within two business days. We honor the Sabbath, so Saturday messages get a Monday reply.
  [ERROR]       Something went wrong. Please try again. (default)
  [ERROR · variant: invalid_email]    Please enter a valid email address.
  [ERROR · variant: invalid_phone]    Please enter a valid phone number with at least 7 digits.
  [ERROR · variant: missing_fields]   All fields are required.
  [ERROR · variant: delivery_failed]  Delivery failed. Please try again.
  [ERROR · variant: bad_request]      Something went wrong. Please try again.
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /feedback
file: src/pages/feedback.astro
surface: LIGHT
meta title: Feedback · Thee Rainers
meta description: The improvement loop. Active listening for continuous system refinement.
primary action: Submit (form submit, POST /api/contact with reason="Feedback")
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Form]
  [EYEBROW]     The Improvement Loop
  [H1]          The system listens.
  [BODY]        Every data point refines the architecture. If something in the system is not transferring, that is information. Submit it here.
  [FORM-LABEL]  Name (optional)
  [PLACEHOLDER] —
  [FORM-LABEL]  Email
  [PLACEHOLDER] —
  [FORM-LABEL]  Which lever are you working on?
  [PLACEHOLDER] —
  [LIST-ITEM]   Cue Reading
  [LIST-ITEM]   Kinetic Chain
  [LIST-ITEM]   Reactive Stiffness
  [LIST-ITEM]   Range Fluency
  [LIST-ITEM]   Defensive Responsibility
  [LIST-ITEM]   Transfer to Live
  [LIST-ITEM]   Identity & Presence
  [FORM-LABEL]  What is not transferring from closed drill to live?
  [PLACEHOLDER] —
  [FORM-LABEL]  What would make the system more useful?
  [PLACEHOLDER] —
  [BUTTON]      Submit (form submit)
  [SUCCESS]     Received. It is in the loop.
  [ERROR]       Something went wrong. Try again.
[SECTION 2 · LIGHT — Context]
  [SMALL]       Why this exists
  [BODY]        Every piece of feedback is a data point. The system is not fixed. It is a living architecture. What you submit here is heard, reviewed, and integrated where it improves the output.
  [BODY]        "Iron sharpens iron, and one man sharpens another."
  [SMALL]       Proverbs 27:17
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /safe
file: src/pages/safe.astro
surface: MIXED (dark hero/witness/scripture, light problem/who-this-serves/capture)
meta title: Non-Damage Boxing for Youth and Gyms · Thee Rainers
meta description: Full offense and defense with minimum unnecessary head trauma. A structured framework for parents, coaches, and gym owners who want safer boxing without removing the craft.
primary action: Get Early Access · Free → (form submit, POST /api/lead-capture, source="safe-boxing")
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
Orphan note: not linked from Nav, Footer, or any other route read in this audit — reachable only by direct URL.
---
[SHARED · Nav]
[SECTION 1 · DARK — Hero]
  [SMALL]       Thee Rainers · For Parents, Coaches, and Gyms
  [H1]          Non-damage boxing.
  [BODY]        Full offense and defense. Minimum unnecessary head trauma. The complete sport, trained with structure and clear limits on contact that causes harm.
  [SMALL]       Boxing carries inherent risk. This framework aims to reduce unnecessary head contact, not eliminate risk. We recommend medical evaluation after any suspected concussion and clearance before returning to sparring.
[SECTION 2 · LIGHT — The gap]
  [SMALL]       The gap
  [H2]          The methods exist. Most gyms don't use them.
  [BODY]        Chaotic sparring — Free rounds before the mechanics are built. Beginners absorbing contact they are not equipped to reduce. The damage accumulates before the skill does.
  [BODY]        No framework to stand behind — Coaches know something is off. They lack a clear methodology to hand to parents or defend to a board. Instinct is not enough when the conversation is about brain health.
  [BODY]        Defense treated as optional — Offense gets the attention. Guard discipline, movement logic, and composure under pressure come later, if at all. They are not optional. They are what limits damage.
[SECTION 3 · DARK — Witness]
  [SMALL]       What it looks like in practice
  [BODY]        This is not a theoretical concern.
  [BODY]        Gyms in Italy, Lithuania, Latvia. Hundreds of sparring sessions across different countries and cultures. The pre-fight clearance in some facilities is five seconds of checking your eyes. If a fighter is knocked out, someone provides assistance. No protocol follows. No guidance. No regulatory response. Fighters get back in without a timeline or a conversation.
  [BODY]        The research describes one version of the sport. What happens inside most gyms is another. This framework exists because those two things need to close.
[SECTION 4 · LIGHT — Who this serves]
  [SMALL]       Who this serves
  [BODY]        Parents — Your child wants to box. You want to know that the environment is structured, the contact is limited, and there is a coach who can explain why.
  [BODY]        Coaches — You already care about safety. You need a clear methodology and the language to communicate it to parents and gym leadership, not just instinct.
  [BODY]        Gym owners — You want to offer youth programs without the liability of chaotic sparring. A structured, defensible framework that protects your athletes and your program.
[SECTION 5 · LIGHT — Gym owner seed]
  [BODY]        Building a structured youth program at your gym? If this work is relevant to what you are doing, get in touch.
  [LINK]        Email Us → → mailto:rainers@theerainers.com?subject=Gym%20Program
[SECTION 6 · LIGHT — Early access capture]
  [SMALL]       Early access
  [H2]          Be first when resources open.
  [BODY]        This framework has practical application for parents, coaches, and gym programs. Leave your name and email. We will reach out when resources open.
  [PLACEHOLDER] Your name
  [PLACEHOLDER] your@email.com
  [BUTTON]      Get Early Access · Free → (form submit)
  [SUCCESS]     You are on the list. We will reach out when the resources and consultations open.
  [ERROR]       Something went wrong. Try again or email rainers@theerainers.com
  [SMALL]       No spam. Unsubscribe any time.
[SECTION 7 · DARK — Scripture]
  [BODY]        "Train a child in the way he should go, and when he is old he will not turn from it."
  [SMALL]       Proverbs 22:6
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /streaming
file: src/pages/streaming.astro
surface: DARK
meta title: Live · Thee Rainers
meta description: Watch Thee Rainers live. Boxing mechanics, technique breakdowns, and real-time coaching.
primary action: variant offline (default) → NONE, follow links only | variant live → Join the chat on YouTube → → https://youtube.com/@theerainers/live
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
State note: offline is the server-rendered default; JS polls /live-status.json every 60s to swap to the live state.
---
[SHARED · Nav]
[SECTION 1 · DARK — Offline state, default]
  [SMALL]       Offline
  [H1]          Not live right now.
  [BODY]        Follow me so you catch the next session.
  [LINK]        YouTube · Subscribe → → https://youtube.com/@theerainers
  [LINK]        Twitch · Follow → → https://twitch.tv/theerainers
  [LINK]        Kick · Follow → → https://kick.com/theerainers
  [LINK]        Facebook · Follow → → https://facebook.com/theerainers
  [LINK]        TikTok · Follow → → https://tiktok.com/@theerainers
  [LINK]        Instagram · Follow → → https://instagram.com/theerainers
[SECTION 1 · DARK — Live state, JS-toggled]
  [SMALL]       Live now
  [H1]          I'm live.
  [BODY]        {live stream title, injected by JS}
  [SMALL]       Live now. Tap the player to unmute.
  [LINK]        Join the chat on YouTube → → https://youtube.com/@theerainers/live
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /gate
file: src/pages/gate.astro
surface: LIGHT
meta title: Enter · Thee Rainers
meta description: One question. Two paths. The entry point to the system.
primary action: I'm building a system. (JS → redirects to /shop) — the other button is a co-equal path, not a lesser action
action position: UNVERIFIED
co-primary actions: 2 — "I'm building a system." (→ /shop) and "I'm looking to get fit." (→ in-page rejection state, then → /foundation)
voice markers: 0
Orphan note: not linked from Nav, Footer, or any other route read in this audit — reachable only by direct URL.
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Question state]
  [SMALL]       Before you continue.
  [H1]          Are you building a system, or trying to get fit?
  [BUTTON]      I'm building a system. (JS redirect → /shop)
  [BUTTON]      I'm looking to get fit. (JS → reveals rejection state)
[SECTION 1 · LIGHT — Rejection state]
  [SMALL]       Understood.
  [H2]          This program isn't built for that.
  [BODY]        The Footwork Foundation is free. Start there. Come back when the question changes.  ⚠ product referred to as "Footwork Foundation" — see Appendix C3 naming note
  [LINK]        The Footwork Foundation → → /foundation
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

---

## /legal/privacy-policy
file: src/pages/legal/privacy-policy.astro
surface: LIGHT
meta title: Privacy Policy · Thee Rainers
meta description: How Thee Rainers collects, uses, and protects your personal data.
primary action: NONE
action position: NONE
co-primary actions: NONE
voice markers: 0
Last updated stamp: 26 May 2026
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Legal body]
  [EYEBROW]     Legal
  [H1]          Privacy Policy
  [SMALL]       Last updated: 26 May 2026
  [H2]          1. Who we are
  [BODY]        Thee Rainers ("we", "us", "our") is a boxing performance coaching and digital products brand operated by Rainers. Our website is theerainers.com. Our contact address for data matters is rainers@theerainers.com.
  [H2]          2. What data we collect and why
  [BODY]        We collect only what we need to deliver our products and services:
  [LIST-ITEM]   Email address and name — when you submit a free download form, register for the Monthly Q&A, or submit a coaching application. Used to send you the requested resource and relevant follow-up communication.
  [LIST-ITEM]   Email address, name, and billing details — when you purchase a product. Billing details (card number, CVV) are handled exclusively by Stripe and never pass through or are stored on our servers. We receive only a confirmation of payment and your email address.
  [LIST-ITEM]   Purchase records — product purchased, subscription status, and Stripe customer and subscription identifiers. Stored in our customer database to manage your access and billing.
  [LIST-ITEM]   Application content — if you apply for 1-on-1 coaching, the information you submit in the application form (fight record, training background, goals).
  [LIST-ITEM]   Communications — if you contact us by email or via the contact form, we keep a record of that correspondence.
  [BODY]        We do not collect data from public databases, data brokers, or marketing partners. We do not collect data from social media profiles unless you provide it directly to us.
  [H2]          3. Legal basis for processing (EU/EEA)
  [BODY]        Where the General Data Protection Regulation (GDPR) applies:
  [LIST-ITEM]   Contract — processing is necessary to deliver the product or service you purchased or requested (Article 6(1)(b)).
  [LIST-ITEM]   Consent — where you have opted in to receive email communications. You may withdraw consent at any time by unsubscribing from any email we send, or by emailing rainers@theerainers.com.
  [LIST-ITEM]   Legitimate interests — fraud prevention, security, and the administration of our business where this does not override your rights.
  [H2]          4. Analytics
  [BODY]        We use Cloudflare Web Analytics, which is privacy-first. It does not use cookies, does not track you across sites, and does not collect or store your IP address or any individually identifiable information. Aggregate visit statistics are used only to understand how our site is performing.
  [H2]          5. Who we share your data with
  [BODY]        We share your data only with the service providers necessary to operate the site. We do not sell your data.
  [BODY]        Table: Processor / Purpose / Location — Stripe, Inc. (Payment processing and subscription billing. Checkout runs on Stripe's own domain (checkout.stripe.com). Stripe processes card data; we do not see or store it. / USA / Ireland (Stripe Payments Europe Limited)); Cloudflare, Inc. (Website hosting, CDN, DDoS protection, and privacy-first Web Analytics (cookieless). / USA, with EU data centre options); Cloudflare R2 (Cloudflare, Inc.) (Storage and delivery of purchased digital files (PDF Blueprints). Files are sent via time-limited secure links, not exposed publicly. / USA, with EU data centre options); Kit (ConvertKit, Inc.) (Email marketing and subscriber management. Receives your email address after purchase or opt-in so we can send you product access links, Q&A invitations, and relevant coaching content. / USA); Airtable, Inc. (Customer relationship management. Stores purchase records, subscription status, and your Stripe identifiers so we can manage access and support requests. / USA); Make (Celonis SE) (Automation platform. Routes form submissions and purchase events between our systems to trigger email delivery and product access. / Germany (EU)); YouTube (Google LLC) (Video embedding on the Library page and the token-gated Workshop Replay page (using youtube-nocookie.com). YouTube may set cookies via embedded video iframes; see our Cookie Policy for details. / USA)
  [BODY]        International transfers to processors in the USA are covered by the applicable transfer mechanisms in place under each processor's own data protection commitments (Standard Contractual Clauses or equivalent frameworks).
  [H2]          6. Retention
  [BODY]        We keep your data for as long as necessary for the purpose it was collected. Purchase and subscription records are kept for the duration of our legal and tax obligations (typically 7 years from the end of the tax year in which the transaction occurred). Email marketing records are kept until you unsubscribe. Application data for 1-on-1 coaching is kept for 12 months if unsuccessful.
  [H2]          7. Your rights
  [BODY]        Under GDPR (if you are in the EU/EEA) you have the right to:
  [LIST-ITEM]   Access the personal data we hold about you
  [LIST-ITEM]   Rectify inaccurate data
  [LIST-ITEM]   Erasure ("right to be forgotten"), subject to legal retention obligations
  [LIST-ITEM]   Restriction of processing
  [LIST-ITEM]   Data portability
  [LIST-ITEM]   Object to processing based on legitimate interests
  [LIST-ITEM]   Withdraw consent at any time where processing is based on consent
  [LIST-ITEM]   Lodge a complaint with your national data protection authority
  [BODY]        To exercise any of these rights, email rainers@theerainers.com. We will respond within 30 days.
  [H2]          8. Cookies
  [BODY]        See our Cookie Policy for full details. In summary: we do not use advertising or tracking cookies. The only cookie that may be present is a strictly necessary Cloudflare infrastructure cookie (__cf_bm) for bot protection.
  [H2]          9. Changes to this policy
  [BODY]        We may update this policy from time to time. Material changes will be communicated by updating the "Last updated" date above. Continued use of the site after an update constitutes acceptance.
  [H2]          10. Contact
  [BODY]        For any privacy question or request: rainers@theerainers.com.
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /legal/terms
file: src/pages/legal/terms.astro
surface: LIGHT
meta title: Terms & Conditions · Thee Rainers
meta description: Terms and conditions for using Thee Rainers products, coaching, and digital services.
primary action: NONE
action position: NONE
co-primary actions: NONE
voice markers: 0
Last updated stamp: 26 May 2026
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Legal body]
  [EYEBROW]     Legal
  [H1]          Terms & Conditions
  [SMALL]       Last updated: 26 May 2026
  [BODY]        These Terms & Conditions ("Terms") govern your access to and use of the website operated by Thee Rainers ("Company," "we," "us," or "our") at theerainers.com (the "Website") and any services, subscriptions, digital products, training plans, coaching services, and related offerings we provide through the Website or by other means (together, the "Services").
  [BODY]        By accessing or using the Website or Services, you agree to be bound by these Terms. If you do not agree, do not use the Website or Services.
  [H2]          1. Who we are
  [BODY]        Thee Rainers provides boxing coaching and related services, which may include one-on-one coaching, online coaching, group coaching, training plans, subscriptions, and digital products.
  [BODY]        Email: rainers@theerainers.com
  [H2]          2. Eligibility
  [BODY]        The Services are intended only for persons who are 18 years of age or older. By using the Services, you represent and warrant that you are at least 18 years old, have the legal capacity to enter into a binding agreement, that all information you provide is accurate, and that you will use the Services in compliance with these Terms and all applicable laws.
  [H2]          3. No medical advice
  [BODY]        Our Services are for educational, coaching, and fitness purposes only.
  [BODY]        You understand and agree that:
  [LIST-ITEM]   boxing and fitness training involve physical activity and an inherent risk of injury;
  [LIST-ITEM]   our Services are not medical advice, physiotherapy, or mental health treatment;
  [LIST-ITEM]   you should consult a physician or qualified professional before starting any training programme, especially if you have injuries, medical conditions, or concerns;
  [LIST-ITEM]   you participate voluntarily and at your own risk.
  [BODY]        If you experience pain, dizziness, shortness of breath, or other warning signs during training, stop immediately and seek medical help if needed.
  [H2]          4. Services
  [BODY]        We may offer one-time coaching calls, recurring subscriptions, coaching packages, digital products, downloadable training plans, and other services described on the Website. We may change, update, suspend, or discontinue any Service at any time, subject to applicable law and any paid commitments already made.
  [H2]          5. Accounts and booking
  [BODY]        If you create an account or book a session, you agree to provide accurate information, keep your login details secure, and not share your account with others. You are responsible for all activity under your account.
  [BODY]        For booking-based Services, bookings are confirmed only when we accept them. If you are late we may shorten the session and still charge the full fee. No-shows may not be refunded or rescheduled.
  [H2]          6. Payments
  [BODY]        You agree to pay all fees shown for the Services you purchase. By providing payment information, you authorise us and our payment processor (Stripe) to charge the applicable amount using your selected payment method. If a payment fails or is charged back, we may suspend access until the matter is resolved. You are responsible for any bank fees or exchange rate differences charged by your provider.
  [H2]          7. Subscriptions
  [BODY]        If you purchase a subscription, it will renew automatically unless cancelled before the renewal date.
  [BODY]        You can cancel your subscription at any time from your account or by emailing rainers@theerainers.com. Cancellation stops all future renewals. You keep full access until the end of your current paid period. We do not refund the portion of a billing period already started, unless required by law.
  [H2]          8. Refunds and cancellations
  [BODY]        All sales are subject to our Refund & Cancellation Policy, which is incorporated into these Terms. Please read it before purchasing.
  [BODY]        One-time coaching calls: Contact us at rainers@theerainers.com to request a reschedule or cancellation. Whether a refund, credit, or reschedule is available depends on the timing and circumstances. No-show or late cancellation rules apply as stated at checkout.
  [BODY]        Digital products and training plans: Non-refundable once delivered, accessed, or downloaded, except where required by applicable law.
  [BODY]        Subscriptions: Non-refundable for any billing period already started, unless required by law.
  [H2]          9. EU / EEA right of withdrawal
  [BODY]        If you are a consumer in the EU or EEA, you may have a statutory right to withdraw from a purchase within 14 days without giving a reason. However, that right may not apply, or may be lost, where:
  [LIST-ITEM]   the service has already been fully performed with your prior express consent and acknowledgment that you lose the withdrawal right once performance begins; or
  [LIST-ITEM]   digital content is supplied immediately and you expressly consent to immediate delivery and acknowledge that you lose the withdrawal right once access or download begins, where applicable law permits.
  [BODY]        Where the right of withdrawal applies, contact us at rainers@theerainers.com within 14 days of purchase.
  [H2]          10. Acceptable use
  [BODY]        You agree not to use the Website or Services to break any law, harass or harm others, copy or resell our content without permission, interfere with the Website's security, upload malicious code, or misrepresent your identity or training level.
  [H2]          11. User content
  [BODY]        If you submit reviews, testimonials, or other content, you grant us permission to use that content for business purposes including marketing, unless you ask us not to and we agree in writing. You represent that you own the content and that it does not infringe anyone's rights. We may remove or decline to publish content at our discretion.
  [H2]          12. Intellectual property
  [BODY]        The Website, branding, training materials, digital products, and all other content are owned by us or our licensors. You may not copy, reproduce, distribute, or create derivative works without permission. We grant you a limited, non-exclusive, non-transferable licence to access and use materials we provide for your personal, non-commercial use.
  [H2]          13. Third-party services
  [BODY]        We use third-party providers including Stripe (payments), Kit (email), Airtable (customer data), Make (automation), Cloudflare (hosting), and YouTube (video). We are not responsible for the acts, errors, or policies of third-party providers. Your use of third-party services may be governed by their own terms.
  [H2]          14. Disclaimers
  [BODY]        To the maximum extent permitted by law, the Services are provided on an "as is" and "as available" basis. We do not guarantee specific results, outcomes, or performance from coaching. Your progress depends on many factors outside our control.
  [H2]          15. Limitation of liability
  [BODY]        To the maximum extent permitted by law, we will not be liable for indirect, incidental, special, consequential, or punitive damages arising out of your use of the Website or Services.
  [BODY]        Our total liability for any claim will not exceed the amount you paid us for the Service giving rise to the claim during the 6 months before the event. Nothing in these Terms limits liability that cannot legally be excluded under applicable law.
  [H2]          16. Indemnification
  [BODY]        You agree to indemnify and hold harmless Thee Rainers and its agents from any claims arising out of your misuse of the Website or Services, your violation of these Terms, or content you submit.
  [H2]          17. Suspension and termination
  [BODY]        We may suspend or terminate your access if you violate these Terms, fail to pay, or if we discontinue the Services. Upon termination, rights granted to you end immediately, except provisions that by their nature survive (payment obligations, intellectual property, disclaimers, liability, and governing law).
  [H2]          18. Privacy and cookies
  [BODY]        Our collection and use of personal data are described in our Privacy Policy. Our use of cookies is described in our Cookie Policy.
  [H2]          19. Governing law
  [BODY]        These Terms are governed by the laws of Latvia, without regard to conflict of law principles. If you are a consumer, you may also benefit from mandatory consumer protections in your country of residence.
  [H2]          20. Disputes
  [BODY]        Before starting formal legal action, please contact us first so we can try to resolve the issue informally. If a dispute cannot be resolved informally, it will be handled by the competent courts in Latvia, unless applicable consumer law requires otherwise.
  [H2]          21. Changes to these Terms
  [BODY]        We may update these Terms from time to time. Continued use of the Website or Services after an update constitutes acceptance of the revised Terms.
  [H2]          22. Contact
  [BODY]        Thee Rainers
  [BODY]        rainers@theerainers.com
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /legal/refund-policy
file: src/pages/legal/refund-policy.astro
surface: LIGHT
meta title: Refund & Cancellation Policy · Thee Rainers
meta description: Thee Rainers refund and cancellation policy for digital products, subscriptions, workshops, and coaching.
primary action: NONE
action position: NONE
co-primary actions: NONE
voice markers: 0
Last updated stamp: 26 May 2026
Contact email on this page: rainers@stepintoring.com (all 5 instances) — see Appendix C3
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Legal body]
  [EYEBROW]     Legal
  [H1]          Refund & Cancellation Policy
  [SMALL]       Last updated: 26 May 2026
  [BODY]        Questions about a purchase? Email rainers@stepintoring.com. We will always do our best to help.
  [H2]          1. Digital products and downloads (Blueprints)
  [BODY]        The Shadowboxing Blueprint is a digital download delivered immediately or within minutes of purchase via a secure link sent to your email address. Because the content is delivered digitally and is accessible immediately after purchase, all digital product sales are final and non-refundable once the download link has been accessed or the file has been downloaded. The Footwork Blueprint is a free download and is not subject to this clause.  ⚠ Footwork Blueprint is NOT currently free ($9 live) — see Appendix C1
  [BODY]        If you have not accessed your download link and wish to request a refund, contact us within 48 hours of purchase at rainers@stepintoring.com with your order details and we will consider your request.
  [BODY]        If you did not receive your download link, email us and we will resend it immediately.
  [H2]          2. Monthly subscriptions (Blueprints + Q&A access)
  [BODY]        You can cancel your subscription at any time from your account or by emailing rainers@stepintoring.com. Cancellation stops all future renewals. You keep full access until the end of your current paid period. We do not refund the portion of a billing period already started, unless required by law.
  [H2]          3. Live workshops (Defense Workshop)
  [BODY]        Workshop tickets are non-refundable. If you are unable to attend the live session, you will receive the full workshop recording at no additional charge. If the session is cancelled by us, you will receive a full refund or a credit towards a future session at your choice.
  [H2]          4. Workshop Replay (on-demand)
  [BODY]        The Workshop Replay is a digital product granting 7-day access to an on-demand video. Because access is granted immediately upon purchase, the Workshop Replay is non-refundable once the access link has been used. If you have not accessed your link, contact us within 48 hours for a refund consideration.  ⚠ describes Workshop Replay as independently purchasable — see Appendix C3
  [H2]          5. 1-on-1 Coaching
  [BODY]        1-on-1 coaching engagements are non-refundable once the first session has taken place. We stand behind our work: if at any point you feel the coaching is not producing clear, measurable progress, we will continue sessions at no charge until it does.
  [BODY]        Rescheduling: You may reschedule a session with at least 24 hours' notice. Sessions cancelled with less than 24 hours' notice, or where you do not attend without notice (no-show), are forfeited.
  [H2]          6. EU / EEA 14-day right of withdrawal
  [BODY]        If you are a consumer in the European Union or European Economic Area, you have a statutory right to withdraw from a purchase within 14 days without giving a reason (the "cooling-off period"), subject to the following exceptions:
  [LIST-ITEM]   If you explicitly consented to immediate performance of a service (for example, by requesting immediate access to a live session), the right of withdrawal is lost once performance begins.
  [LIST-ITEM]   If you explicitly consented to immediate delivery of digital content (for example, by requesting that a download link be sent before the 14-day period expires), the right of withdrawal is lost once the content has been delivered and you have acknowledged this.
  [BODY]        Where the right of withdrawal applies and has not been waived, contact us at rainers@stepintoring.com within 14 days of your purchase to exercise this right. We will process your refund within 14 days of receiving your withdrawal notice.
  [H2]          7. How to request a refund or cancellation
  [BODY]        Email rainers@stepintoring.com with your name, email address used at checkout, the product purchased, and the reason for your request. We aim to respond within 2 business days.
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /legal/cookie-policy
file: src/pages/legal/cookie-policy.astro
surface: LIGHT
meta title: Cookie Policy · Thee Rainers
meta description: How Thee Rainers uses cookies and your consent choices.
primary action: NONE
action position: NONE
co-primary actions: NONE
voice markers: 0
Last updated stamp: 30 July 2026 (most recent "last updated" of all 6 legal pages — the other 5 all say 26 May 2026)
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Legal body]
  [EYEBROW]     Legal
  [H1]          Cookie Policy
  [SMALL]       Last updated: 30 July 2026
  [H2]          The short version
  [BODY]        We use Google Tag Manager with Consent Mode v2. By default, all analytics and advertising storage is denied. A consent banner appears on your first visit. If you decline, no analytics cookies are set. If you accept, Google Analytics 4 loads through GTM and may set cookies. We use no advertising cookies, no profiling cookies, and no third-party ad pixels.
  [H2]          What is a cookie?
  [BODY]        A cookie is a small text file stored in your browser by a website you visit. Cookies serve different purposes: some are strictly necessary to make a website function, others collect analytics data, and others track your behaviour across sites for advertising.
  [H2]          Cookies we set
  [BODY]        We do not set any first-party cookies ourselves. The following cookies may be set depending on your consent choice and our infrastructure providers:
  [BODY]        Table: Cookie / Set by / Purpose / Consent required / Duration — __cf_bm (Cloudflare / Bot management and security. Strictly necessary to protect the site from automated attacks. / No (strictly necessary) / 30 minutes); _ga, _ga_* (Google Analytics (via GTM) / Distinguishes unique visitors and sessions for aggregate traffic analytics. / Yes — only set after you accept / 2 years)
  [H2]          Consent banner
  [BODY]        A banner appears on your first visit with two options: Accept or Decline. Your choice is stored in your browser (localStorage key trb_consent_v1) so you are not asked again. If you decline, no analytics cookies are set and Google Tag Manager runs in a restricted mode with all storage denied.
  [H2]          Analytics
  [BODY]        We use two analytics tools:
  [LIST-ITEM]   Cloudflare Web Analytics (always active, no cookies) — cookieless, privacy-first aggregate data: page views, referrer, country-level location. Requires no consent because it sets no cookies and does not track individual users across sessions.
  [LIST-ITEM]   Google Analytics 4 (via Google Tag Manager, consent-gated) — loads only if you accept the consent banner. Collects session and behaviour data to help us understand what content is useful. Governed by Google's Privacy Policy.
  [BODY]        We do not use Facebook Pixel, TikTok Pixel, or any advertising or retargeting pixels.
  [H2]          Third-party cookies from embedded content
  [BODY]        Some pages on this site embed third-party content that may set cookies in your browser:
  [LIST-ITEM]   YouTube video embeds — The Library page (/library) embeds YouTube videos using the standard YouTube player. YouTube may set cookies when you interact with or view these videos. The token-gated Workshop Replay page uses youtube-nocookie.com, which YouTube states does not set cookies until you interact with the video.
  [BODY]        We do not control cookies set by third-party platforms. For YouTube's cookie practices, refer to Google's privacy policy at policies.google.com/privacy.
  [H2]          Payment processing
  [BODY]        When you click a purchase button, you are redirected to Stripe's hosted checkout at checkout.stripe.com. Any cookies set during that process are set by Stripe on their own domain and are governed by Stripe's Privacy Policy. No Stripe tracking scripts are loaded on theerainers.com.
  [H2]          How to control cookies
  [BODY]        You can manage and delete cookies through your browser settings. Instructions for common browsers:
  [LIST-ITEM]   Chrome: Settings → Privacy and security → Cookies and other site data
  [LIST-ITEM]   Firefox: Settings → Privacy & Security → Cookies and Site Data
  [LIST-ITEM]   Safari: Preferences → Privacy → Manage Website Data
  [LIST-ITEM]   Edge: Settings → Cookies and site permissions
  [BODY]        Blocking strictly necessary cookies (such as __cf_bm) may affect the security and functionality of the site.
  [H2]          Contact
  [BODY]        Questions about this policy: rainers@stepintoring.com.
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /legal/disclaimer
file: src/pages/legal/disclaimer.astro
surface: LIGHT
meta title: Disclaimer · Thee Rainers
meta description: Important disclaimers about the educational and physical training content on theerainers.com.
primary action: NONE
action position: NONE
co-primary actions: NONE
voice markers: 0
Last updated stamp: 26 May 2026
Non-voice-marker note: source has an HTML comment `<!-- TODO: Update this section if affiliate or referral arrangements are introduced. -->` at line 57, inside section 7. Not a "DRAFT: voice pass Rainers" marker so it is not in Appendix B, but flagged here since it is the same class of internal note left in shipped copy.
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Legal body]
  [EYEBROW]     Legal
  [H1]          Disclaimer
  [SMALL]       Last updated: 26 May 2026
  [H2]          1. Educational content only
  [BODY]        The content on theerainers.com — including the Blueprints, video library, free protocols, workshops, coaching programmes, and all written material — is provided for educational and fitness coaching purposes only. It is not intended to constitute, and does not constitute, medical advice, physiotherapy advice, mental health advice, or any other form of regulated professional advice.
  [BODY]        Nothing on this site should be interpreted as a diagnosis, treatment plan, or recommendation for any specific individual's health condition.
  [H2]          2. Physical risk and personal responsibility
  [BODY]        Boxing, martial arts, and physical training of any kind involve inherent risks of injury, including serious injury or death. By accessing, purchasing, or using any content, programme, or coaching service from Thee Rainers, you acknowledge that:
  [LIST-ITEM]   You participate voluntarily and assume full responsibility for your own safety.
  [LIST-ITEM]   You should obtain clearance from a qualified medical professional before starting any new physical training programme, especially if you have any pre-existing injury, illness, or health condition.
  [LIST-ITEM]   Thee Rainers, its founder, and its agents are not liable for any injury, illness, or loss arising from your participation in any training activity described or recommended on this site.
  [H2]          3. Consult a physician
  [BODY]        Before beginning any exercise programme featured on this site, consult a licensed physician or sports medicine professional, particularly if you are over 40, have cardiovascular conditions, joint or musculoskeletal injuries, or any other condition that may be aggravated by vigorous physical activity.
  [H2]          4. No guarantee of results
  [BODY]        Results from training programmes, coaching, and the use of any content on this site vary by individual and depend on factors including but not limited to: training consistency, physical condition, genetics, nutrition, sleep, and coaching environment. Any results described — whether in testimonials, marketing copy, or case studies — represent individual outcomes and do not guarantee that you will achieve the same results.
  [H2]          5. Testimonials
  [BODY]        Any testimonials or statements about outcomes from past students or clients reflect their individual experience. They are not a guarantee of future results. Individual results will vary.
  [H2]          6. Third-party links
  [BODY]        This site may contain links to third-party websites (including social media platforms, payment processors, and external resources). We have no control over the content, privacy practices, or accuracy of third-party sites, and we accept no responsibility for them. A link to a third-party site does not constitute an endorsement.
  [H2]          7. Affiliate relationships
  [BODY]        We do not currently participate in affiliate programmes or receive referral fees from third-party products or services featured on this site. If this changes, we will disclose it clearly at the point of recommendation.
  [H2]          8. Accuracy of information
  [BODY]        We make every effort to ensure that the information on this site is accurate and up to date. However, we make no warranty that it is complete, current, or free of errors. We reserve the right to change or update information without notice.
  [H2]          Contact
  [BODY]        Questions about this disclaimer: rainers@stepintoring.com.
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /legal/accessibility-statement
file: src/pages/legal/accessibility-statement.astro
surface: LIGHT
meta title: Accessibility Statement · Thee Rainers
meta description: Thee Rainers accessibility statement — our commitment to WCAG 2.2 AA, what we've implemented, and known issues we are addressing.
primary action: NONE
action position: NONE
co-primary actions: NONE
voice markers: 0
Last updated stamp: 26 May 2026
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Legal body]
  [EYEBROW]     Legal
  [H1]          Accessibility Statement
  [SMALL]       Last updated: 26 May 2026
  [BODY]        Thee Rainers is committed to making theerainers.com accessible to all users, including people with disabilities. We aim to conform to WCAG 2.2 Level AA and are actively working to meet that standard.
  [H2]          What we have implemented
  [LIST-ITEM]   The site uses semantic HTML5 landmarks: <header>, <nav>, <main>, and <footer> on every page.
  [LIST-ITEM]   Every <img> element has a meaningful alt attribute describing its content.
  [LIST-ITEM]   Decorative SVG icons use aria-hidden="true" to avoid screen reader clutter.
  [LIST-ITEM]   The navigation mobile menu button has an aria-label and the active navigation item receives aria-current="page".
  [LIST-ITEM]   The application and contact forms use explicit <label> elements associated with each input via for / id.
  [LIST-ITEM]   Colour is not the sole means of conveying information.
  [LIST-ITEM]   The site is fully keyboard-navigable: all interactive elements are reachable by Tab and activatable by Enter or Space.
  [LIST-ITEM]   The lang="en" attribute is set on the root <html> element.
  [LIST-ITEM]   We use a variable font (Bricolage Grotesque) that renders well at all sizes and under browser text-zoom settings.
  [LIST-ITEM]   We do not use animations that could trigger vestibular disorders; hero animations respect the prefers-reduced-motion media query.
  [H2]          Known issues we are addressing
  [LIST-ITEM]   Skip-to-content link: A skip navigation link (allowing keyboard users to bypass the site header and jump directly to main content) is not yet implemented. We are adding this.
  [LIST-ITEM]   Email capture form labels: The email input fields on the free download forms (Footwork Foundation, Q&A registration) currently use placeholder text instead of a visible <label>. This has been identified as a WCAG 1.3.1 failure and will be corrected in an upcoming update.  ⚠ "Footwork Foundation" naming — see Appendix C3
  [LIST-ITEM]   Colour contrast: Some secondary text elements use reduced-opacity colour values that may not meet the 4.5:1 contrast ratio for small body text at all zoom levels. We are reviewing and adjusting these.
  [H2]          Third-party content
  [BODY]        Some pages embed YouTube video players. The accessibility of the YouTube player itself is outside our direct control. Where possible we use YouTube's nocookie variant. If you have difficulty with embedded video content, please contact us and we will provide an alternative.
  [H2]          Feedback and contact
  [BODY]        If you experience any accessibility barrier on theerainers.com, we want to hear about it. Email us at rainers@stepintoring.com with a description of the barrier and the page or feature affected. We aim to respond within 5 business days and to resolve confirmed issues as quickly as possible.
  [BODY]        If you are not satisfied with our response, you may contact the relevant national equality or accessibility body in your country.
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

---

## /thank-you/footwork-blueprint
file: src/pages/thank-you/footwork-blueprint.astro
surface: MIXED (dark hero/scripture, light body)
meta title: The Footwork Blueprint · Access | Thee Rainers
meta description: NONE set (robots noindex, no Fragment description) → falls back to Base default
primary action: Watch the Breakdown → → {LOOM_URL}
action position: UNVERIFIED
co-primary actions: 2 in "After the blueprint" — See the Community → /community AND Reserve a Seat → /defense-workshop
voice markers: 0
⚠ CRITICAL — this is the successPath for BOTH the free lead-capture flow (foundation.astro, lead-capture.ts) AND the $9 PAID Stripe purchase (create-checkout.ts `footwork` successPath). Every line of copy on this page assumes the free/lead-magnet flow ("Thee Rainers · Free Blueprint", "The download link is in your inbox now") — there is no purchase confirmation, no price mention, no PurchaseMoment component for a paying customer. A separate, correctly-built purchase-confirmation page exists at src/pages/thank-you/footwork.astro (see next entry) but is never linked to by any code path. See Appendix C3.
---
[SHARED · Nav]
[SECTION 1 · DARK — Delivery hero]
  [SMALL]       Thee Rainers · Free Blueprint
  [H1]          Check your email.
  [BODY]        The download link is in your inbox now. While you wait, watch the breakdown below. It covers the four bases the Blueprint is built on.
  [BUTTON]      Watch the Breakdown → {LOOM_URL}
[SECTION 2 · LIGHT — What the breakdown is]
  [SMALL]       The Breakdown · Video
  [BODY]        The four bases explained.
  [BODY]        A short walkthrough on the mechanical foundation the blueprint runs on. Watch this before your first session so the drills make sense from the first rep.
[SECTION 3 · LIGHT — Next step nudge]
  [SMALL]       After the blueprint
  [SMALL]       $39/mo · The Weekly Session
  [BODY]        Live correction, every week.
  [BODY]        Run the blueprint with Rainers watching. The Weekly Session every Tuesday. Camera on.
  [LINK]        See the Community → → /community
  [SMALL]       $39 · Defense Workshop
  [BODY]        Live. Camera on. Real-time correction.
  [BODY]        90 minutes. The full defensive structure applied to your movement in real time. Replay included.
  [LINK]        Reserve a Seat → → /defense-workshop
[SECTION 4 · DARK — Scripture]
  [BODY]        "I do not run aimlessly. I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /thank-you/footwork
file: src/pages/thank-you/footwork.astro
surface: MIXED (light body, dark scripture)
meta title: Footwork Blueprint · Purchase Confirmed | Thee Rainers
meta description: NONE set (robots noindex, no Fragment description) → falls back to Base default
primary action: NONE (informational, PurchaseMoment has no primaryLabel/primaryHref passed)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
Orphan note: this correctly-built purchase-confirmation page is never linked to or redirected to by any code path in the repo (verified by grep). create-checkout.ts sends paid footwork buyers to /thank-you/footwork-blueprint instead. See Appendix C3.
---
[SHARED · Nav]
[SHARED · PurchaseMoment]
  productName: "The Footwork Blueprint"
  firstActionCopy: "Read the four bases. Run the first drill block before your next session."
[SECTION 1 · LIGHT — Watch while you wait]
  [SMALL]       Watch while you wait
  [SMALL]       The structural problem the Blueprint is designed to solve. From the ground up.
[SECTION 2 · LIGHT — Also from Thee Rainers]
  [SMALL]       Also from Thee Rainers
  [LINK]        The Weekly Session · live every Tuesday, drill library → → /community
  [LINK]        1-on-1 Coaching · application only → → /command
[SECTION 3 · DARK — Scripture]
  [BODY]        "I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /thank-you/shadowboxing
file: src/pages/thank-you/shadowboxing.astro
surface: MIXED (light body, dark scripture)
meta title: Shadowboxing Blueprint · Purchase Confirmed | Thee Rainers
meta description: NONE set → falls back to Base default
primary action: NONE (informational)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
Correctly wired: this IS the live successPath for `shadowboxing` in create-checkout.ts.
---
[SHARED · Nav]
[SHARED · PurchaseMoment]
  productName: "The Shadowboxing Blueprint"
  firstActionCopy: "Start with Session 1. Run it three times before moving to Session 2."
[SECTION 1 · LIGHT — Watch while you wait]
  [SMALL]       Watch while you wait
  [SMALL]       The structural problem the Blueprint is designed to solve. From the ground up.
[SECTION 2 · LIGHT — Also from Thee Rainers]
  [SMALL]       Also from Thee Rainers
  [LINK]        The Weekly Session · live every Tuesday, drill library → → /community
  [LINK]        1-on-1 Coaching · application only → → /command
[SECTION 3 · DARK — Scripture]
  [BODY]        "I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /thank-you/workshop
file: src/pages/thank-you/workshop.astro
surface: LIGHT (body), DARK (scripture)
meta title: Seat Reserved, August 29 | Thee Rainers
meta description: NONE set (no Fragment head at all beyond robots noindex) → falls back to Base default
primary action: NONE (informational; one soft link — see below)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
Orphan note: never linked to or redirected to by any code path in the repo (verified by grep) — create-checkout.ts sends both workshop checkout keys to /thank-you/defense-workshop instead. See Appendix C3.
---
[SHARED · Nav]
[SHARED · PurchaseMoment]
  productName: "Defense Workshop"
  firstActionCopy: "Your session details are below."
[SECTION 1 · LIGHT — Session details]
  [SMALL]       Session details
  [SMALL]       Date — Saturday, August 29
  [SMALL]       Format — Live on Zoom · Camera on
  [SMALL]       Length — 90 minutes
  [SMALL]       Zoom link — Sent to your email 24h before
  [SMALL]       Recording — Delivered within 24h after
  [SMALL]       Optional. Watch before August 29
  [BODY]        The Defense Workshop replay. Same mechanical foundations. Watching it first means your next session becomes refinement, not introduction.
  [LINK]        Defense Workshop · $39 → → /defense-workshop  ⚠ links a just-paid customer back to the $39 sales page — see Appendix C3
[SECTION 2 · LIGHT — Video]
  [SMALL]       Watch this first
  [SMALL]       The structural problem the workshop is designed to solve.
[SECTION 3 · DARK — Scripture]
  [BODY]        "I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /thank-you/defense-workshop
file: src/pages/thank-you/defense-workshop.astro
surface: MIXED (light body, dark scripture)
meta title: You're In · Defense Workshop | Thee Rainers
meta description: Your Defense Workshop seat is confirmed. Details arriving by email.
primary action: NONE (informational)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
Correctly wired: this IS the live successPath for both `defense_workshop_early` and `defense_workshop_standard` in create-checkout.ts.
---
[SHARED · Nav]
[SHARED · PurchaseMoment]
  productName: "Defense Workshop"
  firstActionCopy: "Your confirmation is on its way by email. Check your inbox for session details and the link."
[SECTION 1 · LIGHT — Watch while you wait]
  [SMALL]       Watch while you wait
  [SMALL]       The structural problem the workshop addresses. From the ground up.
[SECTION 2 · LIGHT — Also from Thee Rainers]
  [SMALL]       Also from Thee Rainers
  [LINK]        The Weekly Session · live every Tuesday, drill library → → /community
  [LINK]        Shadowboxing Blueprint · 50+ rounds, $19 → → /shadowboxing-blueprint
  [LINK]        1-on-1 Coaching · application only → → /command
[SECTION 3 · DARK — Scripture]
  [BODY]        "I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /thank-you/workshop-replay
file: src/pages/thank-you/workshop-replay.astro
surface: MIXED (light body, dark scripture)
meta title: Check Your Email · Thee Rainers
meta description: Your Workshop Replay access link is on its way.
primary action: NONE (informational)
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
⚠ This page treats "Workshop Replay" as a standalone purchased product, but no live checkout button anywhere on the site uses lookupKey `workshop_replay` — it is absent from the `PRODUCTS` map in create-checkout.ts. This page is reachable only via a legacy/manual Stripe flow, if at all. See Appendix C1/C3.
---
[SHARED · Nav]
[SHARED · PurchaseMoment]
  productName: "Workshop Replay"
  firstActionCopy: "Your link is in your email. Open it and watch from the beginning."
[SECTION 1 · LIGHT — Watch while you wait]
  [SMALL]       Watch while you wait
  [SMALL]       The structural problem the replay is designed to solve. From the ground up.
[SECTION 2 · LIGHT — Also from Thee Rainers]
  [SMALL]       Also from Thee Rainers
  [LINK]        The Weekly Session · live every Tuesday, drill library → → /community
  [LINK]        1-on-1 Coaching · application only → → /command
[SECTION 3 · DARK — Scripture]
  [BODY]        "I do not run aimlessly; I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /thank-you/contact
file: src/pages/thank-you/contact.astro
surface: MIXED (light body, dark scripture)
meta title: Message received · Thee Rainers
meta description: Thank you for reaching out.
primary action: See the Defense Workshop → → /defense-workshop
action position: UNVERIFIED
co-primary actions: 2 co-equal — Back to home → / AND See the Defense Workshop → → /defense-workshop
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT — Confirmation]
  [SMALL]       Thee Rainers
  [H1]          Message received.
  [BODY]        Thank you for reaching out. We reply within two business days.
  [BUTTON]      Back to home → /
  [BUTTON]      See the Defense Workshop → → /defense-workshop
[SECTION 2 · DARK — Scripture]
  [BODY]        "I do not run aimlessly. I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /private-architecture/[token]
file: src/pages/private-architecture/[token].astro
surface: DARK
meta title: variant valid → "{record.product_name} | Thee Rainers" · variant invalid → "Access | Thee Rainers"
meta description: NONE — no meta description tag present at all (this route does not use Base.astro; it is a standalone HTML document with its own minimal <head>)
primary action: variant valid → {pdfLinks[n].label} → (presigned R2 URL, 1hr expiry) | variant invalid → Send My Link → (form submit, POST /api/resend-access)
action position: UNVERIFIED
co-primary actions: variant valid with multiple PDFs → each download link is co-equal
voice markers: 0
Layout note: does not import global.css and has no <link> to it — CSS custom properties referenced inline (var(--ink-soft), var(--blue)) are undefined in this document's own stylesheet scope. Not a copy issue, flagged for awareness only.
Access-control note: token validated against Airtable Purchases table server-side; expired/inactive/not-found all collapse to the same "not valid" UI branch except where `expires_at` specifically triggered "Link Expired" wording.
---
[SECTION 1 · DARK — variant: valid]
  [ALT]         Thee Rainers (header logo)
  [SMALL]       Your Access · Thee Rainers
  [H1]          {record.product_name}
  [SMALL]       Permanent access · {record.email}
  [SMALL]       Your Video / Your Videos (pluralized by count)
  [SMALL]       Your Download / Your Downloads (pluralized by count)
  [BUTTON]      Download Footwork Resource Links → (conditional, per product)
  [BUTTON]      Download Footwork Blueprint → (conditional, per product)
  [BUTTON]      Download 30-Day Boxing Base Playbook → (conditional, per product)
  [BUTTON]      Download Shadowboxing Blueprint → (conditional, per product)
  [SMALL]       Download links expire after 1 hour. Refresh this page to generate a fresh link.
  [BODY]        Questions or issues? Email rainers@theerainers.com with your order email.
[SECTION 1 · DARK — variant: expired]
  [SMALL]       Link Expired
  [H1]          This link has expired.
  [BODY]        Your access link has expired. Enter your purchase email below and we will send a fresh link.
[SECTION 1 · DARK — variant: not found / invalid]
  [SMALL]       Link Not Found
  [H1]          This link is not valid.
  [BODY]        This link was not found or may have already been used. Enter the email you used to purchase and we will resend your access link.
[SECTION 2 · DARK — Resend form, both invalid variants]
  [SMALL]       Resend Access Link
  [PLACEHOLDER] your@email.com
  [BUTTON]      Send My Link → (form submit)
  [SUCCESS]     If that email has a purchase on file, the link is on its way.
  [ERROR]       Something went wrong. Email rainers@theerainers.com directly.
  [BODY]        Purchased but still having issues? Contact rainers@theerainers.com with your order email and we will sort it out.
[SECTION 3 · DARK — Footer (custom, not [SHARED · Footer])]
  [BODY]        "I do not run aimlessly. I do not box as one beating the air."
  [SMALL]       1 Corinthians 9:26–27  (note: en dash, not hyphen — see Appendix C6)

## /404
file: src/pages/404.astro
surface: LIGHT
meta title: Page Not Found | Thee Rainers
meta description: NONE set → falls back to Base default
primary action: ← Back to home → /
action position: UNVERIFIED
co-primary actions: NONE
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT]
  [SMALL]       404
  [H1]          Wrong corner.
  [BODY]        This page doesn't exist.
  [LINK]        ← Back to home → /
  [LINK]        Free Blueprint → → /foundation
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

## /500
file: src/pages/500.astro
surface: LIGHT
meta title: Something went wrong · Thee Rainers
meta description: NONE set (robots noindex, no Fragment description) → falls back to Base default
primary action: ← Back to home → /
action position: UNVERIFIED
co-primary actions: NONE (Report this → is a utility action, not a competing marketing CTA)
voice markers: 0
---
[SHARED · Nav]
[SECTION 1 · LIGHT]
  [SMALL]       500
  [H1]          Something broke.
  [BODY]        An error occurred on our end. Go back home. Let us know if it keeps happening.
  [LINK]        ← Back to home → /
  [BUTTON]      Report this → (JS → POST /api/error-report)
  [SUCCESS]     Reported. We are on it.
[SHARED · Footer]
[SHARED · CookieConsent]
[SHARED · Base entry popup] (markup present, JS-inactive)

---

## SKIPPED

### Bare redirects (5) — no rendered copy, `Astro.redirect()` only
| Route | file | reason |
|---|---|---|
| /arena | src/pages/arena.astro | 301 → /library |
| /lever-audit-quiz | src/pages/lever-audit-quiz.astro | 301 → / |
| /qa | src/pages/qa.astro | 301 → /community |
| /vault | src/pages/vault.astro | 301 → /shop |
| /workshop | src/pages/workshop.astro | 301 → /defense-workshop |

### API routes (14) — server logic, no page markup
src/pages/api/coaching-capture.ts, community-access.ts, community-magic-link.ts, contact.ts, create-checkout.ts, error-report.ts, lead-capture.ts, monthly-report.ts, portal.ts, resend-access.ts, resend-webhook.ts, session-checkin.ts, stripe-webhook.ts, track.ts, unsubscribe.ts.

Note: several of these embed real user-facing copy (transactional emails, error messages) that materially affects the findings below — `lead-capture.ts` and `stripe-webhook.ts` in particular are cited directly in Appendix C because their email copy contradicts live page copy. They are still filed under SKIPPED per the instruction (API routes, not page routes) rather than given full per-string extraction.

---

## APPENDIX A — CROSS-ROUTE STRING INDEX

### Shared component blocks (see "Shared Components" section for full text)
These four blocks render on **33 of 35 routes** — every route except `/links` (uses `LinkPage.astro`, no Base) and `/private-architecture/[token]` (standalone HTML document, no Base):
- `[SHARED · Nav]` — announcement bar + primary nav + mobile menu
- `[SHARED · Footer]` — help block + social icons + legal link row
- `[SHARED · CookieConsent]` — cookie banner
- `[SHARED · Base entry popup]` — markup present on all 33, JS-active only on `/`

### Verbatim strings appearing on 2+ routes (excluding the 4 shared blocks above), machine-verified against the extraction above
| Count | String | Routes |
|---|---|---|
| 10 | `1 Corinthians 9:26` (citation only) | /foundation, /thank-you/contact, /thank-you/defense-workshop, /thank-you/footwork, /thank-you/footwork-blueprint, /thank-you/shadowboxing, /thank-you/workshop, /thank-you/workshop-replay, /watch/workshop-replay, /workshop-replay |
| 7 | `"I do not run aimlessly; I do not box as one beating the air."` (semicolon variant) | /foundation, /thank-you/defense-workshop, /thank-you/footwork, /thank-you/shadowboxing, /thank-you/workshop, /thank-you/workshop-replay, /watch/workshop-replay |
| 6 | `"I do not run aimlessly. I do not box as one beating the air."` (period variant) | /defense-workshop, /private-architecture/[token], /shadowboxing-blueprint, /shop, /thank-you/contact, /thank-you/footwork-blueprint |
| 6 | `Legal` (eyebrow) | all 6 /legal/* pages |
| 5 | `1 Corinthians 9:26-27` (hyphen citation) | /, /defense-workshop, /links, /shadowboxing-blueprint, /shop |
| 5 | `Last updated: 26 May 2026` | /legal/accessibility-statement, /legal/disclaimer, /legal/privacy-policy, /legal/refund-policy, /legal/terms (cookie-policy alone says 30 July 2026) |
| 4 | `Refund Policy → /legal/refund-policy` | Shared Components, /community, /foundation, /workshop-replay |
| 4 | `The Weekly Session` | /, /about, /community, /shop |
| 4 | `your@email.com` (placeholder) | /community/inside, /foundation, /private-architecture/[token], /safe |
| 4 | `Watch while you wait` | /thank-you/defense-workshop, /thank-you/footwork, /thank-you/shadowboxing, /thank-you/workshop-replay |
| 4 | `Also from Thee Rainers` | /thank-you/defense-workshop, /thank-you/footwork, /thank-you/shadowboxing, /thank-you/workshop-replay |
| 4 | `The Weekly Session · live every Tuesday, drill library → → /community` | /thank-you/defense-workshop, /thank-you/footwork, /thank-you/shadowboxing, /thank-you/workshop-replay |
| 4 | `1-on-1 Coaching · application only → → /command` | /thank-you/defense-workshop, /thank-you/footwork, /thank-you/shadowboxing, /thank-you/workshop-replay |
| 3 | `Get the Free Blueprint → /foundation` | /, /command, /shop |
| 3 | `"The structural problem the ___ is designed to solve. From the ground up."` (template, product name varies) | /thank-you/footwork, /thank-you/shadowboxing, /thank-you/workshop-replay |
| 2 | `Get the Blueprint · $9 → checkout:footwork` | /foundation, /shop |
| 2 | `Get the Blueprints → → /shop` + `Start Free → → /foundation` (paired CTA) | /about, /library |
| 2 | `Instagram/TikTok/Facebook/Threads · {stat}K →` (social row) | /about, /links |
| 2 | `← Back to home → /` | /404, /500 |
| 2 | `Checkout unavailable. Email rainers@theerainers.com` (checkout-error variant) | /community (×4 on page) — also structurally identical to `[SHARED · Base checkout error]`'s "Checkout temporarily unavailable..." wording used on every other checkout route, worded slightly differently (see C3 note below) |

Note: the two Bible-quote wording variants (period vs semicolon) and two citation formats (9:26 vs 9:26-27) for what is substantially the same verse are flagged again under Appendix C3 — this table is the evidence; C3 is the finding.

---

## APPENDIX B — VOICE MARKER INDEX

16 `DRAFT: voice pass Rainers` markers exist in source, across 3 files, rendering on 3 routes:

| # | File | Line | String it sits on | Route(s) |
|---|---|---|---|---|
| 1 | src/pages/index.astro | 43 | `Boxing<br/>built on<br/>structure.` (H1) | / |
| 2 | src/pages/index.astro | 48 | `Full offense. Full defense. Minimum unnecessary damage. The foundation most gyms skip.` (body) | / |
| 3 | src/components/blocks/OfferStack.astro | 48 | `Choose where to start.` (H2) | / (via OfferStack, index.astro only) |
| 4 | src/components/blocks/OfferStack.astro | 73 | `{card.title}` — covers all 3 card headings: "The Blueprints.", "Weekly correction, live.", "Built around one fighter." (inside `cards.map()`) | / |
| 5 | src/components/blocks/OfferStack.astro | 82 | `{card.cta}` — covers all 3 card CTAs: "Get the Blueprints", "Claim your spot", "Apply to see if you qualify" (inside `cards.map()`) | / |
| 6 | src/pages/command.astro | 22 | `The whole<br/>framework<br/>is yours.` (H1) | /command |
| 7 | src/pages/command.astro | 27 | `Not a program. A structure built around how you move, when you train, and where the breakdown actually happens.` (body) | /command |
| 8 | src/pages/command.astro | 33 | `See the work, then apply` (link) | /command |
| 9 | src/pages/command.astro | 71 | `Right for you if.` (H2) | /command |
| 10 | src/pages/command.astro | 94 | `Pass on this if.` (H2) | /command |
| 11 | src/pages/command.astro | 140 | `{item.heading}` — covers all 3 "How it works" headings (inside `.map()`) | /command |
| 12 | src/pages/command.astro | 144 | `{item.body}` — covers all 3 "How it works" bodies (inside `.map()`) | /command |
| 13 | src/pages/command.astro | 168 | `What you walk away with.` (H2) | /command |
| 14 | src/pages/command.astro | 194 | `Apply.` (H2) | /command |
| 15 | src/pages/command.astro | 198 | `I read every application myself. If your situation is right for this, we start.` (body) | /command |
| 16 | src/pages/welcome.astro | 92 | `The Weekly Session is every Tuesday at 3pm ET.` (body, marker sits inline on the same line, not on its own comment line) | /welcome |

**G4 check: every row above resolves to a real file and line — confirmed by direct `grep -n` against the current working tree at the time of writing (commands and counts reproduced below).**

### Do these markers appear in rendered HTML, or only in source?

**Answer: YES — they leak into production HTML and are visible to any visitor via "View Source" on all 3 affected routes (`/`, `/command`, `/welcome`).** This was verified by fetching the live production URLs directly, not inferred from source behavior. Evidence:

```
$ curl -sL "https://theerainers.com/" -o /tmp/index2.html
$ grep -c "DRAFT: voice pass Rainers" /tmp/index2.html
4

$ curl -sL "https://theerainers.com/command" -o /tmp/command2.html
$ grep -c "DRAFT: voice pass Rainers" /tmp/command2.html
9

$ curl -sL "https://theerainers.com/welcome" -o /tmp/welcome2.html
$ grep -c "DRAFT: voice pass Rainers" /tmp/welcome2.html
1
```

A secondary observation from this same evidence, reported because it's directly visible in the numbers and G5 requires evidence over inference rather than silence: for markers that sit on a line by themselves outside any `.map()` loop, the rendered count matches the source count 1:1 (`/welcome`: 1 source marker → 1 rendered instance). For the two files where a marker sits inside a `.map()` loop with 3 iterations (OfferStack.astro lines 73/82 on `/`; command.astro lines 140/144 on `/command`), the rendered count is lower than a naive per-iteration count would predict (`/`: 5 source-line markers, 2 of them ×3-iteration → naive expectation 9, actual 4; `/command`: 10 source-line markers, 2 of them ×3-iteration → naive expectation 14, actual 9). I did not chase down the exact mechanism (Astro's compiler vs. a build-time HTML minifier collapsing repeated identical comments) since that's outside this task's read-only-copy scope — the fact reported here is the raw, directly-observed count, not a theory about why it's that count.

---

## APPENDIX C — CONFLICT REPORT (report only, nothing changed)

### C1 — Prices stated in copy vs. the live Stripe price they map to

**No Stripe API access is available in this environment (no credentials, no MCP Stripe tool loaded). Every claim below is a cross-reference between source files, not a live Stripe lookup — flagged explicitly wherever that distinction matters.**

1. **`create-checkout.ts` price-ID format anomaly — highest severity, verify immediately.** The `PRODUCTS` map (src/pages/api/create-checkout.ts:21-64) sets:
   - `footwork.priceId = 'price_1'`
   - `shadowboxing.priceId = 'price_2'`
   - `defense_workshop_early.priceId = 'price_6'`
   - `defense_workshop_standard.priceId = 'price_5'`
   These do not match the shape of a real Stripe price ID (compare, in the same file: `bundle.priceId = 'price_1U1jK2HzlarU775HwLKCIkWC'`, `greatness_monthly.priceId = 'price_1Tbn8WHzlarU775HMfmbxaJy'`). Real Stripe price IDs are long random alphanumeric strings; `price_1` / `price_2` / `price_5` / `price_6` read as placeholders. If they are literal placeholders still in production, every Stripe Checkout Session created for Footwork, Shadowboxing, and both Defense Workshop tiers would fail at Stripe's API level — this is four of the site's highest-traffic checkout buttons. I could not verify this live; it needs a direct check against the Stripe Dashboard, not inference from this audit.

2. **Complete Bundle: three different live/recent prices for the same product.**
   - `/shop` (current source, authoritative for what a visitor sees today): **$24**
   - `TRB_SHARED_CONTEXT.md` (email system doc, dated 2026-07-27, "Canonical prices"): **$47**, mapped to Stripe price `price_1TxVIjHzlarU775HKApDETjT`
   - `src/pages/api/lead-capture.ts:64` — `FUNNEL_MAP`, HTML embedded in the welcome email sent live via Resend on every new lead opt-in: **"$39 →"** linking to `/shop`
   Three different numbers ($24 / $47 / $39) for one product, one of them (the $39 welcome-email figure) actively emailed to real subscribers right now.

3. **Shadowboxing Blueprint: two different prices.** `/shop` and `/shadowboxing-blueprint` (current source): **$19**. `TRB_SHARED_CONTEXT.md` canonical price table: **$29**.

4. **Workshop Replay: sold at $49 in email/legal copy, but no $49 checkout path exists anywhere in the live product catalog.** `TRB_SHARED_CONTEXT.md` lists Workshop Replay at $49 (Stripe price `price_1TxVHyHzlarU775Hcc8YKaUg`). `lead-capture.ts`'s live `FUNNEL_MAP` email shows "Workshop Replay ... $49 →" linking to `/workshop-replay`. But `/workshop-replay.astro`'s own copy says the replay "is now included with every Defense Workshop seat" and every button on that page points to `/defense-workshop` ($39/$49) — and `create-checkout.ts`'s `PRODUCTS` map (the single source of truth for what `data-checkout` buttons can actually purchase) has **no `workshop_replay` key at all**. A visitor who clicks the $49 link in their welcome email lands on a page that no longer sells anything at $49.

5. **Footwork Blueprint: refund policy still describes it as free.** `/legal/refund-policy` section 1: *"The Footwork Blueprint is a free download and is not subject to this clause."* Current live price on `/shop` and `/foundation`: **$9** (the free window, `FOOTWORK_FREE_UNTIL = 2026-08-01`, closed 6 days before this snapshot). `TRB_SHARED_CONTEXT.md` also lists it as "FREE." Anyone who paid $9 and later reads the refund policy is told their purchase doesn't exist as a paid item.

### C2 — Dates stated in copy, cross-checked for consistency and lapsed deadlines

Snapshot date for this audit: **2026-08-07**.

1. `FOOTWORK_FREE_UNTIL = 2026-08-01T23:00:00Z` (shop.astro, foundation.astro) — **already 6 days in the past.** The "Free until August 2. Goes to $9." banner and the free-variant hero copy on `/foundation` are dead code paths today, correctly captured above as unreachable-but-present conditional variants. See C1.5 for the downstream effect on `/legal/refund-policy`.
2. `EARLY_BIRD_UNTIL = 2026-08-08T22:59:00Z` (shop.astro, defense-workshop.astro) — **1 day in the future** from snapshot date, not yet lapsed, but close enough that "Early bird until Aug 8" copy will go stale within 24 hours of this audit.
3. `NEXT_DATE_ISO = 2026-08-29` (data/workshop.ts) — future, drives all "Aug 29" / "August 29" / "Saturday, August 29" references site-wide. No inconsistency found — every route citing the workshop date agrees on Aug 29, 2026.
4. Legal "Last updated" stamps: five pages (`privacy-policy`, `terms`, `refund-policy`, `disclaimer`, `accessibility-statement`) say **26 May 2026**; `cookie-policy` alone says **30 July 2026**. Not itself a defect (routine maintenance stamps), but worth Rainers knowing five of six legal pages have gone 10+ weeks without a "last updated" bump despite `refund-policy` in particular now containing a materially false claim (C1.5).
5. `workshopState()` (data/workshop.ts) currently evaluates to `'waitlist'` (`TICKETS_OPEN = false`, date is future) — yet every route's copy (Nav bar, OfferStack strip, `/shop`, `/defense-workshop`) presents the workshop as "Reserve your seat" / actively for sale with a working checkout button, never as a waitlist signup. This is a state-vs-copy mismatch worth a look even though it isn't strictly a "date" per the letter of C2 — noted here since it's adjacent and load-bearing on the date logic. See also C3.

### C3 — Contradictory claims between routes

1. **Two different support-email domains for the same person, live simultaneously.** `rainers@theerainers.com` is used in: `[SHARED · Base checkout error]` (every checkout button site-wide), `/defense-workshop`, `/workshop-replay`, `/community`, `/safe`, `/private-architecture/[token]`, `/legal/terms`, `/legal/privacy-policy`. `rainers@stepintoring.com` is used in: `/welcome`, `/community/inside`, `/legal/refund-policy` (5 of 5 contact mentions on that page), `/legal/cookie-policy`, `/legal/disclaimer`, `/legal/accessibility-statement`. **The refund policy — the page an upset paying customer is most likely to read — exclusively uses the off-brand `stepintoring.com` address**, while the checkout-failure error banner that would send them there uses `theerainers.com`.
2. **Two different YouTube handles.** `youtube.com/@Rainers` — used in `[SHARED · Footer]` (rendered on 33 of 35 routes) and `/about`. `youtube.com/@theerainers` — used in `/links` and `/streaming` (×2). Same channel, two spellings, no redirect confirmed between them in this audit.
3. **Workshop Replay: bundled-free vs. standalone-purchase, asserted on different routes at the same time.** `/workshop-replay` and `/watch/workshop-replay` (expired state) both present the replay as now included free with a Defense Workshop purchase, no separate sale. `/legal/refund-policy` section 4 and `/thank-you/workshop-replay` both describe/assume a standalone, separately-purchased Workshop Replay product with its own access flow. See C1.4 for the pricing dimension of the same conflict.
4. **Product naming drift: "Footwork Blueprint" vs. "Footwork Foundation."** The canonical, near-universal name is "Footwork Blueprint" (page title, shop card, nav references). `/gate`'s rejection-state link reads *"The Footwork Foundation is free. Start there."* / *"The Footwork Foundation →"*, and `/legal/accessibility-statement` refers to *"the free download forms (Footwork Foundation, Q&A registration)."* Same product, two names, on top of the fact `/gate` also calls it free when it currently costs $9 (C1.5 pattern repeats here).
5. **Bible quote wording and citation drift.** The same verse (1 Corinthians 9:26-27) is rendered with a period in 6 routes (*"...aimlessly. I do not box..."*) and with a semicolon in 7 routes (*"...aimlessly; I do not box..."*) — see Appendix A for the full route lists. Citation format also splits between "1 Corinthians 9:26" (10 routes) and "1 Corinthians 9:26-27" (5 routes) for substantially the same quoted sentence, and `/private-architecture/[token]` uniquely renders it with an en dash (*"9:26–27"*) instead of a hyphen.
6. **A just-registered workshop buyer is shown a link back to the paid sales page for the product they just bought.** `/thank-you/workshop.astro` (orphaned, see below) shows: *"Optional. Watch before August 29 ... Defense Workshop · $39 →"* linking to `/defense-workshop`. Whether or not this page is ever seen live (it currently isn't — see routing note), the copy itself doesn't distinguish "you already own this" from "buy this."
7. **Two structurally different confirmation pages exist for the same footwork-purchase event.** `/thank-you/footwork-blueprint` (the page every real buyer and every free-lead-capture visitor actually lands on) is written entirely as a free-lead-magnet delivery page — *"Thee Rainers · Free Blueprint"*, *"The download link is in your inbox now"* — with no purchase confirmation, no price, no `PurchaseMoment` component. `/thank-you/footwork` is the correctly-built purchase-confirmation page (`PurchaseMoment`, "Purchase Confirmed" title, "Read the four bases..." first-action copy) but is never linked to or redirected to from anywhere in the codebase (verified by grep). A visitor who pays $9 for the Footwork Blueprint currently sees copy telling them it's free.
8. **`/thank-you/bundle` does not exist.** `create-checkout.ts`'s `bundle.successPath = '/thank-you/bundle'` — there is no `src/pages/thank-you/bundle.astro`. Confirmed live: `https://theerainers.com/thank-you/bundle` returns a **301 redirect straight to `/shop`**. A Complete Bundle buyer is returned to the shop page after paying $24, with zero purchase-confirmation copy, zero delivery messaging, nothing distinguishing "you just paid" from "you're browsing." This is the single highest-severity concrete finding in this audit — filed here since it's fundamentally a contradiction between what the checkout config promises (a confirmation page) and what exists (none), even though it doesn't fit neatly under C1/C2 pricing/date language.

### C4 — Primary-action census

**Zero primary action (informational only, no marketing CTA):**
/legal/privacy-policy, /legal/terms, /legal/refund-policy, /legal/cookie-policy, /legal/disclaimer, /legal/accessibility-statement (all 6 legal pages — expected for this page type), /thank-you/footwork, /thank-you/shadowboxing, /thank-you/defense-workshop, /thank-you/workshop-replay (all `PurchaseMoment` instances that pass no `primaryLabel`/`primaryHref`), /thank-you/workshop (orphaned; its one link reads as informational, not a CTA).

**2+ co-primary actions (competing or equal-weight CTAs on one screen):**
- `/about` — "Get the Blueprints →" (/shop) and "Start Free →" (/foundation), side by side, equal visual weight
- `/library` — hero: "Start Free →" (/foundation) and "Reserve Workshop →" (/defense-workshop); closing section repeats the same pattern with "Get the Blueprints →" (/shop) instead of the workshop link
- `/gate` — "I'm building a system." (→ /shop) and "I'm looking to get fit." (→ in-page rejection), by design a fork, but both rendered as equal-weight buttons
- `/community` — "Join Annual" and "Join Monthly" appear as a co-equal pair twice on the page (pricing section + closing CTA)
- `/thank-you/footwork-blueprint` — "See the Community →" (/community) and "Reserve a Seat →" (/defense-workshop), equal-weight cards
- `/thank-you/contact` — "Back to home" and "See the Defense Workshop →", equal-weight buttons
- `/shop` — 4 product cards each with their own CTA; not flagged as a true C4 violation since it's a catalog page by design, noted for completeness only

### C5 — Retired vocabulary

Searched every rendered route's source (`src/pages/**/*.astro`, `src/components/**/*.astro`) for "Checkpoint", "masterclass", "The Calibration".

- **"masterclass" / "Masterclass"** — zero hits.
- **"The Calibration" / "calibration"** — zero hits.
- **"Checkpoint" / "checkpoint"** — two hits, neither is the retired proper-noun feature name:
  - `src/pages/welcome.astro:109` — `<!-- Meet link / checkpoint CTA -->` — an HTML **comment**, not rendered, not user-visible.
  - `src/pages/community/index.astro:320` — `<li>...Full year of checkpoints</li>` — rendered, user-visible, but lowercase generic English usage ("a year's worth of milestones"), not the capitalized "The Checkpoint" feature name TRB_SHARED_CONTEXT.md flags as retired in the Kit email button "JOIN THE CHECKPOINT." Flagged here for Rainers to confirm the distinction is intentional, since the word alone reads close to the retired term.

### C6 — Em dashes, en dashes, exclamation marks in user-visible copy

Filtered to exclude HTML/JS/JSX code comments and non-rendered internal values (e.g. a hidden form `source` field) — those aren't copy a visitor sees. Every remaining hit is real, rendered, user-visible text.

**Em dashes (—):**
| String | Location |
|---|---|
| `placeholder="—"` × 4 (empty-state placeholder character, visible in unfocused fields) | src/pages/command.astro:212, 218, 224, 230 |
| `placeholder="—"` × 4 + one `<option>—</option>` | src/pages/feedback.astro:22, 28, 36, 49, 55 |
| 8 list items using "— " as an inline separator between a bold term and its explanation (e.g. "**Email address and name** — when you submit...") | src/pages/legal/privacy-policy.astro:25, 26, 27, 28, 29, 36, 37, 38 |
| meta description: "...our commitment to WCAG 2.2 AA...— our commitment to..." | src/pages/legal/accessibility-statement.astro:6 |
| 4 instances, same "**Term** — explanation" pattern | src/pages/legal/cookie-policy.astro:46, 63, 66, 77 |
| 2 instances, same pattern | src/pages/legal/disclaimer.astro:19, 42 |

**En dashes (–):**
| String | Location |
|---|---|
| `1 Corinthians 9:26–27` | src/pages/private-architecture/[token].astro:292 |

**Exclamation marks:** zero found in user-visible copy. Every `!` remaining in the source after filtering is a TypeScript non-null-assertion operator (`x!`) or boolean-negation operator (`!x`) in script blocks — code syntax, not punctuation in copy.

---

## GATE REPORT

**G1 — File exists and covers every non-skipped route.**
PASS. 35 route sections present (`grep -c "^## /"` = 35), matching the full enumeration of `src/pages/**/*.astro` minus the 5 bare redirects and 14 API routes listed under SKIPPED. 35 + 5 + 14 = 54 total `.astro`/`.ts` route files under `src/pages/`, all accounted for.

**G2 — `git diff` shows ZERO changes to any `src/` file caused by this task.**
PASS, with a disclosure. `git status --short src/` shows exactly two modified files: `src/pages/api/contact.ts` and `src/pages/api/session-checkin.ts`. Both were already modified and uncommitted at the start of this task (confirmed against the git status captured before any work in this task began) — this task never opened either file with Edit or Write, only Read/Bash(read-only)/grep were used against `src/` throughout. No file under `src/` was touched by this audit. The only files written by this task are `docs/COPY_AUDIT_SOURCE.md` (this file, explicitly in scope) — nothing else.

**G3 — Spot-check 3 random routes against the rendered page.**
PASS. Checked `/shadowboxing-blueprint`, `/legal/refund-policy`, `/library` — 12 extracted strings tested via `curl -sL` + exact-substring grep against live production HTML. 11/12 matched immediately; the 1 apparent miss (`/library`'s "Knowledge archive." H1) was confirmed to be a false negative in the test methodology, not a missing string — the source has `Knowledge<br/>archive.` (a `<br>` splits the two words in the DOM), which the doc correctly represents as `[H1] Knowledge archive.` (the visual/rendered text a reader sees), but a literal-substring grep with a space doesn't match a `<br>`-separated pair. Re-verified with a `<br>`-aware pattern — present. Zero genuine misses.

**G4 — Every marker in Appendix B resolves to a real file and line.**
PASS. All 16 rows re-verified against a fresh `grep -rn "DRAFT: voice pass Rainers" src/` run at time of writing (matches the 16 total found at the start of this task) — file paths and line numbers in Appendix B match exactly.

**G5 — The rendered-HTML question in Appendix B is answered with evidence, not inference.**
PASS. Answered via three direct `curl -sL <production URL> | grep -c "DRAFT: voice pass Rainers"` calls against `https://theerainers.com/`, `/command`, and `/welcome` — the commands and their raw numeric output (4, 9, 1) are reproduced verbatim in Appendix B. No claim in that section is asserted without a command + output pair backing it.

**Known limitation, disclosed rather than papered over:** the `action position` field (approx px from top at 390 width) is marked UNVERIFIED for all 35 routes except where directly measured live in this session. Producing real numbers requires rendering all 35 routes in a browser at 390px and reading actual layout — outside what was done here (this session only rendered `/shop` in a browser, for an unrelated task earlier). Flagging this explicitly rather than inventing plausible-sounding numbers, per the instruction that "a gate you could not verify is written FAILED, never assumed" — this isn't a gate itself, but the same principle: no fabricated data.

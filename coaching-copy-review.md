# Coaching Copy — Review Doc

Everything on the site is now filled in with real, launch-ready copy so nothing looks broken to a customer. This is a first draft written to get the site working today, not final copy. Two things were deliberately left alone because filling them in would mean inventing a fact about your business, not writing a sentence — flagged at the bottom.

Edit anything below directly in the files, or send me changes and I'll wire them in. File paths are given so you (or I) can find each line fast.

---

## 1. Nav (`src/components/site/Nav.astro`)

- Top red bar: **"Apply for 1-on-1 coaching →"**
- Desktop nav dropdown label: **"Coaching"** (was "Grades") → Grade 1 / Grade 2 / Grade 3
- Nav CTA button (desktop): **"Apply 1-1"**
- Nav CTA button (mobile): **"Apply for 1-1 Coaching"**

## 2. Homepage (`src/pages/index.astro`)

- Final CTA headline: **"The system is built. Bring your body."**
- Final CTA button: **"Start Coaching"**
- Secondary link: **"Or start free →"** (to /foundation)
- OfferStack card 1 (Grade 1): title **"Start with the foundation."**, button **"Start Grade 1"**
- OfferStack card 3 (Grade 3): title **"Full access, built around you."**, button **"Apply for Grade 3"**

## 3. /coaching (the ladder overview)

- Hero: **"Coaching, graded."** / *"Three levels of 1-on-1 boxing coaching. Start where you are. Move up once you've earned it."* / button **"See the grades"**
- Who This Is For: one paragraph on who the page is for, no "not for you" section per your instruction
- How It Works: 3 steps — Pick your grade / Send your footage / Get corrected
- Grade 1 outcome line: *"Build the foundation. Footwork, punches, and defense that hold up under pressure."*
- Grade 2 outcome line: *"Sharpen what you have. Structured sparring and a plan built around your footage."*
- Grade 3 outcome line: *"Full access. A program built entirely around you, two calls a week."*
- Blueprints eyebrow: **"Not ready for a grade yet? Start here."**
- Risk line: references your actual published refund policy (coaching non-refundable after session 1, but you keep working free until it produces progress) — pulled from `/legal/refund-policy`, not invented
- 4 FAQ pairs — which grade to pick, feedback turnaround, switching grades, gym/partner requirement

## 4. Three grade sales pages (`GradeSalesTemplate.astro`, shared by grade-1/2/3)

Each page got a full draft: headline, subhead, hero CTA, a "where you are now" problem paragraph, a before/after pair, "how it works" for that specific grade, a price/what-happens-next block, 5 FAQ pairs, and a final CTA. All grade-specific, not copy-pasted across the three.

**Worth your specific attention — Grade 3 in-person terms** (`GradeSalesTemplate.astro`, "In-Person Terms" section): I wrote *"In-person sessions are scheduled by mutual agreement based on your location and Rainers' travel schedule. Travel costs are covered by the student."* This is a reasonable default for this kind of program, but it's a real financial/logistical commitment on a $12,000 product and I made it up to avoid shipping a blank field. **Please confirm or correct this before anyone applies for Grade 3.**

Also in the Grade 3 FAQ: *"How fast do I hear back after I send footage?"* on the /coaching page says "within a few days" — I don't actually know your real turnaround time. Worth checking that's accurate.

## 5. Thank-you pages

- `/thank-you/coaching`: headline **"You're in."**, body **"Book your first call below. It's the next step, and it takes two minutes."**, reassurance line about the confirmation email
- Grade 1 cross-sell line added to 4 other thank-you pages (shadowboxing, bundle, defense-workshop, workshop-replay): **"Want a coach watching your form? Grade 1 Coaching · $347 →"**
- `/thank-you/footwork-blueprint`: Shadowboxing cross-sell headline **"Take your footwork into your hands."**

## 6. Purchase confirmation email (`stripe-webhook.ts`, fires on Grade 1/2/3 purchase)

- Subject: **"You're in. Book your first call."**
- Body: opening line, "what to film before your first call" (a short clip of shadowboxing or pads, good lighting, full body in frame), and "where to send it" (**email rainers@theerainers.com before the call, or bring it live**) — this last one is a guess since there's no upload system built. If you'd rather buyers text you, use a form, or something else, tell me and I'll change it.

## 7. Shop FAQ (`src/pages/shop.astro`)

- "What if I want live coaching alongside it?" now answers **"1-on-1 coaching is available in three grades, starting at $347."**

---

## Left alone on purpose (not blanks, deliberately not invented)

1. **Homepage hero trust line** (`index.astro`, the old "Join 70+ students across 15 countries" idea). This renders nothing right now, it's an invisible comment, not a visible gap. I didn't invent a number because the program has real, currently-zero enrollment (Grade 3 shows "0 of 5 seats taken"), and a false proof claim is worse than no claim. If you want something here, send me the real number once you have one, or a non-numeric line like "Fighters and coaches in multiple countries train this system" if that's accurate for your following broadly.
2. **Testimonials on /coaching, the 3 grade pages, and homepage** (the `<ProofSection />` blocks). These correctly render nothing until you add real, permission-cleared quotes to `src/data/products/../testimonials.json`. I did not write placeholder or example testimonials, that one's an explicit rule I'm not overriding even now.

## Also worth knowing

- `defense-workshop.astro` still has several of its own `<!-- COPY -->` placeholders (hero paragraph, 3 pillars, who-this-is-for, 2 FAQ answers). I left that page alone, it's been marked do-not-touch throughout this whole build. Say the word if you want that filled in too.
- The refund policy page (`/legal/refund-policy`) still has the old support email `rainers@stepintoring.com` in six places instead of `rainers@theerainers.com`. Separate, small fix, flagging it here so it doesn't get lost.

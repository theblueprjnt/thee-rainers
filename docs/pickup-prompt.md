# Pickup Prompt — Thee Rainers Build Continuation

Paste this into a fresh Claude Code (Ghostty) session to pick up where the last session ended. It is written in positive form so the work feels like an invitation, not a constraint.

---

I am Rainers. I am building theerainers.com — a boxing system brand. The site is live, taking real payments, and we are now in the middle-funnel build phase. The repo is at `/Users/ghoste/thee-rainers`. Quality over speed. Attention to detail, UX, copy nuance — that is the standard.

## Step 1 — load the context

Read these in order before writing any code:

1. `/Users/ghoste/.claude/projects/-Users-ghoste/memory/MEMORY.md` — index
2. `/Users/ghoste/.claude/projects/-Users-ghoste/memory/trb_build_progress.md` — what is shipped, what is open, key commits
3. `/Users/ghoste/.claude/projects/-Users-ghoste/memory/trb_website_purpose.md` — the site is conversions and leads; free value lives on socials
4. `/Users/ghoste/Downloads/TRB_ICP_v2.md` — the current ICP (craft-lover, global, every income)
5. `/Users/ghoste/thee-rainers/CLAUDE.md` — project-level project rules
6. `/Users/ghoste/thee-rainers/docs/voice/` — six voice guides for website, emails, social, informal (DMs), communication principles
7. `/Users/ghoste/thee-rainers/.claude/skills/trb-voice/SKILL.md` and `.claude/skills/trb-design/SKILL.md` — hard rules
8. `/Users/ghoste/thee-rainers/BUILD_NOTES.md` — manual steps that live outside the codebase

## Step 2 — current state

The site is live and the bottom of the funnel works: workshop sells, blueprint capture works, replay sells, community has a real sales page with purple checkout, streaming page is live with a JSON toggle for going on-air. Voice guides have been drafted. Visual design language is consistent across pages.

The leak is the middle of the funnel — 500K social at the top, working checkout at the bottom, almost nothing in between. The next phase is filling that middle.

## Step 3 — the build queue, ordered by leverage

Pick one. Finish it. Push. Move to the next.

### Plumbing (already shipped, needs to be lit up)

- **Wire phone notifications for every lead and every sale.** `/api/lead-capture` and `/api/stripe-webhook` both already POST to Make.com webhooks. The Make.com scenarios that send the SMS/push to the phone are the missing piece. Build the scenario in Make.com: filter on event type, route to a Pushbullet / Pushover / Twilio SMS / Telegram bot push. The webhook payloads are documented in BUILD_NOTES.md.
- **Light up Stripe success URLs in the dashboard.** Workshop Replay payment link (`6oUaEX7hp6Xk3LIdww6J20p`) and Shadowboxing Blueprint payment link (`5kQdR91X5dlIeqm8cc6J20l`) both need their success URL set to `/thank-you/workshop-replay` and `/thank-you/shadowboxing` respectively. Two minutes in the Stripe dashboard.
- **Light up the Make.com delivery scenario.** `MAKE_DELIVERY_WEBHOOK_URL` is set and the webhook fires from `/api/stripe-webhook` with `expiring_url` payload. The scenario that catches it and emails the buyer is what completes the loop. Build it once and it covers Footwork, Shadowboxing, Bundle, and Workshop Replay.
- **Switch the Airtable Leads source field to "Single line text"** so the upserts stop silently dropping.

### Backend reality for the community

Currently the community sales page is framed as "Founding Members" because the delivery infrastructure is in motion. Lock these in so the founding-member promise pays off:

- Schedule the first weekly workshop in Zoom or whichever platform you prefer. The next-workshop date lives in `src/data/proving-ground.ts` — update it and rebuild.
- Decide the community-chat home (Circle, Skool, Discord, WhatsApp, Telegram). Set the env var `COMMUNITY_CHAT_INVITE` in Cloudflare Pages. The `/welcome` page reads it and shows the join button to new members automatically.
- Start the drill library. The first Loom on ring positioning is the first brick. The library page can be a simple gated index that grows over time — let me know when you have three or four recordings and I will scaffold the page.

### Middle-funnel build (the strategic gap)

This is the new frontier. Each of these is a separate experiment:

- A diagnostic lead magnet that earns its way to a follow-up DM. The Lever Audit already exists; the conversation that follows the audit does not. Build a flow: after results land, an automation drops a personal DM-style message in their inbox from your account that opens a real exchange.
- A short founding-cohort email letter that warms a new lead over the first two or three touches before any pitch. Not a nurture sequence — three specific letters that diagnose, demonstrate, and invite. You write the letters; I help you place them.
- A "qualification card" on /community or /workshop that lets a higher-intent visitor leave a sentence about where their training is breaking down. That goes to your phone as a lead with context, not a name and email.
- A weekly Loom or short video pinned to /links, refreshed every Friday, that gives the followers who clicked through one piece of value and one specific next move.

### Site polish remaining

- Audit `/lever-audit` landing page if it exists distinct from the quiz — voice and design pass.
- Fill the voice guide `[RAINERS]` markers in `/docs/voice/*.md` — three to five real DMs, captions, emails per file becomes the example bank.
- Review the `// NEEDS RAINERS` copy markers on `/community` (hero, subhead, founding line, who-this-is-for) and `/workshop` (who-this-is-for panel) and lock in your voice.
- Decide whether to phase out "Proving Ground" as the system name. Surface copy already says "workshop." The data constant and a few backend pages still say "Proving Ground." Either commit to one name across the system or keep "Proving Ground" as the internal name and "workshop" as the public name.

## Step 4 — the working agreement

The voice is owner-grade, calm, physical, period-ended. Short declarative sentences. We diagnose before we offer. We name the trap better than the reader can. We use the locked names exactly: Workshop, Blueprint, Private Architecture, Greatness Community, Foot Space Work. We use middle dots, commas, periods. We earn before we ask. We keep "just," "actually," "honestly" because those words break the machine rhythm.

Colour does the work: Instagram gradient marks the live workshop. Blue carries one-time purchases and lead capture. Purple carries membership and Private Architecture.

The site is a conversion and lead surface. Free value lives on YouTube, Instagram, TikTok. The website's job is to capture intent and convert it.

The middle of the funnel is the open frontier. Every move I take should ask "does this give a high-intent visitor one more meaningful touch with the work before they have to buy?"

## Step 5 — first move on this session

Pick one item from the Plumbing list first. The phone notification or the Stripe success URLs will land in under thirty minutes and immediately compound everything else we ship. Once the plumbing is lit, the middle-funnel experiments can start running on real signal.

Tell me which one you want to start with, and we go.

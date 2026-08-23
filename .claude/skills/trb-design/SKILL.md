---
name: trb-design
description: Thee Rainers design tokens, spacing, and restraint rules. Load before any visual or layout work.
metadata:
  type: skill
---

# TRB Design Rules — Locked

## Site is light mode, sitewide (2026-08-23)
Rainers converted the entire site from dark to light. Dark section backgrounds (`bg-[#0A0A0A]` / `bg-[#0B0B0C]`) are no longer the default anywhere — use white (`bg-white`) or the warm cream (`--warm` #F7F5F2) instead, with dark text. There is no remaining deliberate dark exception (Scripture blocks, previously the one named exception, were removed from the site entirely on the same date — see below).

## Color tokens — corrected against the live codebase (2026-08-23)
This file previously named `--accent` #0057FF as the CTA color. That token does not exist in `src/styles/global.css` and was never the real CTA color — the actual, verified tokens are:
- `--terra` / `--red` #E11D2A — the real primary CTA fill, eyebrow/kicker text, divider lines. Matches CLAUDE.md's brand law exactly.
- `--navy` / `--blue` #2348C6 — secondary accent, entry-tier labels and inline links only. Never a fill CTA.
- `--ink` #0B0B0C — primary text color (not a background default anymore, see above).
- `--white` #FFFFFF and `--warm` #F7F5F2 — primary backgrounds everywhere.
- Purple #6A0DAD — permitted ONLY on /community routes as a deliberate sub-brand. Nowhere else on the site.
- Kill the gradient on "ENGINEERED." Solid white. The photo carries the energy.

## Button rules
- Shape: `rounded-none` everywhere. No pill or rounded buttons.
- One-time purchase CTAs: red/terra (#E11D2A) filled.
- Community/subscription CTAs: purple (#6A0DAD) filled — /community pages only.
- Free/lead capture CTAs: red/terra (#E11D2A) outline or filled.
- No four-accent drift. If in doubt, use red/terra.

## Mobile spacing scale
- Target device: 390x844 (iPhone class).
- Defined scale (px): 4 / 8 / 16 / 24 / 40 / 64. No arbitrary values.
- Reduce mobile section padding 30-40% vs desktop.
- Goal: zero empty viewport-height gaps between content blocks at 390x844.
- Notably over-padded: Why Me section, Bonuses section.

## Contrast and accessibility
- Body text: 4.5:1 contrast ratio minimum (WCAG AA).
- Large display text: 3:1 minimum.
- Gold #D4A373 kicker text on white background: check and darken if failing.
- Footer/legal microcopy: minimum 12px (text-xs) at /55 opacity for AA. Never text-[10px] at low opacity.

## Layout pattern
- 60/40 asymmetric grid for all hero sections. Left 60% = text/form. Right 40% = image/video.

## Scripture block rule — removed 2026-08-23
Rainers removed all Scripture verse sections from the public site (they stay internal to him for now). Do not add a Scripture block to any new page. If you find one during other work, that's leftover from before this date — flag it, don't assume it's intentional.

## Verification loop (required for every change)
1. Implement change.
2. Run dev server.
3. Take Chrome DevTools MCP screenshot at 390x844.
4. Compare against acceptance list.
5. Fix if needed.
6. Re-screenshot before marking done.

Do not mark a visual task done from code review alone.

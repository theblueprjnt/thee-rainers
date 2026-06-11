---
name: trb-design
description: Thee Rainers design tokens, spacing, and restraint rules. Load before any visual or layout work.
metadata:
  type: skill
---

# TRB Design Rules — Locked

## Color tokens
- `--accent` #0057FF — single CTA and link color, sitewide. One-time purchase buttons, lead capture buttons, standard links.
- `--metal` #D4A373 — kickers and horizontal rules ONLY. Never a CTA color.
- `--ink` #0A0A0A or #141414 range — primary text, dark section backgrounds.
- `--white` #FFFFFF — primary background everywhere else.
- Purple #6A0DAD — permitted ONLY on /community routes as a deliberate sub-brand. Nowhere else on the site.
- Kill the gradient on "ENGINEERED." Solid white. The photo carries the energy.

## Button rules
- Shape: `rounded-none` everywhere. No pill or rounded buttons.
- One-time purchase CTAs: blue (#0057FF) filled.
- Community/subscription CTAs: purple (#6A0DAD) filled — /community pages only.
- Free/lead capture CTAs: blue (#0057FF) outline or filled.
- No four-accent drift. If in doubt, use blue.

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

## Scripture block rule
- Always after the final CTA, as a coda. One verse sitewide, attributed.
- Never move it next to a price, timer, or discount mechanic.
- Section stays dark (bg-[#0A0A0A]) for gravitas.

## Verification loop (required for every change)
1. Implement change.
2. Run dev server.
3. Take Chrome DevTools MCP screenshot at 390x844.
4. Compare against acceptance list.
5. Fix if needed.
6. Re-screenshot before marking done.

Do not mark a visual task done from code review alone.

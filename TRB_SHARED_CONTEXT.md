# TRB Email System — Shared Context

Last updated: 2026-07-27

## What was done

Full rebuild of all 15 Kit sequence emails for Thee Rainers. All emails updated via Kit MCP API (update_sequence_email, published: true). HTML design system applied uniformly across all 4 sequences.

## Sequences

| Seq | ID | Name | Emails | Trigger |
|---|---|---|---|---|
| S1 | 2814253 | Lead Nurture: Footwork | 4 (+ 1 draft) | Footwork Blueprint download |
| S2 | (see Kit) | Bundle Buyer Nurture | 5 | Blueprint Bundle purchase |
| S3 | (see Kit) | Workshop Replay Buyer | 3 | Workshop Replay purchase |
| S4 | 2813705 | Greatness Community Welcome | 3 | Community subscription |
| — | 2822600 | Community Session Reminder | 1 | Recurring / Monday |

## Email design system

### Outer wrapper
- XHTML 1.0 Transitional, table-based layout
- Max-width 600px, background #f4f4f4, email panel #ffffff
- Padding: 32px 40px on sides

### Body text
`font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:1.75; color:#111111; margin:0 0 18px 0;`

### Logo
- Header: 88px width, centered, linked to theerainers.com
- Sign-off: 64px width, left-aligned
- Source: https://theerainers.com/images/trb-logo-nobg.png (1080x1350 original)

### Buttons
- Red (#E11D2A): Workshop Replay, Footwork Blueprint CTA
- Purple (#7C3AED): Community / Greatness Community CTAs
- All buttons: bulletproof VML + standard HTML, border-radius 2px, 13px 700 weight, letter-spacing 0.1em, uppercase, padding 16px 32px

### Footer blocks
- S1/S2/S3: shelf (Workshop Replay $49, Blueprint Bundle $47, Shadowboxing Blueprint $29, 1-on-1 Coaching Apply)
- S4: memberfooter only (Member Area + Join The Weekly Session)
- All: socials (Instagram, TikTok, YouTube, Facebook, Threads) + Unsubscribe

## Canonical prices (as of 2026-07-27)

| Product | Price | Note |
|---|---|---|
| Workshop Replay | $49 | price_1TxVHyHzlarU775Hcc8YKaUg |
| Blueprint Bundle | $24 | price_1TxVIjHzlarU775HKApDETjT |
| Shadowboxing Blueprint | $29 | price_1TxVKCHzlarU775HOqg5tXQH |
| Footwork Blueprint | FREE | — |
| Greatness Community | $39/mo | — |

## Kit snippets

| Name | ID | Key | Type |
|---|---|---|---|
| TRB Offer Shelf | 140774 | trb-offer-shelf | block |
| TRB Social Links | 140775 | trb-social-links | block |

Usage in Kit email HTML: `{{ snippet.trb-offer-shelf }}` / `{{ snippet.trb-social-links }}`

## Draft email

S1 position 4 — email ID 10127525, subject "[DRAFT] community", delay 3 days, published: false.
Review and publish at: https://app.kit.com/sequences/2814253

## S4 E3 send_days

Email ID 10031155 locked to `["monday"]` so "session is tomorrow" lands Monday and session fires Tuesday 3pm ET.
If session day changes, update send_days on this email via Kit.

## Partials directory

`/Users/ghoste/Rainers/site/email-partials/`
- header.html
- button-red.html
- button-purple.html
- signoff.html
- socials.html
- shelf.html
- memberfooter.html

## Preview directory

`/Users/ghoste/Rainers/site/email-preview/` — 15 HTML previews with browser shell + index.html
`/Users/ghoste/Rainers/site/kit-paste/` — 15 HTML files ready to paste into Kit

## Flags for Rainers (open items)

1. S2 E2 "Stop before your form breaks!" — exclamation mark in copy, brand rules ban it. Rainers decides.
2. S4 E3 button "JOIN THE CHECKPOINT" — "Checkpoint" retired. Shipped verbatim. Update if needed.
3. "Greatness Community" used in S2 E5, S3 E2, S3 E3 — update if name has changed.
4. Community Session Reminder (seq 2822600, email 10064213) — verify send_days is set to Monday in Kit.
5. S1 E3 Loom URL — verify video still live: loom.com/share/5dcc29c1138645858c2a100cb2fd1350
6. /shop URL used in shelf for Bundle and Shadowboxing — update to specific product page URLs if they exist.
7. S3 E2 — button added where original had none. Remove if unwanted.
8. S2 shelf shows products the buyer already owns — consider stripping shelf from S2 or replacing with coaching-only row.
9. S4 has no retention emails after week 1. Long-term member nurture sequence is absent.

## Subject line changes made

| Email | Old subject | New subject |
|---|---|---|
| S1 E2 | the session is recorded | The importance of film study |
| S2 E3 | The one thing a PDF can't do | The thing a PDF can't do |
| S2 E4 | Where it usually breaks | Where KOs happen |

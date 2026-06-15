# Build Notes — Manual Steps Checklist

Steps that cannot be done by code. Do these before going live or after any deploy.

---

## Make.com scenarios

### Delivery scenario (MAKE_DELIVERY_WEBHOOK_URL)
**Status: webhook URL set. Scenario must be built.**

Trigger: Webhook
Payload: `{ email, product_id, product_slug, token, expiring_url, expiring_url_2 }`

Steps:
1. Create scenario in Make.com: Webhook module → receive payload
2. Add a Router with branches per `product_slug`:
   - `footwork` / `shadowboxing` / `bundle`: Send email with `expiring_url` download link. Bundle: also include `expiring_url_2` when non-null.
   - `workshop-replay`: Send email with `expiring_url` (the `/watch/workshop-replay?sig=...` link). 7-day window — say so in the email.
   - `greatness`: Send welcome email with `expiring_url` (community inside link).
3. Email sender: use rainers@theerainers.com with SPF/DKIM/DMARC aligned (see DNS section below).
4. Test each branch with a manual webhook call before launch.

**If this is not built, every buyer gets nothing after paying.**

### Lead capture scenario (MAKE_LEAD_WEBHOOK_URL)
**Status: webhook URL set. Scenario must be built.**

Trigger: Webhook
Payload: `{ email, full_name, phone, source }`

Source values in production:
- `footwork-free` — footwork foundation free opt-in (default)
- `popup-footwork-blueprint` — homepage popup
- `quiz-footwork` / `quiz-speed` / `quiz-power` / `quiz-ring-iq` — quiz completions
- `lever-audit` — lever audit page
- `qa-registration` — monthly Q&A registration

Steps:
1. Create scenario: Webhook → email welcome with PDF link (footwork-foundation.pdf in R2)
2. Optional: Airtable upsert for free leads (separate from paid Customers table)
3. No nurture sequences. Delivery only. Sequences reviewed and placed by hand.

### Phone notification (optional but recommended)
For any `checkout.session.completed` event that hits Stripe, you can wire a separate
Make.com scenario to push a phone notification:

1. Create a second scenario or add a branch to the delivery scenario.
2. Use Make.com's iOS/Android push module or a Telegram/SMS module.
3. Payload to display: `product_slug`, `email` (masked), timestamp.
4. Gate on `product_slug !== 'unknown'` to avoid noise from unknown products.

---

## DNS — SPF / DKIM / DMARC

Required before email delivery goes live. Check with your domain registrar (the domain where theerainers.com DNS is managed).

**SPF** — authorises Make.com or your email provider to send from theerainers.com:
```
TXT  @  v=spf1 include:<make-or-smtp-provider> ~all
```
Replace `<make-or-smtp-provider>` with the SPF include your email service provides.
Common values: `include:sendgrid.net`, `include:amazonses.com`, `include:_spf.google.com`.

**DKIM** — signing key. Your email provider generates this. Add the CNAME or TXT record they specify.

**DMARC** — policy record:
```
TXT  _dmarc  v=DMARC1; p=quarantine; rua=mailto:rainers@theerainers.com; adkim=r; aspf=r;
```
Start with `p=none` while verifying, then move to `p=quarantine`, then `p=reject`.

---

## Google Postmaster Tools

Register theerainers.com at postmaster.google.com.
Add the TXT verification record to DNS.
Monitor domain reputation and spam rate once email volume starts.
Target: spam rate under 0.10%.

---

## Stripe Dashboard — success URLs

The workshop-replay product must redirect to `/thank-you/workshop-replay` after payment.
Check in Stripe Dashboard: Products → Workshop Replay → Payment Link → After payment → set to `https://theerainers.com/thank-you/workshop-replay`.
**If this is wrong, the buyer lands on a generic Stripe confirmation page instead of the branded moment.**

---

## Airtable — field types

- `source` field in Leads table: must be **Single line text**, not Single Select.
  If it reverts to Single Select, all free opt-in leads will silently 404 on write.
- `Status` field in Members table: must be **Single line text** or a Single Select
  whose options include: `active`, `canceled`, `past_due`, `trialing`, `unpaid`.

---

## Kit — tag IDs

Tags already set (verified 2026-06-14):
- `footwork`: `19807643`
- `shadowboxing`: `19807641`
- `bundle`: `19807644`
- `greatness`: `19830354`
- `KIT_MEMBER_TAG`: `19807647`
- `KIT_TRIAL_TAG_ID`: `20130499` — community trial for Blueprint buyers
- `KIT_LEAD_TAG_ID` (env var): `20371838` — free opt-in leads

If any tag is deleted or recreated in Kit, update the ID in `stripe-webhook.ts`
(PRODUCT_TAGS / KIT_MEMBER_TAG) and the Cloudflare `KIT_LEAD_TAG_ID` env var.

---

## Lever audit PDF

`/public/pdfs/lever-audit.pdf` is a placeholder.

To generate the real one:
1. Open `/public/lever-audit-print.html` in Chrome
2. File → Print → Destination: Save as PDF
3. Save to `/public/pdfs/lever-audit.pdf`
4. Commit and push

---

## Environment variables — verify after any rotation

| Var | Where set | Used by |
|---|---|---|
| `STRIPE_SECRET_KEY` | Cloudflare Pages | create-checkout, stripe-webhook |
| `STRIPE_WEBHOOK_SECRET` | Cloudflare Pages | stripe-webhook |
| `WATCH_TOKEN_SECRET` | Cloudflare Pages | stripe-webhook (URL signing), watch page (validation) |
| `R2_ACCOUNT_ID` | Cloudflare Pages | stripe-webhook |
| `R2_ACCESS_KEY_ID` | Cloudflare Pages | stripe-webhook |
| `R2_SECRET_ACCESS_KEY` | Cloudflare Pages | stripe-webhook |
| `R2_BUCKET_NAME` | Cloudflare Pages | stripe-webhook |
| `MAKE_DELIVERY_WEBHOOK_URL` | Cloudflare Pages | stripe-webhook |
| `MAKE_LEAD_WEBHOOK_URL` | Cloudflare Pages | lead-capture |
| `MAKE_CONTACT_WEBHOOK_URL` | Cloudflare Pages | contact, feedback |
| `KIT_API_KEY` | Cloudflare Pages | lead-capture, stripe-webhook |
| `KIT_LEAD_TAG_ID` | Cloudflare Pages | lead-capture |
| `AIRTABLE_API_KEY` | Cloudflare Pages | lead-capture, stripe-webhook |
| `AIRTABLE_BASE_ID` | Cloudflare Pages | lead-capture, stripe-webhook |
| `AIRTABLE_TABLE` | Cloudflare Pages | stripe-webhook (Members table) |
| `AIRTABLE_LEADS_TABLE` | Cloudflare Pages | lead-capture (Leads table, default: "Leads") |
| `GA4_MEASUREMENT_ID` | Cloudflare Pages | stripe-webhook |
| `GA4_API_SECRET` | Cloudflare Pages | stripe-webhook |
| `SITE_URL` | Cloudflare Pages | lead-capture (CORS), stripe-webhook (watch URLs) |

All APIs return 200 with graceful degradation when vars are missing — except
`STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY` (returns 500) and invalid Stripe
signatures (returns 400). Silent skips are logged as `console.warn` or `console.error`
and visible in Cloudflare Pages → Functions → Logs.

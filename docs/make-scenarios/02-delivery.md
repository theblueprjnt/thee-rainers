# Make.com Scenario 2 — Product Delivery Email + Phone Alert

Trigger: `MAKE_DELIVERY_WEBHOOK_URL`
Purpose: Buyer pays → they get the product within seconds + you get a phone ping.

Status: This scenario was built and active as of May 2026. Verify it is still toggled ON.
If it needs to be rebuilt, follow these steps.

---

## What fires this

`/api/stripe-webhook` POSTs this payload after every successful Stripe purchase:

```json
{
  "email": "buyer@email.com",
  "product_id": "prod_XXX",
  "product_slug": "footwork | shadowboxing | bundle | workshop-replay | greatness",
  "token": "64-char hex string",
  "expiring_url": "7-day download or watch URL",
  "expiring_url_2": "second PDF URL for bundle only (null for all others)"
}
```

---

## Verify it is running (30 seconds)

1. Go to Make.com → your delivery scenario
2. Confirm toggle is ON (green)
3. Check Scenario History — confirm the last execution was successful, not errored
4. If errored: open the last run, find the red module, fix the connection or mapping

---

## Rebuild from scratch (if needed)

### Step 1 — Webhook trigger
1. Create New Scenario
2. Add module: **Webhooks > Custom webhook** → name it `TRB Product Delivery`
3. Copy the URL → set as `MAKE_DELIVERY_WEBHOOK_URL` in Cloudflare Pages env vars
4. Send a test payload (see test curl below)

### Step 2 — Router by product_slug

Add **Flow Control > Router** with these routes:

| Route | Filter |
|---|---|
| Footwork Blueprint | `product_slug` equals `footwork` |
| Shadowboxing Blueprint | `product_slug` equals `shadowboxing` |
| Bundle | `product_slug` equals `bundle` |
| Workshop Replay | `product_slug` equals `workshop-replay` |
| Greatness Community | `product_slug` equals `greatness` |
| Fallback | (no filter) |

### Step 3 — Email per route

**Footwork Blueprint:**
```
Subject: Your Footwork Blueprint — download link inside
Body:
---
Your Blueprint is ready.

Download here (link valid 7 days):
{{expiring_url}}

Open it today. Run the first drill today.

Rainers
---
```

**Shadowboxing Blueprint:**
```
Subject: Your Shadowboxing Blueprint — download link inside
Body:
---
Your Blueprint is ready.

Download here (link valid 7 days):
{{expiring_url}}

Rainers
---
```

**Bundle:**
```
Subject: Your Blueprints — both download links inside
Body:
---
Both Blueprints are ready.

Footwork Blueprint (link valid 7 days):
{{expiring_url}}

Shadowboxing Blueprint (link valid 7 days):
{{expiring_url_2}}

Start with Footwork. Work through it before opening the second one.

Rainers
---
```

**Workshop Replay:**
```
Subject: Your Workshop Replay — watch link inside (7 days)
Body:
---
Your replay is ready.

Watch here (link valid 7 days):
{{expiring_url}}

After 7 days the link expires. Watch it before then.
Reply to this email if you need it resent.

Rainers
---
```

**Greatness Community:**
```
Subject: You are in — Greatness Community
Body:
---
Welcome.

Your community access link:
{{expiring_url}}

The next Proving Ground session details are inside.

Rainers
---
```

**Fallback (unknown product):**
```
Subject: Your purchase from Thee Rainers
Body:
---
Your purchase came through.

Access link:
{{expiring_url}}

Reply to this email if something is missing.

Rainers
---
```

### Step 4 — Phone alert (add BEFORE the router, fires on every purchase)

**Telegram:**
```
NEW SALE
Product: {{product_slug}}
Email: {{email}}
```

**Pushover:**
```
title: New TRB Sale
message: {{product_slug}} — {{email}}
```

Setup instructions in `01-lead-capture.md` Step 4.

### Step 5 — Activate
Toggle ON. Set to run **immediately**.

---

## Test curl (run in terminal to fire a test payload)

Replace `YOUR_WEBHOOK_URL` with the URL from Make.com:

```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@theerainers.com",
    "product_id": "prod_test",
    "product_slug": "footwork",
    "token": "abc123",
    "expiring_url": "https://theerainers.com/pdfs/footwork-foundation.pdf",
    "expiring_url_2": null
  }'
```

Confirm: email arrives at test@theerainers.com, phone pings.

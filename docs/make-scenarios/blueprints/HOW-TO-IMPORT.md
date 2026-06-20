# How to Import These Blueprints into Make.com

Two files. Each takes about 3 minutes to activate.

---

## 1. trb-delivery-blueprint.json
**What it does:** Receives product purchase events from the server → routes by product → sends delivery email with download/watch link.

### Import steps
1. Go to make.com → Scenarios → Create new scenario
2. Click the three-dot menu (top right) → Import Blueprint
3. Upload `trb-delivery-blueprint.json`
4. Make.com will prompt you to set up a webhook — click **Create a webhook** → name it "TRB Delivery" → copy the URL
5. **Paste that webhook URL into Cloudflare Pages env var: `MAKE_DELIVERY_WEBHOOK_URL`**
6. Make.com will then ask you to connect Gmail — click **Connect** → sign in with rainers@theerainers.com → allow access
7. Click **Save** → turn the scenario **ON**

### Test it
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rainers@theerainers.com",
    "product_slug": "workshop-replay",
    "expiring_url": "https://theerainers.com/watch/workshop-replay?sig=test&exp=9999999999"
  }'
```
You should receive an email at rainers@theerainers.com within 30 seconds.

Test each slug: `footwork`, `shadowboxing`, `bundle` (add `expiring_url_2` for bundle), `workshop-replay`.

---

## 2. trb-lead-capture-blueprint.json
**What it does:** Receives free form signups → routes by source → sends welcome email with PDF link or confirmation.

### Import steps
1. Go to make.com → Scenarios → Create new scenario
2. Click the three-dot menu → Import Blueprint
3. Upload `trb-lead-capture-blueprint.json`
4. Create a webhook → name it "TRB Lead Capture" → copy the URL
5. **Check if `MAKE_LEAD_WEBHOOK_URL` in Cloudflare already matches the "Integration Webhooks Email" scenario webhook URL.** If the existing scenario already works, you may not need this blueprint — just verify the existing one is sending emails.
6. Connect Gmail (same rainers@theerainers.com account)
7. Save → turn ON

### Test it
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rainers@theerainers.com",
    "source": "footwork-foundation",
    "full_name": "Test"
  }'
```

---

## After both are live

Check that `MAKE_DELIVERY_WEBHOOK_URL` and `MAKE_LEAD_WEBHOOK_URL` are both set in Cloudflare Pages → Settings → Environment variables.

Then run one real purchase test on the $79 workshop replay (use Stripe test mode or buy it yourself) and confirm the watch email arrives.

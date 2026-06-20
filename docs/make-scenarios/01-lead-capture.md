# Make.com Scenario 1 — Lead Capture + Welcome Email + Phone Alert

Trigger: `MAKE_LEAD_WEBHOOK_URL`
Purpose: Catch every free opt-in, email the lead their PDF, ping your phone.

---

## What fires this

`/api/lead-capture` POSTs this payload to your webhook URL:

```json
{
  "email": "person@email.com",
  "full_name": "First Last",
  "phone": "optional",
  "source": "footwork-free | lever-audit | lever-audit-quiz | qa-registration | popup-footwork-blueprint | quiz-footwork | quiz-speed | quiz-power | quiz-ring-iq"
}
```

---

## Build it in Make.com (step by step)

### Step 1 — Webhook trigger
1. Create New Scenario
2. Add module: **Webhooks > Custom webhook**
3. Click "Add" to create a new webhook — name it `TRB Lead Capture`
4. Copy the webhook URL Make gives you
5. Go to Cloudflare Pages dashboard → Settings → Environment variables
6. Set `MAKE_LEAD_WEBHOOK_URL` to that URL (replace the old one if it exists)
7. Click "Send a test webhook" in Make.com, then submit the form at `/footwork-foundation` on your site to send a real payload. Confirm Make sees it.

### Step 2 — Router (branch by source)
1. Add module: **Flow Control > Router**
2. Create these routes (filters on `source` field):

| Route name | Filter condition |
|---|---|
| Footwork | `source` equals `footwork-free` OR `popup-footwork-blueprint` |
| Lever Audit | `source` equals `lever-audit` OR `lever-audit-quiz` |
| Quiz | `source` starts with `quiz-` |
| Q&A | `source` equals `qa-registration` |
| Fallback | (no filter — catches everything else) |

### Step 3 — Email modules (one per route)

For each route, add an **Email > Send an Email** module (or your SMTP connection if you have one).

**Footwork route email:**
```
To: {{email}}
Subject: Your Footwork Blueprint is here
Body (plain text):
---
{{full_name}},

Your Footwork Blueprint is ready.

Download it here:
https://theerainers.com/pdfs/footwork-foundation.pdf

Work through the first drill today. One rep is better than a saved file.

Rainers
---
```

**Lever Audit route email:**
```
To: {{email}}
Subject: Your 7-Lever Audit results
Body:
---
{{full_name}},

Your audit is attached. The lever that limits you most is the one to fix first.

Download here:
https://theerainers.com/pdfs/lever-audit.pdf

Rainers
---
```

**Q&A route email:**
```
To: {{email}}
Subject: You are registered for the Monthly Q&A
Body:
---
{{full_name}},

You are confirmed for the next Monthly Q&A session.

Details will come to this email before the call.

Rainers
---
```

**Fallback route email:**
```
To: {{email}}
Subject: You are in
Body:
---
{{full_name}},

You are on the list.

Watch for the next message.

Rainers
---
```

### Step 4 — Phone alert (add after each route, or as a final step before router)

Add module: **Telegram > Send a Message** (or Pushover, or Make.com's push module)

**Telegram setup:**
1. Create a Telegram bot via @BotFather — get your bot token
2. Start a conversation with your bot, send it any message
3. Get your chat ID: visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. In Make.com: Connections > Add > Telegram Bot > paste your token
5. Add module: **Telegram > Send a Text Message**
   - Chat ID: your personal chat ID from step 3
   - Text:
     ```
     NEW LEAD
     Source: {{source}}
     Email: {{email}}
     Name: {{full_name}}
     ```

**If you prefer Pushover** (simpler, $5 one-time iOS/Android app):
1. Sign up at pushover.net, get your User Key and create an App Key
2. In Make.com: **HTTP > Make a request**
   - URL: `https://api.pushover.net/1/messages.json`
   - Method: POST
   - Body type: `application/x-www-form-urlencoded`
   - Fields:
     - `token` = your App Key
     - `user` = your User Key
     - `title` = `New TRB Lead`
     - `message` = `{{source}} — {{email}}`

### Step 5 — Activate
1. Toggle the scenario ON (top right switch)
2. Set scheduling: **Immediately** (not on a timer)
3. Test by submitting the footwork form on your site
4. Confirm: email arrives, phone pings

---

## Email sender setup

For Make.com to send FROM rainers@theerainers.com, connect your email provider:
- **Option A**: Gmail (easiest) — add a **Gmail** connection, use your Google Workspace account if you have one at theerainers.com
- **Option B**: SMTP — if you have Private Email at Namecheap, use those SMTP credentials (host: mail.privateemail.com, port 587, TLS)
- **Option C**: Make.com built-in email — sends from a Make.com address, not from you. Not ideal for delivery.

Recommended: Option A or B so emails come from rainers@theerainers.com.

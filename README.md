# OPD WhatsApp Feedback Bot

WhatsApp text-based OPD patient feedback system for SRHU. An additive intake channel alongside the existing [opd-firebase-dashboard](https://github.com/Swami-Rama-Himalayan-University/opd-firebase-dashboard) — patients chat on WhatsApp instead of filling a web form, but data lands in the same Google Sheet and the existing dashboard picks it up automatically.

## Architecture

```
Patient types "feedback" on WhatsApp
        ↓
WATI webhook → Firebase Cloud Function
        ↓
getFormConfig() → Apps Script doGet()   ← fetches dept/doctor list (once per session)
        ↓
12-question Hindi conversation (session stored in Firestore)
        ↓
postFeedback() → Apps Script doPost()   ← same endpoint as the web form
        ↓
sheet.appendRow() → Responses Sheet
        ↓
Existing dashboard — no changes needed
```

## Repo structure

```
functions/
  appscript/client.js       — calls existing Apps Script doGet + doPost
  config/questions.js       — all 12 questions with Hindi text and options
  conversation/stateMachine.js — Firestore-backed session per patient phone
  handlers/whatsapp.js      — WATI webhook handler
  index.js                  — Firebase Cloud Function entry point
```

## Secrets required

Only 3 secrets needed (set via Firebase Secrets Manager):

| Secret | Where to find it |
|---|---|
| `APPS_SCRIPT_URL` | Apps Script editor → Deploy → Manage Deployments → Web App URL |
| `WATI_BASE_URL` | WATI dashboard (e.g. `https://live-server-XXXXX.wati.io`) |
| `WATI_API_TOKEN` | WATI dashboard → API credentials |

## Setup & Deployment

### 1. Get your Apps Script URL

1. Open [script.google.com](https://script.google.com)
2. Open **project-a-feedback-form**
3. Click **Deploy → Manage Deployments**
4. Copy the **Web App URL** — looks like `https://script.google.com/macros/s/XXXXXX/exec`

### 2. Set up WATI

1. Sign up at [wati.io](https://wati.io) (free trial available)
2. Connect a WhatsApp number (sandbox number available for testing)
3. Note your **API token** and **base URL** from the WATI dashboard

### 3. Deploy the Firebase Function

```bash
firebase login
firebase use --add        # pick or create a Firebase project
firebase functions:secrets:set WATI_API_TOKEN
firebase functions:secrets:set WATI_BASE_URL
firebase functions:secrets:set APPS_SCRIPT_URL
firebase deploy --only functions
```

After deploy, Firebase gives you a function URL:
```
https://us-central1-<project>.cloudfunctions.net/whatsapp/webhook
```

### 4. Configure WATI webhook

In WATI dashboard → **Settings → Webhook** → paste the function URL above.

---

## Testing

### Option A — curl (no WhatsApp needed)

Simulate WATI webhook payloads directly against the deployed function. No WATI account required.

**Start a session:**
```bash
curl -X POST https://us-central1-<project>.cloudfunctions.net/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"message","waId":"919999999999","senderName":"Test Patient","text":"feedback"}'
```

**Answer each question** (repeat with different `text` values):
```bash
curl -X POST https://us-central1-<project>.cloudfunctions.net/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"message","waId":"919999999999","senderName":"Test Patient","text":"1"}'
```

Use the same `waId` throughout — it acts as the session key. After all 12 answers, check the Responses sheet for the new row.

### Option B — WhatsApp sandbox (WATI)

1. Complete the WATI setup above
2. Send **"feedback"** to the sandbox WhatsApp number
3. Answer each question as a patient would
4. Verify the row appears in the Google Sheet
5. Verify the existing dashboard reflects the new response

### What to verify

- [ ] Sending "feedback" triggers Q1 with a numbered list of departments
- [ ] Selecting a department by number shows the correct doctors for that dept
- [ ] Invalid answers (e.g. "5" when only 4 options) trigger a re-ask
- [ ] Sending "feedback" mid-session resets and starts fresh
- [ ] After Q12, a thank-you message is sent
- [ ] A new row appears in the Responses sheet with correct column values
- [ ] The existing OPD dashboard reflects the new response

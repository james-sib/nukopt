# Cloudflare Email Worker Setup for NukOpt

## Step 1: Create the Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **Workers & Pages** from sidebar
3. Click **Create Application** → **Create Worker**
4. Name it: `nukopt-email-worker`
5. Click **Deploy** (with default code)
6. Click **Edit Code**
7. Replace ALL code with contents of `cloudflare-email-worker.js`
8. Click **Save and Deploy**

## Step 2: Add Environment Variables (Optional)

In Worker Settings → Variables:
- `WEBHOOK_URL` = `https://nukopt.onrender.com/api/webhook/email`
- `WEBHOOK_SECRET` = `nukopt_webhook_0af6427517d75214f9ec9f3a01c5cb8b`

(These are hardcoded as defaults, but env vars are cleaner)

## Step 3: Enable Email Routing

1. Go to [nukopt.com zone](https://dash.cloudflare.com/?to=/:account/nukopt.com/email/routing/routes)
2. Click **Email** → **Email Routing**
3. If not enabled, click **Enable Email Routing** and add the MX records

## Step 4: Create Catch-All Rule

1. In Email Routing, go to **Routing Rules**
2. Click **Create Address** or **Catch-all**
3. Set up catch-all:
   - **Catch-all action:** Send to a Worker
   - **Worker:** nukopt-email-worker
4. Save

## Step 5: Test

Send an email to `test@nukopt.com` and check:
1. Worker logs in Cloudflare dashboard
2. NukOpt webhook logs / database

## Webhook Payload Format

The worker sends this JSON to the webhook:

```json
{
  "from": "sender@example.com",
  "to": "mailbox123@nukopt.com",
  "subject": "Your verification code",
  "messageId": "<abc123@mail.example.com>",
  "date": "Tue, 28 Jan 2026 20:00:00 +0000",
  "headers": { ... },
  "textBody": "Your code is 123456",
  "htmlBody": "<p>Your code is <b>123456</b></p>",
  "raw": "... full raw email ..."
}
```

## Troubleshooting

**Worker not receiving emails:**
- Check MX records point to `route1/2/3.mx.cloudflare.net`
- Check catch-all rule is active
- Check worker is deployed

**Webhook not receiving:**
- Check Worker logs for errors
- Verify webhook URL is accessible
- Check X-Webhook-Secret header matches

**Emails bouncing:**
- Worker should never throw unhandled errors
- Always accept emails to prevent bounce loops

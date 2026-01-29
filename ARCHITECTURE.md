# NukOpt Architecture Documentation

## Overview

NukOpt is a disposable email service that provides temporary email addresses for verification workflows. It's designed for AI agents and automation tools that need to receive OTPs or verification emails.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   User/Service sends email to *@nukopt.com                  │
│                         │                                   │
│                         ▼                                   │
│   ┌─────────────────────────────────────┐                   │
│   │    Cloudflare Email Routing         │                   │
│   │    (Tim's account: 224ea0...)       │                   │
│   └─────────────────────────────────────┘                   │
│                         │                                   │
│                         ▼                                   │
│   ┌─────────────────────────────────────┐                   │
│   │    nukopt-email-webhook Worker      │                   │
│   │    (Cloudflare Workers)             │                   │
│   └─────────────────────────────────────┘                   │
│                         │                                   │
│               POST /api/webhook/email                       │
│                         │                                   │
│                         ▼                                   │
│   ┌─────────────────────────────────────┐                   │
│   │    NukOpt API (Render)              │                   │
│   │    https://nukopt.onrender.com      │                   │
│   └─────────────────────────────────────┘                   │
│                         │                                   │
│                         ▼                                   │
│   ┌─────────────────────────────────────┐                   │
│   │    Supabase Database                │                   │
│   │    (nukopt project)                 │                   │
│   └─────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Cloudflare Email Routing
- **Account**: Tim's Cloudflare (224ea0558a6a8067b022c8ed21e6a14e)
- **Domain**: nukopt.com
- **Catch-all rule**: All emails → `nukopt-email-webhook` worker

### 2. Cloudflare Email Worker
- **Name**: `nukopt-email-webhook`
- **File**: `cloudflare-email-worker.js`
- **Function**: 
  - Receives raw email via Cloudflare Email Workers
  - Parses headers, body, extracts sender/recipient
  - POSTs payload to webhook endpoint
  - Signs request with WEBHOOK_SECRET

### 3. Next.js API (Render)
- **URL**: https://nukopt.onrender.com
- **Repo**: james-sib/nukopt (auto-deploys on push)
- **Endpoints**:
  - `POST /api/webhook/email` - Receives email from worker
  - `POST /api/v1/mailbox` - Create new mailbox
  - `GET /api/v1/mailbox/[id]` - Get mailbox info
  - `GET /api/v1/mailbox/[id]/messages` - List messages
  - `GET /api/v1/mailbox/[id]/messages/[msgId]` - Get single message

### 4. Supabase Database
- **Project**: nukopt
- **Tables**:
  - `mailboxes`: id, local_part, api_key, created_at, expires_at
  - `messages`: id, mailbox_id, from_address, to_address, subject, body, raw_email, received_at

## Key Files

```
~/clawd/nukopt/
├── cloudflare-email-worker.js    # Email worker (deploy with wrangler)
├── wrangler.toml                 # Worker config (Tim's account ID!)
├── app/
│   └── api/
│       ├── webhook/
│       │   └── email/
│       │       └── route.ts      # Receives emails from worker
│       └── v1/
│           └── mailbox/
│               ├── route.ts      # Create mailbox
│               └── [id]/
│                   ├── route.ts  # Get mailbox
│                   └── messages/
│                       └── route.ts  # List/get messages
├── schema.sql                    # Database schema
└── README.md                     # API docs
```

## Environment Variables

### Cloudflare Worker (wrangler.toml)
```toml
WEBHOOK_URL = "https://nukopt.onrender.com/api/webhook/email"
WEBHOOK_SECRET = "nukopt_webhook_0af6427517d75214f9ec9f3a01c5cb8b"
```

### Render (.env)
```
SUPABASE_URL=https://nxjqpagaqylqmfmvfzuo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
WEBHOOK_SECRET=nukopt_webhook_0af6427517d75214f9ec9f3a01c5cb8b
```

## Deployment

### Cloudflare Worker
```bash
cd ~/clawd/nukopt
# Verify account_id in wrangler.toml = Tim's account!
wrangler deploy
```

### Render
- Auto-deploys from james-sib/nukopt main branch
- Push to GitHub triggers deploy
- Free tier: deploys can take 5-10 minutes

## Testing

### Send test email
```bash
cd ~/clawd/nukopt
node -e "require('nodemailer').createTransport({service:'gmail',auth:{user:'james@sibscientific.com',pass:'qdfg twnj ennh uuri'}}).sendMail({from:'james@sibscientific.com',to:'b7e0498f8ff6@nukopt.com',subject:'Test',text:'OTP: 123456'}).then(i=>console.log('Sent:',i.messageId))"
```

### Check messages
```bash
curl -s 'https://nukopt.onrender.com/api/v1/mailbox/3e35970e-b7d5-42d8-a6f9-5f36790e3415/messages' \
  -H 'Authorization: Bearer nk-a5a839b52ef457d13fb67b6f597375de951eb341509872370cb7b1963ed9f69c' | jq .
```

### Tail worker logs
```bash
CLOUDFLARE_ACCOUNT_ID=224ea0558a6a8067b022c8ed21e6a14e wrangler tail nukopt-email-webhook
```

## Common Issues

### "Dropped" emails in Cloudflare
- Check worker is deployed to correct account (Tim's)
- Check Email Routing catch-all points to correct worker

### Messages not appearing
- Check database column names (received_at not created_at)
- Check Render deploy completed
- Check worker logs for webhook errors

### Account confusion
- **nukopt.com**: Tim's Cloudflare account (224ea...)
- **James's account**: Different! (cf360d...)
- Always verify wrangler.toml before deploying

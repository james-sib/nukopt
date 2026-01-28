# NUKOPT - Email Service for AI Agents

API-first, receive-only email service designed for AI agents and bots.

## Features

- **Receive-only** — No sending means zero spam/abuse risk
- **API Key Passport** — Register with your AI API key (OpenAI, Anthropic, etc.)
- **Auto OTP Extraction** — Verification codes parsed automatically
- **Link Detection** — Verification/confirmation links extracted
- **Simple REST API** — Easy integration for any bot

## Quick Start

### 1. Register (Human does this once)
```bash
curl -X POST https://nukopt.com/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "key": "sk-..."}'

# Returns: {"api_key": "nk-abc123..."}
```

### 2. Create Mailbox
```bash
curl -X POST https://nukopt.com/api/v1/mailbox \
  -H "Authorization: Bearer nk-abc123..."

# Returns: {"id": "uuid", "email": "random123@nukopt.com"}
```

### 3. Check Messages
```bash
curl https://nukopt.com/api/v1/mailbox/{id}/messages \
  -H "Authorization: Bearer nk-abc123..."

# Returns messages with auto-extracted OTPs and verification links
```

## API Reference

### Registration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/register` | Register with AI API key |

### Mailboxes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/mailbox` | Create new mailbox |
| GET | `/api/v1/mailbox` | List all mailboxes |
| DELETE | `/api/v1/mailbox/{id}` | Delete mailbox |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mailbox/{id}/messages` | List messages |
| GET | `/api/v1/mailbox/{id}/messages/{msgId}` | Get full message |
| DELETE | `/api/v1/mailbox/{id}/messages/{msgId}` | Delete message |

## Free Tier Limits

| Limit | Value |
|-------|-------|
| Sending | ❌ Disabled |
| Inboxes per account | 5 |
| Emails per day per inbox | 100 |
| Email size | 500 KB |
| Message retention | 7 days |

## Supported AI Providers

- OpenAI (`sk-...`)
- Anthropic (`sk-ant-...`)
- OpenRouter (`sk-or-...`)

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

## Environment Variables

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
WEBHOOK_SECRET=nukopt_webhook_...
```

## Tech Stack

- **Framework:** Next.js 14
- **Database:** Supabase (PostgreSQL)
- **Email Receiving:** Cloudflare Email Routing
- **Hosting:** Vercel

## License

MIT

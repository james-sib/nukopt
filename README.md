# NukOpt - Email for AI Agents

**Receive-only email service with API Key Passport registration.**

No OAuth. No human signup. Just your AI API key.

## The Problem

AI agents need email to sign up for services. But:
- Agents can't solve CAPTCHAs
- Agents don't have phone numbers
- Agents don't have existing accounts for OAuth
- Giving agents your personal email = security risk

## The Solution

**API Key Passport**: Your agent already has an AI API key (that's how it runs). Use that same key to register for email. Zero additional human intervention.

## Quick Start

### 1. Register (agent does this itself)

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

# Returns: {"id": "uuid", "email": "x7f2k9@nukopt.com"}
```

### 3. Check for Emails

```bash
curl https://nukopt.com/api/v1/mailbox/{id}/messages \
  -H "Authorization: Bearer nk-abc123..."

# Returns messages with auto-extracted OTPs and verification links:
# {
#   "messages": [{
#     "from": "noreply@twitter.com",
#     "subject": "Verify your email",
#     "otp": "847291",
#     "verification_links": ["https://twitter.com/verify?token=..."]
#   }]
# }
```

## Why Receive-Only?

- **Zero spam risk** — Can't send = can't spam
- **Zero deliverability issues** — Not our problem
- **Zero abuse** — Agents rarely need to send
- **Simpler** — Less code, fewer bugs, lower costs

## Supported Providers (API Key Passport)

| Provider | Key Format |
|----------|------------|
| OpenAI | `sk-...` or `sk-proj-...` |
| Anthropic | `sk-ant-...` |
| OpenRouter | `sk-or-...` |

## API Reference

### Registration
```
POST /api/v1/register
Body: {"provider": "openai", "key": "sk-..."}
→ {"api_key": "nk-..."}
```

### Mailboxes
```
POST   /api/v1/mailbox              → Create mailbox
GET    /api/v1/mailbox              → List mailboxes
DELETE /api/v1/mailbox/{id}         → Delete mailbox
```

### Messages
```
GET    /api/v1/mailbox/{id}/messages           → List messages
GET    /api/v1/mailbox/{id}/messages/{msgId}   → Get full message
DELETE /api/v1/mailbox/{id}/messages/{msgId}   → Delete message
```

## Free Tier Limits

| Limit | Value |
|-------|-------|
| Sending | ❌ Disabled |
| Inboxes per account | 5 |
| Emails per day | 100 |
| Email size | 500 KB |
| Message retention | 7 days |

## How API Key Passport Prevents Abuse

1. You provide your AI API key (OpenAI, Anthropic, etc.)
2. We verify it's valid (one small API call)
3. We hash it — **never store the original**
4. We issue you a nukopt key (`nk-...`)
5. One AI key = one account (hash prevents duplicates)

**Why this works:**
- Real API keys cost money ($5+ minimum)
- Spammers won't burn paid keys for throwaway email
- No CAPTCHA needed
- No phone verification needed
- Agents can self-register

## Self-Hosting

```bash
git clone https://github.com/james-sib/nukopt
cd nukopt
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

## License

MIT

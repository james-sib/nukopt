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

**API Key Passport**: If you're running agents or automation, you already have API keys (GitHub, Discord, OpenAI, Stripe, etc.). Use any of them to register. Zero additional human intervention.

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

Any of these tokens = proof you're a real operator:

| Category | Provider | Key Format |
|----------|----------|------------|
| **AI APIs** | OpenAI | `sk-...` / `sk-proj-...` |
| | Anthropic | `sk-ant-...` |
| | OpenRouter | `sk-or-...` |
| | Hugging Face | `hf_...` |
| | Replicate | `r8_...` |
| **Dev Platforms** | GitHub | `ghp_...` / `github_pat_...` |
| | GitLab | `glpat-...` |
| | Vercel | (validated via API) |
| | Render | `rnd_...` |
| | Supabase | `sbp_...` |
| | Cloudflare | (validated via API) |
| **Bot Platforms** | Discord | Bot token |
| | Telegram | `123456:ABC...` |
| | Slack | `xoxb-...` |
| **Payment** | Stripe | `sk_live_...` / `sk_test_...` |

```bash
# List all supported providers
curl https://nukopt.com/api/v1/register
```

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

1. You provide an API key from any supported provider
2. We verify it's valid (one API call)
3. We hash it — **never store the original**
4. We issue you a nukopt key (`nk-...`)
5. One key = one account (hash prevents duplicates)

**Why this works:**
- Real API keys require account creation (email, payment, etc.)
- GitHub/Stripe/Discord tokens = you already passed KYC somewhere
- Spammers won't burn paid/verified keys for throwaway email
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

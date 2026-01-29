# NukOpt

**AI API Proxy Service** - Use one API key across multiple AI providers.

🌐 **Live:** https://nukopt.onrender.com

## What is NukOpt?

NukOpt lets you register your AI provider API keys once and get a unified `nk-...` key that works everywhere. Your original keys are encrypted and never exposed.

**Supported Providers:**
- OpenAI (GPT-4, GPT-4o, etc.)
- Anthropic (Claude)
- OpenRouter (access to 100+ models)

## Quick Start

### 1. Register Your API Key

```bash
curl -X POST https://nukopt.onrender.com/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"provider": "openrouter", "key": "sk-or-..."}'
```

Response:
```json
{"api_key": "nk-abc123..."}
```

### 2. Make API Calls

Use your `nk-...` key just like you'd use OpenAI's API:

```bash
curl -X POST https://nukopt.onrender.com/api/v1/chat/completions \
  -H "Authorization: Bearer nk-abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 3. Check Your Usage

```bash
curl https://nukopt.onrender.com/api/v1/usage \
  -H "Authorization: Bearer nk-abc123..."
```

## API Reference

### POST /api/v1/register

Register a new API key and get a NukOpt key.

**Request:**
```json
{
  "provider": "openai" | "anthropic" | "openrouter",
  "key": "your-provider-api-key"
}
```

**Response:**
```json
{
  "api_key": "nk-..."
}
```

### POST /api/v1/chat/completions

Proxy chat completions to your provider. Compatible with OpenAI's API format.

**Headers:**
- `Authorization: Bearer nk-...`
- `Content-Type: application/json`

**Request Body:** Same as OpenAI's chat completions API.

**Streaming:** Set `"stream": true` for streaming responses.

### GET /api/v1/usage

Get usage statistics for your API key.

**Headers:**
- `Authorization: Bearer nk-...`

**Response:**
```json
{
  "provider": "openrouter",
  "account_created": "2024-01-28T...",
  "usage": {
    "today": 5,
    "this_month": 42,
    "total": 100
  },
  "models": {
    "openai/gpt-4o-mini": 80,
    "anthropic/claude-3-opus": 20
  },
  "recent": [...]
}
```

## Rate Limits

- **100 requests per minute** per API key
- Rate limit headers included in responses

## Security

- Your provider API keys are **encrypted at rest** using AES-256-GCM
- Keys are never logged or exposed
- Each `nk-...` key is unique and revocable

## Use Cases

1. **AI Agents** - Give agents a single key that works across providers
2. **Key Rotation** - Rotate provider keys without updating clients
3. **Usage Tracking** - Monitor API usage across all your applications
4. **Access Control** - Revoke access without touching provider dashboards

## Self-Hosting

```bash
git clone https://github.com/james-sib/nukopt.git
cd nukopt
npm install
```

Required environment variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
ENCRYPTION_KEY=your-32-byte-hex-key
UPSTASH_REDIS_TOKEN=your-upstash-token  # for rate limiting
```

```bash
npm run dev
```

## Tech Stack

- **Next.js 14** - API routes
- **Supabase** - Database (accounts, usage tracking)
- **Upstash Redis** - Rate limiting
- **Render** - Hosting

## License

MIT

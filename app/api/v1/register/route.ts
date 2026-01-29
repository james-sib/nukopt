import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { registerLimiter } from '@/app/lib/rateLimit';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// All supported passport providers
const PROVIDERS: Record<string, { 
  prefixes: string[]; 
  validate: (key: string) => Promise<boolean>;
  description: string;
}> = {
  // AI APIs
  openai: { 
    prefixes: ['sk-', 'sk-proj-'], 
    validate: async (key) => {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return res.ok;  // 401 = invalid key, don't accept!
    },
    description: 'OpenAI API key'
  },
  anthropic: { 
    prefixes: ['sk-ant-'], 
    validate: async (key) => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 
          'x-api-key': key, 
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] })
      });
      return res.ok || res.status === 400;  // 400 = valid key, bad request; 401 = invalid key
    },
    description: 'Anthropic API key'
  },
  openrouter: { 
    prefixes: ['sk-or-'], 
    validate: async (key) => {
      // OpenRouter /models is public, use /auth/key to validate
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return res.ok;
    },
    description: 'OpenRouter API key'
  },
  huggingface: {
    prefixes: ['hf_'],
    validate: async (key) => {
      const res = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return res.ok;
    },
    description: 'Hugging Face token'
  },

  // Developer platforms
  github: {
    prefixes: ['ghp_', 'github_pat_'],
    validate: async (key) => {
      const res = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${key}`, 'User-Agent': 'NukOpt' }
      });
      return res.ok;
    },
    description: 'GitHub personal access token'
  },
  gitlab: {
    prefixes: ['glpat-'],
    validate: async (key) => {
      const res = await fetch('https://gitlab.com/api/v4/user', {
        headers: { 'PRIVATE-TOKEN': key }
      });
      return res.ok;
    },
    description: 'GitLab personal access token'
  },

  // Messaging / Bot platforms
  discord: {
    prefixes: [], // Discord bot tokens don't have a consistent prefix
    validate: async (key) => {
      // Bot tokens are usually long alphanumeric with dots
      if (key.length < 50) return false;
      const res = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bot ${key}` }
      });
      return res.ok;
    },
    description: 'Discord bot token'
  },
  telegram: {
    prefixes: [], // Format: 123456789:ABC-DEF...
    validate: async (key) => {
      // Telegram bot tokens: number:alphanumeric
      if (!/^\d+:[A-Za-z0-9_-]+$/.test(key)) return false;
      const res = await fetch(`https://api.telegram.org/bot${key}/getMe`);
      const data = await res.json();
      return data.ok === true;
    },
    description: 'Telegram bot token'
  },
  slack: {
    prefixes: ['xoxb-'],
    validate: async (key) => {
      const res = await fetch('https://slack.com/api/auth.test', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const data = await res.json();
      return data.ok === true;
    },
    description: 'Slack bot token'
  },

  // Payment (ultimate proof)
  stripe: {
    prefixes: ['sk_live_', 'sk_test_', 'rk_live_', 'rk_test_'],
    validate: async (key) => {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return res.ok;  // Must successfully auth, 401 = invalid
    },
    description: 'Stripe API key'
  },

  // Infrastructure
  cloudflare: {
    prefixes: [], // Various formats
    validate: async (key) => {
      const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const data = await res.json();
      return data.success === true;
    },
    description: 'Cloudflare API token'
  },
  vercel: {
    prefixes: [],
    validate: async (key) => {
      const res = await fetch('https://api.vercel.com/v2/user', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return res.ok;
    },
    description: 'Vercel API token'
  },
  render: {
    prefixes: ['rnd_'],
    validate: async (key) => {
      const res = await fetch('https://api.render.com/v1/owners', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return res.ok;
    },
    description: 'Render API key'
  },
  supabase: {
    prefixes: ['sbp_'],
    validate: async (key) => {
      // Supabase management API
      const res = await fetch('https://api.supabase.com/v1/projects', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return res.ok;
    },
    description: 'Supabase management token'
  },
  replicate: {
    prefixes: ['r8_'],
    validate: async (key) => {
      const res = await fetch('https://api.replicate.com/v1/account', {
        headers: { 'Authorization': `Token ${key}` }
      });
      return res.ok;
    },
    description: 'Replicate API token'
  },
};

async function validateApiKey(provider: string, key: string): Promise<boolean> {
  const config = PROVIDERS[provider];
  if (!config) return false;
  
  // Check prefix if provider has specific prefixes
  if (config.prefixes.length > 0 && !config.prefixes.some(p => key.startsWith(p))) {
    return false;
  }
  
  try {
    return await config.validate(key);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting by IP (graceful degradation if Redis unavailable)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    try {
      const { success } = await registerLimiter.limit(ip);
      if (!success) {
        return NextResponse.json({ 
          error: 'Too many requests. Please try again later.',
          retryAfter: 60
        }, { 
          status: 429,
          headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' }
        });
      }
    } catch (rateLimitError) {
      // Redis not configured - continue without rate limiting
      console.warn('Rate limiting skipped:', rateLimitError);
    }
    
    // Parse JSON with proper error handling
    let body: { provider?: string; key?: string };
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { provider, key } = body;
    
    if (!provider || !key) {
      return NextResponse.json({ error: 'Missing provider or key' }, { status: 400 });
    }
    
    if (!PROVIDERS[provider]) {
      return NextResponse.json({ 
        error: `Unsupported provider. Supported: ${Object.keys(PROVIDERS).join(', ')}`,
        providers: Object.entries(PROVIDERS).map(([k, v]) => ({ id: k, description: v.description }))
      }, { status: 400 });
    }
    
    const isValid = await validateApiKey(provider, key);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    // Hash the key (never store original)
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    const supabase = getSupabase();
    
    // Check if account already exists
    const { data: existing } = await supabase
      .from('nukopt_accounts')
      .select('api_key')
      .eq('key_hash', keyHash)
      .single();
    
    if (existing) {
      // SECURITY: Never return existing API keys - prevents account takeover via leaked third-party keys
      return NextResponse.json({ 
        error: 'Account already exists. Use your existing nukopt API key.',
        hint: 'If you lost your key, contact support.'
      }, { status: 409 });
    }
    
    // Create new account
    const apiKey = 'nk-' + crypto.randomBytes(32).toString('hex');
    
    const { error } = await supabase.from('nukopt_accounts').insert({
      key_hash: keyHash,
      provider,
      api_key: apiKey,
    });
    
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    
    return NextResponse.json({ api_key: apiKey });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

// GET endpoint to list supported providers (no prefixes exposed for security)
export async function GET() {
  return NextResponse.json({
    providers: Object.entries(PROVIDERS).map(([id, config]) => ({
      id,
      description: config.description
    }))
  });
}

// Explicitly handle unsupported methods with JSON response
export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

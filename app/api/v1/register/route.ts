import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Supported AI providers and their key validation
const PROVIDERS: Record<string, { prefixes: string[]; validateUrl: string }> = {
  openai: { 
    prefixes: ['sk-', 'sk-proj-'], 
    validateUrl: 'https://api.openai.com/v1/models' 
  },
  anthropic: { 
    prefixes: ['sk-ant-'], 
    validateUrl: 'https://api.anthropic.com/v1/messages' 
  },
  openrouter: { 
    prefixes: ['sk-or-'], 
    validateUrl: 'https://openrouter.ai/api/v1/models' 
  },
};

async function validateApiKey(provider: string, key: string): Promise<boolean> {
  const config = PROVIDERS[provider];
  if (!config) return false;
  if (!config.prefixes.some(p => key.startsWith(p))) return false;
  
  try {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${key}` };
    if (provider === 'anthropic') {
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
    }
    const res = await fetch(config.validateUrl, { headers, method: 'GET' });
    // 200 = valid, 401 = key format valid but unauthorized (still proves it's a real key format)
    return res.ok || res.status === 401;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { provider, key } = await req.json();
    
    if (!provider || !key) {
      return NextResponse.json({ error: 'Missing provider or key' }, { status: 400 });
    }
    
    if (!PROVIDERS[provider]) {
      return NextResponse.json({ 
        error: `Unsupported provider. Use: ${Object.keys(PROVIDERS).join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate the API key format and that it's real
    const isValid = await validateApiKey(provider, key);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    // Hash the key (we never store the original)
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    const supabase = getSupabase();
    
    // Check if account already exists with this key
    const { data: existing } = await supabase
      .from('nukopt_accounts')
      .select('api_key')
      .eq('key_hash', keyHash)
      .single();
    
    if (existing) {
      return NextResponse.json({ 
        api_key: existing.api_key,
        message: 'Account already exists'
      });
    }
    
    // Create new account with nukopt API key
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

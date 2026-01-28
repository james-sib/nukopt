import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Force dynamic rendering - don't try to pre-render at build time
export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Supported AI providers and their key validation
const PROVIDERS: Record<string, { prefix: string; validateUrl: string }> = {
  openai: { prefix: 'sk-', validateUrl: 'https://api.openai.com/v1/models' },
  anthropic: { prefix: 'sk-ant-', validateUrl: 'https://api.anthropic.com/v1/messages' },
  openrouter: { prefix: 'sk-or-', validateUrl: 'https://openrouter.ai/api/v1/models' },
};

async function validateApiKey(provider: string, key: string): Promise<boolean> {
  const config = PROVIDERS[provider];
  if (!config) return false;
  if (!key.startsWith(config.prefix)) return false;
  
  try {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${key}` };
    if (provider === 'anthropic') {
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
    }
    const res = await fetch(config.validateUrl, { headers, method: 'GET' });
    return res.ok || res.status === 401; // 401 means key format valid but maybe expired
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
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }
    
    // Validate the API key
    const isValid = await validateApiKey(provider, key);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    // Hash the key to create account ID (don't store original)
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    const supabase = getSupabase();
    
    // Check if account already exists
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
    
    // Create new account
    const apiKey = 'nk-' + crypto.randomBytes(32).toString('hex');
    
    const { error } = await supabase.from('nukopt_accounts').insert({
      key_hash: keyHash,
      provider,
      api_key: apiKey,
      created_at: new Date().toISOString()
    });
    
    if (error) throw error;
    
    return NextResponse.json({ api_key: apiKey });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

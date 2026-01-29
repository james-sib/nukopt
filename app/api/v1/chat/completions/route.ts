import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

export async function POST(req: NextRequest) {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer nk-')) {
      return NextResponse.json({ error: 'Invalid API key format. Use: Bearer nk-...' }, { status: 401 });
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    
    // Look up the account
    const supabase = getSupabase();
    const { data: account, error: lookupError } = await supabase
      .from('nukopt_accounts')
      .select('provider, encrypted_key')
      .eq('api_key', apiKey)
      .single();
    
    if (lookupError || !account) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    if (!account.encrypted_key) {
      return NextResponse.json({ 
        error: 'Key storage not configured. Please re-register.',
      }, { status: 400 });
    }
    
    // Check rate limit
    const { success, remaining, reset } = await checkRateLimit(apiKey);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }
    
    // Decrypt the provider key
    const providerKey = decrypt(account.encrypted_key);
    const endpoint = PROVIDER_ENDPOINTS[account.provider];
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }
    
    const body = await req.json();
    
    // Build headers for the provider
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (account.provider === 'anthropic') {
      headers['x-api-key'] = providerKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${providerKey}`;
    }
    
    // Forward the request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    // Log usage (async, don't wait)
    supabase.from('nukopt_usage').insert({
      api_key: apiKey,
      provider: account.provider,
      model: body.model,
      timestamp: new Date().toISOString(),
    }).then(() => {});
    
    // Stream the response back
    if (body.stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
  }
}

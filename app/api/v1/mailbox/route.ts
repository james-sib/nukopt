import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { apiLimiter, addRateLimitHeaders } from '@/app/lib/rateLimit';
import { authenticateApiKey, addTimingJitter } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Legacy function for backwards compatibility
async function getAccount(req: NextRequest) {
  const authResult = await authenticateApiKey(req.headers.get('authorization'));
  if (!authResult.valid) return null;
  return { id: authResult.accountId };
}

// List mailboxes
export async function GET(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('nukopt_mailboxes')
    .select('id, email, created_at')
    .eq('account_id', account.id);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mailboxes: data });
}

// Create mailbox - DB trigger enforces 5 limit
export async function POST(req: NextRequest) {
  // Reject requests with large bodies (no body needed for this endpoint)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }
  
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  let rateLimitInfo: { limit: number; remaining: number; reset: number } | null = null;
  try {
    const { success, limit, remaining, reset } = await apiLimiter.limit(ip);
    rateLimitInfo = { limit, remaining, reset };
    if (!success) {
      const headers = new Headers({ 'Retry-After': '60' });
      addRateLimitHeaders(headers, rateLimitInfo);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: 60 },
        { status: 429, headers }
      );
    }
  } catch (e) {
    // Rate limiting failure shouldn't block the request
    console.warn('Rate limiting error:', e);
  }
  
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const supabase = getSupabase();
  const localPart = crypto.randomBytes(6).toString('hex');
  const email = `${localPart}@nukopt.com`;
  
  const { data, error } = await supabase
    .from('nukopt_mailboxes')
    .insert({
      account_id: account.id,
      email,
      local_part: localPart
    })
    .select()
    .single();
  
  if (error) {
    // DB trigger raises exception if limit exceeded
    if (error.message.includes('limit')) {
      return NextResponse.json({ error: 'Mailbox limit reached (5)' }, { status: 429 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const response = NextResponse.json({ id: data.id, email: data.email });
  if (rateLimitInfo) {
    addRateLimitHeaders(response.headers, rateLimitInfo);
  }
  return response;
}

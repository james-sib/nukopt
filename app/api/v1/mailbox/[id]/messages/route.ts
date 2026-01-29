import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLimiter, addRateLimitHeaders } from '@/app/lib/rateLimit';
import { authenticateApiKey } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

interface RateLimitResult {
  blocked: boolean;
  response?: NextResponse;
  info?: { limit: number; remaining: number; reset: number };
}

async function checkRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  try {
    const { success, limit, remaining, reset } = await apiLimiter.limit(ip);
    const info = { limit, remaining, reset };
    if (!success) {
      const headers = new Headers({ 'Retry-After': '60' });
      addRateLimitHeaders(headers, info);
      return {
        blocked: true,
        response: NextResponse.json(
          { error: 'Too many requests', retryAfter: 60 },
          { status: 429, headers }
        ),
        info
      };
    }
    return { blocked: false, info };
  } catch (e) {
    console.warn('Rate limiting error:', e);
    return { blocked: false };
  }
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function verifyAccess(req: NextRequest, mailboxId: string): Promise<'ok' | 'unauthorized' | 'not_found'> {
  // Use constant-time auth
  const authResult = await authenticateApiKey(req.headers.get('authorization'));
  if (!authResult.valid) return 'unauthorized';
  
  const supabase = getSupabase();
  
  // Verify mailbox belongs to account
  const { data: mailbox } = await supabase
    .from('nukopt_mailboxes')
    .select('id')
    .eq('id', mailboxId)
    .eq('account_id', authResult.accountId)
    .single();
  
  return mailbox ? 'ok' : 'not_found';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimit = await checkRateLimit(req);
  if (rateLimit.blocked) return rateLimit.response!;
  
  const { id } = await params;
  
  const status = await verifyAccess(req, id);
  if (status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (status === 'not_found') {
    return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
  }
  
  // Parse limit from query params (default 50, max 100)
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 100);
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('nukopt_messages')
    .select('id, from_address, subject, otp, verification_links, created_at')
    .eq('mailbox_id', id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const response = NextResponse.json({ messages: data });
  if (rateLimit.info) {
    addRateLimitHeaders(response.headers, rateLimit.info);
  }
  return response;
}

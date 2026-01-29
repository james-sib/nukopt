import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function getAccount(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer nk-')) return null;
  const apiKey = auth.slice(7);
  
  const supabase = getSupabase();
  const { data } = await supabase
    .from('nukopt_accounts')
    .select('id')
    .eq('api_key', apiKey)
    .single();
  
  return data;
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

// Create mailbox (with atomic limit check to prevent race condition)
export async function POST(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const supabase = getSupabase();
  const localPart = crypto.randomBytes(6).toString('hex');
  const email = `${localPart}@nukopt.com`;
  
  // Atomic insert with limit check using raw SQL
  // This prevents race conditions by checking limit inside the INSERT
  const { data, error } = await supabase.rpc('create_mailbox_if_under_limit', {
    p_account_id: account.id,
    p_email: email,
    p_local_part: localPart,
    p_limit: 5
  });
  
  if (error) {
    // Function returns null if limit exceeded
    if (error.message.includes('limit') || !data) {
      return NextResponse.json({ error: 'Mailbox limit reached (5)' }, { status: 429 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Mailbox limit reached (5)' }, { status: 429 });
  }
  
  return NextResponse.json({ id: data[0].id, email: data[0].email });
}

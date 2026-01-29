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

// Create mailbox with optimistic concurrency control
export async function POST(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const supabase = getSupabase();
  const localPart = crypto.randomBytes(6).toString('hex');
  const email = `${localPart}@nukopt.com`;
  
  // Check count first (optimistic check)
  const { count: preCount } = await supabase
    .from('nukopt_mailboxes')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', account.id);
  
  if ((preCount || 0) >= 5) {
    return NextResponse.json({ error: 'Mailbox limit reached (5)' }, { status: 429 });
  }
  
  // Attempt insert
  const { data, error } = await supabase
    .from('nukopt_mailboxes')
    .insert({
      account_id: account.id,
      email,
      local_part: localPart
    })
    .select()
    .single();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Post-insert validation: if over limit, delete and return error
  const { count: postCount } = await supabase
    .from('nukopt_mailboxes')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', account.id);
  
  if ((postCount || 0) > 5) {
    // Race condition occurred - delete the one we just created
    await supabase.from('nukopt_mailboxes').delete().eq('id', data.id);
    return NextResponse.json({ error: 'Mailbox limit reached (5)' }, { status: 429 });
  }
  
  return NextResponse.json({ id: data.id, email: data.email });
}

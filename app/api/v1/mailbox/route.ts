import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getAccount(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer nk-')) return null;
  const apiKey = auth.slice(7);
  
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
  
  const { data, error } = await supabase
    .from('nukopt_mailboxes')
    .select('id, email, created_at')
    .eq('account_id', account.id);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mailboxes: data });
}

// Create mailbox
export async function POST(req: NextRequest) {
  const account = await getAccount(req);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Check mailbox limit (5 per account)
  const { count } = await supabase
    .from('nukopt_mailboxes')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', account.id);
  
  if ((count || 0) >= 5) {
    return NextResponse.json({ error: 'Mailbox limit reached (5)' }, { status: 429 });
  }
  
  // Generate random email
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
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, email: data.email });
}

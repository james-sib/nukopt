import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function verifyAccess(req: NextRequest, mailboxId: string) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer nk-')) return false;
  
  const supabase = getSupabase();
  
  // Get account from API key
  const { data: account } = await supabase
    .from('nukopt_accounts')
    .select('id')
    .eq('api_key', auth.slice(7))
    .single();
  
  if (!account) return false;
  
  // Verify mailbox belongs to account
  const { data: mailbox } = await supabase
    .from('nukopt_mailboxes')
    .select('id')
    .eq('id', mailboxId)
    .eq('account_id', account.id)
    .single();
  
  return !!mailbox;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  if (!await verifyAccess(req, id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('nukopt_messages')
    .select('id, from_address, subject, otp, verification_links, received_at')
    .eq('mailbox_id', id)
    .order('received_at', { ascending: false })
    .limit(50);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

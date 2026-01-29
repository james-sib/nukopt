import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function verifyAccess(req: NextRequest, mailboxId: string): Promise<'ok' | 'unauthorized' | 'not_found'> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer nk-')) return 'unauthorized';
  
  const supabase = getSupabase();
  
  // Get account from API key
  const { data: account } = await supabase
    .from('nukopt_accounts')
    .select('id')
    .eq('api_key', auth.slice(7))
    .single();
  
  if (!account) return 'unauthorized';
  
  // Verify mailbox belongs to account
  const { data: mailbox } = await supabase
    .from('nukopt_mailboxes')
    .select('id')
    .eq('id', mailboxId)
    .eq('account_id', account.id)
    .single();
  
  return mailbox ? 'ok' : 'not_found';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
) {
  const { id, msgId } = await params;
  
  const status = await verifyAccess(req, id);
  if (status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (status === 'not_found') {
    return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
  }
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('nukopt_messages')
    .select('*')
    .eq('id', msgId)
    .eq('mailbox_id', id)
    .single();
  
  if (error || !data) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
  
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
) {
  const { id, msgId } = await params;
  
  const status = await verifyAccess(req, id);
  if (status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (status === 'not_found') {
    return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
  }
  
  const supabase = getSupabase();
  await supabase
    .from('nukopt_messages')
    .delete()
    .eq('id', msgId)
    .eq('mailbox_id', id);
  
  return NextResponse.json({ deleted: true });
}

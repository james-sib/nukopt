import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function verifyAccess(req: NextRequest, mailboxId: string) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer nk-')) return false;
  
  const { data } = await supabase
    .from('mailboxes')
    .select('account:accounts!inner(api_key)')
    .eq('id', mailboxId)
    .single();
  
  return data?.account?.api_key === auth.slice(7);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
) {
  if (!await verifyAccess(req, params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', params.msgId)
    .eq('mailbox_id', params.id)
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
  if (!await verifyAccess(req, params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await supabase
    .from('messages')
    .delete()
    .eq('id', params.msgId)
    .eq('mailbox_id', params.id);
  
  return NextResponse.json({ deleted: true });
}

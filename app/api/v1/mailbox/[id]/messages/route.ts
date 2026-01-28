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
  { params }: { params: { id: string } }
) {
  if (!await verifyAccess(req, params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase
    .from('messages')
    .select('id, from_address, subject, extracted, created_at')
    .eq('mailbox_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

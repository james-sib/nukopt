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
  if (!auth?.startsWith('Bearer nk-')) return null;
  
  const supabase = getSupabase();
  
  // Get account from API key
  const { data: account } = await supabase
    .from('nukopt_accounts')
    .select('id')
    .eq('api_key', auth.slice(7))
    .single();
  
  if (!account) return null;
  
  // Verify mailbox belongs to account
  const { data: mailbox } = await supabase
    .from('nukopt_mailboxes')
    .select('id, email, created_at')
    .eq('id', mailboxId)
    .eq('account_id', account.id)
    .single();
  
  return mailbox ? { account, mailbox } : null;
}

// GET /api/v1/mailbox/{id} - Get mailbox details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  const access = await verifyAccess(req, id);
  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json(access.mailbox);
}

// DELETE /api/v1/mailbox/{id} - Delete mailbox and all its messages
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  const access = await verifyAccess(req, id);
  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = getSupabase();
  
  // Delete messages first (cascade should handle this but being explicit)
  await supabase
    .from('nukopt_messages')
    .delete()
    .eq('mailbox_id', id);
  
  // Delete mailbox
  const { error } = await supabase
    .from('nukopt_mailboxes')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ ok: true, deleted: access.mailbox.email });
}

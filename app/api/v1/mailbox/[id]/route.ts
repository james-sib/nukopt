import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiKey } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function verifyAccess(req: NextRequest, mailboxId: string): Promise<{ status: 'ok' | 'unauthorized' | 'not_found'; account?: any; mailbox?: any }> {
  // Use constant-time auth
  const authResult = await authenticateApiKey(req.headers.get('authorization'));
  if (!authResult.valid) return { status: 'unauthorized' };
  
  const supabase = getSupabase();
  
  // Verify mailbox belongs to account
  const { data: mailbox } = await supabase
    .from('nukopt_mailboxes')
    .select('id, email, created_at')
    .eq('id', mailboxId)
    .eq('account_id', authResult.accountId)
    .single();
  
  if (!mailbox) return { status: 'not_found', account: { id: authResult.accountId } };
  
  return { status: 'ok', account: { id: authResult.accountId }, mailbox };
}

// GET /api/v1/mailbox/{id} - Get mailbox details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  const access = await verifyAccess(req, id);
  if (access.status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (access.status === 'not_found') {
    return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
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
  if (access.status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (access.status === 'not_found') {
    return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
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

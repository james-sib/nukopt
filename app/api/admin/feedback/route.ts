import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/app/lib/adminAuth';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// GET - List all feedback (admin only)
export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const supabase = getSupabase();
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // open, resolved, closed
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    
    let query = supabase
      .from('nukopt_feedback')
      .select(`
        id,
        message,
        category,
        status,
        created_at,
        admin_response,
        responded_at,
        account_id,
        nukopt_accounts!inner(provider)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Admin feedback fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }
    
    // Transform to include provider
    const tickets = (data || []).map(ticket => ({
      id: ticket.id,
      message: ticket.message,
      category: ticket.category,
      status: ticket.status,
      created_at: ticket.created_at,
      admin_response: ticket.admin_response,
      responded_at: ticket.responded_at,
      provider: (ticket.nukopt_accounts as any)?.provider || 'unknown'
    }));
    
    return NextResponse.json({ tickets });
    
  } catch (error) {
    console.error('Admin feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Respond to feedback (admin only)
export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { id, admin_response, status } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }
    
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const updateData: Record<string, any> = {};
    if (admin_response !== undefined) {
      updateData.admin_response = admin_response;
      updateData.responded_at = new Date().toISOString();
    }
    if (status) {
      updateData.status = status;
    }
    
    const { error } = await supabase
      .from('nukopt_feedback')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Admin feedback update error:', error);
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Admin feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/**
 * Cleanup endpoint - deletes messages older than 7 days.
 * Call this via external cron (e.g., cron-job.org, GitHub Actions, etc.)
 * 
 * Requires: X-Cron-Secret header matching WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  // Verify secret
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  
  // Delete messages older than 7 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  
  const { data, error, count } = await supabase
    .from('nukopt_messages')
    .delete()
    .lt('created_at', cutoff.toISOString())
    .select('id');
  
  if (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const deleted = data?.length || 0;
  console.log(`Cleanup: deleted ${deleted} messages older than 7 days`);
  
  return NextResponse.json({ 
    ok: true, 
    deleted,
    cutoff: cutoff.toISOString()
  });
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'nukopt-cleanup',
    description: 'POST with X-Cron-Secret to delete messages older than 7 days'
  });
}

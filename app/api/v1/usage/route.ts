import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer nk-')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    const supabase = getSupabase();
    
    // Verify API key exists
    const { data: account } = await supabase
      .from('nukopt_accounts')
      .select('provider, created_at')
      .eq('api_key', apiKey)
      .single();
    
    if (!account) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    // Get usage stats
    const { data: usage, error } = await supabase
      .from('nukopt_usage')
      .select('model, timestamp')
      .eq('api_key', apiKey)
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayCount = usage?.filter(u => new Date(u.timestamp) >= today).length || 0;
    const monthCount = usage?.filter(u => new Date(u.timestamp) >= thisMonth).length || 0;
    const totalCount = usage?.length || 0;
    
    // Model breakdown
    const modelCounts: Record<string, number> = {};
    usage?.forEach(u => {
      modelCounts[u.model] = (modelCounts[u.model] || 0) + 1;
    });
    
    return NextResponse.json({
      provider: account.provider,
      account_created: account.created_at,
      usage: {
        today: todayCount,
        this_month: monthCount,
        total: totalCount,
      },
      models: modelCounts,
      recent: usage?.slice(0, 10).map(u => ({
        model: u.model,
        timestamp: u.timestamp,
      })),
    });
    
  } catch (error) {
    console.error('Usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return !!session?.value;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Verify admin session
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Total accounts
    const { count: totalAccounts } = await supabase
      .from('nukopt_accounts')
      .select('*', { count: 'exact', head: true });

    // Total mailboxes
    const { count: totalMailboxes } = await supabase
      .from('nukopt_mailboxes')
      .select('*', { count: 'exact', head: true });

    // Total messages
    const { count: totalMessages } = await supabase
      .from('nukopt_messages')
      .select('*', { count: 'exact', head: true });

    // Messages today
    const { count: messagesToday } = await supabase
      .from('nukopt_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Accounts this week
    const { count: accountsThisWeek } = await supabase
      .from('nukopt_accounts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    // Accounts this month
    const { count: accountsThisMonth } = await supabase
      .from('nukopt_accounts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo);

    // Provider breakdown
    const { data: providerData } = await supabase
      .from('nukopt_accounts')
      .select('provider');

    const providerCounts: Record<string, number> = {};
    providerData?.forEach((row: { provider: string }) => {
      providerCounts[row.provider] = (providerCounts[row.provider] || 0) + 1;
    });

    // Recent accounts (last 10)
    const { data: recentAccounts } = await supabase
      .from('nukopt_accounts')
      .select('id, provider, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Recent mailboxes (last 10)
    const { data: recentMailboxes } = await supabase
      .from('nukopt_mailboxes')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Messages with OTPs extracted (success rate)
    const { count: messagesWithOtp } = await supabase
      .from('nukopt_messages')
      .select('*', { count: 'exact', head: true })
      .not('otp', 'is', null);

    // Daily registration trend (last 7 days)
    const { data: dailyAccounts } = await supabase
      .from('nukopt_accounts')
      .select('created_at')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: true });

    const dailyTrend: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyTrend[date] = 0;
    }
    dailyAccounts?.forEach((row: { created_at: string }) => {
      const date = row.created_at.split('T')[0];
      if (dailyTrend[date] !== undefined) {
        dailyTrend[date]++;
      }
    });

    // Daily messages trend (last 7 days)
    const { data: dailyMessages } = await supabase
      .from('nukopt_messages')
      .select('created_at')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: true });

    const messageTrend: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      messageTrend[date] = 0;
    }
    dailyMessages?.forEach((row: { created_at: string }) => {
      const date = row.created_at.split('T')[0];
      if (messageTrend[date] !== undefined) {
        messageTrend[date]++;
      }
    });

    return NextResponse.json({
      overview: {
        totalAccounts: totalAccounts || 0,
        totalMailboxes: totalMailboxes || 0,
        totalMessages: totalMessages || 0,
        messagesToday: messagesToday || 0,
        accountsThisWeek: accountsThisWeek || 0,
        accountsThisMonth: accountsThisMonth || 0,
        otpSuccessRate: totalMessages ? Math.round(((messagesWithOtp || 0) / totalMessages) * 100) : 0,
      },
      providerBreakdown: providerCounts,
      recentAccounts: recentAccounts || [],
      recentMailboxes: recentMailboxes || [],
      trends: {
        registrations: dailyTrend,
        messages: messageTrend,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

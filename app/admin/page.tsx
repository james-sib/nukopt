'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  overview: {
    totalAccounts: number;
    totalMailboxes: number;
    totalMessages: number;
    messagesToday: number;
    accountsThisWeek: number;
    accountsThisMonth: number;
    otpSuccessRate: number;
  };
  providerBreakdown: Record<string, number>;
  recentAccounts: Array<{ id: string; provider: string; created_at: string }>;
  recentMailboxes: Array<{ id: string; email: string; created_at: string }>;
  trends: {
    registrations: Record<string, number>;
    messages: Record<string, number>;
  };
  generatedAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  const formatShortDate = (iso: string) => {
    return iso.split('T')[0].slice(5); // MM-DD
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!stats) return null;

  const maxReg = Math.max(...Object.values(stats.trends.registrations), 1);
  const maxMsg = Math.max(...Object.values(stats.trends.messages), 1);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">NukOpt Admin</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-500">
              Updated: {formatDate(stats.generatedAt)}
            </span>
            <button
              onClick={fetchStats}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Accounts</p>
            <p className="text-3xl font-bold text-blue-600">{stats.overview.totalAccounts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Mailboxes</p>
            <p className="text-3xl font-bold text-green-600">{stats.overview.totalMailboxes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Messages</p>
            <p className="text-3xl font-bold text-purple-600">{stats.overview.totalMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">OTP Success Rate</p>
            <p className="text-3xl font-bold text-orange-600">{stats.overview.otpSuccessRate}%</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Messages Today</p>
            <p className="text-2xl font-bold">{stats.overview.messagesToday}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">New Accounts (7 days)</p>
            <p className="text-2xl font-bold">{stats.overview.accountsThisWeek}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">New Accounts (30 days)</p>
            <p className="text-2xl font-bold">{stats.overview.accountsThisMonth}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Provider Breakdown */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Provider Breakdown</h2>
            <div className="space-y-2">
              {Object.entries(stats.providerBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([provider, count]) => (
                  <div key={provider} className="flex justify-between items-center">
                    <span className="capitalize">{provider}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-4 bg-blue-500 rounded"
                        style={{ width: `${(count / stats.overview.totalAccounts) * 100}px` }}
                      />
                      <span className="text-sm font-mono">{count}</span>
                    </div>
                  </div>
                ))}
              {Object.keys(stats.providerBreakdown).length === 0 && (
                <p className="text-gray-500 text-sm">No registrations yet</p>
              )}
            </div>
          </div>

          {/* Trends */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">7-Day Trends</h2>
            
            <p className="text-sm text-gray-500 mb-2">Registrations</p>
            <div className="flex items-end gap-1 h-16 mb-4">
              {Object.entries(stats.trends.registrations).map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(count / maxReg) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-400 mt-1">{formatShortDate(date)}</span>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 mb-2">Messages</p>
            <div className="flex items-end gap-1 h-16">
              {Object.entries(stats.trends.messages).map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-purple-500 rounded-t"
                    style={{ height: `${(count / maxMsg) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-400 mt-1">{formatShortDate(date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Accounts */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Recent Accounts</h2>
            <div className="space-y-2 text-sm">
              {stats.recentAccounts.map((acc) => (
                <div key={acc.id} className="flex justify-between border-b pb-2">
                  <span className="capitalize font-medium">{acc.provider}</span>
                  <span className="text-gray-500">{formatDate(acc.created_at)}</span>
                </div>
              ))}
              {stats.recentAccounts.length === 0 && (
                <p className="text-gray-500">No accounts yet</p>
              )}
            </div>
          </div>

          {/* Recent Mailboxes */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Recent Mailboxes</h2>
            <div className="space-y-2 text-sm">
              {stats.recentMailboxes.map((mb) => (
                <div key={mb.id} className="flex justify-between border-b pb-2">
                  <span className="font-mono">{mb.email}</span>
                  <span className="text-gray-500">{formatDate(mb.created_at)}</span>
                </div>
              ))}
              {stats.recentMailboxes.length === 0 && (
                <p className="text-gray-500">No mailboxes yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

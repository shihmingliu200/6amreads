'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

function getAdminKey() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('adminKey');
}

export default function BackstageDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const key = getAdminKey();
    if (!key) {
      router.push('/backstage');
      return;
    }

    const headers = { 'X-Admin-Key': key };

    Promise.all([
      fetch(`${API_URL}/admin/stats`, { headers }),
      fetch(`${API_URL}/admin/status`, { headers }),
      fetch(`${API_URL}/admin/members`, { headers }),
    ])
      .then(async ([statsRes, statusRes, membersRes]) => {
        if (statsRes.status === 401 || statusRes.status === 401 || membersRes.status === 401) {
          sessionStorage.removeItem('adminKey');
          router.push('/backstage');
          return;
        }
        const statsData = await statsRes.json();
        const statusData = await statusRes.json();
        const membersData = await membersRes.json();
        if (statsData.error) throw new Error(statsData.error);
        if (statusData.error) throw new Error(statusData.error);
        if (membersData.error) throw new Error(membersData.error);
        setStats(statsData);
        setStatus(statusData);
        setMembers(membersData.members || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleTriggerEmails = async () => {
    const key = getAdminKey();
    if (!key) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/trigger-emails`, {
        method: 'POST',
        headers: { 'X-Admin-Key': key },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      alert(`Sent: ${data.sent}, Failed: ${data.failed}, Total queued: ${data.total}`);
      const statsRes = await fetch(`${API_URL}/admin/stats`, { headers: { 'X-Admin-Key': key } });
      const statsData = await statsRes.json();
      if (statsData.totalEmailsSent != null) setStats(statsData);
      const stRes = await fetch(`${API_URL}/admin/status`, { headers: { 'X-Admin-Key': key } });
      const stData = await stRes.json();
      setStatus(stData);
    } catch (err) {
      setError(err.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminKey');
    router.push('/backstage');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-zinc-500">
        Loading…
      </div>
    );
  }

  const cron = status?.cron;
  const openPct =
    stats?.openRate != null ? `${Math.round(stats.openRate * 1000) / 10}%` : '—';

  return (
    <div className="min-h-screen bg-[#0c0c0c] px-4 py-8 text-zinc-100 md:px-8">
      <header className="mx-auto flex max-w-6xl flex-col gap-4 border-b border-zinc-800 pb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">6amreads Backstage</h1>
          <p className="mt-1 text-sm text-zinc-500">Users, sends, and system health</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTriggerEmails}
            disabled={sending}
            className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-500 disabled:opacity-50"
          >
            {sending ? 'Running job…' : 'Send emails now'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Log out
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-6 max-w-6xl rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats && (
          <>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-2xl font-semibold text-white">{stats.totalUsers}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Total users</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-2xl font-semibold text-white">{stats.totalProfiles}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Onboarding done</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-2xl font-semibold text-white">{stats.emailsSentToday ?? 0}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Emails sent today (UTC)</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-2xl font-semibold text-white">{openPct}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Open rate (logged)</p>
            </div>
          </>
        )}
      </div>

      <div className="mx-auto mt-6 grid max-w-6xl gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Engagement</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            <li className="flex justify-between">
              <span className="text-zinc-500">Total sends (all time)</span>
              <span>{stats?.totalEmailsSent ?? '—'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-500">Opens recorded</span>
              <span>{stats?.emailsOpened ?? '—'}</span>
            </li>
            <li className="mt-3 text-xs text-zinc-600">
              Open tracking improves when you wire SendGrid webhooks to set <code className="text-zinc-500">opened_at</code>{' '}
              on <code className="text-zinc-500">email_logs</code>.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Revenue (placeholder)</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            <li className="flex justify-between">
              <span className="text-zinc-500">MRR</span>
              <span>${((stats?.revenue?.mrrCents ?? 0) / 100).toFixed(2)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-zinc-500">Paying subscribers</span>
              <span>{stats?.revenue?.payingSubscribers ?? 0}</span>
            </li>
            <li className="text-xs text-zinc-600">{stats?.revenue?.note}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-6xl rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">System status</h2>
        <ul className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
          <li>
            <span className="text-zinc-500">Cron scheduled: </span>
            {cron?.scheduled ? (
              <span className="text-emerald-400">Yes</span>
            ) : (
              <span className="text-amber-400">No</span>
            )}
          </li>
          <li>
            <span className="text-zinc-500">Schedule / TZ: </span>
            <code className="text-xs text-zinc-400">
              {cron?.schedule || '—'} ({cron?.timezone || '—'})
            </code>
          </li>
          <li className="md:col-span-2">
            <span className="text-zinc-500">Last cron run started: </span>
            {cron?.lastRunStartedAt
              ? new Date(cron.lastRunStartedAt).toLocaleString()
              : '— (runs at next schedule tick)'}
          </li>
          <li className="md:col-span-2">
            <span className="text-zinc-500">Last cron run finished: </span>
            {cron?.lastRunFinishedAt ? new Date(cron.lastRunFinishedAt).toLocaleString() : '—'}
          </li>
          {cron?.lastRunError && (
            <li className="md:col-span-2 text-red-400">Last error: {cron.lastRunError}</li>
          )}
          <li className="md:col-span-2">
            <span className="text-zinc-500">Last email logged (any user): </span>
            {status?.lastEmailSentAt
              ? new Date(status.lastEmailSentAt).toLocaleString()
              : '—'}
          </li>
        </ul>
      </div>

      <section className="mx-auto mt-12 max-w-6xl">
        <h2 className="text-lg font-semibold text-white">All users</h2>
        {members.length === 0 ? (
          <p className="mt-4 text-zinc-500">No members yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Age</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Paused</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Joined</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <Link href={`/backstage/members/${m.id}`} className="text-amber-500 hover:underline">
                        {m.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{m.age ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{m.paused ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/backstage/members/${m.id}`} className="text-zinc-500 hover:text-zinc-300">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

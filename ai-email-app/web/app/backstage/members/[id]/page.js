'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import LanguagePicker from '@/components/LanguagePicker';

function getAdminKey() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('adminKey');
}

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const load = () => {
    const key = getAdminKey();
    if (!key || !id) {
      if (!key) router.push('/backstage');
      return;
    }
    fetch(`${API_URL}/admin/members/${id}`, {
      headers: { 'X-Admin-Key': key },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        const m = d.member;
        setForm({
          email: m.email || '',
          timezone: m.timezone || 'UTC',
          paused: Boolean(m.paused),
          delivery_hour: m.delivery_hour != null ? m.delivery_hour : 6,
          language: m.language || 'en',
          age: m.age ?? '',
          hobbies: m.hobbies ?? '',
          position: m.position ?? '',
          goal_5yr: m.goal_5yr ?? '',
          goal_10yr: m.goal_10yr ?? '',
          main_goal: m.main_goal ?? '',
          about_me: m.about_me ?? '',
          feedback_prefs: m.feedback_prefs ?? '',
        });
      })
      .catch((err) => {
        setError(err.message || 'Failed to load');
        if (String(err.message).includes('401')) {
          sessionStorage.removeItem('adminKey');
          router.push('/backstage');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when id changes
  }, [id, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    const key = getAdminKey();
    if (!key) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/members/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': key,
        },
        body: JSON.stringify({
          email: form.email,
          timezone: form.timezone,
          paused: form.paused,
          delivery_hour: Number(form.delivery_hour),
          language: form.language || 'en',
          age: Number(form.age),
          hobbies: form.hobbies,
          position: form.position,
          goal_5yr: form.goal_5yr,
          goal_10yr: form.goal_10yr,
          main_goal: form.main_goal,
          about_me: form.about_me,
          feedback_prefs: form.feedback_prefs || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Save failed');
      setData((prev) => ({ ...prev, member: d.member }));
      setEditOpen(false);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this user and all related data? This cannot be undone.')) return;
    const key = getAdminKey();
    if (!key) return;
    try {
      const res = await fetch(`${API_URL}/admin/members/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': key },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Delete failed');
      router.push('/backstage/dashboard');
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-zinc-500">
        {error || 'Loading…'}
      </div>
    );
  }

  const { member, emailLogs } = data;

  return (
    <div className="min-h-screen bg-[#0c0c0c] px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/backstage/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </Link>

        <header className="mt-6 flex flex-col gap-4 border-b border-zinc-800 pb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="break-all font-serif text-xl font-semibold md:text-2xl">{member.email}</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Joined {member.created_at ? new Date(member.created_at).toLocaleString() : '—'} · TZ{' '}
              {member.timezone || 'UTC'} · Delivery hour {member.delivery_hour ?? 6} ·{' '}
              {member.paused ? 'Paused' : 'Active'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-900"
            >
              Edit user
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300 hover:bg-red-950"
            >
              Delete user
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="mt-10 space-y-6 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          {[
            ['Language', member.language || 'en'],
            ['Age', member.age],
            ['Hobbies', member.hobbies],
            ['Position', member.position],
            ['5-year', member.goal_5yr],
            ['10-year', member.goal_10yr],
            ['Main goal', member.main_goal],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{val ?? '—'}</p>
            </div>
          ))}
          {member.about_me && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">About</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{member.about_me}</p>
            </div>
          )}
          {member.feedback_prefs && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Feedback prefs</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{member.feedback_prefs}</p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Email history</h2>
          {!emailLogs?.length ? (
            <p className="mt-4 text-sm text-zinc-500">No emails sent yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
              {emailLogs.map((log) => (
                <li key={log.id} className="flex flex-col gap-1 px-4 py-3 text-sm md:flex-row md:justify-between">
                  <span className="text-zinc-500">{new Date(log.sent_at).toLocaleString()}</span>
                  <span className="text-zinc-200">{log.subject}</span>
                  <span className="text-xs text-zinc-600">
                    {log.opened_at ? `Opened ${new Date(log.opened_at).toLocaleString()}` : 'Not opened (tracked)'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Edit member</h3>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              {[
                ['email', 'Email', 'email'],
                ['timezone', 'Timezone', 'text'],
                ['delivery_hour', 'Delivery hour (0–23)', 'number'],
                ['language', 'Language', 'language'],
                ['age', 'Age', 'number'],
                ['hobbies', 'Hobbies', 'text'],
                ['position', 'Position', 'text'],
                ['goal_5yr', '5-year goal', 'textarea'],
                ['goal_10yr', '10-year goal', 'textarea'],
                ['main_goal', 'Main goal', 'textarea'],
                ['about_me', 'About', 'textarea'],
                ['feedback_prefs', 'Feedback prefs', 'textarea'],
              ].map(([name, label, kind]) => (
                <label key={name} className="block">
                  <span className="text-xs text-zinc-500">{label}</span>
                  {kind === 'language' ? (
                    <div className="mt-1">
                      <LanguagePicker
                        value={form[name] ?? 'en'}
                        onChange={(v) => setForm({ ...form, [name]: v })}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  ) : kind === 'textarea' ? (
                    <textarea
                      name={name}
                      rows={2}
                      value={form[name] ?? ''}
                      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                    />
                  ) : (
                    <input
                      name={name}
                      type={kind}
                      value={form[name] ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [name]: kind === 'number' ? e.target.value : e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                    />
                  )}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.paused}
                  onChange={(e) => setForm({ ...form, paused: e.target.checked })}
                  className="rounded border-zinc-600"
                />
                Paused
              </label>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-600 py-2.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

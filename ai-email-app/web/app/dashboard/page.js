'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import NewspaperPreview from '@/components/NewspaperPreview';
import LanguagePicker from '@/components/LanguagePicker';
import { API_URL, getToken, clearToken, onboardingComplete } from '@/lib/api';

function formatHour(h) {
  if (h == null || h === '') return '6:00 AM';
  const x = Number(h);
  if (!Number.isFinite(x)) return `${h}`;
  const am = x < 12;
  const hour12 = x % 12 === 0 ? 12 : x % 12;
  return `${hour12}:00 ${am ? 'AM' : 'PM'}`;
}

function parseFeedbackPrefs(prefs) {
  if (!prefs || typeof prefs !== 'string') return { more: '', less: '' };
  const moreM = prefs.match(/More:\s*([^·]+)/);
  const lessM = prefs.match(/Less:\s*(.+)$/);
  return {
    more: moreM ? moreM[1].trim() : '',
    less: lessM ? lessM[1].trim() : '',
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [answers, setAnswers] = useState({
    age: '',
    hobbies: '',
    position: '',
    goal_5yr: '',
    goal_10yr: '',
    main_goal: '',
    about_me: '',
  });
  const [timezone, setTimezone] = useState('UTC');
  const [deliveryHour, setDeliveryHour] = useState(6);
  const [language, setLanguage] = useState('en');
  const [paused, setPaused] = useState(false);
  const [feedbackMore, setFeedbackMore] = useState('');
  const [feedbackLess, setFeedbackLess] = useState('');

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearToken();
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load profile');
      const p = data.profile;
      if (!onboardingComplete(p)) {
        router.replace('/onboarding');
        return;
      }
      setProfile(p);
      setAnswers({
        age: p.age ?? '',
        hobbies: p.hobbies ?? '',
        position: p.position ?? '',
        goal_5yr: p.goal_5yr ?? '',
        goal_10yr: p.goal_10yr ?? '',
        main_goal: p.main_goal ?? '',
        about_me: p.about_me ?? '',
      });
      setTimezone(p.timezone || 'UTC');
      setDeliveryHour(p.delivery_hour != null ? Number(p.delivery_hour) : 6);
      setLanguage(p.language || 'en');
      setPaused(Boolean(p.paused));
      const fb = parseFeedbackPrefs(p.feedback_prefs);
      setFeedbackMore(fb.more);
      setFeedbackLess(fb.less);
    } catch (e) {
      setLoadError(e.message || 'Could not load profile');
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body) => {
    const token = getToken();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setProfile(data.profile);
      setMessage('Saved.');
      setTimeout(() => setMessage(''), 2500);
    } catch (e) {
      setMessage(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-cream-50 px-6 py-20 text-center text-red-800">
        <p>{loadError}</p>
        <Link href="/" className="mt-4 inline-block text-accent">
          Home
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 text-ink-700">
        Loading your desk…
      </div>
    );
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-cream-50 pb-20">
      <header className="border-b border-cream-200 bg-cream-50/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-ink-700 hover:text-ink-900">
              Home
            </Link>
            <button type="button" onClick={handleLogout} className="font-medium text-accent hover:text-accent-hover">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-12 px-6 py-10">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink-900">Your desk</h1>
          <p className="mt-2 text-sm text-ink-700">
            Profile, preview, and preferences — everything that shapes tomorrow&apos;s edition.
          </p>
          {message && <p className="mt-3 text-sm text-accent">{message}</p>}
        </div>

        <section className="rounded-2xl border border-cream-300 bg-white p-6 shadow-paper md:p-8">
          <h2 className="font-serif text-xl font-semibold text-ink-900">Profile summary</h2>
          <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-700">Email</dt>
              <dd className="mt-1 text-ink-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-700">Age</dt>
              <dd className="mt-1 text-ink-900">{profile.age}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-700">Position</dt>
              <dd className="mt-1 text-ink-900">{profile.position}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-700">Main goal</dt>
              <dd className="mt-1 leading-relaxed text-ink-900">{profile.main_goal}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-ink-900">Newspaper preview</h2>
          <p className="mt-2 text-sm text-ink-700">A rough layout of what hits your inbox.</p>
          <div className="mt-6">
            <NewspaperPreview profile={profile} email={profile.email} />
          </div>
        </section>

        <section className="rounded-2xl border border-cream-300 bg-white p-6 shadow-paper md:p-8">
          <h2 className="font-serif text-xl font-semibold text-ink-900">Your seven answers</h2>
          <p className="mt-2 text-sm text-ink-700">Edit anytime — changes apply to the next send.</p>
          <div className="mt-6 space-y-4">
            {[
              ['age', 'Age', 'number'],
              ['hobbies', 'Hobbies', 'text'],
              ['position', 'Position', 'text'],
              ['goal_5yr', 'In 5 years', 'textarea'],
              ['goal_10yr', 'In 10 years', 'textarea'],
              ['main_goal', 'Main goal right now', 'textarea'],
              ['about_me', 'About you', 'textarea'],
            ].map(([key, label, kind]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-ink-700">{label}</span>
                {kind === 'textarea' ? (
                  <textarea
                    name={key}
                    rows={3}
                    value={answers[key]}
                    onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                ) : (
                  <input
                    name={key}
                    type={kind}
                    value={answers[key]}
                    onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                )}
              </label>
            ))}
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                patch({
                  age: Number(answers.age),
                  hobbies: answers.hobbies,
                  position: answers.position,
                  goal_5yr: answers.goal_5yr,
                  goal_10yr: answers.goal_10yr,
                  main_goal: answers.main_goal,
                  about_me: answers.about_me,
                })
              }
              className="mt-4 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-semibold text-cream-50 hover:bg-ink-800 disabled:opacity-50"
            >
              Save answers
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-cream-300 bg-white p-6 shadow-paper md:p-8">
          <h2 className="font-serif text-xl font-semibold text-ink-900">Email preferences</h2>
          <p className="mt-2 text-sm text-ink-700">
            Delivery time uses your timezone setting (IANA name, e.g. <code className="rounded bg-cream-100 px-1">America/New_York</code>
            ). Your language affects lesson content, news summaries, and email labels.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-700">Language</span>
              <div className="mt-1.5">
                <LanguagePicker
                  value={language}
                  onChange={setLanguage}
                  disabled={saving}
                  className="w-full rounded-lg border border-cream-300 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-700">Delivery hour (local)</span>
              <select
                value={deliveryHour}
                onChange={(e) => setDeliveryHour(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-cream-300 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-700">Timezone</span>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="America/Chicago"
                className="mt-1.5 w-full rounded-lg border border-cream-300 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => patch({ delivery_hour: deliveryHour, timezone, language })}
            className="mt-6 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-semibold text-cream-50 hover:bg-ink-800 disabled:opacity-50"
          >
            Save email preferences
          </button>
        </section>

        <section className="rounded-2xl border border-cream-300 bg-white p-6 shadow-paper md:p-8">
          <h2 className="font-serif text-xl font-semibold text-ink-900">Feedback for tomorrow</h2>
          <p className="mt-2 text-sm text-ink-700">What should we lean into — or ease up on — in your next edition?</p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-700">More of…</span>
              <textarea
                rows={2}
                value={feedbackMore}
                onChange={(e) => setFeedbackMore(e.target.value)}
                placeholder="e.g. shorter news, more career depth…"
                className="mt-1.5 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-700">Less of…</span>
              <textarea
                rows={2}
                value={feedbackLess}
                onChange={(e) => setFeedbackLess(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-cream-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => patch({ feedback_more: feedbackMore, feedback_less: feedbackLess })}
              className="rounded-full bg-ink-900 px-6 py-2.5 text-sm font-semibold text-cream-50 hover:bg-ink-800 disabled:opacity-50"
            >
              Save feedback
            </button>
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-cream-300 bg-cream-100/80 p-6 md:flex-row md:items-center md:p-8">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink-900">Delivery</h2>
            <p className="mt-1 text-sm text-ink-700">
              {paused ? 'You will not receive emails until you resume.' : `Scheduled around ${formatHour(deliveryHour)} in ${timezone}.`}
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-full border border-cream-300 bg-white px-5 py-2.5">
            <input
              type="checkbox"
              checked={paused}
              onChange={async (e) => {
                const next = e.target.checked;
                const prev = paused;
                setPaused(next);
                const token = getToken();
                setSaving(true);
                setMessage('');
                try {
                  const res = await fetch(`${API_URL}/profile`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ paused: next }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Update failed');
                  setProfile(data.profile);
                  setMessage(next ? 'Delivery paused.' : 'Delivery resumed.');
                  setTimeout(() => setMessage(''), 2500);
                } catch (err) {
                  setPaused(prev);
                  setMessage(err.message || 'Could not update');
                } finally {
                  setSaving(false);
                }
              }}
              className="h-4 w-4 rounded border-cream-400 text-accent focus:ring-accent"
            />
            <span className="text-sm font-medium text-ink-900">Pause delivery</span>
          </label>
        </section>
      </main>
    </div>
  );
}

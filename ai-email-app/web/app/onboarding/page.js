'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { API_URL, fetchProfile, onboardingComplete } from '@/lib/api';

const QUESTIONS = [
  {
    name: 'age',
    label: 'How old are you?',
    type: 'number',
    placeholder: 'e.g. 28',
    hint: 'We use this to tune tone and examples — never shared.',
  },
  {
    name: 'hobbies',
    label: 'What are your hobbies?',
    type: 'text',
    placeholder: 'Reading, running, photography…',
    hint: 'Helps us weave in references you actually care about.',
  },
  {
    name: 'position',
    label: 'What is your position?',
    type: 'text',
    placeholder: 'Job title / company, or student / university / major',
    hint: 'Job, company, student path — whatever describes you best.',
  },
  {
    name: 'goal_5yr',
    label: 'Where do you see yourself in 5 years?',
    type: 'textarea',
    placeholder: 'A sentence or two is enough.',
    hint: 'We anchor lessons to the direction you want to go.',
  },
  {
    name: 'goal_10yr',
    label: 'Where do you see yourself in 10 years?',
    type: 'textarea',
    placeholder: 'Dream big — we’ll keep it grounded in your day-to-day.',
    hint: 'Long horizon helps us connect today’s lesson to the bigger picture.',
  },
  {
    name: 'main_goal',
    label: 'What is your main goal right now?',
    type: 'textarea',
    placeholder: 'The one thing you’re actively working toward.',
    hint: 'This is the north star for your daily edition.',
  },
  {
    name: 'about_me',
    label: 'Write a brief statement about yourself…',
    type: 'textarea',
    placeholder: 'Voice, values, what you’re curious about — a short paragraph.',
    hint: 'The more “you” this feels, the better your paper reads.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('questions');
  const [form, setForm] = useState({
    age: '',
    hobbies: '',
    position: '',
    goal_5yr: '',
    goal_10yr: '',
    main_goal: '',
    about_me: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/signup');
      return;
    }
    fetchProfile(token).then((p) => {
      if (onboardingComplete(p)) {
        router.replace('/dashboard');
        return;
      }
      setChecking(false);
    });
  }, [router]);

  const q = QUESTIONS[step];
  const progressPct = phase === 'done' ? 100 : ((step + 1) / 7) * 100;

  const currentValid = () => {
    const v = form[q.name];
    if (v === '' || v === undefined) return false;
    if (q.name === 'age') {
      const n = Number(v);
      return Number.isFinite(n) && n >= 1 && n <= 120;
    }
    return String(v).trim().length > 0;
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleNext = () => {
    if (!currentValid()) return;
    if (step < 6) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentValid()) return;
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/signup');
      return;
    }

    try {
      const payload = {
        ...form,
        age: Number(form.age),
      };
      const res = await fetch(`${API_URL}/profile/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setPhase('done');
    } catch {
      setError('Could not connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 text-ink-700">
        Loading…
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-cream-50 px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <p className="mt-12 text-4xl" aria-hidden>
            ☀️
          </p>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-ink-900 md:text-4xl">
            Your first newspaper arrives tomorrow at 6 AM!
          </h1>
          <p className="mt-4 text-ink-700">
            We&apos;ll email you at the delivery time in your settings (default 6:00 AM). You can adjust it anytime
            from your dashboard.
          </p>
          <Link
            href="/dashboard"
            className="mt-10 inline-flex rounded-full bg-ink-900 px-8 py-3.5 text-sm font-semibold text-cream-50 transition hover:bg-ink-800"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-10 md:py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>

        <p className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-accent">Onboarding</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink-900 md:text-3xl">{q.label}</h1>
        {q.hint && <p className="mt-2 text-sm text-ink-700">{q.hint}</p>}

        <div className="mt-8">
          <div className="h-1.5 overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs text-ink-700">
            Question {step + 1} of 7
          </p>
        </div>

        <form
          onSubmit={step === 6 ? handleSubmit : (e) => e.preventDefault()}
          className="mt-10 space-y-6"
        >
          {q.type === 'textarea' ? (
            <textarea
              id={q.name}
              name={q.name}
              rows={5}
              placeholder={q.placeholder}
              value={form[q.name]}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-cream-300 bg-white px-4 py-3 text-ink-900 outline-none ring-accent/30 transition focus:border-accent focus:ring-2"
            />
          ) : (
            <input
              id={q.name}
              name={q.name}
              type={q.type}
              placeholder={q.placeholder}
              value={form[q.name]}
              onChange={handleChange}
              required
              min={q.name === 'age' ? 1 : undefined}
              max={q.name === 'age' ? 120 : undefined}
              className="w-full rounded-lg border border-cream-300 bg-white px-4 py-3 text-ink-900 outline-none ring-accent/30 transition focus:border-accent focus:ring-2"
            />
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="text-sm font-medium text-ink-700 hover:text-ink-900 disabled:opacity-30"
            >
              ← Back
            </button>
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!currentValid()}
                className="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-ink-800 disabled:opacity-40"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !currentValid()}
                className="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-ink-800 disabled:opacity-40"
              >
                {loading ? 'Saving…' : 'Finish'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

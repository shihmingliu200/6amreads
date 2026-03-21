'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { API_URL } from '@/lib/api';
import { postGoogleCredential, redirectAfterAuth } from '@/lib/authRedirect';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      localStorage.setItem('token', data.token);
      router.push('/onboarding');
    } catch {
      setError('Could not connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (cred) => {
    setError('');
    setLoading(true);
    try {
      const data = await postGoogleCredential(cred.credential);
      localStorage.setItem('token', data.token);
      await redirectAfterAuth(router);
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-10 font-serif text-3xl font-semibold text-ink-900">Create your account</h1>
        <p className="mt-2 text-sm text-ink-700">Start your personalized morning newspaper.</p>

        <div className="mt-8 space-y-6">
          <GoogleSignInButton
            onSuccess={handleGoogle}
            onError={() => setError('Google sign-in was cancelled or failed.')}
            disabled={loading}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-cream-50 px-3 text-ink-700">or email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-ink-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-lg border border-cream-300 bg-white px-4 py-3 text-ink-900 outline-none ring-accent/30 transition focus:border-accent focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-ink-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="mt-1.5 w-full rounded-lg border border-cream-300 bg-white px-4 py-3 text-ink-900 outline-none ring-accent/30 transition focus:border-accent focus:ring-2"
              />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink-900 py-3.5 text-sm font-semibold text-cream-50 transition hover:bg-ink-800 disabled:opacity-60"
            >
              {loading ? 'Please wait…' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-700">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

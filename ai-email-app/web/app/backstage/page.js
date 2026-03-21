'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

export default function BackstageLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'X-Admin-Key': key },
      });

      if (!res.ok) {
        if (res.status === 401) setError('Invalid admin key.');
        else setError('Something went wrong.');
        return;
      }

      sessionStorage.setItem('adminKey', key);
      router.push('/backstage/dashboard');
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] px-6 py-16 text-zinc-100">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← 6amreads.com
        </Link>
        <h1 className="mt-10 font-serif text-2xl font-semibold tracking-tight">Backstage</h1>
        <p className="mt-2 text-sm text-zinc-500">Admin access only. Enter your server admin key.</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <input
            type="password"
            placeholder="Admin key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-amber-900/30 focus:border-zinc-600 focus:ring-2"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

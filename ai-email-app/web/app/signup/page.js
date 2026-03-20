'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    } catch (err) {
      setError('Could not connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '400px', margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ marginBottom: '8px' }}>Create your account</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Start receiving your personalized morning email.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          name="password"
          type="password"
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ marginTop: '24px', color: '#555' }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  );
}

const inputStyle = {
  padding: '12px 14px',
  fontSize: '1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  outline: 'none',
};

const buttonStyle = {
  padding: '12px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
};

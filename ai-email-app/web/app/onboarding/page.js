'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const questions = [
  { name: 'age',       label: 'How old are you?',                           type: 'number', placeholder: '25' },
  { name: 'hobbies',   label: 'What are your hobbies?',                     type: 'text',   placeholder: 'Reading, running, cooking...' },
  { name: 'position',  label: 'What is your job / role / field of study?',  type: 'text',   placeholder: 'Software engineer at Acme / CS student at MIT' },
  { name: 'goal_5yr',  label: 'Where do you see yourself in 5 years?',      type: 'text',   placeholder: 'Lead engineer at a startup...' },
  { name: 'goal_10yr', label: 'Where do you see yourself in 10 years?',     type: 'text',   placeholder: 'CTO of my own company...' },
  { name: 'main_goal', label: 'What is your main goal right now?',          type: 'text',   placeholder: 'Learn machine learning, get promoted...' },
  { name: 'about_me',  label: 'Tell us a bit about yourself.',              type: 'textarea', placeholder: 'I am someone who...' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    age: '', hobbies: '', position: '', goal_5yr: '',
    goal_10yr: '', main_goal: '', about_me: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/signup');
      return;
    }

    try {
      const payload = { ...form, age: Number(form.age) };
      const res = await fetch(`${API_URL}/profile/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setDone(true);
    } catch (err) {
      setError('Could not connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem' }}>🎉 You're all set!</h1>
        <p style={{ color: '#555', fontSize: '1.1rem', marginTop: '16px', lineHeight: '1.6' }}>
          Your first personalized morning email arrives tomorrow morning.
          Check your inbox around 6 AM.
        </p>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '560px', margin: '60px auto', padding: '0 24px' }}>
      <h1 style={{ marginBottom: '8px' }}>Tell us about yourself</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>7 quick questions so we can personalize your daily email.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {questions.map((q) => (
          <div key={q.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.95rem' }}>{q.label}</label>
            {q.type === 'textarea' ? (
              <textarea
                name={q.name}
                placeholder={q.placeholder}
                value={form[q.name]}
                onChange={handleChange}
                required
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            ) : (
              <input
                name={q.name}
                type={q.type}
                placeholder={q.placeholder}
                value={form[q.name]}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            )}
          </div>
        ))}

        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Saving...' : 'Save & Get My Morning Email →'}
        </button>
      </form>
    </main>
  );
}

const inputStyle = {
  padding: '12px 14px',
  fontSize: '1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const buttonStyle = {
  padding: '14px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
};

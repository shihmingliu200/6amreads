import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>☀️ Your Personalized Morning Email</h1>
      <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '40px', lineHeight: '1.6' }}>
        Every morning, get a custom email with lessons tied to your goals,
        relevant world news, and sources — all tailored to you.
      </p>
      <Link href="/signup" style={{
        background: '#1a1a1a',
        color: '#fff',
        padding: '14px 32px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '1rem',
        fontWeight: '600',
      }}>
        Get Started — It's Free
      </Link>
    </main>
  );
}

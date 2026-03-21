import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';
import SiteFooter from '@/components/SiteFooter';

const steps = [
  { n: '1', title: 'Sign up', text: 'Create your account in seconds — email or Google.' },
  { n: '2', title: 'Answer 7 questions', text: 'We learn your goals, interests, and story — one screen at a time.' },
  { n: '3', title: 'Read at 6 AM', text: 'Your newspaper lands in your inbox, every morning.' },
];

const features = [
  {
    title: 'Personalized lessons',
    body: 'Daily coaching that references your goals, role, and hobbies — not generic advice.',
  },
  {
    title: 'World news, distilled',
    body: 'Headlines with context, aligned to what matters to you — with sources you can trust.',
  },
  {
    title: 'Feedback loop',
    body: 'Tell us what to lean into or pull back on; tomorrow\'s edition listens.',
  },
  {
    title: 'Transparent sources',
    body: 'We point to primary reporting and docs so you can go deeper anytime.',
  },
];

export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden border-b border-cream-200">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cream-200/60 via-cream-50 to-cream-50" />
          <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
            <p className="font-sans text-sm font-medium uppercase tracking-[0.25em] text-accent">6amreads.com</p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight text-ink-900 md:text-6xl md:leading-[1.1]">
              Your morning.
              <br />
              <span className="text-ink-700">Personalized.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700 md:text-xl">
              The personalized AI morning newspaper — editorial tone, warm layout, and real utility. One email at 6 AM
              with lessons for your goals, world news that fits your life, and room to steer what comes next.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-ink-900 px-8 py-3.5 text-sm font-semibold text-cream-50 shadow-paper transition hover:bg-ink-800"
              >
                Start reading tomorrow morning
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-cream-300 bg-white px-8 py-3.5 text-sm font-semibold text-ink-800 transition hover:border-cream-400"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        <section id="how" className="border-b border-cream-200 bg-cream-100/50 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-serif text-3xl font-semibold text-ink-900 md:text-4xl">How it works</h2>
            <p className="mt-3 max-w-2xl text-ink-700">Three steps from signup to your first edition.</p>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((s) => (
                <li key={s.n} className="relative">
                  <span className="font-serif text-5xl font-semibold text-cream-300">{s.n}</span>
                  <h3 className="mt-2 font-serif text-xl font-semibold text-ink-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-serif text-3xl font-semibold text-ink-900 md:text-4xl">What you get</h2>
            <p className="mt-3 max-w-2xl text-ink-700">Built like a newspaper — powered for you.</p>
            <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:gap-12">
              {features.map((f) => (
                <li key={f.title} className="border-l-2 border-accent pl-6">
                  <h3 className="font-serif text-lg font-semibold text-ink-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{f.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-16 rounded-2xl border border-cream-300 bg-white p-10 text-center shadow-paper md:p-14">
              <p className="font-serif text-2xl text-ink-900 md:text-3xl">Ready for a calmer morning routine?</p>
              <Link
                href="/signup"
                className="mt-8 inline-flex rounded-full bg-ink-900 px-10 py-4 text-sm font-semibold text-cream-50 transition hover:bg-ink-800"
              >
                Start reading tomorrow morning
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

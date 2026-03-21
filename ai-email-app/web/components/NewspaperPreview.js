export default function NewspaperPreview({ profile, email }) {
  const name = email?.split('@')[0] || 'Reader';

  return (
    <div className="overflow-hidden rounded-lg border border-cream-300 bg-white shadow-paper">
      <div className="border-b border-cream-200 bg-gradient-to-br from-ink-900 to-ink-800 px-6 py-8 text-center text-cream-50">
        <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-cream-200">6amreads</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold">Good morning, {name}</h3>
        <p className="mt-1 font-sans text-sm text-cream-200">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="space-y-6 px-6 py-8 font-serif text-ink-800">
        <section>
          <h4 className="border-b border-cream-200 pb-2 font-sans text-xs font-semibold uppercase tracking-wider text-accent">
            Today&apos;s lesson
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            {profile?.main_goal
              ? `A short, personalized note tied to your goal: "${String(profile.main_goal).slice(0, 120)}${String(profile.main_goal).length > 120 ? '…' : ''}" — plus one actionable idea for your day.`
              : 'Complete onboarding to unlock lessons crafted around your goals and interests.'}
          </p>
        </section>
        <section>
          <h4 className="border-b border-cream-200 pb-2 font-sans text-xs font-semibold uppercase tracking-wider text-accent">
            World news
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            Curated headlines with context — matched to what you care about, with clear sources.
          </p>
        </section>
        <section>
          <h4 className="border-b border-cream-200 pb-2 font-sans text-xs font-semibold uppercase tracking-wider text-accent">
            Sources & feedback
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            Every edition links out to primary sources. Your feedback shapes the next morning&apos;s paper.
          </p>
        </section>
      </div>
    </div>
  );
}

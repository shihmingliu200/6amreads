import Link from 'next/link';
import Logo from './Logo';

export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-cream-200/80 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-800">
          <Link href="/login" className="hover:text-accent">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-ink-900 px-4 py-2 text-cream-50 transition hover:bg-ink-800"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}

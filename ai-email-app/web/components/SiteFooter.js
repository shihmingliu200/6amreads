import Logo from './Logo';

export default function SiteFooter() {
  return (
    <footer className="border-t border-cream-300 bg-cream-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-14 md:flex-row md:justify-between">
        <Logo />
        <p className="max-w-md text-center text-sm text-ink-700 md:text-right">
          Your personalized morning newspaper — tailored lessons, world news, and sources in one calm read.
        </p>
      </div>
      <div className="border-t border-cream-200 py-4 text-center text-xs text-ink-700">
        © {new Date().getFullYear()} 6amreads.com
      </div>
    </footer>
  );
}

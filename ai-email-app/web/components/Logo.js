import Link from 'next/link';

export default function Logo({ className = '', href = '/' }) {
  return (
    <Link
      href={href}
      className={`font-serif text-xl tracking-tight text-ink-900 md:text-2xl ${className}`}
    >
      <span className="font-semibold">6am</span>
      <span className="font-normal text-ink-700">reads</span>
      <span className="ml-0.5 text-sm font-sans font-normal text-accent md:text-base">.com</span>
    </Link>
  );
}

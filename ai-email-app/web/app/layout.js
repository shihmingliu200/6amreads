import { Cormorant_Garamond, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://6amreads.com'),
  title: '6amreads — Your personalized morning newspaper',
  description:
    'A calm, editorial daily email at 6 AM — personalized lessons, world news, and sources tailored to you.',
  openGraph: {
    title: '6amreads — Your personalized morning newspaper',
    description: 'Your morning. Personalized. Delivered by email every day at 6 AM.',
    url: 'https://6amreads.com',
    siteName: '6amreads',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-cream-50 font-sans text-ink-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

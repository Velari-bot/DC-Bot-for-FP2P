import type { Metadata } from 'next';
import './globals.css';
import './home-styles.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PathGen v2 - AI Coaches for Every Fortnite Player',
  description: 'Your personal Fortnite coach — powered by AI. PathGen analyzes your gameplay, builds training routines, and gives you real-time insights to help you play smarter and climb faster.',
  icons: {
    icon: '/Logo.png',
    shortcut: '/Logo.png',
    apple: '/Logo.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://pathgen.dev',
    title: 'PathGen v2 - AI Coaches for Every Fortnite Player',
    description: 'Your personal Fortnite coach — powered by AI. PathGen analyzes your gameplay, builds training routines, and gives you real-time insights to help you play smarter and climb faster.',
    images: [
      {
        url: 'https://pathgen.dev/embed.png',
        width: 1200,
        height: 630,
        alt: 'PathGen AI - Fortnite Coaching',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PathGen v2 - AI Coaches for Every Fortnite Player',
    description: 'Your personal Fortnite coach — powered by AI. PathGen analyzes your gameplay, builds training routines, and gives you real-time insights to help you play smarter and climb faster.',
    images: ['https://pathgen.dev/embed.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0A0A0A', color: '#FFFFFF', margin: 0, padding: 0 }}>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}

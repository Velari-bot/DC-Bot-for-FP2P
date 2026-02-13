import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fortnite Masterclass by DestinysJesus | Official PathGen Partner',
  description: 'Level up faster with the world\'s best Fortnite Masterclasses. Trusted by 28+ pros. Over 200+ fighting lessons. Become an elite player faster with PathGen + the Fighting & Solos Masterclasses.',
};

export default function MasterclassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

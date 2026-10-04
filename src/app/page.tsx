import type { Metadata } from 'next';
import LandingPageClient from '@/components/marketing/LandingPageClient';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const title = 'Allatura — Contracts, renewals & commercial control';
const description =
  'Never lose visibility over contracts, renewals, suppliers, payments, and construction workflows. Centralise documents, claims, and portfolio financials in one multi-tenant platform.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title,
  description,
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Allatura',
    type: 'website',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <LandingPageClient />;
}

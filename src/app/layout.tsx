import { Inter } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import './globals.css';
import { Suspense } from 'react';

const inter = Inter({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Plutus, IT spend intelligence',
  description: 'Systems, contracts, renewals, and analytics in one dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeRegistry>
          <Suspense>{children}</Suspense>
        </ThemeRegistry>
      </body>
    </html>
  );
}

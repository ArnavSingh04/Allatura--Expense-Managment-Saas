import { Inter } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import './globals.css';
import { Suspense } from 'react';
import Script from 'next/script';

const inter = Inter({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Plutus, IT spend intelligence',
  description: 'Systems, contracts, renewals, and analytics in one dashboard.',
};

const THEME_STORAGE_SYNC_SCRIPT = `(function(){try{var k='plutus-color-mode';var v=localStorage.getItem(k);var m='light';if(v==='dark'||v==='light')m=v;document.documentElement.dataset.theme=m;document.documentElement.style.colorScheme=m;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script
          id="plutus-theme-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_STORAGE_SYNC_SCRIPT }}
        />
        <ThemeRegistry>
          <Suspense>{children}</Suspense>
        </ThemeRegistry>
      </body>
    </html>
  );
}

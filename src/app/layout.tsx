import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import './globals.css';
import { Suspense } from 'react';
import Script from 'next/script';
import type { ColorModePreference } from '@/lib/colorModeContext';
import { AuthSessionProvider } from '@/contexts/AuthSessionContext';

const inter = Inter({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Allatura, IT spend intelligence',
  description: 'Systems, contracts, renewals, and analytics in one dashboard.',
};

const THEME_STORAGE_SYNC_SCRIPT = `(function(){try{var k='plutus-color-mode';var v=localStorage.getItem(k);var m='light';if(v==='dark'||v==='light')m=v;document.documentElement.dataset.theme=m;document.documentElement.style.colorScheme=m;document.cookie=k+'='+m+';path=/;max-age=31536000;SameSite=Lax';}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get('plutus-color-mode')?.value;
  const initialColorMode: ColorModePreference =
    cookieVal === 'dark' || cookieVal === 'light' ? cookieVal : 'light';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script
          id="plutus-theme-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_STORAGE_SYNC_SCRIPT }}
        />
        <ThemeRegistry initialColorMode={initialColorMode}>
          <AuthSessionProvider>
            <Suspense>{children}</Suspense>
          </AuthSessionProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}

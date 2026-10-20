import { cookies } from 'next/headers';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import './globals.css';
import { Suspense } from 'react';
import Script from 'next/script';
import type { ColorModePreference } from '@/lib/colorModeContext';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { AuthSessionProvider } from '@/contexts/AuthSessionContext';
import { notoSerif, plusJakarta } from './fonts';

export const metadata = {
  title: 'Allatura — project delivery & commercial control',
  description:
    'Portfolio visibility, project financials, contracts, variations, claims, documents, and audit—built for teams delivering capital work.',
};

const THEME_STORAGE_SYNC_SCRIPT = `(function(){try{var k='plutus-color-mode';var v=localStorage.getItem(k);var m='light';if(v==='dark'||v==='light')m=v;document.documentElement.dataset.theme=m;document.documentElement.style.colorScheme=m;document.cookie=k+'='+m+';path=/;max-age=31536000;SameSite=Lax';}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get('plutus-color-mode')?.value;
  const initialColorMode: ColorModePreference =
    cookieVal === 'dark' || cookieVal === 'light' ? cookieVal : 'light';

  return (
    <html lang="en" className={`${plusJakarta.variable} ${notoSerif.variable}`} suppressHydrationWarning>
      <body className={plusJakarta.className} suppressHydrationWarning>
        <Script
          id="plutus-theme-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_STORAGE_SYNC_SCRIPT }}
        />
        <Auth0Provider>
          <ThemeRegistry initialColorMode={initialColorMode}>
            <AuthSessionProvider>
              <Suspense>{children}</Suspense>
            </AuthSessionProvider>
          </ThemeRegistry>
        </Auth0Provider>
      </body>
    </html>
  );
}

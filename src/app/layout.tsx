import { Poppins } from 'next/font/google'
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import './globals.css'
import { Suspense } from 'react';

const inter = Poppins({ weight: '400', style: 'normal', subsets: ['latin'] });

export const metadata = {
  title: 'ABA Frontend WEB APP',
  description: 'ABA Frontend App',
}


export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeRegistry>
          <Suspense>
            {children}
          </Suspense>
        </ThemeRegistry>
      </body>
    </html>
  )
}

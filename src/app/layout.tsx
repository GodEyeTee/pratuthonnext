// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

import { DEFAULT_LOCALE, translations, type Locale } from '@/lib/i18n.config';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Pratuthong - Rooms Management System',
    template: '%s | Pratuthong',
  },
  description: 'Modern rooms management and monitoring system',
  keywords: ['rooms', 'rent', 'monitoring', 'management', 'IoT'],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // 👈 ต้อง await
  const raw = cookieStore.get('locale')?.value as Locale | undefined;
  const locale: Locale =
    raw && ['th', 'en'].includes(raw) ? raw : DEFAULT_LOCALE;
  const messages = translations[locale];

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages as any}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

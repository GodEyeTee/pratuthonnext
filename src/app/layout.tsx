import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบ Authentication ด้วย Next.js 15 + Supabase',
  description:
    'ระบบจัดการผู้ใช้งานที่ปลอดภัยด้วย Next.js 15, Supabase และ Sentry',
  keywords: ['authentication', 'nextjs', 'supabase', 'react'],
  authors: [{ name: 'Your Team Name' }],

  openGraph: {
    title: 'ระบบ Authentication ด้วย Next.js 15 + Supabase',
    description: 'ระบบจัดการผู้ใช้งานที่ปลอดภัย',
    type: 'website',
    locale: 'th_TH',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}

        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#3b82f6" />
      </head>

      <body className="font-sans antialiased bg-white text-gray-900">
        {/* ✅ Accessibility skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>

        {/* ✅ Main content wrapper */}
        <div id="main-content">{children}</div>

        {/* ✅ Development helpers */}
        {process.env.NODE_ENV === 'development' && <DevTools />}
      </body>
    </html>
  );
}

/**
 * Development Tools Component
 */
function DevTools() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
        <div>ENV: {process.env.NODE_ENV}</div>
        <div>Next.js: Local Dev</div>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <div>Supabase: ✅</div>}
        {process.env.NEXT_PUBLIC_SENTRY_DSN && <div>Sentry: ✅</div>}
      </div>
    </div>
  );
}

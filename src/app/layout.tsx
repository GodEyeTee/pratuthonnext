import AppNavbar from '@/components/layout/AppNavbar';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ระบบ RBAC - Next.js 15 + Supabase',
    template: '%s | ระบบ RBAC',
  },
  description:
    'ระบบจัดการผู้ใช้งานด้วย Role-Based Access Control (RBAC) พร้อม Next.js 15, Supabase และ Sentry',
  keywords: [
    'RBAC',
    'authentication',
    'authorization',
    'nextjs',
    'supabase',
    'react',
    'typescript',
    'role-based access control',
  ],
  authors: [{ name: 'Your Team Name' }],
  creator: 'Your Team Name',

  // Open Graph
  openGraph: {
    title: 'ระบบ RBAC - Next.js 15 + Supabase',
    description: 'ระบบจัดการผู้ใช้งานด้วย Role-Based Access Control',
    type: 'website',
    locale: 'th_TH',
    alternateLocale: 'en_US',
    siteName: 'RBAC System',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'ระบบ RBAC - Next.js 15 + Supabase',
    description: 'ระบบจัดการผู้ใช้งานด้วย Role-Based Access Control',
  },

  // PWA
  manifest: '/manifest.json',

  // Security
  robots: {
    index: false, // Set to true in production
    follow: false, // Set to true in production
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Performance optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* Theme */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Preload critical assets */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>

      <body className="font-sans antialiased">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>

        {/* Providers wrapper */}
        <Providers>
          <AppNavbar />
          {/* Main content */}
          <div id="main-content" className="relative">
            {children}
          </div>

          {/* Development tools */}
          {process.env.NODE_ENV === 'development' && <DevTools />}
        </Providers>

        {/* Service Worker registration */}
        {process.env.NODE_ENV === 'production' && <ServiceWorkerRegistration />}
      </body>
    </html>
  );
}

/**
 * Development Tools Component
 */
function DevTools() {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs">
      <div className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <div className="font-semibold mb-1">Development Mode</div>
        <div className="space-y-1 opacity-90">
          <div>ENV: {process.env.NODE_ENV}</div>
          <div>Framework: Next.js 15</div>
          {process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <div className="text-green-300">✓ Supabase Connected</div>
          )}
          {process.env.NEXT_PUBLIC_SENTRY_DSN && (
            <div className="text-green-300">✓ Sentry Monitoring</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Service Worker Registration
 */
function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                  console.log('SW registered: ', registration);
                })
                .catch(function(registrationError) {
                  console.log('SW registration failed: ', registrationError);
                });
            });
          }
        `,
      }}
    />
  );
}

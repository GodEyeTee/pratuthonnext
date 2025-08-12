// src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Public paths that don't require authentication
const PUBLIC_PATHS = new Set<string>([
  '/',
  '/login',
  '/logout',
  '/auth/callback',
  '/locale',
  '/api/health',
]);

// Paths that require specific roles
const ROLE_PROTECTED_PATHS: Record<string, string[]> = {
  '/admin': ['admin'],
  '/rooms': ['admin', 'support'],
  '/tenants': ['admin', 'support'],
  '/bookings': ['admin', 'support'],
  '/reports': ['admin', 'support'],
  '/dashboard': ['admin', 'support'],
  '/profile': ['admin', 'support', 'user'],
  '/settings': ['admin', 'support', 'user'],
  '/help': ['admin', 'support', 'user'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookieName = process.env.SESSION_COOKIE_NAME || '__session';

  // 1) Allow static files and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/public') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.svg')
  ) {
    return NextResponse.next();
  }

  // 2) Allow API routes that need to be accessible before authentication
  if (
    pathname.startsWith('/api/auth/session') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next();
  }

  // 3) Allow public pages
  if (PUBLIC_PATHS.has(pathname)) {
    // If user is already logged in and tries to access login page, redirect to appropriate dashboard
    if (pathname === '/login') {
      const hasSession = req.cookies.has(sessionCookieName);
      if (hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // 4) Check for authentication for protected routes
  const hasSession = req.cookies.has(sessionCookieName);

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    // Preserve the original path for redirect after login
    if (pathname !== '/') {
      url.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(url);
  }

  // 5) Role-based access control (RBAC)
  // Note: Actual role checking happens in the server components/API routes
  // since we can't decode the session cookie in middleware without the Firebase Admin SDK
  // This is just a basic check - detailed RBAC is handled server-side

  // Allow the request to proceed - actual role validation happens in the page/API
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

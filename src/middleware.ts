import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Import RBAC configuration
import {
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  ROLE_REDIRECTS,
} from './lib/rbac.config';
import { createServerSupabase } from './lib/supabaseClient.server';

/**
 * Middleware to enforce authentication and authorization on every request.
 *
 * This middleware inspects the incoming request to determine whether the
 * requested path is protected. If so, it ensures that the user is logged in
 * and has a role that is permitted to access the route. Unauthenticated users
 * are redirected to `/login`. Authenticated users who attempt to access
 * routes they are not authorized for will be redirected to `/profile`.
 *
 * Additionally, logged in users visiting auth pages (login/register) will be
 * redirected to their home route based on their role.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.[^/]+$/)
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect logged in users away from auth pages
  if (user && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    const redirectPath =
      ROLE_REDIRECTS[(user as any).role as keyof typeof ROLE_REDIRECTS] ??
      '/profile';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // If route is protected, enforce auth
  const protectedEntry = PROTECTED_ROUTES.find(r =>
    pathname.startsWith(r.path)
  );
  if (protectedEntry) {
    // If there is no logged in user, redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      // Preserve return path to redirect after login
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Determine user role from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile?.role as string) || 'user';
    // Check role against allowedRoles
    if (!protectedEntry.allowedRoles.includes(role)) {
      // Not authorized: redirect to profile or a safe landing page
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }
  return NextResponse.next();
}

// Apply middleware to all routes. The matcher applies to all paths.
export const config = {
  matcher: '/:path*',
};

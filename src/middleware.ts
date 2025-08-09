import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Public routes ที่ไม่ต้อง login
const PUBLIC_ROUTES = ['/', '/login', '/auth/callback', '/about', '/contact'];

// Routes ที่ต้อง redirect ไป dashboard ถ้า login แล้ว
const AUTH_ROUTES = ['/login', '/register'];

// Protected routes ที่ต้อง login
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/admin',
  '/rooms',
  '/bookings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => route === pathname || pathname.startsWith(route + '/')
  );

  // Check if route is auth route
  const isAuthRoute = AUTH_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  // If user is not logged in and trying to access protected route
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    // Add redirect param to return after login
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and trying to access auth routes (login/register)
  if (user && isAuthRoute) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // For admin routes, check role
  if (pathname.startsWith('/admin') && user) {
    try {
      // Get user profile with role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If not admin, redirect to dashboard
      if (!profile || profile.role !== 'admin') {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // On error, redirect to dashboard
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

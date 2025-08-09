// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/auth/callback', '/about', '/contact'];
const AUTH_ROUTES = ['/login', '/register'];
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/admin',
  '/rooms',
  '/bookings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) fast-exit: static/assets/api health/locale
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/locale') // 👈 สำคัญ: อย่าช้าให้เส้นนี้
  ) {
    return NextResponse.next();
  }

  // 2) classify route BEFORE touching supabase
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => route === pathname || pathname.startsWith(route + '/')
  );
  const isAuthRoute = AUTH_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  const isProtectedRoute = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  const isAdminRoute = pathname.startsWith('/admin');

  // 3) ถ้าเป็น public และไม่ใช่ admin/protected/auth → ไม่ต้องเรียก Supabase เลย
  if (!isAuthRoute && !isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // 4) เฉพาะกรณีที่ต้องรู้ user เท่านั้น เราจึงสร้าง client และเรียก getUser()
  let supabaseResponse = NextResponse.next({ request });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 5) auth route: ถ้า login แล้ว → เด้งไป dashboard
  if (user && isAuthRoute) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 6) protected: ถ้าไม่ login → เด้งไป login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7) admin: ถ้า login แล้วแต่ไม่ใช่ admin → เด้งไป dashboard (ค่อยเช็ค role)
  if (isAdminRoute && user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    } catch {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // คง matcher เดิมไว้
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

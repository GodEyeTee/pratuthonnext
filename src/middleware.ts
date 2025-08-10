import {
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  ROLE_REDIRECTS,
} from '@/lib/rbac.config';
import type { UserRole } from '@/types/rbac';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ชื่อ cookie ที่จะมีเมื่อผู้ใช้ล็อกอิน (ครอบคลุมกรณี Supabase พบบ่อย)
const SESSION_COOKIES = [
  'sb-access-token',
  'sb-refresh-token',
  'supabase-auth-token', // บางโปรเจกต์ตั้งเอง/legacy
];

function hasSessionCookie(req: NextRequest) {
  return SESSION_COOKIES.some(k => req.cookies.has(k));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ข้ามไฟล์ static / api
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.[^/]+$/)
  ) {
    return NextResponse.next();
  }

  // public pages → ผ่านเลย
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const isAuthed = hasSessionCookie(request);

  // ถ้ามี session แล้วแต่ไปหน้า auth → เด้งออก (ครั้งเดียว ไม่กระพริบ)
  if (isAuthed && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    const redirectPath = ROLE_REDIRECTS['user' as UserRole] ?? '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // เส้นทางที่ต้องล็อกอิน
  const protectedEntry = PROTECTED_ROUTES.find(r =>
    pathname.startsWith(r.path)
  );
  if (protectedEntry) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url);
      const ret = pathname + (search ?? '');
      loginUrl.searchParams.set('redirectTo', ret);
      return NextResponse.redirect(loginUrl);
    }
    // ไม่เช็ค role ที่นี่ → ไปเช็คที่เพจ/เซิร์ฟเวอร์ (เร็วและแน่นกว่า)
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};

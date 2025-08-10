import {
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  ROLE_REDIRECTS,
} from '@/lib/rbac.config';
import type { UserRole } from '@/types/rbac';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ใช้คุกกี้ session ของ Firebase (ตั้งชื่อได้ผ่าน ENV; ดีฟอลต์ '__session')
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

function hasSessionCookie(req: NextRequest) {
  return req.cookies.has(SESSION_COOKIE_NAME);
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

  // มี session แล้วแต่ไปหน้า auth → เด้งออกตาม role
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
    // เช็ค role/permission ต่อที่ฝั่งเพจหรือเซิร์ฟเวอร์
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};

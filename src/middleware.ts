// src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// หน้า/เส้นทางที่ไม่ต้องมีเซสชัน
const PUBLIC_PATHS = new Set<string>([
  '/', // landing
  '/login',
  '/favicon.ico',
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieName = process.env.SESSION_COOKIE_NAME || '__session';

  // 1) อนุญาต static/_next/assets เสมอ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // 2) อนุญาต API ที่ต้องเข้าถึงได้ก่อนมีเซสชัน
  //    สำคัญสุด: /api/auth/session (ไว้แลกคุกกี้หลัง Google sign-in)
  if (
    pathname.startsWith('/api/auth/session') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next();
  }

  // 3) หน้า public ปล่อยผ่าน
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 4) ที่เหลือ ต้องมีคุกกี้เซสชัน
  const hasSession = req.cookies.has(cookieName);
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// matcher: ครอบคลุมทุกเส้นทาง ยกเว้นไฟล์ระบบพื้นฐาน
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

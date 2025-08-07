/**
 * Enhanced Middleware with RBAC Support
 * สำหรับ Next.js 15 App Router
 */

import { createRBACMiddleware } from '@/lib/rbac.middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await createRBACMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes that don't need protection
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

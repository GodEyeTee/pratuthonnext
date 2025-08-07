/**
 * RBAC Middleware for Route Protection
 */

import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  ROLE_REDIRECTS,
  canAccessRoute,
  hasPermission,
} from '@/constants/rbac';
import type { Permission, UserRole } from '@/types/rbac';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  email_verified?: boolean;
}

/**
 * Enhanced middleware with RBAC support
 */
export async function createRBACMiddleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = req.nextUrl.pathname;

  // Skip auth check for auth callback routes
  if (pathname.startsWith('/auth/callback')) {
    return res;
  }

  // Skip auth for API routes (they should handle their own auth)
  if (pathname.startsWith('/api/')) {
    return res;
  }

  // Skip auth for static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return res;
  }

  try {
    // Get session and user
    const {
      data: { session, user },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Handle session errors
    if (sessionError) {
      console.error('Middleware session error:', sessionError);
      return redirectToLogin(req, pathname);
    }

    // Get user role from database if user exists
    let userWithRole: AuthUser | null = null;
    if (user) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('id, email, raw_user_meta_data')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          userWithRole = {
            id: userData.id,
            email: userData.email,
            role: (userData.raw_user_meta_data?.role as UserRole) || 'user',
            email_verified: user.email_confirmed_at ? true : false,
          };
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    }

    // Check if route is public
    if (isPublicRoute(pathname)) {
      return res;
    }

    // Check if route is auth route (redirect if already logged in)
    if (isAuthRoute(pathname)) {
      if (session && userWithRole) {
        const redirectUrl = getRedirectForRole(userWithRole.role, req);
        return NextResponse.redirect(redirectUrl);
      }
      return res;
    }

    // Protected routes - require authentication
    if (!session || !userWithRole) {
      return redirectToLogin(req, pathname);
    }

    // Check email verification for sensitive routes
    if (isEmailVerificationRequired(pathname) && !userWithRole.email_verified) {
      const redirectUrl = new URL('/verify-email', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check role-based access
    if (!canAccessRoute(userWithRole.role, pathname)) {
      return redirectToUnauthorized(req, userWithRole.role);
    }

    // Add user context to request headers for use in components
    res.headers.set('x-user-id', userWithRole.id);
    res.headers.set('x-user-role', userWithRole.role);
    res.headers.set('x-user-email', userWithRole.email);

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return redirectToLogin(req, pathname);
  }
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

/**
 * Check if route is auth route
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if email verification is required for route
 */
function isEmailVerificationRequired(pathname: string): boolean {
  const sensitiveRoutes = ['/admin', '/settings'];
  return sensitiveRoutes.some(route => pathname.startsWith(route));
}

/**
 * Redirect to login with return URL
 */
function redirectToLogin(req: NextRequest, currentPath?: string): NextResponse {
  const loginUrl = new URL('/login', req.url);
  if (currentPath && currentPath !== '/') {
    loginUrl.searchParams.set('redirect', currentPath);
  }
  return NextResponse.redirect(loginUrl);
}

/**
 * Redirect to appropriate page based on role
 */
function getRedirectForRole(role: UserRole, req: NextRequest): URL {
  const redirectPath = ROLE_REDIRECTS[role] || '/dashboard';
  return new URL(redirectPath, req.url);
}

/**
 * Redirect to unauthorized page
 */
function redirectToUnauthorized(
  req: NextRequest,
  userRole: UserRole
): NextResponse {
  const unauthorizedUrl = new URL('/unauthorized', req.url);
  unauthorizedUrl.searchParams.set('role', userRole);
  return NextResponse.redirect(unauthorizedUrl);
}

/**
 * Route-specific permission checker for API routes
 */
export async function checkApiPermissions(
  req: NextRequest,
  requiredPermissions: Permission[]
): Promise<{ authorized: boolean; user: AuthUser | null; error?: string }> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {
            // No-op for API routes
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authorized: false,
        user: null,
        error: 'Authentication required',
      };
    }

    // Get user role
    const { data: userData } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return {
        authorized: false,
        user: null,
        error: 'User not found',
      };
    }

    const userWithRole: AuthUser = {
      id: userData.id,
      email: userData.email,
      role: (userData.raw_user_meta_data?.role as UserRole) || 'user',
    };

    // Check permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(userWithRole.role, permission)
    );

    return {
      authorized: hasAllPermissions,
      user: userWithRole,
      error: hasAllPermissions ? undefined : 'Insufficient permissions',
    };
  } catch (error) {
    return {
      authorized: false,
      user: null,
      error: 'Internal server error',
    };
  }
}

/**
 * Higher-order function to protect API routes
 */
export function withRBACProtection(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>,
  requiredPermissions: Permission[]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { authorized, user, error } = await checkApiPermissions(
      req,
      requiredPermissions
    );

    if (!authorized || !user) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

/**
 * Utility function to extract user from request headers (set by middleware)
 */
export function getUserFromHeaders(req: NextRequest): AuthUser | null {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');
  const userEmail = req.headers.get('x-user-email');

  if (!userId || !userRole || !userEmail) {
    return null;
  }

  return {
    id: userId,
    role: userRole as UserRole,
    email: userEmail,
  };
}

/**
 * Create audit log entry for role changes and sensitive actions
 */
export async function createAuditLog(
  supabase: any,
  action: string,
  userId: string,
  performedBy: string,
  details?: Record<string, any>
) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      user_id: userId,
      performed_by: performedBy,
      details,
      timestamp: new Date().toISOString(),
      ip_address: '', // You can extract this from request if needed
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

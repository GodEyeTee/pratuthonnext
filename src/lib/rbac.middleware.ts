/**
 * RBAC Middleware for Route Protection
 * Clean Architecture - Infrastructure Layer
 */

import type { Permission, UserRole } from '@/types/rbac';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Types
interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  email_verified?: boolean;
}

interface SessionResponse {
  data: {
    session: {
      user: {
        id: string;
        email: string;
        email_confirmed_at?: string;
        user_metadata?: Record<string, any>;
      };
    } | null;
    user: {
      id: string;
      email: string;
      email_confirmed_at?: string;
      user_metadata?: Record<string, any>;
    } | null;
  };
  error: any;
}

// Configuration
const PUBLIC_ROUTES = ['/', '/login', '/auth/callback'];
const AUTH_ROUTES = ['/login', '/register'];
const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin',
  support: '/dashboard',
  user: '/dashboard',
};

const PROTECTED_ROUTES = {
  '/admin': ['admin'],
  '/dashboard': ['admin', 'support', 'user'],
  '/profile': ['admin', 'support', 'user'],
} as const;

// Utilities
class MiddlewareService {
  private createSupabaseClient(request: NextRequest) {
    return createServerClient(
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
            });
          },
        },
      }
    );
  }

  private isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route =>
      route === '/' ? pathname === '/' : pathname.startsWith(route)
    );
  }

  private isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(route => pathname.startsWith(route));
  }

  private isStaticFile(pathname: string): boolean {
    return (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.') ||
      pathname.startsWith('/api/')
    );
  }

  private async getUserWithRole(
    supabase: any,
    userId: string
  ): Promise<AuthUser | null> {
    try {
      // Get user metadata which contains the role
      const { data: user, error } = await supabase.auth.getUser();

      if (error || !user.user) {
        return null;
      }

      return {
        id: user.user.id,
        email: user.user.email,
        role: (user.user.user_metadata?.role as UserRole) || 'user',
        email_verified: !!user.user.email_confirmed_at,
      };
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  private canAccessRoute(userRole: UserRole, pathname: string): boolean {
    // Check specific protected routes
    for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
      if (pathname.startsWith(route)) {
        return (allowedRoles as UserRole[]).includes(userRole);
      }
    }
    return true;
  }

  private redirectToLogin(
    request: NextRequest,
    currentPath?: string
  ): NextResponse {
    const loginUrl = new URL('/login', request.url);
    if (currentPath && currentPath !== '/') {
      loginUrl.searchParams.set('redirect', currentPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  private redirectToDashboard(
    request: NextRequest,
    userRole: UserRole
  ): NextResponse {
    const redirectPath = ROLE_REDIRECTS[userRole] || '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  async handle(request: NextRequest): Promise<NextResponse> {
    const pathname = request.nextUrl.pathname;

    // Skip middleware for static files and API routes
    if (this.isStaticFile(pathname)) {
      return NextResponse.next();
    }

    // Allow public routes
    if (this.isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    try {
      const supabase = this.createSupabaseClient(request);
      const { data, error } =
        (await supabase.auth.getSession()) as SessionResponse;

      if (error) {
        console.error('Middleware session error:', error);
        return this.redirectToLogin(request, pathname);
      }

      const session = data.session;
      const authUser = session
        ? await this.getUserWithRole(supabase, session.user.id)
        : null;

      // Handle auth routes (redirect if already logged in)
      if (this.isAuthRoute(pathname)) {
        if (session && authUser) {
          return this.redirectToDashboard(request, authUser.role);
        }
        return NextResponse.next();
      }

      // Protected routes require authentication
      if (!session || !authUser) {
        return this.redirectToLogin(request, pathname);
      }

      // Check role-based access
      if (!this.canAccessRoute(authUser.role, pathname)) {
        return this.redirectToDashboard(request, authUser.role);
      }

      // Add user context to headers for server components
      const response = NextResponse.next();
      response.headers.set('x-user-id', authUser.id);
      response.headers.set('x-user-role', authUser.role);
      response.headers.set('x-user-email', authUser.email);

      return response;
    } catch (error) {
      console.error('Middleware error:', error);
      return this.redirectToLogin(request, pathname);
    }
  }
}

// API Route Protection
export class ApiAuthService {
  private createSupabaseClient(request: NextRequest) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op for API routes
          },
        },
      }
    );
  }

  async checkPermissions(
    request: NextRequest,
    requiredPermissions: Permission[]
  ): Promise<{ authorized: boolean; user: AuthUser | null; error?: string }> {
    try {
      const supabase = this.createSupabaseClient(request);
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return {
          authorized: false,
          user: null,
          error: 'Authentication required',
        };
      }

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        role: (data.user.user_metadata?.role as UserRole) || 'user',
      };

      // For now, simplified permission check based on role
      const hasPermission = this.checkUserPermissions(
        user.role,
        requiredPermissions
      );

      return {
        authorized: hasPermission,
        user,
        error: hasPermission ? undefined : 'Insufficient permissions',
      };
    } catch (error) {
      return {
        authorized: false,
        user: null,
        error: 'Internal server error',
      };
    }
  }

  private checkUserPermissions(
    role: UserRole,
    permissions: Permission[]
  ): boolean {
    const rolePermissions: Record<UserRole, Permission[]> = {
      admin: [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'dashboard:admin',
      ],
      support: ['users:read', 'users:update', 'dashboard:support'],
      user: ['profile:read', 'profile:update', 'dashboard:user'],
    };

    const userPermissions = rolePermissions[role] || [];
    return permissions.every(permission =>
      userPermissions.includes(permission)
    );
  }
}

// Main middleware function
const middlewareService = new MiddlewareService();

export async function createRBACMiddleware(request: NextRequest) {
  return middlewareService.handle(request);
}

// Higher-order function for API route protection
export function withRBACProtection(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>,
  requiredPermissions: Permission[]
) {
  const apiAuthService = new ApiAuthService();

  return async (request: NextRequest): Promise<NextResponse> => {
    const { authorized, user, error } = await apiAuthService.checkPermissions(
      request,
      requiredPermissions
    );

    if (!authorized || !user) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

// Utility to extract user from headers (set by middleware)
export function getUserFromHeaders(request: NextRequest): AuthUser | null {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const userEmail = request.headers.get('x-user-email');

  if (!userId || !userRole || !userEmail) {
    return null;
  }

  return {
    id: userId,
    role: userRole as UserRole,
    email: userEmail,
  };
}

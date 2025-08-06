import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from './env';
import { captureError, clearUserContext, setUserContext } from './sentry';

/**
 * Enhanced Auth Utilities
 * ปรับปรุงการจัดการ authentication พร้อม error handling ที่ดีขึ้น
 */

// ✅ Types
export interface AuthResult<T = any> {
  data: T | null;
  error: string | null;
  loading?: boolean;
}

export interface UserProfile extends User {
  display_name?: string;
  avatar_url?: string;
  role?: 'user' | 'admin' | 'moderator';
}

// ✅ Server-side auth client
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  try {
    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn('Cannot set cookies from Server Component:', error);
            }
          },
        },
      }
    );
  } catch (error) {
    captureError(error as Error, { context: 'createAuthServerClient' });
    throw new Error('Failed to create auth server client');
  }
}

// ✅ Client-side auth client with error handling
export function createAuthBrowserClient() {
  try {
    return createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } catch (error) {
    captureError(error as Error, { context: 'createAuthBrowserClient' });
    throw new Error('Failed to create auth browser client');
  }
}

// ✅ Get user with comprehensive error handling
export async function getUser(): Promise<AuthResult<UserProfile>> {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      captureError(new Error(error.message), {
        context: 'getUser',
        error_code: error.name,
      });
      return { data: null, error: 'Failed to get user' };
    }

    // Set user context for Sentry
    if (user) {
      setUserContext({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name,
      });
    }

    return { data: user as UserProfile, error: null };
  } catch (error) {
    captureError(error as Error, { context: 'getUser' });
    return { data: null, error: 'Unexpected error getting user' };
  }
}

// ✅ Get session with error handling
export async function getSession(): Promise<AuthResult<Session>> {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      captureError(new Error(error.message), {
        context: 'getSession',
        error_code: error.name,
      });
      return { data: null, error: 'Failed to get session' };
    }

    return { data: session, error: null };
  } catch (error) {
    captureError(error as Error, { context: 'getSession' });
    return { data: null, error: 'Unexpected error getting session' };
  }
}

// ✅ Sign out with proper cleanup
export async function signOut(): Promise<AuthResult<void>> {
  try {
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      captureError(new Error(error.message), {
        context: 'signOut',
        error_code: error.name,
      });
      return { data: null, error: 'Failed to sign out' };
    }

    // Clear user context from Sentry
    clearUserContext();

    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear local storage if needed
      localStorage.removeItem('user-preferences');
      // Force reload to clear any cached state
      window.location.href = '/login';
    }

    return { data: null, error: null };
  } catch (error) {
    captureError(error as Error, { context: 'signOut' });
    return { data: null, error: 'Unexpected error signing out' };
  }
}

// ✅ Google OAuth sign in with error handling
export async function signInWithGoogle(
  redirectTo?: string
): Promise<AuthResult<void>> {
  try {
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      captureError(new Error(error.message), {
        context: 'signInWithGoogle',
        error_code: error.name,
        redirect_to: redirectTo,
      });
      return { data: null, error: 'Failed to sign in with Google' };
    }

    return { data: null, error: null };
  } catch (error) {
    captureError(error as Error, { context: 'signInWithGoogle' });
    return { data: null, error: 'Unexpected error signing in with Google' };
  }
}

// ✅ Check if user has specific role
export function hasRole(user: UserProfile | null, role: string): boolean {
  if (!user) return false;
  return user.role === role || user.app_metadata?.role === role;
}

// ✅ Check if user is admin
export function isAdmin(user: UserProfile | null): boolean {
  return hasRole(user, 'admin');
}

// ✅ Format user display name
export function getDisplayName(user: UserProfile | null): string {
  if (!user) return 'Guest';

  return (
    user.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  );
}

// ✅ Get user avatar URL with fallback
export function getAvatarUrl(user: UserProfile | null): string | null {
  if (!user) return null;

  return (
    user.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null
  );
}

// ✅ Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ✅ Auth state listener for client components
export function onAuthStateChange(callback: (user: User | null) => void) {
  try {
    const supabase = createAuthBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      // Update Sentry user context
      if (session?.user) {
        setUserContext({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
        });
      } else {
        clearUserContext();
      }

      callback(session?.user || null);
    });

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    captureError(error as Error, { context: 'onAuthStateChange' });
    return () => {}; // Return empty cleanup function
  }
}

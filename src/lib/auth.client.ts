/**
 * Client-side Auth Utilities
 * ใช้ในฝั่ง client components เท่านั้น (use client)
 */

import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { captureError, clearUserContext, setUserContext } from './sentry.utils';

// ✅ Types
export interface AuthResult<T = any> {
  data: T | null;
  error: string | null;
  loading?: boolean;
}

// ✅ Client-side auth client
export function createAuthBrowserClient() {
  try {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } catch (error) {
    captureError(error as Error, { context: 'createAuthBrowserClient' });
    throw new Error('Failed to create auth browser client');
  }
}

// ✅ Google OAuth sign in
export async function signInWithGoogle(
  redirectTo?: string
): Promise<AuthResult<void>> {
  try {
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectTo || '/dashboard'
        )}`,
      },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: 'Unexpected error signing in with Google' };
  }
}

// ✅ Sign out
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

// ✅ Get current user (client-side)
export async function getCurrentUser(): Promise<AuthResult<User>> {
  try {
    const supabase = createAuthBrowserClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      captureError(new Error(error.message), {
        context: 'getCurrentUser',
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

    return { data: user, error: null };
  } catch (error) {
    captureError(error as Error, { context: 'getCurrentUser' });
    return { data: null, error: 'Unexpected error getting user' };
  }
}

// ✅ Utility functions
export function getDisplayName(user: User | null): string {
  if (!user) return 'Guest';

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  );
}

export function getAvatarUrl(user: User | null): string | null {
  if (!user) return null;

  return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

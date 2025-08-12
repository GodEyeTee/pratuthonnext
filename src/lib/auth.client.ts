// src/lib/auth.client.ts
/**
 * Client-side Auth helpers
 */
import { authHelpers } from '@/lib/firebase/client';
import type { User } from 'firebase/auth';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

// Google sign-in
export async function signInWithGoogle(
  redirectTo?: string
): Promise<AuthResult> {
  const result = await authHelpers.signInWithGoogle();
  if (result.error) return { success: false, error: result.error };

  if (result.user) {
    // Create session cookie via API
    const idToken = await result.user.getIdToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      return { success: false, error: 'Failed to create session' };
    }

    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }

    return { success: true, user: result.user };
  }

  return { success: false, error: 'Sign in failed' };
}

// Email sign-in
export async function signInWithEmail(
  email: string,
  password: string,
  redirectTo?: string
): Promise<AuthResult> {
  const result = await authHelpers.signInWithEmail(email, password);
  if (result.error) return { success: false, error: result.error };

  if (result.user) {
    // Create session cookie via API
    const idToken = await result.user.getIdToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      return { success: false, error: 'Failed to create session' };
    }

    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }

    return { success: true, user: result.user };
  }

  return { success: false, error: 'Sign in failed' };
}

// Create account
export async function createAccount(
  email: string,
  password: string,
  displayName?: string,
  redirectTo?: string
): Promise<AuthResult> {
  const result = await authHelpers.createAccount(email, password, displayName);
  if (result.error) return { success: false, error: result.error };

  if (result.user) {
    // Create session cookie via API
    const idToken = await result.user.getIdToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      return { success: false, error: 'Failed to create session' };
    }

    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }

    return { success: true, user: result.user };
  }

  return { success: false, error: 'Account creation failed' };
}

// Reset password
export async function resetPassword(email: string): Promise<AuthResult> {
  const result = await authHelpers.resetPassword(email);
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

// Sign out
export async function signOut(): Promise<AuthResult> {
  const result = await authHelpers.signOut();
  if (result.error) return { success: false, error: result.error };

  if (typeof window !== 'undefined') {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfile');

    // Clear session cookie via API
    await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    window.location.href = '/login';
  }

  return { success: true };
}

export function getCurrentUser(): User | null {
  return authHelpers.getCurrentUser();
}

export function onAuthStateChange(cb: (user: User | null) => void) {
  return authHelpers.onAuthStateChange(cb);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  return authHelpers.getIdToken(forceRefresh);
}

/**
 * Refresh session after role change
 */
export async function refreshSession(): Promise<boolean> {
  const user = authHelpers.getCurrentUser();
  if (!user) return false;

  const idToken = await user.getIdToken(true); // force refresh
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  return res.ok;
}

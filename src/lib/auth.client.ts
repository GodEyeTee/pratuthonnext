'use client';
/**
 * Client-side Authentication Functions
 * Clean Architecture - Application Layer
 */

import { authHelpers } from '@/lib/firebase/client';
import type { User } from 'firebase/auth';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

// Sign in with Google
export async function signInWithGoogle(
  redirectTo?: string
): Promise<AuthResult> {
  try {
    const { user, error } = await authHelpers.signInWithGoogle();
    if (error) return { success: false, error };

    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return { success: true, user: user || undefined };
  } catch (e: any) {
    console.error('Sign in with Google error:', e);
    return { success: false, error: e?.message ?? 'Google sign-in failed' };
  }
}

// Sign in with email
export async function signInWithEmail(
  email: string,
  password: string,
  redirectTo?: string
): Promise<AuthResult> {
  try {
    const { user, error } = await authHelpers.signInWithEmail(email, password);
    if (error) return { success: false, error };

    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return { success: true, user: user || undefined };
  } catch (e: any) {
    console.error('Sign in with email error:', e);
    return { success: false, error: e?.message ?? 'Email sign-in failed' };
  }
}

// Create account
export async function createAccount(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  try {
    const { user, error } = await authHelpers.createAccount(
      email,
      password,
      displayName
    );
    if (error) return { success: false, error };
    return { success: true, user: user || undefined };
  } catch (e: any) {
    console.error('Create account error:', e);
    return { success: false, error: e?.message ?? 'Create account failed' };
  }
}

// Sign out
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await authHelpers.signOut();
    if (error) return { success: false, error };

    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
    }
    return { success: true };
  } catch (e: any) {
    console.error('Sign out error:', e);
    return { success: false, error: e?.message ?? 'Sign out failed' };
  }
}

// Reset password
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await authHelpers.resetPassword(email);
    if (error) return { success: false, error };
    return { success: true };
  } catch (e: any) {
    console.error('Reset password error:', e);
    return { success: false, error: e?.message ?? 'Reset password failed' };
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return authHelpers.getCurrentUser();
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return authHelpers.onAuthStateChange(callback);
}

// Get ID token for API calls
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  return authHelpers.getIdToken(forceRefresh);
}

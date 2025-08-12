// src/lib/auth.client.ts
/**
 * Client-side Auth helpers
 */
import fb from '@/lib/firebase/client';
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
  const { user, error } = await fb.authHelpers.signInWithGoogle();
  if (error) return { success: false, error };
  if (redirectTo && typeof window !== 'undefined')
    window.location.href = redirectTo;
  return { success: true, user: user ?? undefined };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await fb.authHelpers.signOut();
  if (error) return { success: false, error };
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfile');
  }
  return { success: true };
}

export function getCurrentUser(): User | null {
  return fb.authHelpers.getCurrentUser();
}

export function onAuthStateChange(cb: (user: User | null) => void) {
  return fb.authHelpers.onAuthStateChange(cb);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  return fb.authHelpers.getIdToken(forceRefresh);
}

/**
 * 🔄 สำคัญ: ใช้หลังเปลี่ยน role เพื่อรีเฟรช claims + mint session cookie ใหม่
 */
export async function refreshSession(): Promise<boolean> {
  const user = fb.authHelpers.getCurrentUser();
  if (!user) return false;
  // refresh claims ตามเอกสาร
  const idToken = await user.getIdToken(true); // force refresh
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  return res.ok;
}

// src/lib/auth.client.ts
'use client';

import { createClient } from '@/lib/supabase/client';

export async function signInWithGoogle(redirectTo?: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
                redirectTo || '/dashboard'
              )}`
            : undefined,
      },
    });
    if (error) return { error: error.message };
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Sign out ผ่าน server route เพื่อให้ SSR cookies ถูกลบแน่นอน
 */
export async function signOut(): Promise<void> {
  try {
    await fetch('/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

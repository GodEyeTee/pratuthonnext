'use client';

import { auth, authHelpers } from '@/lib/firebase/client';
import type { Permission, UserRole } from '@/types/rbac';
import {
  getIdTokenResult,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * เราเสิร์ฟสถานะ auth + RBAC ให้ UI ใช้แบบพร้อมกิน
 * - role, permissions มาจาก Custom Claims (Admin SDK setCustomUserClaims)
 * - ถ้าไม่มี role ใน claims => fallback เป็น 'user'
 */
type AuthState = {
  user: FirebaseUser | null;
  loading: boolean;
  role: UserRole | null;
  permissions: string[];
  hasAnyPermission: (perms: Permission[]) => boolean;
  hasAllPermissions: (perms: Permission[]) => boolean;
};

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  role: null,
  permissions: [],
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (!u) {
        setRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }
      try {
        // อ่าน custom claims จาก ID token (client) :contentReference[oaicite:3]{index=3}
        const res = await getIdTokenResult(u);
        const claims = res.claims || {};
        const r = (claims.role as UserRole | undefined) ?? 'user';
        const perms = Array.isArray(claims.permissions)
          ? (claims.permissions as string[])
          : [];
        setRole(r);
        setPermissions(perms);
      } catch (e) {
        // ถ้าอ่าน claims ไม่ได้ ให้ fallback เบา ๆ
        setRole('user');
        setPermissions([]);
        console.warn('[useAuth] getIdTokenResult failed:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const hasAnyPermission = (perms: Permission[]) =>
    perms.some(p => permissions.includes(p as string));

  const hasAllPermissions = (perms: Permission[]) =>
    perms.every(p => permissions.includes(p as string));

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      role,
      permissions,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [user, loading, role, permissions]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

// Convenience re-exports
export const signInWithGoogle = authHelpers.signInWithGoogle;
export const signInWithEmail = authHelpers.signInWithEmail;
export const createAccount = authHelpers.createAccount;
export const resetPassword = authHelpers.resetPassword;
export const signOut = authHelpers.signOut;

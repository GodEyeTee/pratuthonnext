// src/hooks/useAuth.tsx
'use client';

import { auth, authHelpers, db } from '@/lib/firebase/client';
import type { Permission, UserRole } from '@/types/rbac';
import {
  getIdTokenResult,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Auth Context with RBAC support
 * - role, permissions from Firestore users collection + custom claims
 * - Syncs with Firebase Auth state
 */
type AuthState = {
  user: FirebaseUser | null;
  loading: boolean;
  role: UserRole | null;
  permissions: string[];
  hasAnyPermission: (perms: Permission[]) => boolean;
  hasAllPermissions: (perms: Permission[]) => boolean;
  signInWithGoogle: () => Promise<{
    user: FirebaseUser | null;
    error: string | null;
  }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ user: FirebaseUser | null; error: string | null }>;
  createAccount: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ user: FirebaseUser | null; error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
};

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  role: null,
  permissions: [],
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  signInWithGoogle: async () => ({ user: null, error: 'Not initialized' }),
  signInWithEmail: async () => ({ user: null, error: 'Not initialized' }),
  createAccount: async () => ({ user: null, error: 'Not initialized' }),
  resetPassword: async () => ({ error: 'Not initialized' }),
  signOut: async () => ({ error: 'Not initialized' }),
});

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:role',
    'rooms:read',
    'rooms:create',
    'rooms:update',
    'rooms:delete',
    'bookings:read',
    'bookings:create',
    'bookings:update',
    'bookings:delete',
    'tenants:read',
    'tenants:create',
    'tenants:update',
    'tenants:delete',
    'reports:read',
    'reports:create',
    'reports:delete',
    'settings:read',
    'settings:update',
    'dashboard:admin',
    'dashboard:support',
    'dashboard:user',
  ],
  support: [
    'users:read',
    'users:update',
    'rooms:read',
    'rooms:update',
    'bookings:read',
    'bookings:create',
    'bookings:update',
    'tenants:read',
    'tenants:create',
    'tenants:update',
    'reports:read',
    'dashboard:support',
    'dashboard:user',
  ],
  user: [
    'profile:read',
    'profile:update',
    'rooms:read',
    'bookings:read',
    'bookings:create',
    'dashboard:user',
  ],
};

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
        // First try to get role from custom claims
        const tokenResult = await getIdTokenResult(u);
        const claimsRole = tokenResult.claims.role as UserRole | undefined;

        // Then check Firestore for role (source of truth)
        const userDocRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userDocRef);

        let userRole: UserRole = 'user'; // default role

        if (userDoc.exists()) {
          const userData = userDoc.data();
          userRole = (userData.role as UserRole) || claimsRole || 'user';
        } else {
          // Create user document if it doesn't exist
          userRole = claimsRole || 'user';
          await setDoc(userDocRef, {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            role: userRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        }

        setRole(userRole);
        setPermissions(ROLE_PERMISSIONS[userRole] || []);
      } catch (e) {
        console.warn('[useAuth] Error getting user data:', e);
        setRole('user');
        setPermissions(ROLE_PERMISSIONS.user);
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

  const signInWithGoogle = async () => {
    setLoading(true);
    const result = await authHelpers.signInWithGoogle();
    if (result.user) {
      // Update last login in Firestore
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(
        userDocRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    return result;
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    const result = await authHelpers.signInWithEmail(email, password);
    if (result.user) {
      // Update last login in Firestore
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(
        userDocRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    return result;
  };

  const createAccount = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    setLoading(true);
    const result = await authHelpers.createAccount(
      email,
      password,
      displayName
    );
    if (result.user) {
      // Create user document in Firestore
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(userDocRef, {
        email: result.user.email,
        displayName: displayName || result.user.displayName,
        photoURL: result.user.photoURL,
        role: 'user', // default role for new users
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    }
    return result;
  };

  const resetPassword = async (email: string) => {
    return authHelpers.resetPassword(email);
  };

  const signOut = async () => {
    const result = await authHelpers.signOut();
    setUser(null);
    setRole(null);
    setPermissions([]);
    return result;
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      role,
      permissions,
      hasAnyPermission,
      hasAllPermissions,
      signInWithGoogle,
      signInWithEmail,
      createAccount,
      resetPassword,
      signOut,
    }),
    [user, loading, role, permissions]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

// Re-export auth methods for convenience
export { authHelpers } from '@/lib/firebase/client';

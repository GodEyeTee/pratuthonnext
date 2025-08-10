'use client';

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '@/lib/rbac.config';
import { clearUserContext, setUserContext } from '@/lib/sentry.utils';
import { createClient } from '@/lib/supabase/client';
import type { Permission, UserRole, UserWithRole } from '@/types/rbac';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasRoles: (roles: UserRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

type ProfileRow = {
  id: string;
  email: string | null;
  role: UserRole | null;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------- helpers --------
  const selectProfileById = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,role,display_name,avatar_url,created_at,updated_at')
      .eq('id', uid)
      .maybeSingle();
    if (error) console.warn('[profiles by id] ', error.message);
    return data as ProfileRow | null;
  };

  const selectProfileByEmail = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,role,display_name,avatar_url,created_at,updated_at')
      .eq('email', email)
      .maybeSingle();
    if (error) console.warn('[profiles by email] ', error.message);
    return data as ProfileRow | null;
  };

  const insertDefaultProfile = async (authUser: User) => {
    const payload = {
      id: authUser.id,
      email: authUser.email,
      role: 'user' as UserRole,
      display_name:
        (authUser.user_metadata?.full_name as string | undefined) ??
        (authUser.user_metadata?.name as string | undefined) ??
        null,
      avatar_url:
        (authUser.user_metadata?.avatar_url as string | undefined) ??
        (authUser.user_metadata?.picture as string | undefined) ??
        null,
    };
    const { data, error } = await supabase
      .from('profiles')
      .insert(payload)
      .select('id,email,role,display_name,avatar_url,created_at,updated_at')
      .single();
    if (error) {
      console.warn('[profiles insert] ', error.message);
      return null;
    }
    return data as ProfileRow;
  };

  const fetchUserWithRole = async (
    authUser: User
  ): Promise<UserWithRole | null> => {
    try {
      // 1) by id
      let profile = await selectProfileById(authUser.id);

      // 2) fallback by email
      if (!profile && authUser.email) {
        profile = await selectProfileByEmail(authUser.email);
      }

      // 3) create default profile
      if (!profile) {
        profile = await insertDefaultProfile(authUser);
      }

      // 4) merge
      const role: UserRole =
        (profile?.role as UserRole | null) ??
        (authUser.user_metadata?.role as UserRole | undefined) ??
        (authUser.app_metadata?.role as UserRole | undefined) ??
        'user';

      const name =
        profile?.display_name ??
        (authUser.user_metadata?.full_name as string | undefined) ??
        (authUser.user_metadata?.name as string | undefined);

      const avatar_url =
        profile?.avatar_url ??
        (authUser.user_metadata?.avatar_url as string | undefined) ??
        (authUser.user_metadata?.picture as string | undefined);

      const userWithRole: UserWithRole = {
        id: authUser.id,
        // make email optional (undefined when null)
        email: authUser.email ?? undefined,
        role,
        name,
        avatar_url,
        created_at: profile?.created_at ?? authUser.created_at,
        updated_at:
          profile?.updated_at ?? authUser.updated_at ?? authUser.created_at,
        email_verified: !!authUser.email_confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at ?? undefined,
      };

      // sentry user context expects email?: string (not null)
      setUserContext({
        id: userWithRole.id,
        email: userWithRole.email, // string | undefined
        name: userWithRole.name, // string | undefined
      });

      return userWithRole;
    } catch (e) {
      console.error('fetchUserWithRole error:', e);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { data, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;

      const authUser = data.user;
      if (authUser) {
        const u = await fetchUserWithRole(authUser);
        setUser(u);
        setError(null);
      } else {
        setUser(null);
        clearUserContext();
      }
    } catch (e) {
      console.error('refreshUser error:', e);
      setError(e instanceof Error ? e.message : 'Failed to refresh user');
      setUser(null);
      clearUserContext();
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error: soErr } = await supabase.auth.signOut();
      if (soErr) throw soErr;
      setUser(null);
      setSession(null);
      clearUserContext();
      window.location.href = '/login';
    } catch (e) {
      console.error('signOut error:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // -------- init & listeners --------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error: sErr } = await supabase.auth.getSession();
        if (sErr) throw sErr;

        if (!mounted) return;
        setSession(data.session || null);

        if (data.session?.user) {
          const u = await fetchUserWithRole(data.session.user);
          if (!mounted) return;
          setUser(u);
        } else {
          setUser(null);
          clearUserContext();
        }
      } catch (e) {
        console.error('initialize auth error:', e);
        if (mounted) {
          setError(
            e instanceof Error ? e.message : 'Failed to initialize auth'
          );
          setUser(null);
          setSession(null);
          clearUserContext();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        if (!mounted) return;
        setSession(sess || null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (sess?.user) {
            const u = await fetchUserWithRole(sess.user);
            setUser(u);
          }
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          clearUserContext();
          setError(null);
        }
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- permission helpers --------
  const checkRole = (role: UserRole) => user?.role === role;
  const checkRoles = (roles: UserRole[]) =>
    user ? roles.includes(user.role) : false;
  const checkPermission = (permission: Permission) =>
    user ? hasPermission(user.role, permission) : false;
  const checkAnyPermission = (permissions: Permission[]) =>
    user ? hasAnyPermission(user.role, permissions) : false;
  const checkAllPermissions = (permissions: Permission[]) =>
    user ? hasAllPermissions(user.role, permissions) : false;

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshUser,
    hasRole: checkRole,
    hasRoles: checkRoles,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ------------ hooks ------------
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export function useRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role || null;
}

export function useIsAdmin(): boolean {
  const { hasRole } = useAuth();
  return hasRole('admin');
}

export function useIsSupport(): boolean {
  const { hasRoles } = useAuth();
  return hasRoles(['admin', 'support']);
}

export function useIsUser(): boolean {
  const { user } = useAuth();
  return !!user;
}

export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUsers: hasPermission('users:read'),
    canCreateUsers: hasPermission('users:create'),
    canUpdateUsers: hasPermission('users:update'),
    canDeleteUsers: hasPermission('users:delete'),
    canAccessAdmin: hasPermission('dashboard:admin'),
    canAccessSupport: hasPermission('dashboard:support'),
    canViewReports: hasPermission('reports:read'),
    canManageSettings: hasAllPermissions(['settings:read', 'settings:update']),
  };
}

export function useUserInfo() {
  const { user } = useAuth();
  return {
    user,
    displayName: user?.name || user?.email?.split('@')[0] || 'User',
    avatarUrl: user?.avatar_url,
    isEmailVerified: user?.email_verified || false,
    memberSince: user?.created_at
      ? new Date(user.created_at).toLocaleDateString()
      : null,
    lastSignIn: user?.last_sign_in_at
      ? new Date(user.last_sign_in_at).toLocaleDateString()
      : null,
  };
}

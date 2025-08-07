'use client';

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '@/lib/rbac.config';
import { clearUserContext, setUserContext } from '@/lib/sentry.utils';
import type { Permission, UserRole, UserWithRole } from '@/types/rbac';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

// Auth Context Types
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

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch user with role information
  const fetchUserWithRole = async (
    authUser: User
  ): Promise<UserWithRole | null> => {
    try {
      // Get user role from metadata or default to 'user'
      const role = (authUser.user_metadata?.role as UserRole) || 'user';

      const userWithRole: UserWithRole = {
        id: authUser.id,
        email: authUser.email!,
        role,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
        avatar_url:
          authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
        email_verified: !!authUser.email_confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at,
      };

      // Set Sentry user context
      setUserContext({
        id: userWithRole.id,
        email: userWithRole.email,
        name: userWithRole.name,
      });

      return userWithRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      setLoading(true);
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (authUser) {
        const userWithRole = await fetchUserWithRole(authUser);
        setUser(userWithRole);
      } else {
        setUser(null);
        clearUserContext();
      }

      setError(null);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to refresh user'
      );
      setUser(null);
      clearUserContext();
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setSession(null);
      clearUserContext();

      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // Permission checking functions
  const checkRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const checkRoles = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const checkPermission = (permission: Permission): boolean => {
    return user ? hasPermission(user.role, permission) : false;
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return user ? hasAnyPermission(user.role, permissions) : false;
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return user ? hasAllPermissions(user.role, permissions) : false;
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          setSession(session);

          if (session?.user) {
            const userWithRole = await fetchUserWithRole(session.user);
            setUser(userWithRole);
          } else {
            setUser(null);
            clearUserContext();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError(
            error instanceof Error ? error.message : 'Failed to initialize auth'
          );
          setUser(null);
          setSession(null);
          clearUserContext();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (!mounted) return;

      setSession(session);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const userWithRole = await fetchUserWithRole(session.user);
          setUser(userWithRole);
        }
        setError(null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        clearUserContext();
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

// useAuth Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-specific hooks
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
  return !!user; // Any authenticated user
}

// Permission hooks
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

// User info hooks
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

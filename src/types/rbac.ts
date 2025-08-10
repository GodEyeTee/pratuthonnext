/*
 * RBAC type definitions
 */

export type UserRole = 'admin' | 'support' | 'user';
export type Permission = string;

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description?: {
    th: string;
    en: string;
  };
}

export interface ProtectedRoute {
  path: string;
  allowedRoles: UserRole[];
  requiredPermissions: Permission[];
}

/** Used across app (Auth + Sentry + UI) */
export interface UserWithRole {
  id: string;
  role: UserRole;
  email?: string; // optional string (not null) to match Sentry typing
  name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  email_verified?: boolean;
  last_sign_in_at?: string;
}

/** Props for role guard component */
export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/** Props for permission guard component */
export interface PermissionGuardProps {
  requiredPermissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // default true
}

/**
 * RBAC (Role-Based Access Control) Type Definitions
 */

export type UserRole = 'admin' | 'support' | 'user';

export type Permission =
  // User management
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  // Profile management
  | 'profile:read'
  | 'profile:update'
  // Dashboard access
  | 'dashboard:admin'
  | 'dashboard:support'
  | 'dashboard:user'
  // Settings
  | 'settings:read'
  | 'settings:update'
  // Reports
  | 'reports:read'
  | 'reports:create'
  | 'reports:delete'
  // Room management
  | 'rooms:read'
  | 'rooms:create'
  | 'rooms:update'
  | 'rooms:delete'
  // Booking management
  | 'bookings:read'
  | 'bookings:create'
  | 'bookings:update'
  | 'bookings:delete';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: {
    th: string;
    en: string;
  };
}

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  email_verified?: boolean;
  last_sign_in_at?: string;
}

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export interface PermissionGuardProps {
  requiredPermissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = require all permissions, false = require any
}

export interface AuthState {
  user: UserWithRole | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface RoleChangeRequest {
  userId: string;
  newRole: UserRole;
  reason?: string;
  requestedBy: string;
}

// For audit logging
export interface RoleChangeLog {
  id: string;
  user_id: string;
  old_role: UserRole;
  new_role: UserRole;
  changed_by: string;
  reason?: string;
  timestamp: string;
}

// Route protection types
export interface ProtectedRoute {
  path: string;
  allowedRoles: UserRole[];
  requiredPermissions?: Permission[];
}

export interface RouteConfig {
  protected: ProtectedRoute[];
  public: string[];
  auth: string[]; // routes for auth (redirect if logged in)
}

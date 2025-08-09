/*
 * RBAC type definitions
 *
 * These interfaces define the shape of roles, permissions and protected
 * routes used throughout the application. Keeping types centralized helps
 * maintain consistency when adding new roles or permissions.
 */

// Roles available in the system
export type UserRole = 'admin' | 'support' | 'user';

// Simple string alias for permission names
export type Permission = string;

// Definition of a role and its permissions. A description can be provided
// for UI display in multiple languages.
export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description?: {
    th: string;
    en: string;
  };
}

// A protected route describes which roles may access a path and which
// permissions are required. Middleware uses this to enforce access
// restrictions.
export interface ProtectedRoute {
  path: string;
  allowedRoles: UserRole[];
  requiredPermissions: Permission[];
}

/**
 * Updated RBAC configuration and helpers.
 *
 * This file defines the roles, permissions and protected routes used by the
 * application. It replaces the previous version to tighten access controls
 * so that only `admin` and `support` roles may access administrative pages
 * like the dashboard, rooms, tenants and bookings. Regular users are limited
 * to profile management only.
 */

import type {
  Permission,
  ProtectedRoute,
  RolePermissions,
  UserRole,
} from '../types/rbac';

// -----------------------------------------------------------------------------
// Role definitions and hierarchy
//
// Roles are ordered by privilege. Higher numbers indicate more privileges.
export const DEFAULT_USER_ROLE: UserRole = 'user';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  support: 2,
  user: 1,
};

// List all possible permissions in the system. These are used by the UI and
// helper functions for type safety. When adding new features, append
// additional permissions here.
export const ALL_PERMISSIONS: Permission[] = [
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
  'profile:read',
  'profile:update',
  'dashboard:admin',
  'dashboard:support',
  'dashboard:user',
  'settings:read',
  'settings:update',
  'reports:read',
  'reports:create',
  'reports:delete',
  'rooms:read',
  'rooms:create',
  'rooms:update',
  'rooms:delete',
  'bookings:read',
  'bookings:create',
  'bookings:update',
  'bookings:delete',
];

// -----------------------------------------------------------------------------
// Role to permission mapping
//
// Define which permissions belong to each role. Users with a given role will
// automatically inherit all of the permissions in its list.
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: 'admin',
    permissions: [
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      'profile:read',
      'profile:update',
      'dashboard:admin',
      'dashboard:support',
      'dashboard:user',
      'settings:read',
      'settings:update',
      'reports:read',
      'reports:create',
      'reports:delete',
      'rooms:read',
      'rooms:create',
      'rooms:update',
      'rooms:delete',
      'bookings:read',
      'bookings:create',
      'bookings:update',
      'bookings:delete',
    ],
    description: {
      th: 'ผู้ดูแลระบบ - สามารถเข้าถึงและจัดการทุกส่วนของระบบรวมถึงจัดการห้องพักและการจอง',
      en: 'Administrator - Full access to all system features including room and booking management',
    },
  },
  support: {
    role: 'support',
    permissions: [
      'users:read',
      'users:update',
      'profile:read',
      'profile:update',
      'dashboard:support',
      'dashboard:user',
      'settings:read',
      'reports:read',
      // Support staff can view and update rooms and bookings but cannot delete them.
      'rooms:read',
      'rooms:update',
      'bookings:read',
      'bookings:create',
      'bookings:update',
    ],
    description: {
      th: 'ทีมสนับสนุน - สามารถช่วยเหลือลูกค้า จัดการการจอง และดูรายงาน',
      en: 'Support Team - Can assist customers, manage bookings, and view reports',
    },
  },
  user: {
    role: 'user',
    permissions: [
      'profile:read',
      'profile:update',
      'dashboard:user',
      // ผู้ใช้ทั่วไปไม่ได้รับสิทธิ์ rooms:* หรือ bookings:* อีกต่อไป
    ],
    description: {
      th: 'ผู้เช่า - สามารถจัดการโปรไฟล์ของตนเอง',
      en: 'Tenant - Can manage their own profile',
    },
  },
};

// -----------------------------------------------------------------------------
// Route protection
//
// Declare which roles may access a given route. These rules are enforced in
// middleware and can also be used in the UI to hide links from users who do
// not have access.
export const PROTECTED_ROUTES: ProtectedRoute[] = [
  {
    path: '/admin',
    allowedRoles: ['admin'],
    requiredPermissions: ['dashboard:admin'],
  },
  {
    path: '/admin/users',
    allowedRoles: ['admin'],
    requiredPermissions: ['users:read'],
  },
  {
    path: '/admin/settings',
    allowedRoles: ['admin'],
    requiredPermissions: ['settings:read', 'settings:update'],
  },
  {
    path: '/admin/rooms',
    allowedRoles: ['admin'],
    requiredPermissions: ['rooms:read', 'rooms:update'],
  },
  {
    path: '/support',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: ['dashboard:support'],
  },
  {
    path: '/dashboard',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: ['dashboard:user'],
  },
  {
    path: '/profile',
    allowedRoles: ['admin', 'support', 'user'],
    requiredPermissions: ['profile:read'],
  },
  {
    path: '/reports',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: ['reports:read'],
  },
  {
    path: '/rooms',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: ['rooms:read'],
  },
  {
    path: '/tenants',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: ['rooms:read'],
  },
  {
    path: '/bookings',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: ['bookings:read'],
  },
];

// Publicly accessible routes that do not require authentication.
export const PUBLIC_ROUTES: string[] = [
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
];

// Routes used for authentication. If a logged in user visits these, they will
// be redirected based on their role.
export const AUTH_ROUTES: string[] = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// After a user logs in, redirect them based on their role. Users and support
// staff go to `/dashboard`; admins go to `/admin`.
export const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin',
  support: '/dashboard',
  user: '/dashboard',
};

// Permission groups provide convenient groupings for the UI (e.g. to build
// permission checkboxes). They mirror ALL_PERMISSIONS but grouped by domain.
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  USER_MANAGEMENT: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
  ],
  PROFILE_MANAGEMENT: ['profile:read', 'profile:update'],
  DASHBOARD_ACCESS: ['dashboard:admin', 'dashboard:support', 'dashboard:user'],
  SETTINGS_MANAGEMENT: ['settings:read', 'settings:update'],
  REPORTS_MANAGEMENT: ['reports:read', 'reports:create', 'reports:delete'],
  ROOM_MANAGEMENT: [
    'rooms:read',
    'rooms:create',
    'rooms:update',
    'rooms:delete',
  ],
  BOOKING_MANAGEMENT: [
    'bookings:read',
    'bookings:create',
    'bookings:update',
    'bookings:delete',
  ],
};

// Optional: specify display information for roles (colour and icon name). This
// can be consumed by the UI to draw badges or pills. Icons should be mapped
// separately in the UI layer.
export const ROLE_DISPLAY: Record<UserRole, { color: string; label: string }> =
  {
    admin: { color: 'red', label: 'Admin' },
    support: { color: 'blue', label: 'Support' },
    user: { color: 'green', label: 'User' },
  };

// -----------------------------------------------------------------------------
// Utility functions
//
// Determine if the given role includes a specific permission.
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const perms = ROLE_PERMISSIONS[userRole]?.permissions ?? [];
  return perms.includes(permission);
}

// Determine if the role includes any of the given permissions.
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some(p => hasPermission(userRole, p));
}

// Determine if the role includes all of the given permissions.
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every(p => hasPermission(userRole, p));
}

// Check whether the user is allowed to access a route. This will match the
// beginning of the route (so `/rooms/123` matches `/rooms`). If the route is
// not listed in PROTECTED_ROUTES, it is considered public (other middleware
// should handle authentication).
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const protectedRoute = PROTECTED_ROUTES.find(r => route.startsWith(r.path));
  if (!protectedRoute) return true;
  return protectedRoute.allowedRoles.includes(userRole);
}

// Get the numeric privilege level for a role. Unknown roles return 0.
export function getRoleHierarchyLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] ?? 0;
}

// Determine if `managerRole` can manage `targetRole`. Only roles with higher
// hierarchy can manage lower roles. Admin can manage all, support can manage
// users, and users can manage no roles.
export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  return getRoleHierarchyLevel(managerRole) > getRoleHierarchyLevel(targetRole);
}

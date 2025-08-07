/**
 * RBAC Constants and Configurations
 */

import type {
  Permission,
  ProtectedRoute,
  RolePermissions,
  UserRole,
} from '@/types/rbac';

// Default role for new users
export const DEFAULT_USER_ROLE: UserRole = 'user';

// Role hierarchy (higher number = more privileges)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  support: 2,
  user: 1,
};

// All available permissions
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
];

// Role-based permissions mapping
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
    ],
    description: {
      th: 'ผู้ดูแลระบบ - สามารถเข้าถึงและจัดการทุกส่วนของระบบ',
      en: 'Administrator - Full access to all system features and user management',
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
    ],
    description: {
      th: 'ทีมสนับสนุน - สามารถช่วยเหลือผู้ใช้และดูรายงาน',
      en: 'Support Team - Can assist users and view reports',
    },
  },
  user: {
    role: 'user',
    permissions: ['profile:read', 'profile:update', 'dashboard:user'],
    description: {
      th: 'ผู้ใช้ทั่วไป - สามารถจัดการโปรไฟล์ของตนเอง',
      en: 'Regular User - Can manage own profile and access user dashboard',
    },
  },
};

// Protected routes configuration
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
    path: '/support',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: ['dashboard:support'],
  },
  {
    path: '/dashboard',
    allowedRoles: ['admin', 'support', 'user'],
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
];

// Public routes (no auth required)
export const PUBLIC_ROUTES = ['/', '/about', '/contact', '/terms', '/privacy'];

// Auth routes (redirect to dashboard if logged in)
export const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// Route redirects based on role
export const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin',
  support: '/support',
  user: '/dashboard',
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
  ] as Permission[],
  PROFILE_MANAGEMENT: ['profile:read', 'profile:update'] as Permission[],
  DASHBOARD_ACCESS: [
    'dashboard:admin',
    'dashboard:support',
    'dashboard:user',
  ] as Permission[],
  SETTINGS_MANAGEMENT: ['settings:read', 'settings:update'] as Permission[],
  REPORTS_MANAGEMENT: [
    'reports:read',
    'reports:create',
    'reports:delete',
  ] as Permission[],
};

// Role display colors and icons
export const ROLE_DISPLAY = {
  admin: {
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: '👑',
    badge: 'Admin',
  },
  support: {
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: '🛠️',
    badge: 'Support',
  },
  user: {
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: '👤',
    badge: 'User',
  },
} as const;

// Utility functions
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[userRole]?.permissions.includes(permission) ?? false;
}

export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const protectedRoute = PROTECTED_ROUTES.find(r => route.startsWith(r.path));

  if (!protectedRoute) {
    // If route is not in protected routes, check if it's public
    return (
      PUBLIC_ROUTES.includes(route) ||
      PUBLIC_ROUTES.some(publicRoute => route.startsWith(publicRoute))
    );
  }

  // Check role access
  if (!protectedRoute.allowedRoles.includes(userRole)) {
    return false;
  }

  // Check permissions if specified
  if (protectedRoute.requiredPermissions) {
    return hasAllPermissions(userRole, protectedRoute.requiredPermissions);
  }

  return true;
}

export function getRoleHierarchyLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] ?? 0;
}

export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  return getRoleHierarchyLevel(managerRole) > getRoleHierarchyLevel(targetRole);
}

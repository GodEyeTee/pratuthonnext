/**
 * RBAC Configuration and Business Logic
 * Clean Architecture - Domain Layer
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
    ],
    description: {
      th: 'ทีมสนับสนุน - สามารถช่วยเหลือลูกค้า จัดการการจอง และดูรายงาน',
      en: 'Support Team - Can assist customers, manage bookings, and view reports',
    },
  },
  user: {
    role: 'user',
    permissions: ['profile:read', 'profile:update', 'dashboard:user'],
    description: {
      th: 'ผู้เช่า - สามารถจองห้องพัก จัดการโปรไฟล์ และดูประวัติการจอง',
      en: 'Tenant - Can book rooms, manage profile, and view booking history',
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
    path: '/admin/rooms',
    allowedRoles: ['admin'],
    requiredPermissions: ['users:read'], // Room management permissions
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
  {
    path: '/rooms',
    allowedRoles: ['admin', 'support', 'user'],
    requiredPermissions: ['dashboard:user'], // Users can view available rooms
  },
  {
    path: '/bookings',
    allowedRoles: ['admin', 'support', 'user'],
    requiredPermissions: ['dashboard:user'], // Users can manage their bookings
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
  support: '/dashboard',
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
  ROOM_MANAGEMENT: [
    'rooms:read',
    'rooms:create',
    'rooms:update',
    'rooms:delete',
  ] as Permission[],
  BOOKING_MANAGEMENT: [
    'bookings:read',
    'bookings:create',
    'bookings:update',
    'bookings:delete',
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

// Room-specific permissions (for room rental system)
export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
  RESERVED: 'reserved',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
} as const;

export const RENTAL_TYPE = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
} as const;

// Business rules
export class RoomRentalRules {
  static canManageRooms(userRole: UserRole): boolean {
    return hasPermission(userRole, 'users:read'); // Using existing permission
  }

  static canManageBookings(userRole: UserRole): boolean {
    return ['admin', 'support'].includes(userRole);
  }

  static canViewAllBookings(userRole: UserRole): boolean {
    return ['admin', 'support'].includes(userRole);
  }

  static canCreateBooking(userRole: UserRole): boolean {
    return true; // All authenticated users can create bookings
  }

  static canCancelBooking(userRole: UserRole, isOwnBooking: boolean): boolean {
    return userRole === 'admin' || userRole === 'support' || isOwnBooking;
  }

  static canUpdateRoom(userRole: UserRole): boolean {
    return userRole === 'admin';
  }

  static canViewReports(userRole: UserRole): boolean {
    return hasPermission(userRole, 'reports:read');
  }
}

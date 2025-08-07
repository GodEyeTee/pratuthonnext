'use client';

import { useAuth } from '@/hooks/useAuth';
import { ROLE_REDIRECTS } from '@/lib/rbac.config';
import type {
  Permission,
  PermissionGuardProps,
  RoleGuardProps,
  UserRole,
} from '@/types/rbac';
import { useRouter } from 'next/navigation';
import React from 'react';

/**
 * RoleGuard - Protects components based on user roles
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
  redirectTo,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return fallback || <UnauthorizedMessage type="login" />;
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(user.role)) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return (
      fallback || (
        <UnauthorizedMessage
          type="role"
          userRole={user.role}
          allowedRoles={allowedRoles}
        />
      )
    );
  }

  return <>{children}</>;
};

/**
 * PermissionGuard - Protects components based on specific permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermissions,
  children,
  fallback = null,
  requireAll = true,
}) => {
  const { user, loading, hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No user
  if (!user) {
    return fallback || <UnauthorizedMessage type="login" />;
  }

  // Check permissions
  const hasRequiredPermissions = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasRequiredPermissions) {
    return (
      fallback || (
        <UnauthorizedMessage
          type="permission"
          permissions={requiredPermissions}
        />
      )
    );
  }

  return <>{children}</>;
};

/**
 * AdminOnly - Shorthand for admin-only content
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

/**
 * SupportOrAdmin - Shorthand for support and admin content
 */
export const SupportOrAdmin: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin', 'support']} fallback={fallback}>
    {children}
  </RoleGuard>
);

/**
 * AuthenticatedOnly - Shorthand for any authenticated user
 */
export const AuthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin', 'support', 'user']} fallback={fallback}>
    {children}
  </RoleGuard>
);

/**
 * ConditionalRender - Renders content based on roles without fallback
 */
export const ConditionalRender: React.FC<{
  roles: UserRole[];
  children: React.ReactNode;
}> = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

/**
 * PermissionButton - Button that's only visible if user has permission
 */
export const PermissionButton: React.FC<{
  permission: Permission;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ permission, children, className, onClick }) => (
  <PermissionGuard requiredPermissions={[permission]} fallback={null}>
    <button className={className} onClick={onClick}>
      {children}
    </button>
  </PermissionGuard>
);

/**
 * RoleBasedNavigation - Navigation items based on role
 */
export const RoleBasedNavigation: React.FC<{
  items: Array<{
    label: string;
    href: string;
    roles: UserRole[];
    icon?: React.ReactNode;
  }>;
  className?: string;
}> = ({ items, className }) => {
  const { user } = useAuth();

  if (!user) return null;

  const visibleItems = items.filter(item => item.roles.includes(user.role));

  return (
    <nav className={className}>
      {visibleItems.map((item, index) => (
        <a
          key={index}
          href={item.href}
          className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
};

/**
 * Unauthorized Message Component
 */
interface UnauthorizedMessageProps {
  type: 'login' | 'role' | 'permission';
  userRole?: UserRole;
  allowedRoles?: UserRole[];
  permissions?: Permission[];
}

const UnauthorizedMessage: React.FC<UnauthorizedMessageProps> = ({
  type,
  userRole,
  allowedRoles,
  permissions,
}) => {
  const getMessage = () => {
    switch (type) {
      case 'login':
        return {
          title: 'เข้าสู่ระบบเพื่อดำเนินการต่อ',
          description: 'คุณต้องเข้าสู่ระบบเพื่อเข้าถึงส่วนนี้',
          action: 'เข้าสู่ระบบ',
          actionHref: '/login',
        };
      case 'role':
        return {
          title: 'ไม่มีสิทธิ์เข้าถึง',
          description: `คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (ต้องการสิทธิ์: ${allowedRoles?.join(', ')})`,
          action: 'กลับหน้าแรก',
          actionHref: userRole ? ROLE_REDIRECTS[userRole] : '/',
        };
      case 'permission':
        return {
          title: 'ไม่มีสิทธิ์เข้าถึง',
          description: `คุณไม่มีสิทธิ์ที่จำเป็นในการเข้าถึงส่วนนี้`,
          action: 'กลับหน้าแรก',
          actionHref: userRole ? ROLE_REDIRECTS[userRole] : '/',
        };
      default:
        return {
          title: 'ไม่มีสิทธิ์เข้าถึง',
          description: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
          action: 'กลับหน้าแรก',
          actionHref: '/',
        };
    }
  };

  const { title, description, action, actionHref } = getMessage();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-3-12a3 3 0 01-3-3m3 3a3 3 0 003-3m0 3a3 3 0 013-3 3 3 0 013 3m-3 3h3m-3 0h-3m-3 0a3 3 0 01-3-3m3 3a3 3 0 01-3-3m3 3a3 3 0 003-3 3 3 0 013 3m-3 3h3m-3 0h-3"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>

      <a
        href={actionHref}
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        {action}
      </a>
    </div>
  );
};

// High-order component for protecting entire pages
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// High-order component for protecting with permissions
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  requireAll = true
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard
        requiredPermissions={requiredPermissions}
        requireAll={requireAll}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

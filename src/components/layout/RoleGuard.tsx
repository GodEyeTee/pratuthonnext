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

/** RoleGuard */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
  redirectTo,
}) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !role) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return fallback || <UnauthorizedMessage type="login" />;
  }

  if (!allowedRoles.includes(role)) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return (
      fallback || (
        <UnauthorizedMessage
          type="role"
          userRole={role}
          allowedRoles={allowedRoles}
        />
      )
    );
  }

  return <>{children}</>;
};

/** PermissionGuard */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermissions,
  children,
  fallback = null,
  requireAll = true,
}) => {
  const { user, role, loading, hasAnyPermission, hasAllPermissions } =
    useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !role) {
    return fallback || <UnauthorizedMessage type="login" />;
  }

  const ok = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!ok) {
    return (
      fallback || (
        <UnauthorizedMessage
          type="permission"
          userRole={role}
          permissions={requiredPermissions}
        />
      )
    );
  }

  return <>{children}</>;
};

export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const SupportOrAdmin: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin', 'support']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AuthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin', 'support', 'user']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const ConditionalRender: React.FC<{
  roles: UserRole[];
  children: React.ReactNode;
}> = ({ roles, children }) => {
  const { role } = useAuth();
  if (!role || !roles.includes(role)) return null;
  return <>{children}</>;
};

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

/** Unauthorized block */
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
          description: `ต้องการสิทธิ์: ${allowedRoles?.join(', ')}`,
          action: 'กลับหน้าแรก',
          // แคบชนิดก่อน index เพื่อกัน TS7053
          actionHref: userRole ? ROLE_REDIRECTS[userRole as UserRole] : '/',
        };
      case 'permission':
        return {
          title: 'ไม่มีสิทธิ์เข้าถึง',
          description: `คุณไม่มีสิทธิ์ที่จำเป็นในการเข้าถึงส่วนนี้`,
          action: 'กลับหน้าแรก',
          actionHref: userRole ? ROLE_REDIRECTS[userRole as UserRole] : '/',
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
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      <a
        href={actionHref}
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
      >
        {action}
      </a>
    </div>
  );
};

/** HOCs */
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

// src/lib/rbac.config.ts
import type { Permission, UserRole } from '@/types/rbac';

/**
 * เส้นทางที่ redirect หลังล็อกอินตาม role
 */
export const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/dashboard',
  support: '/dashboard',
  user: '/profile',
};

/**
 * หน้า public ที่ไม่ต้องล็อกอิน
 * (สำคัญ: รวม /login, /logout, /auth/callback เพื่อไม่ให้ middleware ไปขวาง)
 */
export const PUBLIC_ROUTES: string[] = [
  '/',
  '/login',
  '/logout',
  '/auth/callback',
  '/locale',
  '/health',
];

/**
 * หน้า auth ที่ถ้าล็อกอินแล้วให้เด้งออก (เช่น /login)
 */
export const AUTH_ROUTES: string[] = ['/login'];

/**
 * เพจที่ต้องล็อกอิน (role-check ให้ทำในฝั่งเพจ/เซิร์ฟเวอร์อีกชั้น)
 */
export const PROTECTED_ROUTES: Array<{
  path: string;
  allowedRoles: UserRole[];
  requiredPermissions: Permission[];
}> = [
  {
    path: '/dashboard',
    allowedRoles: ['admin', 'support', 'user'],
    requiredPermissions: [],
  },
  {
    path: '/rooms',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: [],
  },
  {
    path: '/tenants',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: [],
  },
  {
    path: '/bookings',
    allowedRoles: ['admin', 'support'],
    requiredPermissions: [],
  },
  {
    path: '/profile',
    allowedRoles: ['admin', 'support', 'user'],
    requiredPermissions: [],
  },
  {
    path: '/settings',
    allowedRoles: ['admin', 'support', 'user'],
    requiredPermissions: [],
  },
  {
    path: '/help',
    allowedRoles: ['admin', 'support', 'user'],
    requiredPermissions: [],
  },
];

/**
 * Permission helpers (ถ้าใช้จริงค่อย map ราย permission)
 * ตอนนี้กำหนดง่าย ๆ: admin/support = true, user = false
 */
export function hasPermission(role: UserRole, _perm: Permission): boolean {
  if (role === 'admin') return true;
  if (role === 'support') return true;
  return false;
}
export function hasAnyPermission(role: UserRole, perms: Permission[]) {
  return perms.some(p => hasPermission(role, p));
}
export function hasAllPermissions(role: UserRole, perms: Permission[]) {
  return perms.every(p => hasPermission(role, p));
}

/**
 * ✅ canManageRole — ใช้ใน API `/api/users` เพื่อตัดสินว่า
 *   ผู้กระทำ (actor) มีสิทธิ์ "เปลี่ยน role" ของเป้าหมายหรือไม่
 *
 * ดีฟอลต์ที่ปลอดภัย:
 *  - admin: ทำได้ทุกอย่าง
 *  - support: ทำไม่ได้ (กันเผลอยกระดับสิทธิ์)
 *  - user: ทำไม่ได้
 *
 * หากต้องการอนุญาตให้ support จัดการเฉพาะ user:
 *   เปลี่ยน logic ด้านล่างตามคอมเมนต์
 */
export function canManageRole(
  actorRole: UserRole,
  targetRole?: UserRole
): boolean {
  if (actorRole === 'admin') return true;

  // ถ้าอยากเปิดให้ support จัดการ user เท่านั้น ให้ใช้แบบนี้:
  // if (actorRole === 'support') {
  //   return !targetRole || targetRole === 'user';
  // }

  return false;
}

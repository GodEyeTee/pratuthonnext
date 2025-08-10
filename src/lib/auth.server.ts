/**
 * Server-side Authentication Functions (Firebase)
 * Clean Architecture - Application Layer
 */
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/types/rbac';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 14, // 14 days
  path: '/',
};

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  emailVerified: boolean;
}

export async function createSessionCookie(idToken: string) {
  try {
    const expiresIn = 14 * 24 * 60 * 60 * 1000; // 14 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, SESSION_COOKIE_OPTIONS);
    return { success: true };
  } catch (error: any) {
    console.error('Create session cookie error:', error);
    return {
      success: false,
      error: error?.message ?? 'Failed to create session',
    };
  }
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    const [userRecord, userDoc] = await Promise.all([
      adminAuth.getUser(uid),
      adminDb.collection('users').doc(uid).get(),
    ]);

    const customData = userDoc.exists ? userDoc.data() : {};
    const role = ((customData as any)?.role ||
      (decoded as any).role ||
      'user') as UserRole;

    return {
      uid,
      email: userRecord.email ?? null,
      displayName: userRecord.displayName ?? null,
      photoURL: userRecord.photoURL ?? null,
      role,
      emailVerified: userRecord.emailVerified ?? false,
    };
  } catch (error) {
    console.error('Get current session error:', error);
    return null;
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error: any) {
    console.error('Clear session cookie error:', error);
    return {
      success: false,
      error: error?.message ?? 'Failed to clear session',
    };
  }
}

// RBAC helpers (เร็ว/ตรงไปตรงมา)
export async function verifyUserRole(allowed: UserRole[]): Promise<boolean> {
  const s = await getCurrentSession();
  return !!s && allowed.includes(s.role);
}

export async function verifyUserPermission(
  permission: string
): Promise<boolean> {
  const s = await getCurrentSession();
  if (!s) return false;
  if (s.role === 'admin') return true;
  if (s.role === 'support') {
    return (
      !permission.startsWith('users:delete') &&
      !permission.startsWith('users:role')
    );
  }
  if (s.role === 'user') {
    return (
      permission.startsWith('profile:') ||
      permission.startsWith('bookings:read')
    );
  }
  return permission === 'rooms:read';
}

// Admin-only utilities (ใช้ตรง ๆ แทน userManagement เดิม)
export async function adminCreateUser(
  email: string,
  password: string,
  role: UserRole,
  displayName?: string
) {
  try {
    const record = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });
    await adminAuth.setCustomUserClaims(record.uid, { role }); // ตั้ง custom claims สำหรับ RBAC :contentReference[oaicite:1]{index=1}
    await adminDb
      .collection('users')
      .doc(record.uid)
      .set({
        email,
        displayName: displayName ?? null,
        role,
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      });
    return { success: true, user: record };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Create user failed' };
  }
}

export async function adminUpdateUserRole(uid: string, newRole: UserRole) {
  try {
    await adminAuth.setCustomUserClaims(uid, { role: newRole }); // :contentReference[oaicite:2]{index=2}
    await adminDb
      .collection('users')
      .doc(uid)
      .set({ role: newRole, updatedAt: new Date() }, { merge: true });
    await adminDb.collection('audit_logs').add({
      action: 'role_changed',
      userId: uid,
      performedBy: 'system',
      timestamp: new Date(),
      details: { newRole },
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Update role failed' };
  }
}

export async function adminListUsers(limit = 100, pageToken?: string) {
  try {
    const res = await adminAuth.listUsers(limit, pageToken);
    const ids = res.users.map(u => u.uid);
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
    const userData = new Map<string, any>();
    for (const c of chunks) {
      const qs = await adminDb
        .collection('users')
        .where('__name__', 'in', c)
        .get();
      qs.forEach(d => userData.set(d.id, d.data()));
    }
    const enriched = res.users.map(u => ({
      ...u,
      customData: userData.get(u.uid) || null,
    }));
    return { users: enriched, pageToken: res.pageToken };
  } catch {
    return { users: [], pageToken: undefined };
  }
}

export async function adminDeleteUser(uid: string) {
  try {
    await adminAuth.deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();
    await adminDb.collection('audit_logs').add({
      action: 'user_deleted',
      userId: uid,
      performedBy: 'system',
      timestamp: new Date(),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Delete user failed' };
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getCurrentSession } from '@/lib/auth.server';
import { userManagement } from '@/lib/firebase/admin';
import type { UserRole } from '@/types/rbac';
import { NextResponse } from 'next/server';

const ALLOWED_ROLES: UserRole[] = ['admin', 'support', 'user'];

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { uid, newRole } = (await req.json()) as {
    uid?: string;
    newRole?: UserRole;
  };
  if (!uid || !newRole || !ALLOWED_ROLES.includes(newRole)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { success, error } = await userManagement.updateUserRole(uid, newRole);
  return success
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: error || 'Update failed' }, { status: 400 });
}

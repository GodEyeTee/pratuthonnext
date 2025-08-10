import { getCurrentSession } from '@/lib/auth.server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/types/rbac';
import { NextResponse } from 'next/server';
import 'server-only';

export async function POST(req: Request) {
  const sess = await getCurrentSession();
  if (!sess || sess.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { uid, role } = (await req.json()) as { uid: string; role: UserRole };
    if (!uid || !role) {
      return NextResponse.json(
        { error: 'uid and role are required' },
        { status: 400 }
      );
    }

    await adminAuth.setCustomUserClaims(uid, { role }); // กำหนด role ด้วย custom claims :contentReference[oaicite:8]{index=8}
    await adminDb
      .collection('users')
      .doc(uid)
      .set({ role, updatedAt: new Date() }, { merge: true });
    await adminDb.collection('audit_logs').add({
      action: 'role_changed',
      userId: uid,
      performedBy: sess.uid,
      timestamp: new Date(),
      details: { newRole: role },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed' },
      { status: 500 }
    );
  }
}

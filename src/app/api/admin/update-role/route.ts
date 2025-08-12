// src/app/api/admin/update-role/route.ts
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const me = await adminAuth.verifySessionCookie(session, true);
    if (me.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { uid, role } = await req.json();
    if (!uid || !role)
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    await adminAuth.setCustomUserClaims(uid, { role });
    await adminDb
      .collection('users')
      .doc(uid)
      .set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await adminAuth.revokeRefreshTokens(uid); // สำคัญ!

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[update-role]', e);
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

import { getCurrentSession } from '@/lib/auth.server';
import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import 'server-only';

export async function GET() {
  const sess = await getCurrentSession();
  if (!sess || !['admin', 'support'].includes(sess.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    const users = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed' },
      { status: 500 }
    );
  }
}

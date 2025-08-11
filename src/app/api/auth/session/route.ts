export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
const EXPIRES_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: 'missing idToken' }, { status: 400 });
    }

    // Verify token ของผู้ใช้ (ได้ uid, claims)
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const uid = decoded.uid;

    // สร้าง/อัปเดตโปรไฟล์ใน Firestore
    const ref = adminDb.collection('users').doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const u = await adminAuth.getUser(uid);
      await ref.set({
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        photoURL: u.photoURL ?? null,
        // ค่าเริ่มต้น: user — (ไม่จำเป็นต้องตั้งเป็น custom claim)
        role: 'user',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      });
    } else {
      await ref.set(
        {
          updatedAt: FieldValue.serverTimestamp(),
          lastLoginAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // ออก Session Cookie 3 วัน (ยาวกว่า ID token ปกติ) — ตามแนวทางเอกสาร
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: EXPIRES_MS / 1000,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'create session failed' },
      { status: 400 }
    );
  }
}

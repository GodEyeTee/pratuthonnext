// src/app/api/auth/session/route.ts
import { userManagement } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 3 * 24 * 60 * 60, // 3 วัน
};

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken)
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

    const { sessionCookie, error } = await userManagement.createSessionCookie(
      idToken,
      COOKIE_OPTS.maxAge * 1000
    );
    if (error || !sessionCookie)
      return NextResponse.json(
        { error: error || 'Mint failed' },
        { status: 401 }
      );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, COOKIE_OPTS);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[auth/session]', e);
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}

// src/app/locale/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get('lang');

  if (lang && ['th', 'en'].includes(lang)) {
    const cookieStore = await cookies();
    cookieStore.set('locale', lang, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });
  }

  return NextResponse.redirect(
    new URL(req.headers.get('referer') || '/', req.url)
  );
}

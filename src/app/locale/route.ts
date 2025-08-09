// app/locale/route.ts
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n.config';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get('lang') ?? DEFAULT_LOCALE;
  const locale = (AVAILABLE_LOCALES as readonly string[]).includes(lang)
    ? lang
    : DEFAULT_LOCALE;

  const referer = req.headers.get('referer') || '/';
  const redirectTo = new URL(referer, url.origin);

  const res = NextResponse.redirect(redirectTo);
  res.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}

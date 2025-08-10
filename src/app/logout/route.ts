import 'server-only';

import { clearSessionCookie } from '@/lib/auth.server';
import { NextResponse } from 'next/server';

// รองรับทั้ง GET/POST
export async function GET(request: Request) {
  try {
    // ลบคุกกี้ session ของ Firebase (HttpOnly) ฝั่งเซิร์ฟเวอร์
    await clearSessionCookie();
  } catch {
    // เงียบไว้ ต่อให้ล้มเหลว เราก็ redirect ต่อ
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}

export async function POST(request: Request) {
  return GET(request);
}

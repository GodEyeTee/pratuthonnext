import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  // สำหรับ Firebase redirect sign-in เราจะจัดการฝั่ง client อยู่แล้ว
  return NextResponse.redirect(`${origin}/dashboard`);
}

export async function POST(req: Request) {
  return GET(req);
}

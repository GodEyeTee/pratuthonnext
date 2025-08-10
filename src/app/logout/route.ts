import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient(); // ✅ ต้อง await
    await supabase.auth.signOut(); // เคลียร์คุกกี้ SSR ให้เรียบร้อย
  } catch {
    // ignore errors – เราจะ redirect ต่อให้ signOut ล้มเหลว
  }
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}

export async function POST(request: Request) {
  return GET(request);
}

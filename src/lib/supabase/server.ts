// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
// import type { Database } from '@/types/supabase'; // ถ้ามี types เปิดใช้งานได้

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`[supabase] Missing env ${name}`);
  return v;
}

/**
 * SSR anon client (RLS-enabled)
 * - ใช้ใน Server Components / Server Actions / Route Handlers
 * - Next 15: ต้อง await cookies() ก่อนใช้งานค่าใน dynamic route
 */
export async function createClient() {
  const url = required(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const anon = required(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // ✅ ต้อง await ตามข้อกำหนด "sync dynamic APIs"
  const cookieStore: any = await (getCookies() as any);

  return createServerClient(/* <Database> */ url, anon, {
    cookies: {
      get(name: string) {
        try {
          const c = cookieStore?.get?.(name);
          return c?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options?: any) {
        try {
          // signature แบบใหม่ของ Next 15
          cookieStore?.set?.({ name, value, ...(options || {}) });
        } catch {
          try {
            // fallback แบบเก่า
            cookieStore?.set?.(name, value, options);
          } catch {
            /* noop */
          }
        }
      },
      remove(name: string, options?: any) {
        try {
          cookieStore?.set?.({
            name,
            value: '',
            ...(options || {}),
            maxAge: 0,
          });
        } catch {
          try {
            cookieStore?.set?.(name, '', { ...(options || {}), maxAge: 0 });
          } catch {
            /* noop */
          }
        }
      },
    },
  });
}

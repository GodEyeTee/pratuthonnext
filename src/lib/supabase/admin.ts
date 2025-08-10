// src/lib/supabase/admin.ts
import { createClient as createSb } from '@supabase/supabase-js';
// import type { Database } from '@/types/supabase'; // ถ้ามี types ค่อยใส่

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`[supabase-admin] Missing env ${name}`);
  return v;
}

// singleton กันสร้างซ้ำ
let _admin: ReturnType<typeof createSb> | null = null;

/**
 * Admin client (service_role)
 * - BYPASS RLS — ใช้เฉพาะ background jobs/admin tools เท่านั้น
 * - ไม่อ่าน/เขียนคุกกี้
 */
export function createAdminClient() {
  if (_admin) return _admin;
  const url = required(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const srv = required(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  _admin = createSb(/*<Database>*/ url, srv, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'admin-service',
      },
    },
  });
  return _admin;
}

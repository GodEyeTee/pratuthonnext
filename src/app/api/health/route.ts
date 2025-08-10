import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import 'server-only';

export async function GET() {
  try {
    // ping แบบเบาๆ: ไม่อ่านเอกสาร แค่เข้าถึง reference
    await adminDb.listCollections(); // ถ้า credential ไม่โอเค ตรงนี้จะ throw
    return NextResponse.json({
      ok: true,
      service: 'api/health',
      provider: 'firebase',
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unhealthy' },
      { status: 500 }
    );
  }
}

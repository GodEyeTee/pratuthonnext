import { getCurrentSession } from '@/lib/auth.server';
import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import 'server-only';

// สถิติโดยประมาณ — ใช้ count() aggregation ของ Firestore ช่วยประหยัด read :contentReference[oaicite:5]{index=5}
type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  roleCounts: { admin: number; support: number; user: number; other: number };
  recentActivity: Array<{
    id: string;
    action: string;
    userId?: string;
    timestamp?: string;
  }>;
};

export async function GET() {
  // ตรวจสิทธิ์แบบง่าย: ต้องล็อกอินก่อน (จะเพิ่ม role check ทีหลัง)
  const sess = await getCurrentSession();
  if (!sess)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const usersRef = adminDb.collection('users');

    const [totalSnap, adminSnap, supportSnap, userSnap, newSnap, activitySnap] =
      await Promise.all([
        usersRef.count().get(), // รวมทั้งหมด (aggregation) :contentReference[oaicite:6]{index=6}
        usersRef.where('role', '==', 'admin').count().get(),
        usersRef.where('role', '==', 'support').count().get(),
        usersRef.where('role', '==', 'user').count().get(),
        usersRef
          .where(
            'createdAt',
            '>=',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
          .count()
          .get(),
        adminDb
          .collection('audit_logs')
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get(),
      ]);

    const totalUsers = Number(totalSnap.data().count || 0);
    const admins = Number(adminSnap.data().count || 0);
    const supports = Number(supportSnap.data().count || 0);
    const users = Number(userSnap.data().count || 0);
    const newUsers = Number(newSnap.data().count || 0);

    // นิยาม activeUsers แบบหยาบๆ = ผู้ใช้ที่มี lastLoginAt ภายใน 30 วัน
    const activeSnap = await usersRef
      .where(
        'lastLoginAt',
        '>=',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      .count()
      .get();
    const activeUsers = Number(activeSnap.data().count || 0);

    const recentActivity = activitySnap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        action: data.action ?? 'unknown',
        userId: data.userId,
        timestamp: data.timestamp?.toDate?.()
          ? data.timestamp.toDate().toISOString()
          : (data.timestamp ?? null),
      };
    });

    const payload: DashboardStats = {
      totalUsers,
      activeUsers,
      newUsers,
      roleCounts: {
        admin: admins,
        support: supports,
        user: users,
        other: totalUsers - (admins + supports + users),
      },
      recentActivity,
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error('[admin.dashboard]', e);
    return NextResponse.json(
      { error: e?.message ?? 'Failed' },
      { status: 500 }
    );
  }
}
// อ้างอิง: Next.js Route Handlers & Server Actions + revalidatePath (ใช้ใน action อื่น ๆ) :contentReference[oaicite:7]{index=7}

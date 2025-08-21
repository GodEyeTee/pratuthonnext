// src/app/shop/browse/layout.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentSession } from '@/lib/auth.server';
import { redirect } from 'next/navigation';
import 'server-only';

export default async function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getCurrentSession();
  if (!s) redirect('/login');
  // staff ไม่ควรเห็นหน้าซื้อของผู้ใช้ -> เด้งไปหน้าจัดการ
  if (s.role === 'admin' || s.role === 'support') redirect('/shop/manage');

  return (
    <DashboardLayout title="ร้านค้า" subtitle="เลือกซื้อสินค้า">
      {children}
    </DashboardLayout>
  );
}

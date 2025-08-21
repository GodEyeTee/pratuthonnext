// src/app/shop/manage/layout.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentSession } from '@/lib/auth.server';
import { redirect } from 'next/navigation';
import 'server-only';

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getCurrentSession();
  if (!s) redirect('/login');
  // ให้เฉพาะ admin/support
  if (!(s.role === 'admin' || s.role === 'support')) redirect('/shop/browse');

  return (
    <DashboardLayout title="ร้านค้า" subtitle="จัดการ / POS">
      {children}
    </DashboardLayout>
  );
}

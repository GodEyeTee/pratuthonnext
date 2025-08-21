import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentSession } from '@/lib/auth.server';
import { redirect } from 'next/navigation';
import 'server-only';

export default async function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getCurrentSession();
  if (!s) redirect('/login');
  if (!(s.role === 'admin' || s.role === 'support')) {
    redirect('/dashboard/user');
  }
  return (
    <DashboardLayout title="Maintenance" subtitle="งานซ่อมบำรุง">
      {children}
    </DashboardLayout>
  );
}

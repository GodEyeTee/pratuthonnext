import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

/**
 * Profile section shell
 * ครอบทุกหน้าใต้ /profile/* ด้วย DashboardLayout
 */
export default function ProfileSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout title="Profile" subtitle="Your account">
      {children}
    </DashboardLayout>
  );
}

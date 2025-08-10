import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

/**
 * Settings section shell
 * ครอบทุกหน้าใต้ /settings/* ด้วย DashboardLayout
 */
export default function SettingsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout title="Settings" subtitle="Application settings">
      {children}
    </DashboardLayout>
  );
}

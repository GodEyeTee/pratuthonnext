import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

/**
 * Rooms section shell
 * ครอบทุกหน้าใต้ /rooms/* ด้วย DashboardLayout
 */
export default function RoomsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout title="Rooms" subtitle="Manage rooms">
      {children}
    </DashboardLayout>
  );
}

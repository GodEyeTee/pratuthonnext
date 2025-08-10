import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout title="Dashboard" subtitle="Overview">
      {children}
    </DashboardLayout>
  );
}

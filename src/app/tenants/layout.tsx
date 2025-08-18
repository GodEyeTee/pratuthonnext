import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

export default function TenantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout title="Tenants" subtitle="Manage tenants">
      {children}
    </DashboardLayout>
  );
}

import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

export default function BookingsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Booking History"
      subtitle="All reservations at a glance"
    >
      {children}
    </DashboardLayout>
  );
}

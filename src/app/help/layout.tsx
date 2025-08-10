import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

/**
 * Help section shell
 * ครอบทุกหน้าใต้ /help/* ด้วย DashboardLayout
 */
export default function HelpSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout title="Help" subtitle="Q&A and docs">
      {children}
    </DashboardLayout>
  );
}

// src/app/dashboard/user/layout.tsx
import { getCurrentSession } from '@/lib/auth.server';
import { redirect } from 'next/navigation';
import React from 'react';
import 'server-only';

export default async function UserDashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/login');
  }
  // อนุญาตเฉพาะ user เท่านั้น
  if (session.role !== 'user') {
    // admin / support กลับแดชบอร์ดหลัก
    redirect('/dashboard');
  }

  return <>{children}</>;
}

// src/app/shop/page.tsx
import { getCurrentSession } from '@/lib/auth.server';
import { redirect } from 'next/navigation';
import 'server-only';

export default async function ShopEntry() {
  const session = await getCurrentSession();

  // ยังไม่ล็อกอิน -> ให้ไปหน้า browse (จะรีไดเร็กท์อีกชั้นถ้าจำเป็น)
  if (!session) redirect('/shop/browse');

  if (session.role === 'admin' || session.role === 'support') {
    redirect('/shop/manage');
  } else {
    redirect('/shop/browse');
  }
}

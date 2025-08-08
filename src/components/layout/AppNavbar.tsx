'use client';

import { Navbar, type NavItem } from '@/components/ui/Navbar';

const items: NavItem[] = [
  {
    label: { th: 'แดชบอร์ด', en: 'Dashboard' },
    href: '/dashboard',
  },
  {
    label: { th: 'ห้องพัก', en: 'Rooms' },
    href: '/rooms',
  },
  {
    label: { th: 'ผู้ใช้', en: 'Users' },
    href: '/admin/users',
  },
];

export function AppNavbar() {
  return (
    <Navbar
      brand={{ name: 'ระบบหอพัก', href: '/' }}
      items={items}
      locale="th"
    />
  );
}

export default AppNavbar;

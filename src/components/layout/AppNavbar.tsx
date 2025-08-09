'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ถ้าจะใช้ที่อื่นต่อก็ export type นี้ไปได้
export type Locale = 'th' | 'en';
export type NavItem = {
  label: Record<Locale, string>;
  href: string;
  /** ถ้าอยากให้ active เฉพาะ path ตรงเป๊ะๆ */
  exact?: boolean;
};

const items: NavItem[] = [
  { label: { th: 'แดชบอร์ด', en: 'Dashboard' }, href: '/dashboard' },
  { label: { th: 'ห้องพัก', en: 'Rooms' }, href: '/rooms' },
  { label: { th: 'ผู้ใช้', en: 'Users' }, href: '/admin/users' },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  // ให้ /dashboard active ครอบเส้นทางย่อยด้วย แต่ไม่ให้ "/" ครอบทั้งหมด
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function AppNavbar({ locale = 'th' as Locale }: { locale?: Locale }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="flex items-center justify-between gap-4 px-4 py-3 border-b"
    >
      <Link href="/" className="font-semibold text-lg">
        ระบบหอพัก
      </Link>

      <ul role="list" className="flex items-center gap-4">
        {items.map(item => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'underline underline-offset-4'
                    : 'hover:underline underline-offset-4'
                }
              >
                {item.label[locale]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default AppNavbar;

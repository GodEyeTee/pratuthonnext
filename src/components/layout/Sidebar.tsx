/*
 * Sidebar component
 *
 * This is a simplified and fully self‑contained version of the sidebar.  It
 * supports collapsing on large screens, a mobile drawer on small screens,
 * theme toggling, and role‑based filtering of navigation items.  Only
 * `admin` and `support` users will see dashboard/rooms/tenants/bookings
 * links. All roles will see profile, settings and help.
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { signOut } from '@/lib/auth.client';
import {
  BedDouble,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings as Cog,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useLocale as useNextIntlLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';

type SidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: SidebarItem[];
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleMode } = useTheme();
  const tNav = useTranslations('navigation');
  const locale = useNextIntlLocale();

  // Collapse state for desktop and open state for mobile
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter items by role. If an item declares roles, the current user's role
  // must be included. Items without a roles property are always shown.
  const filterByRole = (items: SidebarItem[]) => {
    return items.filter(it => {
      if (!it.roles) return true;
      const role = (user?.role as string) || 'user';
      return it.roles.includes(role);
    });
  };

  // Main navigation items (restricted to admin/support)
  const mainItems: SidebarItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: tNav('dashboard'),
        href: '/dashboard',
        icon: <Home size={18} />, // shown for admin/support
        roles: ['admin', 'support'],
      },
      {
        id: 'rooms',
        label: tNav('rooms'),
        href: '/rooms',
        icon: <BedDouble size={18} />,
        roles: ['admin', 'support'],
      },
      {
        id: 'tenants',
        label: locale === 'th' ? 'ผู้เช่า' : 'Tenants',
        href: '/tenants',
        icon: <Users size={18} />,
        roles: ['admin', 'support'],
      },
      {
        id: 'bookings',
        label: tNav('bookings'),
        href: '/bookings',
        icon: <Calendar size={18} />,
        roles: ['admin', 'support'],
      },
    ],
    [tNav, locale]
  );

  // System items (reports, maintenance, integration). These are further
  // restricted: reports and maintenance are for admin/support; integration
  // only for admin.
  const systemItems: SidebarItem[] = useMemo(
    () =>
      filterByRole([
        {
          id: 'reports',
          label: tNav('reports'),
          href: '/reports',
          icon: <FileText size={18} />,
          roles: ['admin', 'support'],
        },
        {
          id: 'maintenance',
          label: locale === 'th' ? 'งานซ่อมบำรุง' : 'Maintenance',
          href: '/maintenance',
          icon: <Wrench size={18} />,
          roles: ['admin', 'support'],
        },
        {
          id: 'integration',
          label: locale === 'th' ? 'การเชื่อมต่อ' : 'Integration',
          href: '/integration',
          icon: <Shield size={18} />,
          roles: ['admin'],
        },
      ]),
    [tNav, locale, user?.role]
  );

  // Account items (profile, settings, help). Available to all roles.
  const accountItems: SidebarItem[] = useMemo(
    () => [
      {
        id: 'profile',
        label: tNav('profile'),
        href: '/profile',
        icon: <User size={18} />,
      },
      {
        id: 'settings',
        label: tNav('settings'),
        href: '/settings',
        icon: <Cog size={18} />,
      },
      {
        id: 'help',
        label: tNav('help'),
        href: '/help',
        icon: <HelpCircle size={18} />,
      },
    ],
    [tNav]
  );

  // Combine all sections with appropriate filtering
  const sections = useMemo(() => {
    return [
      {
        label: locale === 'th' ? 'หลัก' : 'Main',
        items: filterByRole(mainItems),
      },
      { label: locale === 'th' ? 'ระบบ' : 'System', items: systemItems },
      { label: locale === 'th' ? 'บัญชี' : 'Account', items: accountItems },
    ];
  }, [mainItems, systemItems, accountItems, user?.role]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  // Render single item. If children exist they will be shown nested. Active
  // state is determined by matching pathname.
  const renderItem = (item: SidebarItem) => {
    const isActive =
      item.href &&
      (pathname === item.href || pathname.startsWith(item.href + '/'));
    return (
      <li key={item.id}>
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
              'hover:bg-accent/60',
              isActive && 'bg-accent text-accent-foreground'
            )}
            onClick={() => setMobileOpen(false)}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ) : null}
        {item.children && !collapsed && (
          <ul className="ml-4 space-y-1 mt-1">
            {item.children.map(child => renderItem(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border shadow-md"
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed z-50 top-0 left-0 h-full flex flex-col bg-background border-r shadow-md transition-transform duration-200',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header with brand and collapse button */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          {!collapsed && (
            <div className="text-lg font-semibold">
              {locale === 'th' ? 'ระบบหอพัก' : 'Rooms System'}
            </div>
          )}
          <button
            className="hidden lg:block p-2 rounded-md hover:bg-accent/50"
            onClick={() => setCollapsed(v => !v)}
            aria-label={
              collapsed
                ? locale === 'th'
                  ? 'ขยาย'
                  : 'Expand'
                : locale === 'th'
                  ? 'ย่อ'
                  : 'Collapse'
            }
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>
        {/* Navigation sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {sections.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <div className="text-xs uppercase font-semibold text-muted-foreground mb-2 px-3">
                  {section.label}
                </div>
              )}
              <ul className="space-y-1">
                {section.items.map(item => renderItem(item))}
              </ul>
            </div>
          ))}
        </nav>
        {/* Footer with theme toggle, logout and user info */}
        <div className="border-t px-4 py-4 space-y-3">
          {/* Theme toggle */}
          <button
            onClick={toggleMode}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent/60"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (
              <span>
                {theme === 'dark'
                  ? locale === 'th'
                    ? 'โหมดสว่าง'
                    : 'Light Mode'
                  : locale === 'th'
                    ? 'โหมดมืด'
                    : 'Dark Mode'}
              </span>
            )}
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent/60"
          >
            <LogOut size={18} />
            {!collapsed && (
              <span>{locale === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>
            )}
          </button>
          {/* User info */}
          {!collapsed && user && (
            <div className="text-xs text-muted-foreground px-2">
              <div>{user.email}</div>
              <div className="capitalize">
                {(user.role as string) || 'user'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

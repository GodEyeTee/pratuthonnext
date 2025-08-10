'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

type SidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  roles?: Array<'admin' | 'support' | 'user'>;
};

type SidebarProps = {
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen?: boolean;
  setMobileOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Sidebar(props: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleMode } = useTheme();

  // fallback states when not controlled
  const [ic, setIc] = useState(false);
  const [im, setIm] = useState(false);

  const collapsed = props.collapsed ?? ic;
  const setCollapsed = props.setCollapsed ?? setIc;
  const mobileOpen = props.mobileOpen ?? im;
  const setMobileOpen = props.setMobileOpen ?? setIm;

  const filterByRole = (items: SidebarItem[]) =>
    items.filter(it => !it.roles || (user && it.roles.includes(user.role)));

  const mainItems: SidebarItem[] = useMemo(
    () =>
      filterByRole([
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: <Home size={18} />,
          roles: ['admin', 'support'],
        },
        {
          id: 'rooms',
          label: 'Rooms',
          href: '/rooms',
          icon: <BedDouble size={18} />,
          roles: ['admin', 'support'],
        },
        {
          id: 'tenants',
          label: 'Tenants',
          href: '/tenants',
          icon: <Users size={18} />,
          roles: ['admin', 'support'],
        },
        {
          id: 'bookings',
          label: 'Bookings',
          href: '/bookings',
          icon: <Calendar size={18} />,
          roles: ['admin', 'support'],
        },
      ]),
    [user?.role]
  );

  const systemItems: SidebarItem[] = useMemo(
    () =>
      filterByRole([
        {
          id: 'reports',
          label: 'Reports',
          href: '/reports',
          icon: <FileText size={18} />,
          roles: ['admin', 'support'],
        },
        {
          id: 'maintenance',
          label: 'Maintenance',
          href: '/maintenance',
          icon: <Wrench size={18} />,
          roles: ['admin', 'support'],
        },
        {
          id: 'integration',
          label: 'Integration',
          href: '/integration',
          icon: <Shield size={18} />,
          roles: ['admin'],
        },
      ]),
    [user?.role]
  );

  const accountItems: SidebarItem[] = useMemo(
    () => [
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: <User size={18} />,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: <Cog size={18} />,
      },
      {
        id: 'help',
        label: 'Help',
        href: '/help',
        icon: <HelpCircle size={18} />,
      },
    ],
    []
  );

  const renderItem = (item: SidebarItem) => {
    const active =
      item.href &&
      (pathname === item.href || pathname.startsWith(item.href + '/'));
    return (
      <li key={item.id}>
        {item.href && (
          <Link
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-accent/60',
              active && 'bg-accent text-accent-foreground'
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border shadow-md"
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          {!collapsed && (
            <div className="text-lg font-semibold">Rooms System</div>
          )}
          <button
            className="hidden lg:block p-2 rounded-md hover:bg-accent/50"
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          <div>
            {!collapsed && (
              <div className="text-xs uppercase font-semibold text-muted-foreground mb-2 px-3">
                Main
              </div>
            )}
            <ul className="space-y-1">{mainItems.map(renderItem)}</ul>
          </div>
          <div>
            {!collapsed && (
              <div className="text-xs uppercase font-semibold text-muted-foreground mb-2 px-3">
                System
              </div>
            )}
            <ul className="space-y-1">{systemItems.map(renderItem)}</ul>
          </div>
          <div>
            {!collapsed && (
              <div className="text-xs uppercase font-semibold text-muted-foreground mb-2 px-3">
                Account
              </div>
            )}
            <ul className="space-y-1">{accountItems.map(renderItem)}</ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t px-4 py-4 space-y-3">
          <button
            onClick={toggleMode}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent/60"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>
          <a
            href="/logout"
            className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent/60"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </a>
          {!collapsed && user && (
            <div className="text-xs text-muted-foreground px-2">
              <div>{user.email}</div>
              <div className="capitalize">{user.role}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

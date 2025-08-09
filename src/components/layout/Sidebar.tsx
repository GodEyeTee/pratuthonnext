'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { signOut } from '@/lib/auth.client';
import { cn } from '@/lib/utils';
import {
  BedDouble,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  Users as UsersIcon,
  Wrench,
  X,
} from 'lucide-react';
import { useLocale as useNextIntlLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: SidebarItem[];
  roles?: string[];
};

type Props = {
  collapsed?: boolean;
  setCollapsed?: (v: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (v: boolean) => void;
};

export default function Sidebar(props: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleMode } = useTheme();

  // i18n
  const tNav = useTranslations('navigation');
  const locale = useNextIntlLocale();

  // controlled/uncontrolled support
  const [collapsedU, setCollapsedU] = useState<boolean>(
    props.collapsed ?? false
  );
  const [mobileOpenU, setMobileOpenU] = useState<boolean>(
    props.mobileOpen ?? false
  );
  const collapsed = props.collapsed ?? collapsedU;
  const setCollapsed = props.setCollapsed ?? setCollapsedU;
  const mobileOpen = props.mobileOpen ?? mobileOpenU;
  const setMobileOpen = props.setMobileOpen ?? setMobileOpenU;

  useEffect(() => {
    if (props.collapsed !== undefined) setCollapsedU(props.collapsed);
    if (props.mobileOpen !== undefined) setMobileOpenU(props.mobileOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.collapsed, props.mobileOpen]);

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const filteredByRole = (items: SidebarItem[]) =>
    items.filter(
      it => !it.roles || it.roles.includes((user?.role as string) || 'user')
    );

  // เมนูหลัก (เน้นระบบห้องพัก)
  const mainItems: SidebarItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: tNav('dashboard'),
        icon: <Home className="w-5 h-5" />,
        href: '/dashboard',
      },
      {
        id: 'rooms',
        label: tNav('rooms'),
        icon: <BedDouble className="w-5 h-5" />,
        href: '/rooms',
      },
      {
        id: 'shortcuts',
        label: locale === 'th' ? 'เมนูด่วน' : 'Shortcuts',
        icon: <Calendar className="w-5 h-5" />,
        children: [
          {
            id: 'bookings',
            label: tNav('bookings'),
            icon: <Calendar className="w-5 h-5" />,
            href: '/bookings',
          },
        ],
      },
      {
        id: 'users',
        label: tNav('users'),
        icon: <UsersIcon className="w-5 h-5" />,
        href: '/admin/users',
        roles: ['admin', 'support'],
      },
    ],
    [tNav, locale, user?.role]
  );

  const systemItems: SidebarItem[] = useMemo(
    () =>
      filteredByRole([
        {
          id: 'reports',
          label: tNav('reports'),
          icon: <FileText className="w-5 h-5" />,
          href: '/reports',
          roles: ['admin', 'support'],
        },
        {
          id: 'maintenance',
          label: locale === 'th' ? 'งานซ่อมบำรุง' : 'Maintenance',
          icon: <Wrench className="w-5 h-5" />,
          href: '/maintenance',
          roles: ['admin', 'support'],
        },
        {
          id: 'integration',
          label: locale === 'th' ? 'การเชื่อมต่อ' : 'Integration',
          icon: <Shield className="w-5 h-5" />,
          href: '/integration',
          roles: ['admin'],
        },
      ]),
    [tNav, locale, user?.role]
  );

  const accountItems: SidebarItem[] = useMemo(
    () => [
      {
        id: 'profile',
        label: tNav('profile'),
        icon: <User className="w-5 h-5" />,
        href: '/profile',
      },
      {
        id: 'settings',
        label: tNav('settings'),
        icon: <Settings className="w-5 h-5" />,
        href: '/settings',
      },
      {
        id: 'help',
        label: tNav('help'),
        icon: <HelpCircle className="w-5 h-5" />,
        href: '/help',
      },
    ],
    [tNav]
  );

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const renderItem = (item: SidebarItem, depth = 0) => {
    const isActive =
      item.href &&
      (pathname === item.href ||
        (item.href !== '/' && pathname.startsWith(item.href + '/')));
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = !!item.children?.length;

    return (
      <div key={item.id}>
        <Link
          href={item.href || '#'}
          onClick={e => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.id);
            }
          }}
          title={collapsed ? item.label : undefined}
          className={cn(
            'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
            'hover:bg-accent/60',
            isActive && 'bg-accent text-accent-foreground',
            depth > 0 && 'ml-6'
          )}
        >
          {/* active pill */}
          <span
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-orange-500 to-pink-500 opacity-0 transition-opacity',
              isActive && 'opacity-100'
            )}
          />
          {item.icon}
          {!collapsed && (
            <>
              <span className="flex-1 text-sm font-medium truncate">
                {item.label}
              </span>
              {hasChildren && <ChevronRightIcon open={isExpanded} />}
            </>
          )}
        </Link>

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(c => renderItem(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-xl bg-background/90 border shadow-lg backdrop-blur"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full transition-all duration-300 z-50',
          // ✅ ใช้ความกว้างแบบสลับทีเดียว แก้ปัญหาย่อแล้วกรอบไม่ย่อ
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Panel */}
        <div
          className={cn(
            'flex h-full flex-col border-r bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60',
            'dark:bg-gray-950/75 dark:border-gray-900'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-900">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow">
                  <BedDouble className="w-5 h-5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="font-semibold text-sm">
                    {locale === 'th' ? 'ระบบหอพัก' : 'Rooms System'}
                  </p>
                  <p className="text-xs text-muted-foreground">Pratuthong</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-accent/60 transition-colors hidden lg:block"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              title={
                collapsed
                  ? locale === 'th'
                    ? 'ขยาย'
                    : 'Expand'
                  : locale === 'th'
                    ? 'ย่อ'
                    : 'Collapse'
              }
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* Main */}
            <div className="space-y-1">
              {!collapsed && (
                <SectionLabel text={locale === 'th' ? 'ทั่วไป' : 'General'} />
              )}
              {mainItems.map(it => renderItem(it))}
            </div>

            {/* System */}
            {systemItems.length > 0 && (
              <div className="space-y-1">
                {!collapsed && (
                  <SectionLabel
                    text={
                      locale === 'th' ? 'การจัดการระบบ' : 'System Management'
                    }
                  />
                )}
                {systemItems.map(it => renderItem(it))}
              </div>
            )}

            {/* Account */}
            <div className="space-y-1">
              {!collapsed && (
                <SectionLabel
                  text={locale === 'th' ? 'บัญชีผู้ใช้' : 'Account'}
                />
              )}
              {accountItems.map(it => renderItem(it))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t dark:border-gray-900 p-3 space-y-2">
            {/* Theme only (ตัดปุ่มภาษาออกตามที่ขอ) */}
            <div
              className={cn(
                'flex items-center gap-2',
                collapsed && 'justify-center'
              )}
            >
              <button
                onClick={toggleMode}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/60 transition-colors"
                aria-label="Toggle theme"
                title={
                  theme === 'dark'
                    ? locale === 'th'
                      ? 'โหมดสว่าง'
                      : 'Light Mode'
                    : locale === 'th'
                      ? 'โหมดมืด'
                      : 'Dark Mode'
                }
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                {!collapsed && (
                  <span className="text-sm font-medium">
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
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all',
                collapsed && 'justify-center'
              )}
              title={
                collapsed
                  ? locale === 'th'
                    ? 'ออกจากระบบ'
                    : 'Logout'
                  : undefined
              }
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && (
                <span className="text-sm font-medium">
                  {locale === 'th' ? 'ออกจากระบบ' : 'Logout'}
                </span>
              )}
            </button>

            {/* User Info */}
            {!collapsed && user && (
              <div className="px-3 py-2 bg-accent/40 rounded-lg">
                <p className="text-xs font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {(user.role as string) || 'user'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
      {text}
    </p>
  );
}

function ChevronRightIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn('w-4 h-4 transition-transform', open && 'rotate-90')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

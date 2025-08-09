'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { signOut } from '@/lib/auth.client';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Building,
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
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: SidebarItem[];
  roles?: string[];
}

export interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  onNavigate?: () => void; // optional hook if parent wants to know
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    href: '/dashboard',
  },
  {
    id: 'Rooms',
    label: 'Rooms',
    icon: <Building className="w-5 h-5" />,
    href: '/rooms',
  },
  {
    id: 'favourites',
    label: 'Favourites',
    icon: <BarChart3 className="w-5 h-5" />,
    children: [
      {
        id: 'bookings',
        label: 'Bookings',
        icon: <Calendar className="w-5 h-5" />,
        href: '/bookings',
      },
    ],
  },
];

const systemManagementItems: SidebarItem[] = [
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileText className="w-5 h-5" />,
    href: '/reports',
    roles: ['admin', 'support'],
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: <Zap className="w-5 h-5" />,
    href: '/automation',
    roles: ['admin'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: <Wrench className="w-5 h-5" />,
    href: '/maintenance',
    roles: ['admin', 'support'],
  },
  {
    id: 'integration',
    label: 'Integration',
    icon: <Shield className="w-5 h-5" />,
    href: '/integration',
    roles: ['admin'],
  },
];

const accountItems: SidebarItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" />,
    href: '/profile',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings',
  },
  {
    id: 'help',
    label: 'Help Center',
    icon: <HelpCircle className="w-5 h-5" />,
    href: '/help',
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onNavigate,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleMode } = useTheme();

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const filteredSystemItems = systemManagementItems.filter(
    item => !item.roles || item.roles.includes((user as any)?.role || 'user')
  );

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const isActive = item.href ? pathname === item.href : false;
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = !!(item.children && item.children.length > 0);

    return (
      <div key={item.id}>
        <Link
          href={item.href || '#'}
          onClick={e => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.id);
              return;
            }
            // Close mobile nav on route
            if (mobileOpen) setMobileOpen(false);
            onNavigate?.();
          }}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
            'hover:bg-accent/60',
            isActive && 'bg-accent text-accent-foreground',
            depth > 0 && 'ml-6'
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          {item.icon}
          {!collapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {hasChildren && (
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              )}
            </>
          )}
        </Link>
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderSidebarItem(child, depth + 1))}
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border shadow-lg"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-background border-r transition-all duration-300 z-40',
          'dark:bg-gray-900 dark:border-gray-800',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Sidebar"
        data-collapsed={collapsed}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg">SolarSync</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors hidden lg:block"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={collapsed}
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
            <div className="space-y-1">
              {sidebarItems.map(item => renderSidebarItem(item))}
            </div>

            {filteredSystemItems.length > 0 && (
              <div className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    System Management
                  </p>
                )}
                {filteredSystemItems.map(item => renderSidebarItem(item))}
              </div>
            )}

            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account Management
                </p>
              )}
              {accountItems.map(item => renderSidebarItem(item))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t dark:border-gray-800 p-3 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleMode}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-accent/60 transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              {!collapsed && (
                <span className="text-sm font-medium">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </button>

            {/* User Info */}
            {!collapsed && (user as any) && (
              <div className="px-3 py-2 bg-accent/30 rounded-lg">
                <p className="text-xs font-medium truncate">
                  {(user as any).email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {(user as any).role}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

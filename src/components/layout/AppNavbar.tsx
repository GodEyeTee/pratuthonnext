'use client';

import LanguageToggle from '@/components/i18n/LanguageToggle';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { signOut } from '@/lib/auth.client';
import { cn } from '@/lib/utils';
import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { useLocale as useNextIntlLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Props = {
  title?: string;
  subtitle?: string;
  rightExtra?: React.ReactNode;
};

export default function AppNavbar({ title, subtitle, rightExtra }: Props) {
  const { user, role } = useAuth(); // ⭐ ใช้ role จาก useAuth
  const tNav = useTranslations('navigation');
  const tAuth = useTranslations('auth');
  const nextIntlLocale = useNextIntlLocale();
  const { setLocale } = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const node = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(node))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(node))
        setProfileOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const logout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b dark:bg-gray-900/80 dark:border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Title / Subtitle */}
          <div className="flex-1 min-w-0">
            {title && (
              <div>
                <h1 className="text-xl font-semibold text-foreground truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {rightExtra}

            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(
                    'pl-9 pr-4 py-2 w-64 rounded-lg',
                    'bg-background dark:bg-gray-800',
                    'border dark:border-gray-700',
                    'text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400',
                    'transition-all'
                  )}
                />
              </div>
            </div>

            {/* Language */}
            <LanguageToggle
              locale={(nextIntlLocale as 'th' | 'en') ?? 'th'}
              onChange={lng => setLocale(lng)}
              className="hidden sm:flex"
            />

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 rounded-lg hover:bg-accent/60 transition-colors"
                aria-haspopup="menu"
                aria-expanded={notifOpen}
                aria-label={
                  nextIntlLocale === 'th' ? 'การแจ้งเตือน' : 'Notifications'
                }
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </button>

              {notifOpen && (
                <GlassPopover className="right-0 mt-2 w-80" role="menu">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold">
                      {nextIntlLocale === 'th'
                        ? 'การแจ้งเตือน'
                        : 'Notifications'}
                    </p>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      {nextIntlLocale === 'th'
                        ? 'ยังไม่มีการแจ้งเตือน'
                        : 'No notifications yet'}
                    </p>
                  </div>
                  <div className="px-3 py-2 border-t border-white/10 text-right text-sm">
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="px-3 py-1.5 rounded-md hover:bg-white/10"
                    >
                      {nextIntlLocale === 'th' ? 'ปิด' : 'Close'}
                    </button>
                  </div>
                </GlassPopover>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {profileOpen && (
                <GlassPopover className="right-0 mt-2 w-64" role="menu">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold">
                      {user?.email || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {role ?? 'user'}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">{tNav('profile')}</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">{tNav('settings')}</span>
                    </Link>
                  </div>
                  <div className="p-1 border-t border-white/10">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 hover:text-red-400"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">{tAuth('signOut')}</span>
                    </button>
                  </div>
                </GlassPopover>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Glass popover */
function GlassPopover({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'absolute rounded-2xl overflow-hidden',
        'bg-white/20 dark:bg-white/5 supports-[backdrop-filter]:bg-white/20',
        'backdrop-blur-2xl',
        'ring-1 ring-white/30 dark:ring-white/10 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.45)]',
        'bg-gradient-to-br from-white/15 via-white/15 to-white/30 dark:from-white/50 dark:via-white/5 dark:to-transparent',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

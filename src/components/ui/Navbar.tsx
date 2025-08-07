'use client';

import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/rbac';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from './Button';

export interface NavItem {
  label: {
    th: string;
    en: string;
  };
  href: string;
  icon?: React.ReactNode;
  allowedRoles?: UserRole[];
  children?: NavItem[];
}

export interface NavbarProps {
  brand?: {
    name: string;
    logo?: React.ReactNode;
    href?: string;
  };
  items: NavItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
  };
  locale: 'th' | 'en';
  onLanguageChange?: (locale: 'th' | 'en') => void;
  onLogout?: () => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  brand,
  items,
  user,
  locale,
  onLanguageChange,
  onLogout,
  className,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  // Filter nav items based on user role
  const visibleItems = items.filter(
    item => !item.allowedRoles || !user || item.allowedRoles.includes(user.role)
  );

  const isActiveRoute = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          {brand && (
            <Link
              href={brand.href || '/'}
              className="flex items-center space-x-2 font-bold text-lg"
            >
              {brand.logo}
              <span>{brand.name}</span>
            </Link>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {visibleItems.map(item => (
              <NavLink
                key={item.href}
                item={item}
                locale={locale}
                isActive={isActiveRoute(item.href)}
              />
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            {onLanguageChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLanguageChange(locale === 'th' ? 'en' : 'th')}
                className="hidden sm:flex"
              >
                {locale === 'th' ? '🇺🇸 EN' : '🇹🇭 TH'}
              </Button>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block">{user.name}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg py-1">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {locale === 'th' ? 'โปรไฟล์' : 'Profile'}
                    </Link>

                    <Link
                      href="/settings"
                      className="block px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {locale === 'th' ? 'ตั้งค่า' : 'Settings'}
                    </Link>

                    {onLanguageChange && (
                      <button
                        onClick={() => {
                          onLanguageChange(locale === 'th' ? 'en' : 'th');
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-accent sm:hidden"
                      >
                        {locale === 'th' ? '🇺🇸 English' : '🇹🇭 ไทย'}
                      </button>
                    )}

                    <hr className="my-1" />

                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {locale === 'th' ? 'ออกจากระบบ' : 'Sign Out'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">
                    {locale === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-3">
              {visibleItems.map(item => (
                <NavLink
                  key={item.href}
                  item={item}
                  locale={locale}
                  isActive={isActiveRoute(item.href)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Overlay for user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  );
};

// Navigation Link Component
interface NavLinkProps {
  item: NavItem;
  locale: 'th' | 'en';
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({
  item,
  locale,
  isActive,
  onClick,
  className,
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={cn(
      'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
      isActive ? 'text-primary' : 'text-muted-foreground',
      className
    )}
  >
    {item.icon}
    <span>{item.label[locale]}</span>
  </Link>
);

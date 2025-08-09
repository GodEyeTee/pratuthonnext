'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:ml-64 transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/95 dark:bg-gray-900/95 backdrop-blur border-b dark:border-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Title */}
              <div className="flex-1">
                {title && (
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm text-muted-foreground">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right side - Search & Actions */}
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search equipment..."
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

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-accent dark:hover:bg-gray-800 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

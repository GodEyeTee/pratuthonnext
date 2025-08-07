'use client';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AuthProvider } from '@/hooks/useAuth';
import { LocaleProvider } from '@/hooks/useLocale';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/hooks/useToast';
import React from 'react';

/**
 * Root Providers Component
 * Wraps the entire application with necessary providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

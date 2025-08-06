/**
 * Sentry Utilities - Simple version
 * ใช้ฟีเจอร์พื้นฐานของ Sentry
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Check if Sentry is enabled
 */
function isSentryEnabled(): boolean {
  return !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

/**
 * Capture error manually
 */
export function captureError(error: Error, extra?: Record<string, any>) {
  console.error('Captured error:', error, extra);

  if (isSentryEnabled()) {
    Sentry.captureException(error, {
      extra,
      tags: {
        component: 'manual',
      },
    });
  }
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  console.log(`[${level.toUpperCase()}]`, message);

  if (isSentryEnabled()) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  name?: string;
}) {
  if (isSentryEnabled()) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext() {
  if (isSentryEnabled()) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: 'info' | 'warning' | 'error' = 'info'
) {
  if (isSentryEnabled()) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now(),
    });
  }
}

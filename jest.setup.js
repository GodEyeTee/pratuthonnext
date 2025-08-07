/**
 * Jest Setup Configuration
 * Global test setup and utilities
 */

import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch'; // Polyfill for fetch API

// =============================================================================
// Global Polyfills
// =============================================================================

// Set up TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// =============================================================================
// Environment Variables for Testing
// =============================================================================

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-testing';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// =============================================================================
// Mock Next.js Router
// =============================================================================

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// =============================================================================
// Mock Supabase Client
// =============================================================================

jest.mock('@/lib/auth', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithOAuth: jest.fn().mockResolvedValue({
        data: { url: 'https://oauth.url' },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      update: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      delete: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })),
  })),
  getUser: jest.fn().mockResolvedValue(null),
  getSession: jest.fn().mockResolvedValue(null),
}));

// =============================================================================
// Mock Auth Hooks
// =============================================================================

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    error: null,
    signOut: jest.fn(),
    refreshUser: jest.fn(),
    hasRole: jest.fn().mockReturnValue(false),
    hasRoles: jest.fn().mockReturnValue(false),
    hasPermission: jest.fn().mockReturnValue(false),
    hasAnyPermission: jest.fn().mockReturnValue(false),
    hasAllPermissions: jest.fn().mockReturnValue(false),
  }),
  useRole: () => null,
  useIsAdmin: () => false,
  useIsSupport: () => false,
  useIsUser: () => false,
  usePermissions: () => ({
    hasPermission: jest.fn().mockReturnValue(false),
    hasAnyPermission: jest.fn().mockReturnValue(false),
    hasAllPermissions: jest.fn().mockReturnValue(false),
    canManageUsers: false,
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canAccessAdmin: false,
    canAccessSupport: false,
    canViewReports: false,
    canManageSettings: false,
  }),
  useUserInfo: () => ({
    user: null,
    displayName: 'Test User',
    avatarUrl: null,
    isEmailVerified: false,
    memberSince: null,
    lastSignIn: null,
  }),
}));

// =============================================================================
// Mock Locale Hooks
// =============================================================================

jest.mock('@/hooks/useLocale', () => ({
  useLocale: () => ({
    locale: 'en',
    setLocale: jest.fn(),
    t: key => key, // Return the key as translation
    translations: {},
    isRTL: false,
    direction: 'ltr',
  }),
  useTranslation: () => ({
    t: key => key,
    locale: 'en',
    translations: {},
    tCommon: key => `common.${key}`,
    tAuth: key => `auth.${key}`,
    tNav: key => `navigation.${key}`,
    tError: key => `errors.${key}`,
    tValidation: key => `validation.${key}`,
  }),
  useLanguageSwitcher: () => ({
    currentLocale: 'en',
    switchToThai: jest.fn(),
    switchToEnglish: jest.fn(),
    toggleLanguage: jest.fn(),
    setLocale: jest.fn(),
    isThai: false,
    isEnglish: true,
  }),
}));

// =============================================================================
// Mock Theme Hooks
// =============================================================================

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      mode: 'light',
      colors: {},
      spacing: {},
      typography: {},
      borderRadius: {},
      shadow: {},
    },
    mode: 'light',
    setMode: jest.fn(),
    toggleMode: jest.fn(),
    isDark: false,
    isLight: true,
  }),
  useThemeColors: () => ({}),
  useSemanticColors: () => ({
    success: { bg: '', text: '', border: '' },
    warning: { bg: '', text: '', border: '' },
    error: { bg: '', text: '', border: '' },
    info: { bg: '', text: '', border: '' },
  }),
  useBreakpoint: () => ({
    isSm: false,
    isMd: false,
    isLg: true,
    isXl: false,
    is2Xl: false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

// =============================================================================
// Mock Toast Hooks
// =============================================================================

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    toast: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
  }),
  useNotifications: () => ({
    signInSuccess: jest.fn(),
    signOutSuccess: jest.fn(),
    authError: jest.fn(),
    createSuccess: jest.fn(),
    updateSuccess: jest.fn(),
    deleteSuccess: jest.fn(),
    createError: jest.fn(),
    updateError: jest.fn(),
    deleteError: jest.fn(),
    accessDenied: jest.fn(),
    roleChanged: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));

// =============================================================================
// Global Test Utilities
// =============================================================================

// Custom matchers
expect.extend({
  toHaveBeenCalledWithRole(received, role) {
    const pass = received.mock.calls.some(call =>
      call.some(arg => arg === role || (arg && arg.role === role))
    );

    if (pass) {
      return {
        message: () =>
          `expected function not to have been called with role "${role}"`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected function to have been called with role "${role}"`,
        pass: false,
      };
    }
  },
});

// =============================================================================
// Console Suppression for Tests
// =============================================================================

// Suppress console.log during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restore console for debugging if needed
global.restoreConsole = () => {
  global.console.log = originalConsoleLog;
  global.console.warn = originalConsoleWarn;
  global.console.error = originalConsoleError;
};

// =============================================================================
// Test Cleanup
// =============================================================================

// Clear all timers after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});

/**
 * Testing Utilities for RBAC System
 * Provides helper functions for testing React components with all providers
 */

import { AuthProvider } from '@/hooks/useAuth';
import { LocaleProvider } from '@/hooks/useLocale';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/hooks/useToast';
import type { UserRole, UserWithRole } from '@/types/rbac';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import React from 'react';

// =============================================================================
// Test Providers
// =============================================================================

interface TestProvidersProps {
  children: React.ReactNode;
  initialUser?: UserWithRole | null;
  initialLocale?: 'th' | 'en';
  initialTheme?: 'light' | 'dark';
}

/**
 * Wrapper component that provides all necessary contexts for testing
 */
function TestProviders({
  children,
  initialUser = null,
  initialLocale = 'en',
  initialTheme = 'light',
}: TestProvidersProps) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

// =============================================================================
// Custom Render Function
// =============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: UserWithRole | null;
  locale?: 'th' | 'en';
  theme?: 'light' | 'dark';
}

/**
 * Custom render function that includes all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    user = null,
    locale = 'en',
    theme = 'light',
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders
      initialUser={user}
      initialLocale={locale}
      initialTheme={theme}
    >
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// =============================================================================
// Mock User Factory
// =============================================================================

/**
 * Creates a mock user with specified role and optional properties
 */
export function createMockUser(
  role: UserRole = 'user',
  overrides: Partial<UserWithRole> = {}
): UserWithRole {
  const baseUser: UserWithRole = {
    id: `test-user-${role}`,
    email: `${role}@test.com`,
    role,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    avatar_url: `https://example.com/avatar-${role}.jpg`,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    email_verified: true,
    last_sign_in_at: '2024-01-15T10:30:00Z',
  };

  return { ...baseUser, ...overrides };
}

/**
 * Creates mock users for all roles
 */
export function createMockUsers() {
  return {
    admin: createMockUser('admin'),
    support: createMockUser('support'),
    user: createMockUser('user'),
  };
}

// =============================================================================
// Mock API Responses
// =============================================================================

/**
 * Creates a mock API response
 */
export function createMockApiResponse<T>(
  data: T,
  options: {
    success?: boolean;
    status?: number;
    message?: string;
  } = {}
) {
  const { success = true, status = 200, message = 'Success' } = options;

  return {
    data: success ? data : null,
    error: success ? null : { message, status },
    status,
    success,
  };
}

/**
 * Creates a mock fetch response
 */
export function createMockFetchResponse<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
}

// =============================================================================
// Test Data Generators
// =============================================================================

/**
 * Generates random test data
 */
export const testDataGenerators = {
  email: (prefix = 'test') =>
    `${prefix}${Math.random().toString(36).substr(2, 9)}@test.com`,

  name: () => {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'];
    const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  },

  uuid: () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }),

  date: (daysAgo = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  },
};

// =============================================================================
// Permission Testing Helpers
// =============================================================================

/**
 * Tests if a component renders correctly for different roles
 */
export async function testRoleAccess(
  component: React.ReactElement,
  expectations: Record<UserRole, boolean>
) {
  const results: Record<UserRole, boolean> = {} as any;

  for (const [role, shouldRender] of Object.entries(expectations)) {
    const user = createMockUser(role as UserRole);
    const { container } = renderWithProviders(component, { user });

    const hasContent =
      container.children.length > 0 && container.textContent !== '';

    results[role as UserRole] = hasContent === shouldRender;
  }

  return results;
}

/**
 * Mocks authentication context with specific user
 */
export function mockAuthContext(user: UserWithRole | null) {
  const mockUseAuth = jest.fn(() => ({
    user,
    session: user ? { user } : null,
    loading: false,
    error: null,
    signOut: jest.fn(),
    refreshUser: jest.fn(),
    hasRole: jest.fn((role: UserRole) => user?.role === role),
    hasRoles: jest.fn((roles: UserRole[]) =>
      user ? roles.includes(user.role) : false
    ),
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
  }));

  jest.doMock('@/hooks/useAuth', () => ({
    useAuth: mockUseAuth,
  }));

  return mockUseAuth;
}

// =============================================================================
// Event Testing Helpers
// =============================================================================

/**
 * Simulates user interactions for testing
 */
export const userEvents = {
  click: (element: Element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },

  type: (element: Element, text: string) => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  submit: (form: Element) => {
    form.dispatchEvent(new Event('submit', { bubbles: true }));
  },

  keyDown: (element: Element, key: string) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  },
};

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Custom assertion helpers for RBAC testing
 */
export const assertions = {
  toBeVisibleForRole: (
    element: Element,
    role: UserRole,
    user: UserWithRole | null
  ) => {
    const isVisible = element && element.textContent !== '';
    const hasCorrectRole = user?.role === role;

    expect(isVisible && hasCorrectRole).toBe(true);
  },

  toHaveCorrectPermissions: (
    mockFn: jest.MockedFunction<any>,
    expectedPermissions: string[]
  ) => {
    expectedPermissions.forEach(permission => {
      expect(mockFn).toHaveBeenCalledWith(permission);
    });
  },

  toRedirectUnauthorizedUser: (mockRouter: any, expectedPath: string) => {
    expect(mockRouter.push).toHaveBeenCalledWith(expectedPath);
  },
};

// =============================================================================
// Performance Testing Helpers
// =============================================================================

/**
 * Measures component render time
 */
export function measureRenderTime(
  component: React.ReactElement,
  iterations = 100
): Promise<number> {
  return new Promise(resolve => {
    const times: number[] = [];

    const runIteration = (i: number) => {
      if (i >= iterations) {
        const average =
          times.reduce((sum, time) => sum + time, 0) / times.length;
        resolve(average);
        return;
      }

      const start = performance.now();
      renderWithProviders(component);
      const end = performance.now();

      times.push(end - start);

      // Use setTimeout to avoid blocking
      setTimeout(() => runIteration(i + 1), 0);
    };

    runIteration(0);
  });
}

// =============================================================================
// Cleanup Helpers
// =============================================================================

/**
 * Cleans up after tests
 */
export function cleanup() {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear timers
  jest.clearAllTimers();

  // Restore console if mocked
  if (global.restoreConsole) {
    global.restoreConsole();
  }
}

// =============================================================================
// Export everything for easy importing
// =============================================================================

export * from '@testing-library/react';
export { renderWithProviders as render };

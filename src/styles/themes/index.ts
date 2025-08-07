/**
 * Theme System - Design tokens and theme provider
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };

  // Semantic colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };

  border: {
    primary: string;
    secondary: string;
    focus: string;
  };

  // Status colors
  success: {
    bg: string;
    text: string;
    border: string;
  };

  warning: {
    bg: string;
    text: string;
    border: string;
  };

  error: {
    bg: string;
    text: string;
    border: string;
  };

  info: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string;
    mono: string;
  };

  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };

  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };

  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadow {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadow: ThemeShadow;
}

// Base design tokens
const spacing: ThemeSpacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
};

const typography: ThemeTypography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Consolas, "Liberation Mono", Menlo, Courier, monospace',
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    '4xl': '2.5rem', // 40px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

const borderRadius: ThemeBorderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  full: '9999px',
};

const shadow: ThemeShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Light theme
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6',
    },
    success: {
      bg: '#dcfce7',
      text: '#166534',
      border: '#bbf7d0',
    },
    warning: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#fde68a',
    },
    error: {
      bg: '#fecaca',
      text: '#dc2626',
      border: '#fca5a5',
    },
    info: {
      bg: '#dbeafe',
      text: '#1d4ed8',
      border: '#93c5fd',
    },
  },
  spacing,
  typography,
  borderRadius,
  shadow,
};

// Dark theme
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa',
      600: '#93c5fd',
      700: '#bfdbfe',
      800: '#dbeafe',
      900: '#eff6ff',
    },
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#60a5fa',
    },
    success: {
      bg: '#14532d',
      text: '#4ade80',
      border: '#166534',
    },
    warning: {
      bg: '#92400e',
      text: '#fbbf24',
      border: '#d97706',
    },
    error: {
      bg: '#991b1b',
      text: '#f87171',
      border: '#dc2626',
    },
    info: {
      bg: '#1e40af',
      text: '#93c5fd',
      border: '#2563eb',
    },
  },
  spacing,
  typography,
  borderRadius,
  shadow,
};

// Theme utilities
export function getTheme(mode: ThemeMode): Theme {
  return mode === 'light' ? lightTheme : darkTheme;
}

export function createCSSVariables(theme: Theme): Record<string, string> {
  return {
    // Colors
    '--color-primary-500': theme.colors.primary[500],
    '--color-primary-600': theme.colors.primary[600],
    '--color-background-primary': theme.colors.background.primary,
    '--color-background-secondary': theme.colors.background.secondary,
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-border-primary': theme.colors.border.primary,

    // Typography
    '--font-family-sans': theme.typography.fontFamily.sans,
    '--font-size-base': theme.typography.fontSize.base,
    '--font-weight-medium': theme.typography.fontWeight.medium,

    // Spacing
    '--spacing-sm': theme.spacing.sm,
    '--spacing-md': theme.spacing.md,
    '--spacing-lg': theme.spacing.lg,

    // Border radius
    '--border-radius-md': theme.borderRadius.md,
    '--border-radius-lg': theme.borderRadius.lg,

    // Shadow
    '--shadow-md': theme.shadow.md,
    '--shadow-lg': theme.shadow.lg,
  };
}

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemeMode, Theme } from '@/lib/theme.config';
import { getTheme, createCSSVariables, lightTheme, darkTheme } from '@/lib/theme.config';

// Theme Context Types
interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
}

// Create Theme Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme storage key
const THEME_STORAGE_KEY = 'app-theme';

// Get stored theme or detect system preference
function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  
  try {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to get stored theme:', error);
  }
  
  // Fallback to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

// Store theme preference
function storeTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to store theme:', error);
  }
}

// Apply theme CSS variables to document
function applyThemeToDocument(theme: Theme): void {
  if (typeof window === 'undefined') return;
  
  const cssVariables = createCSSVariables(theme);
  const root = document.documentElement;
  
  Object.entries(cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.colors.primary[600]);
  }
  
  // Update class for Tailwind dark mode
  if (theme.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Theme Provider Component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState<Theme>(lightTheme);

  // Initialize theme
  useEffect(() => {
    const initialMode = getInitialTheme();
    setModeState(initialMode);
    
    const initialTheme = getTheme(initialMode);
    setTheme(initialTheme);
    applyThemeToDocument(initialTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply system theme if user hasn't set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        const newMode = e.matches ? 'dark' : 'light';
        setModeState(newMode);
        const newTheme = getTheme(newMode);
        setTheme(newTheme);
        applyThemeToDocument(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update theme when mode changes
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    storeTheme(newMode);
    
    const newTheme = getTheme(newMode);
    setTheme(newTheme);
    applyThemeToDocument(newTheme);
  };

  // Toggle between light and dark
  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    theme,
    mode,
    setMode,
    toggleMode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// useTheme Hook
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme utilities hooks
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

export function useThemeSpacing() {
  const { theme } = useTheme();
  return theme.spacing;
}

export function useThemeTypography() {
  const { theme } = useTheme();
  return theme.typography;
}

// CSS-in-JS utilities
export function useThemeClass(lightClass: string, darkClass: string): string {
  const { isDark } = useTheme();
  return isDark ? darkClass : lightClass;
}

// Theme-aware color utilities
export function useSemanticColors() {
  const { theme } = useTheme();
  
  return {
    // Status colors
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.info,
    
    // Background colors
    primary: theme.colors.background.primary,
    secondary: theme.colors.background.secondary,
    tertiary: theme.colors.background.tertiary,
    
    // Text colors
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textTertiary: theme.colors.text.tertiary,
    textInverse: theme.colors.text.inverse,
    
    // Border colors
    borderPrimary: theme.colors.border.primary,
    borderSecondary: theme.colors.border.secondary,
    borderFocus: theme.colors.border.focus,
  };
}

// Media query hooks for responsive design
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const isSm = useMediaQuery('(min-width: 640px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const is2Xl = useMediaQuery('(min-width: 1536px)');
  
  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile: !isMd,
    isTablet: isMd && !isLg,
    isDesktop: isLg,
  };
}

// High-order component for providing theme context
export function withTheme<P extends object>(Component: React.ComponentType<P>) {
  return function ThemedComponent(props: P) {
    return (
      <ThemeProvider>
        <Component {...props} />
      </ThemeProvider>
    );
  };
}
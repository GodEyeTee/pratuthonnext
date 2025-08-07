'use client';

import type { Locale, TranslationNamespace } from '@/lib/i18n.config';
import {
  AVAILABLE_LOCALES,
  createTranslationFunction,
  DEFAULT_LOCALE,
  getTranslations,
} from '@/lib/i18n.config';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Locale Context Types
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  translations: TranslationNamespace;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

// Create Locale Context
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Locale storage key
const LOCALE_STORAGE_KEY = 'app-locale';

// Get stored locale or default
function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && AVAILABLE_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch (error) {
    console.warn('Failed to get stored locale:', error);
  }

  // Try to detect browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('th')) return 'th';
  if (browserLang.startsWith('en')) return 'en';

  return DEFAULT_LOCALE;
}

// Store locale preference
function storeLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Failed to store locale:', error);
  }
}

// Locale Provider Component
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<TranslationNamespace>(
    getTranslations(DEFAULT_LOCALE)
  );

  // Initialize locale from storage
  useEffect(() => {
    const storedLocale = getStoredLocale();
    setLocaleState(storedLocale);
    setTranslations(getTranslations(storedLocale));

    // Update document attributes
    document.documentElement.lang = storedLocale;
    document.documentElement.dir = 'ltr'; // For future RTL support
  }, []);

  // Update locale
  const setLocale = (newLocale: Locale) => {
    if (!AVAILABLE_LOCALES.includes(newLocale)) {
      console.warn(`Unsupported locale: ${newLocale}`);
      return;
    }

    setLocaleState(newLocale);
    setTranslations(getTranslations(newLocale));
    storeLocale(newLocale);

    // Update document attributes
    document.documentElement.lang = newLocale;
    document.documentElement.dir = 'ltr'; // For future RTL support
  };

  // Create translation function
  const t = createTranslationFunction(locale);

  // RTL support (for future use)
  const isRTL = false; // Set to true for RTL languages
  const direction = isRTL ? 'rtl' : 'ltr';

  const value: LocaleContextType = {
    locale,
    setLocale,
    t,
    translations,
    isRTL,
    direction,
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

// useLocale Hook
export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Translation hook
export function useTranslation() {
  const { t, locale, translations } = useLocale();

  return {
    t,
    locale,
    translations,
    // Convenience functions
    tCommon: (key: string) => t(`common.${key}`),
    tAuth: (key: string) => t(`auth.${key}`),
    tNav: (key: string) => t(`navigation.${key}`),
    tError: (key: string) => t(`errors.${key}`),
    tValidation: (key: string) => t(`validation.${key}`),
  };
}

// Language switcher hook
export function useLanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const switchToThai = () => setLocale('th');
  const switchToEnglish = () => setLocale('en');
  const toggleLanguage = () => setLocale(locale === 'th' ? 'en' : 'th');

  return {
    currentLocale: locale,
    switchToThai,
    switchToEnglish,
    toggleLanguage,
    setLocale,
    isThai: locale === 'th',
    isEnglish: locale === 'en',
  };
}

// Formatting hooks
export function useFormatting() {
  const { locale } = useLocale();

  const formatDate = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      ...defaultOptions,
      ...options,
    }).format(dateObj);
  };

  const formatTime = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      ...defaultOptions,
      ...options,
    }).format(dateObj);
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(
      locale === 'th' ? 'th-TH' : 'en-US',
      options
    ).format(number);
  };

  const formatCurrency = (amount: number, currency = 'THB') => {
    return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - dateObj.getTime()) / 1000
    );

    const rtf = new Intl.RelativeTimeFormat(
      locale === 'th' ? 'th-TH' : 'en-US',
      { numeric: 'auto' }
    );

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    locale,
  };
}

// Pluralization hook (useful for count-based messages)
export function usePluralization() {
  const { locale } = useLocale();

  const pluralize = (count: number, singular: string, plural?: string) => {
    if (locale === 'th') {
      // Thai doesn't have plural forms, always use singular
      return `${count} ${singular}`;
    }

    // English pluralization
    if (count === 1) {
      return `${count} ${singular}`;
    }

    return `${count} ${plural || `${singular}s`}`;
  };

  return { pluralize };
}

// High-order component for providing locale context
export function withLocale<P extends object>(
  Component: React.ComponentType<P>
) {
  return function LocalizedComponent(props: P) {
    return (
      <LocaleProvider>
        <Component {...props} />
      </LocaleProvider>
    );
  };
}

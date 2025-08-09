'use client';

import type { Locale, TranslationNamespace } from '@/lib/i18n.config';
import {
  useMessages,
  useLocale as useNextIntlLocale,
  useTranslations,
} from 'next-intl';
import { useRouter } from 'next/navigation';

export function useLocale() {
  const router = useRouter();
  const locale = useNextIntlLocale() as Locale;
  const tAll = useTranslations();

  async function setLocale(next: Locale) {
    // วิธีที่ชัวร์สุด: hard navigation ให้ route ตั้ง cookie แล้วเด้งกลับ
    if (typeof window !== 'undefined') {
      window.location.assign(`/locale?lang=${next}`);
      return;
    }
    // fallback ถ้าเรียกจาก env แปลก ๆ
    await fetch(`/locale?lang=${next}`, { method: 'GET' });
    router.refresh();
  }

  const t = (key: string) => tAll(key as any);
  const translations = useMessages() as unknown as TranslationNamespace;

  return {
    locale,
    setLocale,
    t,
    translations,
    isRTL: false,
    direction: 'ltr' as const,
  };
}

export function useTranslation() {
  const { locale, t, translations } = useLocale();
  const ns = (name: keyof TranslationNamespace) => (key: string) =>
    t(`${name}.${key}`);
  return {
    t,
    locale,
    translations,
    tCommon: ns('common'),
    tAuth: ns('auth'),
    tNav: ns('navigation'),
    tError: ns('errors'),
    tValidation: ns('validation'),
  };
}

export function useLanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return {
    currentLocale: locale,
    switchToThai: () => setLocale('th'),
    switchToEnglish: () => setLocale('en'),
    toggleLanguage: () => setLocale(locale === 'th' ? 'en' : 'th'),
    setLocale,
    isThai: locale === 'th',
    isEnglish: locale === 'en',
  };
}

export function useFormatting() {
  const locale = useNextIntlLocale() as Locale;
  const fmt = (loc: Locale) => (loc === 'th' ? 'th-TH' : 'en-US');
  const toDate = (d: Date | string) =>
    typeof d === 'string' ? new Date(d) : d;

  return {
    formatDate: (d: Date | string, o?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(fmt(locale), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...o,
      }).format(toDate(d)),
    formatTime: (d: Date | string, o?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(fmt(locale), {
        hour: '2-digit',
        minute: '2-digit',
        ...o,
      }).format(toDate(d)),
    formatDateTime: (d: Date | string) =>
      new Intl.DateTimeFormat(fmt(locale), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(toDate(d)),
    formatNumber: (n: number, o?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(fmt(locale), o).format(n),
    formatCurrency: (amount: number, currency = 'THB') =>
      new Intl.NumberFormat(fmt(locale), {
        style: 'currency',
        currency,
      }).format(amount),
    formatRelativeTime: (d: Date | string) => {
      const dateObj = toDate(d);
      const now = new Date();
      const diff = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
      const rtf = new Intl.RelativeTimeFormat(fmt(locale), {
        numeric: 'auto' as const,
      });
      if (diff < 60) return rtf.format(-diff, 'second');
      if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
      if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
      if (diff < 2592000) return rtf.format(-Math.floor(diff / 86400), 'day');
      if (diff < 31536000)
        return rtf.format(-Math.floor(diff / 2592000), 'month');
      return rtf.format(-Math.floor(diff / 31536000), 'year');
    },
    locale,
  };
}

// HOC รุ่นกันแตก ถ้ามีที่ไหน import ไว้
export function withLocale<P extends object>(
  Component: React.ComponentType<P>
) {
  return function LocalizedComponent(props: P) {
    return <Component {...props} />;
  };
}

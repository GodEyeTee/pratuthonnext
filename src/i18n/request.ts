// src/i18n/request.ts
import { DEFAULT_LOCALE, translations, type Locale } from '@/lib/i18n.config';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value as Locale | undefined;
  const locale: Locale =
    raw && ['th', 'en'].includes(raw) ? raw : DEFAULT_LOCALE;

  return {
    locale,
    messages: translations[locale] as any,
  };
});

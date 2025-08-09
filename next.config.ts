import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts'); // 👈 ชี้ไปที่ไฟล์เมื่อกี้

const nextConfig: NextConfig = {
  /* your config */
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: 'simon-vv',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});

'use client';

import LanguageToggle, { type Locale } from '@/components/i18n/LanguageToggle';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useToast';
import { signInWithGoogle } from '@/lib/auth.client';
import { ROLE_REDIRECTS } from '@/lib/rbac.config';
import {
  BedDouble,
  CalendarCheck,
  CreditCard,
  DoorOpen,
  Moon,
  Sun,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // i18n (ใช้ next-intl ผ่าน useLocale wrapper)
  const { t, locale, setLocale } = useLocale();

  const { error: showError, success: showSuccess } = useNotifications();
  const { theme, toggleMode } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  // ---- i18n labels แบบไม่มโน key ใหม่ (ใช้เงื่อนไขสั้น ๆ) ----
  const brand = 'Pratuthong Rooms';
  const heroTitle =
    locale === 'th'
      ? 'แพลตฟอร์มจัดการห้องพักทันสมัย'
      : 'Modern Room Management Platform';
  const heroSubtitle =
    locale === 'th'
      ? 'จอง-จัดการ-ออกบิล ครบในที่เดียว'
      : 'Book, manage & bill in one place';
  const tagline =
    locale === 'th'
      ? 'ระบบบริหารจัดการหอพัก/ห้องพัก'
      : 'Rooms management & booking system';
  const orText = locale === 'th' ? 'หรือ' : 'Or';
  const emailSoon =
    locale === 'th'
      ? 'เข้าสู่ระบบด้วยอีเมล (เร็วๆ นี้)'
      : 'Sign in with Email (Coming Soon)';
  const terms =
    locale === 'th'
      ? 'การเข้าสู่ระบบถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว'
      : 'By signing in, you agree to our Terms of Service and Privacy Policy';

  // ---- redirect หลัง login ----
  useEffect(() => {
    if (user && !loading) {
      const redirectTo =
        searchParams?.get('redirect') || ROLE_REDIRECTS[user.role];
      router.push(redirectTo);
    }
  }, [user, loading, router, searchParams]);

  // ---- แสดง error จาก callback ----
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      const message = t('auth.signInError');
      showError(t('auth.signInError'), message);
    }
  }, [searchParams, showError, t]);

  // ---- Google login ----
  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const redirectTo = searchParams?.get('redirect') || '/dashboard';
      const result = await signInWithGoogle(redirectTo);
      if (result.error) {
        showError(t('auth.signInError'), result.error);
      } else {
        showSuccess(t('auth.signInSuccess'));
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(t('auth.signInError'), t('errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left : Auth Card */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Top bar: language + theme */}
          <div className="flex items-center justify-end gap-2">
            <LanguageToggle
              locale={locale as Locale}
              onChange={next => setLocale(next)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="rounded-full"
              aria-label={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Logo & Title */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                <BedDouble className="w-9 h-9 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">{brand}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>
          </div>

          {/* Login Card */}
          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="text-center">{t('auth.signIn')}</CardTitle>
              <CardDescription className="text-center">
                {locale === 'th'
                  ? 'เข้าสู่ระบบเพื่อเริ่มจัดการห้องพักของคุณ'
                  : 'Sign in to manage your rooms'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full"
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 mr-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FcGoogle className="w-5 h-5 mr-3" />
                )}
                <span>
                  {isLoading ? t('common.loading') : t('auth.signInWithGoogle')}
                </span>
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {orText}
                  </span>
                </div>
              </div>

              {/* Other Sign In Methods */}
              <div className="space-y-3">
                <Button variant="ghost" size="lg" className="w-full" disabled>
                  <span>{emailSoon}</span>
                </Button>
              </div>

              {/* Terms */}
              <p className="text-xs text-center text-muted-foreground">
                {terms}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right : Hero / Selling points */}
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative h-full w-full flex items-center justify-center p-10">
          <div className="text-white max-w-lg mx-auto">
            <h2 className="text-4xl font-bold leading-tight">{heroTitle}</h2>
            <p className="mt-3 text-lg opacity-90">{heroSubtitle}</p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-6 h-6" />
                  <div>
                    <p className="font-semibold text-sm">
                      {locale === 'th' ? 'จองง่าย' : 'Instant Booking'}
                    </p>
                    <p className="text-xs opacity-90">
                      {locale === 'th'
                        ? 'จอง/เช็คอินได้ในไม่กี่คลิก'
                        : 'Book & check-in in a few clicks'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <DoorOpen className="w-6 h-6" />
                  <div>
                    <p className="font-semibold text-sm">
                      {locale === 'th' ? 'สถานะห้องชัดเจน' : 'Live Room Status'}
                    </p>
                    <p className="text-xs opacity-90">
                      {locale === 'th'
                        ? 'เห็นห้องว่าง/ไม่ว่างแบบเรียลไทม์'
                        : 'See availability in real time'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  <div>
                    <p className="font-semibold text-sm">
                      {locale === 'th' ? 'ออกบิลอัตโนมัติ' : 'Smart Billing'}
                    </p>
                    <p className="text-xs opacity-90">
                      {locale === 'th'
                        ? 'ช่วยคำนวณ/ออกใบแจ้งหนี้ได้ไว'
                        : 'Automate invoices & payments'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <BedDouble className="w-6 h-6" />
                  <div>
                    <p className="font-semibold text-sm">
                      {locale === 'th' ? 'จัดการหลายอาคาร' : 'Multi-property'}
                    </p>
                    <p className="text-xs opacity-90">
                      {locale === 'th'
                        ? 'รองรับหลายตึก/หลายชั้น'
                        : 'Works across buildings/floors'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs opacity-80">
              © {new Date().getFullYear()} Pratuthong.{' '}
              {locale === 'th' ? 'ทุกสิทธิ์' : 'All rights reserved'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

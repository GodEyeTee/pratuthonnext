'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useToast';
import { signInWithGoogle } from '@/lib/auth.client';
import { ROLE_REDIRECTS } from '@/lib/rbac.config';
import { Moon, Sun } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { t, locale } = useTranslation();
  const { error: showError, success: showSuccess } = useNotifications();
  const { theme, toggleMode } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (user && !loading) {
      const redirectTo =
        searchParams?.get('redirect') || ROLE_REDIRECTS[user.role];
      router.push(redirectTo);
    }
  }, [user, loading, router, searchParams]);

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      const errorMessages = {
        auth_callback_error: t('auth.signInError'),
        callback_failed: t('auth.signInError'),
        no_code: t('auth.signInError'),
        callback_error: t('auth.signInError'),
      };

      const message =
        errorMessages[errorParam as keyof typeof errorMessages] ||
        t('auth.signInError');
      showError(t('auth.signInError'), message);
    }
  }, [searchParams, showError, t]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background dark:bg-gray-950">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Title */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Sun className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">
              SolarSync
            </h1>
            <p className="mt-2 text-muted-foreground dark:text-gray-400">
              {locale === 'th'
                ? 'ระบบจัดการพลังงานอัจฉริยะ'
                : 'Smart Energy Management System'}
            </p>
          </div>

          {/* Login Card */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-center">
                {locale === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
              </CardTitle>
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
                  <div className="w-5 h-5 mr-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
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
                  <div className="w-full border-t border-border dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400">
                    {locale === 'th' ? 'หรือ' : 'Or'}
                  </span>
                </div>
              </div>

              {/* Other Sign In Methods */}
              <div className="space-y-3">
                <Button variant="ghost" size="lg" className="w-full" disabled>
                  <span>
                    {locale === 'th'
                      ? 'เข้าสู่ระบบด้วยอีเมล (เร็วๆ นี้)'
                      : 'Sign in with Email (Coming Soon)'}
                  </span>
                </Button>
              </div>

              {/* Terms */}
              <p className="text-xs text-center text-muted-foreground dark:text-gray-400">
                {locale === 'th'
                  ? 'การเข้าสู่ระบบถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว'
                  : 'By signing in, you agree to our Terms of Service and Privacy Policy'}
              </p>
            </CardContent>
          </Card>

          {/* Theme Toggle */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">Welcome to SolarSync</h2>
              <p className="text-xl opacity-90">
                Monitor and manage your energy devices with real-time insights
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-sm opacity-90">Monitoring</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-sm opacity-90">Efficiency</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm opacity-90">Devices</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl font-bold">15%</div>
                  <div className="text-sm opacity-90">Savings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

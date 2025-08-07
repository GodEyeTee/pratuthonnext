'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ROLE_REDIRECTS } from '@/constants/rbac';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useLocale';
import { useNotifications } from '@/hooks/useToast';
import { signInWithGoogle } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { t, locale } = useTranslation();
  const { error: showError, success: showSuccess } = useNotifications();
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const redirectTo =
        searchParams?.get('redirect') || ROLE_REDIRECTS[user.role];
      router.push(redirectTo);
    }
  }, [user, loading, router, searchParams]);

  // Handle error from URL params
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-primary/5 to-secondary/5 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                RBAC System
              </h1>
              <p className="text-sm text-muted-foreground">
                {locale === 'th' ? 'ระบบจัดการสิทธิ์' : 'Access Control System'}
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-foreground">
          {t('auth.signIn')}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {locale === 'th'
            ? 'เข้าสู่ระบบเพื่อจัดการบัญชีของคุณ'
            : 'Sign in to manage your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">
              {locale === 'th' ? 'เข้าสู่ระบบด้วย' : 'Sign in with'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Sign In Button */}
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
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {locale === 'th' ? 'หรือ' : 'Or'}
                </span>
              </div>
            </div>

            {/* Alternative Sign In Methods (Placeholder) */}
            <div className="space-y-3">
              <Button variant="ghost" size="lg" className="w-full" disabled>
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
                <span>
                  {locale === 'th'
                    ? 'เข้าสู่ระบบด้วย Twitter (เร็วๆ นี้)'
                    : 'Sign in with Twitter (Coming Soon)'}
                </span>
              </Button>

              <Button variant="ghost" size="lg" className="w-full" disabled>
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
                <span>
                  {locale === 'th'
                    ? 'เข้าสู่ระบบด้วย GitHub (เร็วๆ นี้)'
                    : 'Sign in with GitHub (Coming Soon)'}
                </span>
              </Button>
            </div>

            {/* Security Notice */}
            <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    {locale === 'th'
                      ? 'การรักษาความปลอดภัย'
                      : 'Security Notice'}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      {locale === 'th'
                        ? 'เราใช้ระบบการยืนยันตัวตนที่ปลอดภัยผ่าน OAuth 2.0 และไม่เก็บรหัสผ่านของคุณ'
                        : 'We use secure OAuth 2.0 authentication and never store your passwords.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {locale === 'th' ? 'ยังไม่มีบัญชี?' : "Don't have an account?"}{' '}
            <span className="font-medium text-primary cursor-not-allowed opacity-50">
              {locale === 'th'
                ? 'สมัครสมาชิก (เร็วๆ นี้)'
                : 'Sign up (Coming Soon)'}
            </span>
          </p>

          <div className="flex justify-center space-x-4 text-sm">
            <a
              href="/terms"
              className="text-muted-foreground hover:text-foreground"
            >
              {locale === 'th' ? 'เงื่อนไขการใช้งาน' : 'Terms of Service'}
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-foreground"
            >
              {locale === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="/help"
              className="text-muted-foreground hover:text-foreground"
            >
              {locale === 'th' ? 'ช่วยเหลือ' : 'Help'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

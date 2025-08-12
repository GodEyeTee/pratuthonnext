// src/app/login/page.tsx
'use client';

import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import {
  createAccount,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/auth.client';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/dashboard';
  const { theme } = useTheme();
  const { locale, setLocale } = useLocale();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle(redirect);
    if (!result.success) {
      setError(result.error || 'Sign in failed');
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signin') {
        const result = await signInWithEmail(email, password, redirect);
        if (!result.success) {
          setError(result.error || 'Sign in failed');
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const result = await createAccount(
          email,
          password,
          displayName,
          redirect
        );
        if (!result.success) {
          setError(result.error || 'Account creation failed');
        }
      } else if (mode === 'reset') {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccess('Password reset email sent. Check your inbox.');
          setTimeout(() => setMode('signin'), 3000);
        } else {
          setError(result.error || 'Password reset failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }

    setLoading(false);
  };

  const isRTL = locale === 'th';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/20">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setLocale('th')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            locale === 'th'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent'
          }`}
        >
          ไทย
        </button>
        <button
          onClick={() => setLocale('en')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            locale === 'en'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent'
          }`}
        >
          EN
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <div className="text-3xl">🏠</div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {locale === 'th' ? 'ระบบจัดการห้องเช่า' : 'Room Rental System'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === 'signin' &&
              (locale === 'th'
                ? 'เข้าสู่ระบบเพื่อดำเนินการต่อ'
                : 'Sign in to continue')}
            {mode === 'signup' &&
              (locale === 'th' ? 'สร้างบัญชีใหม่' : 'Create new account')}
            {mode === 'reset' &&
              (locale === 'th' ? 'รีเซ็ตรหัสผ่าน' : 'Reset password')}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-lg backdrop-blur">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {locale === 'th' ? 'ชื่อ' : 'Display Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={locale === 'th' ? 'ชื่อของคุณ' : 'Your name'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {locale === 'th' ? 'อีเมล' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {locale === 'th' ? 'รหัสผ่าน' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {locale === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>{locale === 'th' ? 'จดจำฉัน' : 'Remember me'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-primary hover:underline"
                >
                  {locale === 'th' ? 'ลืมรหัสผ่าน?' : 'Forgot password?'}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' &&
                (locale === 'th' ? 'เข้าสู่ระบบ' : 'Sign In')}
              {mode === 'signup' &&
                (locale === 'th' ? 'สร้างบัญชี' : 'Create Account')}
              {mode === 'reset' &&
                (locale === 'th' ? 'ส่งอีเมลรีเซ็ต' : 'Send Reset Email')}
            </button>
          </form>

          {/* Divider */}
          {mode !== 'reset' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-card text-muted-foreground">
                    {locale === 'th' ? 'หรือ' : 'OR'}
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 rounded-lg border hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {locale === 'th'
                  ? 'เข้าสู่ระบบด้วย Google'
                  : 'Continue with Google'}
              </button>
            </>
          )}

          {/* Mode Toggle */}
          <div className="mt-6 text-center text-sm">
            {mode === 'signin' && (
              <>
                <span className="text-muted-foreground">
                  {locale === 'th'
                    ? 'ยังไม่มีบัญชี?'
                    : "Don't have an account?"}
                </span>{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline"
                >
                  {locale === 'th' ? 'สมัครสมาชิก' : 'Sign up'}
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                <span className="text-muted-foreground">
                  {locale === 'th'
                    ? 'มีบัญชีอยู่แล้ว?'
                    : 'Already have an account?'}
                </span>{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline"
                >
                  {locale === 'th' ? 'เข้าสู่ระบบ' : 'Sign in'}
                </button>
              </>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-primary hover:underline"
              >
                {locale === 'th' ? 'กลับไปเข้าสู่ระบบ' : 'Back to sign in'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

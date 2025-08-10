'use client';

import { signInWithEmail, signInWithGoogle, useAuth } from '@/hooks/useAuth';
import { ROLE_REDIRECTS } from '@/lib/rbac.config';
import type { UserRole } from '@/types/rbac';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ใช้ role จาก useAuth (custom claims) แล้วแคบชนิดให้ type-safe เวลา index
  const safeRole: UserRole = (role ?? 'user') as UserRole;
  const goTo = searchParams?.get('redirect') || ROLE_REDIRECTS[safeRole];

  const onGoogle = async () => {
    const { user: u, error } = await signInWithGoogle();
    if (error) {
      alert(error || 'Sign-in failed');
      return;
    }
    // สำเร็จ: เด้งไปตาม redirect/role
    router.replace(goTo);
  };

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const { user: u, error } = await signInWithEmail(email, password);
    if (error) {
      alert(error || 'Sign-in failed');
      return;
    }
    router.replace(goTo);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in to continue.
        </p>

        <form onSubmit={onEmail} className="space-y-3">
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 text-white py-2 hover:bg-blue-700"
            disabled={loading}
          >
            Sign in
          </button>
        </form>

        <div className="mt-4">
          <button
            className="w-full rounded-md border py-2 hover:bg-accent/60"
            onClick={onGoogle}
            disabled={loading}
          >
            Continue with Google
          </button>
        </div>

        {user && (
          <div className="mt-4 text-sm text-muted-foreground">
            Logged in as <span className="font-medium">{user.email}</span>.{' '}
            <a href={goTo} className="text-blue-600 underline">
              Continue
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

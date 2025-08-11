'use client';

import { authHelpers } from '@/lib/firebase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const onGoogle = async () => {
    const { user, error } = await authHelpers.signInWithGoogle();
    if (error || !user) {
      alert(error || 'Sign-in failed');
      return;
    }
    const idToken = await user.getIdToken(true);

    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const { error: e } = (await res.json().catch(() => ({}))) as any;
      alert(e || 'Create session failed');
      return;
    }
    const go = sp?.get('redirect') || '/dashboard';
    router.replace(go);
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in with your Google account
        </p>
        <button
          onClick={onGoogle}
          className="w-full rounded-md border py-2 hover:bg-accent/60 active:scale-[.99] transition"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}

import { createClient } from '@/lib/auth.server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    console.log('Auth callback received:', { code: !!code, next, origin });

    if (code) {
      const supabase = await createClient();

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('Code exchange result:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        error: error?.message,
      });

      if (!error && data.session) {
        // Success - redirect to dashboard
        const redirectUrl = `${origin}${next}`;
        console.log('Redirecting to:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
      } else {
        console.error('Code exchange failed:', error);
        return NextResponse.redirect(`${origin}/login?error=callback_failed`);
      }
    } else {
      console.error('No authorization code received');
      return NextResponse.redirect(`${origin}/login?error=no_code`);
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login?error=callback_error`);
  }
}

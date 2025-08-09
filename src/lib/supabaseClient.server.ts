/*
 * Supabase server‑side client
 *
 * This helper provides a way to instantiate a Supabase client that is only
 * used on the server. It uses the Service Role key so that row level
 * security (RLS) can still be enforced by specifying `role` via session
 * variables when necessary. Avoid exposing this client to the client side;
 * always call it from within server components or server actions.
 */

import { createClient } from '@supabase/supabase-js';

// Grab credentials from environment variables. The URL should be safe to
// expose, but the service key must be kept secret. You can set these in
// your deployment environment (e.g. Vercel, Netlify) or .env.local for
// development. Never commit secrets into version control.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Creates a Supabase client configured for server usage. Use this inside
 * server components or server actions. Do not use on the client side.
 */
export function createServerSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not set');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
    // We can set a global schema or other Supabase options here.
  });
}

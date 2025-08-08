// lib/supabase/queries.ts
import { createClient } from './client';

export async function getProfile(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  return { data, error };
}

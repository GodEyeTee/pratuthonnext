/*
 * Server actions for room management
 *
 * These functions run on the server. They perform database writes via
 * Supabase and then revalidate the `/rooms` path so that updated data
 * appears without requiring a full page reload. By moving database writes
 * into server actions we avoid shipping Supabase credentials to the client
 * and centralize authorization logic.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '../../lib/supabaseClient.server';

export async function createRoomAction(prevState: any, formData: FormData) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  // Extract fields from form data
  const number = formData.get('number') as string;
  const type = formData.get('type') as string;
  const status = formData.get('status') as string;
  const floor = parseInt(formData.get('floor') as string, 10) || null;
  const rateDaily = parseFloat(formData.get('rate_daily') as string) || null;
  const rateMonthly =
    parseFloat(formData.get('rate_monthly') as string) || null;
  const waterRate = parseFloat(formData.get('water_rate') as string) || null;
  const electricRate =
    parseFloat(formData.get('electric_rate') as string) || null;
  const { error } = await supabase.from('rooms').insert({
    number,
    type,
    status,
    floor,
    rate_daily: rateDaily,
    rate_monthly: rateMonthly,
    water_rate: waterRate,
    electric_rate: electricRate,
  });
  if (error) {
    console.error('Failed to create room:', error.message);
    return { error: error.message };
  }
  // Revalidate list page
  revalidatePath('/rooms');
  // Return success; the form will reset automatically
  return { success: true };
}

export async function updateRoomAction(prevState: any, formData: FormData) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  const id = formData.get('id') as string;
  const number = formData.get('number') as string;
  const type = formData.get('type') as string;
  const status = formData.get('status') as string;
  const floor = parseInt(formData.get('floor') as string, 10) || null;
  const rateDaily = parseFloat(formData.get('rate_daily') as string) || null;
  const rateMonthly =
    parseFloat(formData.get('rate_monthly') as string) || null;
  const waterRate = parseFloat(formData.get('water_rate') as string) || null;
  const electricRate =
    parseFloat(formData.get('electric_rate') as string) || null;
  const { error } = await supabase
    .from('rooms')
    .update({
      number,
      type,
      status,
      floor,
      rate_daily: rateDaily,
      rate_monthly: rateMonthly,
      water_rate: waterRate,
      electric_rate: electricRate,
    })
    .eq('id', id);
  if (error) {
    console.error('Failed to update room:', error.message);
    return { error: error.message };
  }
  revalidatePath('/rooms');
  return { success: true };
}

export async function deleteRoomAction(prevState: any, formData: FormData) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  const id = formData.get('id') as string;
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete room:', error.message);
    return { error: error.message };
  }
  revalidatePath('/rooms');
  return { success: true };
}

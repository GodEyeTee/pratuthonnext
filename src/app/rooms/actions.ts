'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createRoomAction(formData: FormData) {
  const supabase = await createClient(); // ✅ await
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const number = (formData.get('number') as string)?.trim();
  const type = (formData.get('type') as string)?.trim();
  const status = (formData.get('status') as string)?.trim() || 'available';
  const floor = formData.get('floor')
    ? parseInt(String(formData.get('floor')), 10)
    : null;
  const rateDaily = formData.get('rate_daily')
    ? parseFloat(String(formData.get('rate_daily')))
    : null;
  const rateMonthly = formData.get('rate_monthly')
    ? parseFloat(String(formData.get('rate_monthly')))
    : null;
  const waterRate = formData.get('water_rate')
    ? parseFloat(String(formData.get('water_rate')))
    : null;
  const electricRate = formData.get('electric_rate')
    ? parseFloat(String(formData.get('electric_rate')))
    : null;

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
    console.error('[rooms.insert]', error);
    return { error: error.message };
  }
  revalidatePath('/rooms');
  return { success: true };
}

export async function updateRoomAction(formData: FormData) {
  const supabase = await createClient(); // ✅ await
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = String(formData.get('id'));
  const number = (formData.get('number') as string)?.trim();
  const type = (formData.get('type') as string)?.trim();
  const status = (formData.get('status') as string)?.trim() || 'available';
  const floor = formData.get('floor')
    ? parseInt(String(formData.get('floor')), 10)
    : null;
  const rateDaily = formData.get('rate_daily')
    ? parseFloat(String(formData.get('rate_daily')))
    : null;
  const rateMonthly = formData.get('rate_monthly')
    ? parseFloat(String(formData.get('rate_monthly')))
    : null;
  const waterRate = formData.get('water_rate')
    ? parseFloat(String(formData.get('water_rate')))
    : null;
  const electricRate = formData.get('electric_rate')
    ? parseFloat(String(formData.get('electric_rate')))
    : null;

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
    console.error('[rooms.update]', error);
    return { error: error.message };
  }
  revalidatePath('/rooms');
  return { success: true };
}

export async function deleteRoomAction(formData: FormData) {
  const supabase = await createClient(); // ✅ await
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = String(formData.get('id'));
  const { error } = await supabase.from('rooms').delete().eq('id', id);

  if (error) {
    console.error('[rooms.delete]', error);
    return { error: error.message };
  }
  revalidatePath('/rooms');
  return { success: true };
}

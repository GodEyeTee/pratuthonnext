'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createBookingAction(formData: FormData) {
  const supabase = await createClient();
  // ... insert ...
  revalidateTag('bookings:list'); // invalidate data cache
  revalidatePath('/bookings'); // (ทางเลือก) invalidate route cache ทั้งเพจ
  return { ok: true };
}

export async function updateBookingAction(formData: FormData) {
  const supabase = await createClient();
  // ... update ...
  revalidateTag('bookings:list');
  revalidatePath('/bookings');
  return { ok: true };
}

export async function cancelBookingAction(id: string) {
  const supabase = await createClient();
  // ... update status -> cancelled ...
  revalidateTag('bookings:list');
  revalidatePath('/bookings');
  return { ok: true };
}

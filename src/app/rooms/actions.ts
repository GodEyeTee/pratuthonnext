'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

function numOrNull(v: FormDataEntryValue | null) {
  if (v == null) return null;
  const n = Number(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function createRoomAction(formData: FormData) {
  const now = new Date();
  const docRef = adminDb.collection('rooms').doc(); // สร้าง id ใหม่
  const payload: any = {
    id: docRef.id,
    number: (formData.get('number') as string)?.trim(),
    type: (formData.get('type') as string)?.trim(),
    status: (formData.get('status') as string)?.trim() || 'available',
    floor: numOrNull(formData.get('floor')) ?? 1,
    rate_daily: numOrNull(formData.get('rate_daily')) ?? 0,
    rate_monthly: numOrNull(formData.get('rate_monthly')) ?? 0,
    water_rate: numOrNull(formData.get('water_rate')) ?? 18,
    electric_rate: numOrNull(formData.get('electric_rate')) ?? 7,
    size: numOrNull(formData.get('size')),
    amenities: tryParseJSON(formData.get('amenities')) ?? [],
    images: tryParseJSON(formData.get('images')) ?? [],
    description: (formData.get('description') as string) || '',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  await docRef.set(payload);
  revalidatePath('/rooms');
  return { success: true, id: docRef.id };
}

export async function updateRoomAction(formData: FormData) {
  const id = String(formData.get('id'));
  const now = new Date();

  const payload: any = {
    number: (formData.get('number') as string)?.trim(),
    type: (formData.get('type') as string)?.trim(),
    status: (formData.get('status') as string)?.trim() || 'available',
    floor: numOrNull(formData.get('floor')) ?? 1,
    rate_daily: numOrNull(formData.get('rate_daily')) ?? 0,
    rate_monthly: numOrNull(formData.get('rate_monthly')) ?? 0,
    water_rate: numOrNull(formData.get('water_rate')) ?? 18,
    electric_rate: numOrNull(formData.get('electric_rate')) ?? 7,
    size: numOrNull(formData.get('size')),
    amenities: tryParseJSON(formData.get('amenities')) ?? [],
    images: tryParseJSON(formData.get('images')) ?? [],
    description: (formData.get('description') as string) || '',
    updated_at: now.toISOString(),
  };

  await adminDb.collection('rooms').doc(id).update(payload);
  revalidatePath('/rooms');
  return { success: true };
}

export async function deleteRoomAction(formData: FormData) {
  const id = String(formData.get('id'));
  await adminDb.collection('rooms').doc(id).delete();
  revalidatePath('/rooms');
  return { success: true };
}

function tryParseJSON(val: FormDataEntryValue | null) {
  if (!val) return null;
  try {
    return JSON.parse(String(val));
  } catch {
    return null;
  }
}

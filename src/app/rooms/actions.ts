'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

function numOrNull(v: FormDataEntryValue | null) {
  if (v == null) return null;
  const n = Number(String(v));
  return Number.isFinite(n) ? n : null;
}

function tryParseJSON(val: FormDataEntryValue | null) {
  if (!val) return null;
  try {
    return JSON.parse(String(val));
  } catch {
    return null;
  }
}

export async function createRoomAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const now = new Date();
    const docRef = adminDb.collection('rooms').doc();
    const payload: Record<string, unknown> = {
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
    return { success: true, data: { id: docRef.id } };
  } catch (e: any) {
    console.error('[rooms.create]', e);
    return { success: false, error: e?.message ?? 'Failed to create room' };
  }
}

export async function updateRoomAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = String(formData.get('id'));
    const now = new Date();

    const payload: Record<string, unknown> = {
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
  } catch (e: any) {
    console.error('[rooms.update]', e);
    return { success: false, error: e?.message ?? 'Failed to update room' };
  }
}

export async function deleteRoomAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = String(formData.get('id'));
    await adminDb.collection('rooms').doc(id).delete();
    revalidatePath('/rooms');
    return { success: true };
  } catch (e: any) {
    console.error('[rooms.delete]', e);
    return { success: false, error: e?.message ?? 'Failed to delete room' };
  }
}

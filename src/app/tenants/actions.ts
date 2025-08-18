'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

function str(v: FormDataEntryValue | null) {
  return String(v || '').trim();
}

export async function createTenantAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const now = new Date().toISOString();
    const ref = adminDb.collection('tenants').doc();
    const payload = {
      id: ref.id,
      name: str(formData.get('name')),
      email: str(formData.get('email')) || null,
      phone: str(formData.get('phone')) || null,
      room: str(formData.get('room')) || null,
      status: (str(formData.get('status')) || 'active') as
        | 'active'
        | 'inactive',
      created_at: now,
      updated_at: now,
    };
    await ref.set(payload);
    revalidatePath('/tenants');
    return { success: true, data: { id: ref.id } };
  } catch (e: any) {
    console.error('[tenants.create]', e);
    return { success: false, error: e?.message ?? 'Failed to create tenant' };
  }
}

export async function updateTenantAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = str(formData.get('id'));
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      name: str(formData.get('name')),
      email: str(formData.get('email')) || null,
      phone: str(formData.get('phone')) || null,
      room: str(formData.get('room')) || null,
      status: (str(formData.get('status')) || 'active') as
        | 'active'
        | 'inactive',
      updated_at: now,
    };
    await adminDb.collection('tenants').doc(id).update(payload);
    revalidatePath('/tenants');
    return { success: true };
  } catch (e: any) {
    console.error('[tenants.update]', e);
    return { success: false, error: e?.message ?? 'Failed to update tenant' };
  }
}

export async function deleteTenantAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = str(formData.get('id'));
    await adminDb.collection('tenants').doc(id).delete();
    revalidatePath('/tenants');
    return { success: true };
  } catch (e: any) {
    console.error('[tenants.delete]', e);
    return { success: false, error: e?.message ?? 'Failed to delete tenant' };
  }
}

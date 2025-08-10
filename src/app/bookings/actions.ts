'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import 'server-only';

// แกะค่าแบบปลอดภัยจาก FormData
function fdString(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
}

export async function createBookingAction(formData: FormData) {
  const roomId = fdString(formData, 'roomId');
  const userId = fdString(formData, 'userId');
  const startAt = fdString(formData, 'startAt'); // ISO
  const endAt = fdString(formData, 'endAt'); // ISO

  const doc = await adminDb.collection('bookings').add({
    roomId,
    userId,
    startAt,
    endAt,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Invalidate cache ให้เพจ/แดชบอร์ดโหลดข้อมูลใหม่รอบถัดไป
  revalidateTag('bookings:list'); // สำหรับ fetch ที่มี { next: { tags: ['bookings:list'] } }
  revalidatePath('/bookings'); // สำหรับ path เพจ
  return { ok: true, id: doc.id };
}

export async function updateBookingAction(formData: FormData) {
  const id = fdString(formData, 'id');
  if (!id) return { ok: false, error: 'Missing booking id' };

  const patch: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  const status = fdString(formData, 'status');
  if (status) patch.status = status;

  const startAt = fdString(formData, 'startAt');
  if (startAt) patch.startAt = startAt;

  const endAt = fdString(formData, 'endAt');
  if (endAt) patch.endAt = endAt;

  await adminDb.collection('bookings').doc(id).update(patch);

  revalidateTag('bookings:list');
  revalidatePath('/bookings');
  return { ok: true };
}

export async function cancelBookingAction(id: string) {
  if (!id) return { ok: false, error: 'Missing booking id' };

  await adminDb.collection('bookings').doc(id).update({
    status: 'cancelled',
    updatedAt: new Date(),
  });

  revalidateTag('bookings:list');
  revalidatePath('/bookings');
  return { ok: true };
}

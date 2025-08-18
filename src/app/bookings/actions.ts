'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import 'server-only';

type ActionResult<T = unknown> = {
  ok: boolean;
  id?: string;
  error?: string;
  data?: T;
};

// ---------- small helpers ----------
function s(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function n(fd: FormData, key: string) {
  const v = s(fd, key);
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
}

function startOfDayISO(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  ).toISOString();
}
function isoDateOnly(v: string) {
  try {
    const d = new Date(v);
    if (Number.isNaN(+d)) return '';
    return startOfDayISO(
      new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    );
  } catch {
    return '';
  }
}
function parseISODate(v: string): Date | null {
  try {
    const d = new Date(v);
    return Number.isNaN(+d) ? null : d;
  } catch {
    return null;
  }
}
function datesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  // overlap if aStart < bEnd && aEnd > bStart
  return aStart < bEnd && aEnd > bStart;
}

// ---------- helpers: tenants & rooms ----------
function tenantAssignedRoomRaw(tenant: any): string | null {
  const v = tenant?.roomId ?? tenant?.room_id ?? tenant?.room ?? null;
  if (!v) return null;
  const str = String(v).trim();
  return str.length ? str : null;
}

/** รับค่ามาเป็น "room id" หรือ "label" ก็ได้ แล้วคืน room doc + id */
async function resolveRoomByIdOrLabel(
  roomIdOrLabel: string
): Promise<{ id: string; data: any; label: string }> {
  if (!roomIdOrLabel) throw new Error('room id/label missing');

  // 1) ลองตาม doc id ตรงๆ
  const byId = await adminDb.collection('rooms').doc(roomIdOrLabel).get();
  if (byId.exists) {
    const x = byId.data() as any;
    const label = String(x?.number ?? x?.name ?? x?.code ?? byId.id);
    return { id: byId.id, data: x, label };
  }

  // 2) ลองค้นด้วย number / code / name (รองรับทั้ง number และ string)
  const val = roomIdOrLabel;
  const tryNum = Number(val);
  const queries: Array<Promise<any>> = [];

  if (Number.isFinite(tryNum)) {
    queries.push(
      adminDb.collection('rooms').where('number', '==', tryNum).limit(1).get()
    );
  }
  // string fields & กรณี number ถูกเก็บเป็น string
  queries.push(
    adminDb.collection('rooms').where('code', '==', val).limit(1).get()
  );
  queries.push(
    adminDb.collection('rooms').where('name', '==', val).limit(1).get()
  );
  queries.push(
    adminDb.collection('rooms').where('number', '==', val).limit(1).get()
  );

  for (const q of queries) {
    const snap = await q;
    if (!snap.empty) {
      const doc = snap.docs[0] as any | undefined;
      if (doc) {
        const x = doc.data() as any;
        const label = String(x?.number ?? x?.name ?? x?.code ?? doc.id);
        return { id: String(doc.id), data: x, label };
      }
    }
  }

  throw new Error('Room not found');
}

async function assertRoomAvailable(
  roomId: string,
  checkInISO: string,
  checkOutISO: string,
  excludeId?: string
) {
  const inD = parseISODate(checkInISO);
  const outD = parseISODate(checkOutISO);
  if (!inD || !outD) throw new Error('Invalid date');
  if (outD < inD) throw new Error('Check-out must be same or after check-in');

  const snap = await adminDb
    .collection('bookings')
    .where('roomId', '==', roomId)
    .where('status', 'in', ['pending', 'confirmed'])
    .get();

  const conflict = snap.docs.some(d => {
    if (excludeId && d.id === excludeId) return false;
    const x = d.data() as any;
    const bIn = parseISODate(x?.checkInDate);
    const bOut = parseISODate(x?.checkOutDate);
    if (!bIn || !bOut) return false;
    return datesOverlap(inD, outD, bIn, bOut);
  });

  if (conflict) {
    throw new Error('This room is already booked for the selected dates.');
  }
}

// ---------- actions ----------
export async function createBookingAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const tenantId = s(formData, 'tenantId');
    const roomInput = s(formData, 'roomId'); // อาจเป็น id หรือ label
    const checkInDate = isoDateOnly(s(formData, 'checkInDate'));
    const checkOutDate = isoDateOnly(s(formData, 'checkOutDate'));
    const guests = n(formData, 'guests') ?? 1;

    if (!tenantId || !roomInput || !checkInDate || !checkOutDate) {
      throw new Error('Missing required fields');
    }

    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) throw new Error('Tenant not found');
    const tenant = tenantDoc.data();

    // map room label/id → room id จริง
    const resolved = await resolveRoomByIdOrLabel(roomInput);

    // ถ้า tenant ผูกห้องไว้ ต้องตรงกัน
    const assignedRaw = tenantAssignedRoomRaw(tenant);
    if (assignedRaw) {
      const assignedResolved = await resolveRoomByIdOrLabel(assignedRaw);
      if (assignedResolved.id !== resolved.id) {
        throw new Error(
          `This tenant is assigned to room "${assignedResolved.label}" only.`
        );
      }
    }

    // กันจองซ้ำ
    await assertRoomAvailable(resolved.id, checkInDate, checkOutDate);

    const now = new Date();
    const doc = await adminDb.collection('bookings').add({
      tenantId,
      roomId: resolved.id,
      roomNumber: resolved.label,
      checkInDate,
      checkOutDate,
      guests,
      status: 'pending', // pending | confirmed | cancelled | completed
      createdAt: now,
      updatedAt: now,
    });

    revalidateTag('bookings:list');
    revalidatePath('/bookings');
    return { ok: true, id: doc.id, data: { id: doc.id } };
  } catch (e: any) {
    console.error('[bookings.create]', e);
    return { ok: false, error: e?.message ?? 'Create failed' };
  }
}

export async function updateBookingAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = s(formData, 'id');
    if (!id) throw new Error('Missing booking id');

    const curSnap = await adminDb.collection('bookings').doc(id).get();
    if (!curSnap.exists) throw new Error('Booking not found');
    const cur = curSnap.data() as any;

    const patch: Record<string, any> = { updatedAt: new Date() };

    // รับค่าใหม่ (ถ้าไม่ส่งมาใช้ค่าเดิม)
    const tenantId = s(formData, 'tenantId') || cur.tenantId;
    const roomInput = s(formData, 'roomId') || cur.roomId; // อาจเป็น label/id
    const checkInDate = s(formData, 'checkInDate')
      ? isoDateOnly(s(formData, 'checkInDate'))
      : (cur.checkInDate as string);
    const checkOutDate = s(formData, 'checkOutDate')
      ? isoDateOnly(s(formData, 'checkOutDate'))
      : (cur.checkOutDate as string);

    const guests = n(formData, 'guests');
    if (typeof guests === 'number') patch.guests = guests;

    const status = s(formData, 'status');
    if (status) patch.status = status as any;

    // resolve room + validate tenant binding
    const resolved = await resolveRoomByIdOrLabel(roomInput);

    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) throw new Error('Tenant not found');
    const assignedRaw = tenantAssignedRoomRaw(tenantDoc.data());
    if (assignedRaw) {
      const assignedResolved = await resolveRoomByIdOrLabel(assignedRaw);
      if (assignedResolved.id !== resolved.id) {
        throw new Error(
          `This tenant is assigned to room "${assignedResolved.label}" only.`
        );
      }
    }

    // กันจองซ้ำ (ยกเว้นเอกสารตัวเอง)
    await assertRoomAvailable(resolved.id, checkInDate, checkOutDate, id);

    patch.tenantId = tenantId;
    patch.roomId = resolved.id;
    patch.roomNumber = resolved.label;
    patch.checkInDate = checkInDate;
    patch.checkOutDate = checkOutDate;

    await adminDb.collection('bookings').doc(id).update(patch);

    revalidateTag('bookings:list');
    revalidatePath('/bookings');
    return { ok: true };
  } catch (e: any) {
    console.error('[bookings.update]', e);
    return { ok: false, error: e?.message ?? 'Update failed' };
  }
}

export async function deleteBookingAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = s(formData, 'id');
    if (!id) throw new Error('Missing booking id');

    await adminDb.collection('bookings').doc(id).delete();

    revalidateTag('bookings:list');
    revalidatePath('/bookings');
    return { ok: true };
  } catch (e: any) {
    console.error('[bookings.delete]', e);
    return { ok: false, error: e?.message ?? 'Delete failed' };
  }
}

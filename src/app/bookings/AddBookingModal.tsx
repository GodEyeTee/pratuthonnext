'use client';

import Modal from '@/components/ui/Modal';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { createBookingAction } from './actions';

type RoomLite = { id: string; label: string };
type TenantLite = { id: string; name: string };

export default function AddBookingModal({
  rooms,
  tenants,
  tenantRoomMap,
  roomLabelMap,
  roomLabelToId, // NEW: label -> id
}: {
  rooms: RoomLite[];
  tenants: TenantLite[];
  tenantRoomMap: Record<string, string | null>;
  roomLabelMap: Record<string, string>;
  roomLabelToId: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>(''); // always hold "id" here
  const [checkIn, setCheckIn] = useState<string>(''); // YYYY-MM-DD
  const [checkOut, setCheckOut] = useState<string>(''); // YYYY-MM-DD

  // raw from tenants (could be id or label)
  const tenantRoomPrefRaw = useMemo(
    () => tenantRoomMap[tenantId] ?? null,
    [tenantId, tenantRoomMap]
  );

  // resolve to id if it's a label
  const resolvedAssignedRoomId = useMemo(() => {
    if (!tenantRoomPrefRaw) return null;
    // already an id?
    if (roomLabelMap[tenantRoomPrefRaw]) return tenantRoomPrefRaw;
    // label -> id
    return roomLabelToId[String(tenantRoomPrefRaw)] ?? null;
  }, [tenantRoomPrefRaw, roomLabelMap, roomLabelToId]);

  const assignedRoomLabel = resolvedAssignedRoomId
    ? (roomLabelMap[resolvedAssignedRoomId] ?? resolvedAssignedRoomId)
    : null;

  useEffect(() => {
    if (!open) {
      setError(null);
      setTenantId('');
      setRoomId('');
      setCheckIn('');
      setCheckOut('');
    }
  }, [open]);

  useEffect(() => {
    if (resolvedAssignedRoomId) setRoomId(resolvedAssignedRoomId);
    else setRoomId(''); // clear if tenant w/o assigned room
  }, [resolvedAssignedRoomId]);

  // keep checkOut >= checkIn
  useEffect(() => {
    if (checkIn && checkOut && checkOut < checkIn) setCheckOut(checkIn);
  }, [checkIn, checkOut]);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      // ถ้าล็อกห้องไว้ ให้ยัด roomId (id) เสมอ เพื่อกัน disabled ไม่ส่งค่า
      if (resolvedAssignedRoomId)
        formData.set('roomId', resolvedAssignedRoomId);
      const res = await createBookingAction(formData);
      if (!res.ok) {
        setError(res.error || 'Failed to create booking');
        return;
      }
      setOpen(false);
    });
  };

  const assignedNotMatchWarning = Boolean(
    tenantRoomPrefRaw && !resolvedAssignedRoomId
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 active:scale-[.98] transition-all shadow-sm"
      >
        Add Booking
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create booking"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="booking-create-form"
              disabled={isPending || assignedNotMatchWarning}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="booking-create-form" action={submit} className="space-y-3">
          <Field label="Tenant" required>
            <select
              name="tenantId"
              required
              className="input"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
            >
              <option value="" disabled>
                Select tenant…
              </option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Room" required>
              {resolvedAssignedRoomId && (
                <input
                  type="hidden"
                  name="roomId"
                  value={resolvedAssignedRoomId}
                />
              )}
              <select
                {...(!resolvedAssignedRoomId
                  ? { required: true, name: 'roomId' }
                  : { name: undefined })}
                className="input disabled:opacity-60"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                disabled={!!resolvedAssignedRoomId}
              >
                {resolvedAssignedRoomId ? (
                  <option value={resolvedAssignedRoomId}>
                    {assignedRoomLabel}
                  </option>
                ) : (
                  <>
                    <option value="" disabled>
                      Select room…
                    </option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {resolvedAssignedRoomId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Locked to tenant’s assigned room.
                </p>
              )}
              {assignedNotMatchWarning && (
                <p className="mt-1 text-xs text-rose-600">
                  Assigned room “{tenantRoomPrefRaw}” not found in rooms list.
                  Please fix tenant data or choose a room.
                </p>
              )}
            </Field>

            <Field label="Guests">
              <input
                name="guests"
                type="number"
                min={1}
                defaultValue={1}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Check-in date" required>
              <input
                name="checkInDate"
                type="date"
                required
                className="input"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
              />
            </Field>
            <Field label="Check-out date" required>
              <input
                name="checkOutDate"
                type="date"
                required
                className="input"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                min={checkIn || undefined}
              />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          )}
        </form>

        <style jsx>{`
          .input {
            @apply w-full rounded-xl border border-border dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-colors;
          }
        `}</style>
      </Modal>
    </>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1.5 flex items-center gap-1 text-foreground dark:text-gray-100">
        <span>{label}</span>
        {required && (
          <span className="text-rose-500 dark:text-rose-400">*</span>
        )}
      </div>
      {children}
    </label>
  );
}

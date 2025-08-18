'use client';

import KebabMenu from '@/components/ui/KebabMenu';
import Modal from '@/components/ui/Modal';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { deleteBookingAction, updateBookingAction } from './actions';

type RoomLite = { id: string; label: string };
type TenantLite = { id: string; name: string };

type Row = {
  id: string;
  tenantId?: string | null;
  roomId?: string | null;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  checkIn: Date | null;
  checkOut: Date | null;
};

const TR = {
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete: 'Delete this booking?',
  saving: 'Saving…',
  save: 'Save',
  cancel: 'Cancel',
  tenant: 'Tenant',
  room: 'Room',
  guests: 'Guests',
  status: 'Status',
  checkIn: 'Check-in date',
  checkOut: 'Check-out date',
};

export default function BookingActions({
  row,
  rooms,
  tenants,
  tenantRoomMap,
  roomLabelMap,
}: {
  row: Row;
  rooms: RoomLite[];
  tenants: TenantLite[];
  tenantRoomMap: Record<string, string | null>;
  roomLabelMap: Record<string, string>;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [tenantId, setTenantId] = useState<string>(row.tenantId ?? '');
  const [roomId, setRoomId] = useState<string>(row.roomId ?? '');
  const [checkIn, setCheckIn] = useState<string>(
    row.checkIn ? row.checkIn.toISOString().slice(0, 10) : ''
  );
  const [checkOut, setCheckOut] = useState<string>(
    row.checkOut ? row.checkOut.toISOString().slice(0, 10) : ''
  );

  const assignedRoomId = useMemo(
    () => tenantRoomMap[tenantId] ?? null,
    [tenantId, tenantRoomMap]
  );
  const assignedRoomLabel = assignedRoomId
    ? (roomLabelMap[assignedRoomId] ?? assignedRoomId)
    : null;

  useEffect(() => {
    if (assignedRoomId) setRoomId(assignedRoomId);
  }, [assignedRoomId]);

  useEffect(() => {
    if (checkIn && checkOut && checkOut < checkIn) setCheckOut(checkIn);
  }, [checkIn, checkOut]);

  const onDelete = () => {
    if (!confirm(TR.confirmDelete)) return;
    const fd = new FormData();
    fd.set('id', row.id);
    startTransition(async () => {
      await deleteBookingAction(fd);
    });
  };

  return (
    <>
      <KebabMenu
        side="bottom-end"
        items={[
          { label: TR.edit, onSelect: () => setOpenEdit(true) },
          {
            label: TR.delete,
            destructive: true,
            onSelect: onDelete,
            separatorBefore: true,
          },
        ]}
      />

      {/* Edit modal */}
      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title={TR.edit}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="px-4 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {TR.cancel}
            </button>
            <button
              type="submit"
              form="booking-edit-form"
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? TR.saving : TR.save}
            </button>
          </>
        }
      >
        <form
          id="booking-edit-form"
          action={(fd: FormData) => {
            fd.set('id', row.id);
            fd.set('tenantId', tenantId);
            fd.set('roomId', roomId);
            if (checkIn) fd.set('checkInDate', checkIn);
            if (checkOut) fd.set('checkOutDate', checkOut);
            startTransition(async () => {
              await updateBookingAction(fd);
              setOpenEdit(false);
            });
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={TR.tenant}>
              <select
                name="tenantId"
                className="input"
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
              >
                <option value="">—</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={TR.room}>
              <select
                name="roomId"
                className="input disabled:opacity-60"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                disabled={!!assignedRoomId}
              >
                {assignedRoomId ? (
                  <option value={assignedRoomId}>{assignedRoomLabel}</option>
                ) : (
                  <>
                    <option value="">—</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {assignedRoomId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Locked to tenant’s assigned room.
                </p>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label={TR.guests}>
              <input
                name="guests"
                type="number"
                min={1}
                defaultValue={row.guests}
                className="input"
              />
            </Field>
            <Field label={TR.checkIn}>
              <input
                name="checkInDate"
                type="date"
                className="input"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
              />
            </Field>
            <Field label={TR.checkOut}>
              <input
                name="checkOutDate"
                type="date"
                className="input"
                value={checkOut}
                min={checkIn || undefined}
                onChange={e => setCheckOut(e.target.value)}
              />
            </Field>
          </div>

          <Field label={TR.status}>
            <select name="status" defaultValue={row.status} className="input">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1.5 flex items-center gap-1 text-foreground dark:text-gray-100">
        <span>{label}</span>
      </div>
      {children}
    </label>
  );
}

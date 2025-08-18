'use client';

import KebabMenu from '@/components/ui/KebabMenu';
import Modal from '@/components/ui/Modal';
import { useState, useTransition } from 'react';
import { deleteTenantAction, updateTenantAction } from './actions';
import type { TenantRow } from './page';

const tr = {
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete: 'Delete this tenant?',
  saving: 'Saving…',
  save: 'Save',
  cancel: 'Cancel',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  room: 'Room',
  status: 'Status',
  active: 'Active',
  inactive: 'Inactive',
};

export default function TenantActions({
  row,
  onUpdated,
  onDeleted,
}: {
  row: TenantRow;
  onUpdated: (x: TenantRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm(tr.confirmDelete)) return;
    const fd = new FormData();
    fd.set('id', row.id);
    startTransition(async () => {
      const res = await deleteTenantAction(fd);
      if (res.success) onDeleted(row.id);
    });
  };

  return (
    <>
      <KebabMenu
        side="bottom-end"
        items={[
          { label: tr.edit, onSelect: () => setOpenEdit(true) },
          {
            label: tr.delete,
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
        title={tr.edit}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="px-4 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {tr.cancel}
            </button>
            <button
              type="submit"
              form="tenant-edit-form"
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? tr.saving : tr.save}
            </button>
          </>
        }
      >
        <form
          id="tenant-edit-form"
          action={(formData: FormData) => {
            formData.set('id', row.id);
            const next: TenantRow = {
              id: row.id,
              name: String(formData.get('name') || row.name),
              email: String(formData.get('email') || row.email || '') || null,
              phone: String(formData.get('phone') || row.phone || '') || null,
              room: String(formData.get('room') || row.room || '') || null,
              status: String(
                formData.get('status') || row.status || 'active'
              ) as 'active' | 'inactive',
            };
            startTransition(async () => {
              const res = await updateTenantAction(formData);
              if (res.success) {
                onUpdated(next);
                setOpenEdit(false);
              }
            });
          }}
          className="space-y-3"
        >
          <Field label={tr.name} required>
            <input
              name="name"
              defaultValue={row.name}
              required
              className="input"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={tr.email}>
              <input
                name="email"
                type="email"
                defaultValue={row.email ?? ''}
                className="input"
              />
            </Field>
            <Field label={tr.phone}>
              <input
                name="phone"
                defaultValue={row.phone ?? ''}
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={tr.room}>
              <input
                name="room"
                defaultValue={row.room ?? ''}
                className="input"
              />
            </Field>
            <Field label={tr.status}>
              <select
                name="status"
                defaultValue={row.status ?? 'active'}
                className="input"
              >
                <option value="active">{tr.active}</option>
                <option value="inactive">{tr.inactive}</option>
              </select>
            </Field>
          </div>
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

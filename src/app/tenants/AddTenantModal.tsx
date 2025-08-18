'use client';

import Modal from '@/components/ui/Modal';
import { useState, useTransition } from 'react';
import { createTenantAction } from './actions';
import type { TenantRow } from './page';

const tr = {
  addTenant: 'Add Tenant',
  createTenant: 'Create tenant',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  room: 'Room',
  status: 'Status',
  active: 'Active',
  inactive: 'Inactive',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving…',
};

export default function AddTenantModal({
  onCreated,
}: {
  onCreated: (x: TenantRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    if (!formData.get('status')) formData.set('status', 'active');

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim() || null;
    const phone = String(formData.get('phone') || '').trim() || null;
    const room = String(formData.get('room') || '').trim() || null;
    const status = String(formData.get('status') || 'active') as
      | 'active'
      | 'inactive';

    startTransition(async () => {
      const res = await createTenantAction(formData);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed');
        return;
      }
      // optimistic add
      const now = new Date().toISOString();
      onCreated({
        id: res.data.id,
        name,
        email,
        phone,
        room,
        status,
        created_at: now,
        updated_at: now,
      });
      setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 active:scale-[.98] transition-all shadow-sm"
      >
        {tr.addTenant}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tr.createTenant}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {tr.cancel}
            </button>
            <button
              type="submit"
              form="tenant-create-form"
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? tr.saving : tr.save}
            </button>
          </>
        }
      >
        <form id="tenant-create-form" action={submit} className="space-y-3">
          <Field label={tr.name} required>
            <input
              name="name"
              required
              className="input"
              placeholder="John Doe"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={tr.email}>
              <input
                name="email"
                type="email"
                className="input"
                placeholder="john@example.com"
              />
            </Field>
            <Field label={tr.phone}>
              <input name="phone" className="input" placeholder="0812345678" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={tr.room}>
              <input name="room" className="input" placeholder="A-101" />
            </Field>
            <Field label={tr.status}>
              <select name="status" defaultValue="active" className="input">
                <option value="active">{tr.active}</option>
                <option value="inactive">{tr.inactive}</option>
              </select>
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

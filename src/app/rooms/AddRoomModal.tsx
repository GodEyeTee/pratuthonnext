'use client';

import { useState, useTransition } from 'react';
import { createRoomAction } from './actions';

export default function AddRoomModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createRoomAction(formData);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded bg-emerald-600 text-white"
      >
        Add Room
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3">Create Room</h3>
            {/* ห้ามใส่ method/encType ถ้า action เป็น function */}
            <form action={submit} className="space-y-3">
              <input
                name="number"
                placeholder="Number"
                className="w-full rounded border p-2"
              />
              <input
                name="type"
                placeholder="Type"
                className="w-full rounded border p-2"
              />
              <input
                name="status"
                placeholder="Status"
                defaultValue="available"
                className="w-full rounded border p-2"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

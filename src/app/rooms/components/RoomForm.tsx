'use client';

import { useState, useTransition } from 'react';
import { createRoomAction, updateRoomAction } from '../actions';

export interface RoomFormProps {
  initial?: {
    id: string;
    number: string;
    type: string;
    status: string;
    floor: number | null;
    rate_daily: number | null;
    rate_monthly: number | null;
    water_rate: number | null;
    electric_rate: number | null;
    // ฟิลด์เสริมที่เพจ [id] ส่งมา
    size?: number | null;
    amenities?: unknown[];
    images?: string[];
    description?: string;
  };
}

export default function RoomForm({ initial }: RoomFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const action = isEdit ? updateRoomAction : createRoomAction;
      if (isEdit) formData.set('id', initial!.id);
      const result = await action(formData);
      if (!result.success) setError(result.error || 'Operation failed');
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {isEdit && <input type="hidden" name="id" defaultValue={initial?.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Number</label>
          <input
            name="number"
            defaultValue={initial?.number ?? ''}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input
            name="type"
            defaultValue={initial?.type ?? ''}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <input
            name="status"
            defaultValue={initial?.status ?? 'available'}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Floor</label>
          <input
            name="floor"
            type="number"
            defaultValue={initial?.floor ?? ''}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Daily Rate</label>
          <input
            name="rate_daily"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_daily ?? ''}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monthly Rate</label>
          <input
            name="rate_monthly"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_monthly ?? ''}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Water Rate</label>
          <input
            name="water_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.water_rate ?? ''}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Electric Rate
          </label>
          <input
            name="electric_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.electric_rate ?? ''}
            className="w-full rounded border p-2"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

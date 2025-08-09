/*
 * RoomForm component
 *
 * This client component renders a form for creating or updating a room. It
 * delegates the actual database write to server actions defined in
 * `src/app/rooms/actions.ts`. By using server actions, no Supabase
 * credentials are exposed to the client and the form submission can
 * revalidate the rooms listing automatically.
 */

'use client';

import { useState, useTransition } from 'react';
import { createRoomAction, updateRoomAction } from '../actions';

// Define the shape of a room that can be passed as initial data
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
      const result = await action({}, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {isEdit && <input type="hidden" name="id" defaultValue={initial?.id} />}
      <div>
        <label className="block mb-1 text-sm font-medium">Number</label>
        <input
          name="number"
          type="text"
          defaultValue={initial?.number ?? ''}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Type</label>
        <input
          name="type"
          type="text"
          defaultValue={initial?.type ?? ''}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Status</label>
        <select
          name="status"
          defaultValue={initial?.status ?? 'available'}
          className="w-full p-2 border rounded"
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Floor</label>
        <input
          name="floor"
          type="number"
          defaultValue={initial?.floor ?? ''}
          min={0}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Daily Rate</label>
          <input
            name="rate_daily"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_daily ?? ''}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Monthly Rate</label>
          <input
            name="rate_monthly"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_monthly ?? ''}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Water Rate</label>
          <input
            name="water_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.water_rate ?? ''}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">
            Electric Rate
          </label>
          <input
            name="electric_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.electric_rate ?? ''}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? 'Saving…' : isEdit ? 'Update Room' : 'Create Room'}
      </button>
    </form>
  );
}

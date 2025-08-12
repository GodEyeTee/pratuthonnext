'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
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
    size?: number | null;
    amenities?: unknown[];
    images?: string[];
    description?: string;
  };
}

const TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' },
];

const AMENITY_OPTIONS = [
  'Air Conditioning',
  'Water Heater',
  'Balcony',
  'TV',
  'Fridge',
  'WiFi',
  'Parking',
];

export default function RoomForm({ initial }: RoomFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial);

  const [amenities, setAmenities] = useState<string[]>(
    Array.isArray(initial?.amenities) ? (initial!.amenities as string[]) : []
  );
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const amenitiesLabel = useMemo(
    () =>
      amenities.length ? `${amenities.length} selected` : 'Select amenities',
    [amenities]
  );

  const toggleAmenity = (name: string) => {
    setAmenities(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);

    // normalize fields for server action
    formData.set('amenities', JSON.stringify(amenities));
    if (!formData.get('images'))
      formData.set('images', JSON.stringify(initial?.images ?? []));
    if (!formData.get('status'))
      formData.set('status', initial?.status ?? 'available');

    startTransition(async () => {
      const action = isEdit ? updateRoomAction : createRoomAction;
      if (isEdit) formData.set('id', initial!.id);
      const result = await action(formData);
      if (!result.success) {
        setError(result.error || 'Operation failed');
      } else {
        router.push('/rooms');
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      {isEdit && <input type="hidden" name="id" defaultValue={initial?.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Room Number" required>
          <input
            name="number"
            defaultValue={initial?.number ?? ''}
            required
            className="i"
          />
        </Field>

        <Field label="Type" required>
          <select
            name="type"
            required
            defaultValue={initial?.type ?? ''}
            className="i"
          >
            <option value="" disabled>
              Select type
            </option>
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            name="status"
            defaultValue={initial?.status ?? 'available'}
            className="i"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Floor">
          <input
            name="floor"
            type="number"
            min={1}
            defaultValue={initial?.floor ?? ''}
            className="i"
          />
        </Field>

        <Field label="Daily Rate (฿)">
          <input
            name="rate_daily"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_daily ?? ''}
            className="i"
          />
        </Field>

        <Field label="Monthly Rate (฿)">
          <input
            name="rate_monthly"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_monthly ?? ''}
            className="i"
          />
        </Field>

        <Field label="Water Rate (฿/unit)">
          <input
            name="water_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.water_rate ?? ''}
            className="i"
          />
        </Field>

        <Field label="Electric Rate (฿/unit)">
          <input
            name="electric_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.electric_rate ?? ''}
            className="i"
          />
        </Field>

        <Field label="Size (m²)">
          <input
            name="size"
            type="number"
            step="0.1"
            defaultValue={initial?.size ?? ''}
            className="i"
          />
        </Field>

        <Field label="Amenities">
          <div className="relative">
            <button
              type="button"
              className="i text-left"
              onClick={() => setAmenitiesOpen(v => !v)}
            >
              {amenitiesLabel}
            </button>
            {amenitiesOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border bg-popover text-popover-foreground shadow-lg p-2 max-h-56 overflow-auto">
                {AMENITY_OPTIONS.map(name => (
                  <label
                    key={name}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded border"
                      checked={amenities.includes(name)}
                      onChange={() => toggleAmenity(name)}
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </Field>

        {/* hidden mirrors needed by server action */}
        <input
          type="hidden"
          name="amenities"
          value={JSON.stringify(amenities)}
        />
        <input
          type="hidden"
          name="images"
          value={JSON.stringify(initial?.images ?? [])}
        />
      </div>

      <Field label="Description">
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ''}
          className="i"
        />
      </Field>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
        >
          {isEdit
            ? isPending
              ? 'Updating…'
              : 'Update'
            : isPending
              ? 'Creating…'
              : 'Create'}
        </button>
      </div>
    </form>
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
      <div className="text-sm font-medium mb-1 flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </div>
      {children}
    </label>
  );
}

// shared input class
const i =
  'w-full rounded-xl border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40';
// little trick to attach to JSX via className="i"
// @ts-ignore
String.prototype.i;

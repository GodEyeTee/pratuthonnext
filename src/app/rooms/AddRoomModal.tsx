'use client';

import { useMemo, useState, useTransition } from 'react';
import { createRoomAction } from './actions';

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

export default function AddRoomModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // form state (uncontrolled inputs + a bit of state for multi-select)
  const [amenities, setAmenities] = useState<string[]>([]);
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

  const submit = (formData: FormData) => {
    setError(null);

    // ensure server action receives JSON strings for array fields
    formData.set('amenities', JSON.stringify(amenities));
    if (!formData.get('images')) formData.set('images', JSON.stringify([]));

    // sensible defaults if user leaves blank
    if (!formData.get('status')) formData.set('status', 'available');
    if (!formData.get('water_rate')) formData.set('water_rate', '18');
    if (!formData.get('electric_rate')) formData.set('electric_rate', '7');

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
        className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:opacity-90 active:scale-[.98]"
      >
        Add Room
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 w-full max-w-2xl shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Create Room</h3>

            {/* IMPORTANT: do not set method/enctype when using server action function */}
            <form action={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Room Number" required>
                  <input
                    name="number"
                    required
                    placeholder="e.g. 101"
                    className="i"
                  />
                </Field>

                <Field label="Type" required>
                  <select name="type" required defaultValue="" className="i">
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
                  <select name="status" defaultValue="available" className="i">
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
                    placeholder="1"
                    className="i"
                  />
                </Field>

                <Field label="Daily Rate (฿)">
                  <input
                    name="rate_daily"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="i"
                  />
                </Field>

                <Field label="Monthly Rate (฿)">
                  <input
                    name="rate_monthly"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="i"
                  />
                </Field>

                <Field label="Water Rate (฿/unit)">
                  <input
                    name="water_rate"
                    type="number"
                    step="0.01"
                    placeholder="18"
                    className="i"
                  />
                </Field>

                <Field label="Electric Rate (฿/unit)">
                  <input
                    name="electric_rate"
                    type="number"
                    step="0.01"
                    placeholder="7"
                    className="i"
                  />
                </Field>

                <Field label="Size (m²)">
                  <input
                    name="size"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 28"
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

                {/* Hidden mirrors for arrays */}
                <input
                  type="hidden"
                  name="amenities"
                  value={JSON.stringify(amenities)}
                />
                <input type="hidden" name="images" value={JSON.stringify([])} />
              </div>

              <Field label="Description">
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Short description…"
                  className="i"
                />
              </Field>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-xl border hover:bg-muted/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

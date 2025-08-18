// src/app/rooms/components/RoomForm.tsx
'use client';

import { useLocale } from '@/hooks/useLocale';
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
  { value: 'standard', label: { en: 'Standard', th: 'มาตรฐาน' } },
  { value: 'deluxe', label: { en: 'Deluxe', th: 'ดีลักซ์' } },
  { value: 'suite', label: { en: 'Suite', th: 'สวีท' } },
];

const STATUS_OPTIONS = [
  { value: 'available', label: { en: 'Available', th: 'ว่าง' } },
  { value: 'occupied', label: { en: 'Occupied', th: 'มีผู้เช่า' } },
  { value: 'maintenance', label: { en: 'Maintenance', th: 'ปรับปรุง' } },
  { value: 'reserved', label: { en: 'Reserved', th: 'จองแล้ว' } },
];

const AMENITY_OPTIONS = [
  { value: 'Air Conditioning', label: { en: 'Air Conditioning', th: 'แอร์' } },
  {
    value: 'Water Heater',
    label: { en: 'Water Heater', th: 'เครื่องทำน้ำอุ่น' },
  },
  { value: 'Balcony', label: { en: 'Balcony', th: 'ระเบียง' } },
  { value: 'TV', label: { en: 'TV', th: 'ทีวี' } },
  { value: 'Fridge', label: { en: 'Fridge', th: 'ตู้เย็น' } },
  { value: 'WiFi', label: { en: 'WiFi', th: 'WiFi' } },
  { value: 'Parking', label: { en: 'Parking', th: 'ที่จอดรถ' } },
];

const translations = {
  en: {
    roomNumber: 'Room Number',
    type: 'Type',
    status: 'Status',
    floor: 'Floor',
    dailyRate: 'Daily Rate',
    monthlyRate: 'Monthly Rate',
    waterRate: 'Water Rate',
    electricRate: 'Electric Rate',
    size: 'Size',
    amenities: 'Amenities',
    description: 'Description',
    selectType: 'Select type',
    selectAmenities: 'Select amenities',
    selected: 'selected',
    update: 'Update',
    create: 'Create',
    updating: 'Updating…',
    creating: 'Creating…',
    operationFailed: 'Operation failed',
    perUnit: '/unit',
  },
  th: {
    roomNumber: 'หมายเลขห้อง',
    type: 'ประเภท',
    status: 'สถานะ',
    floor: 'ชั้น',
    dailyRate: 'ราคารายวัน',
    monthlyRate: 'ราคารายเดือน',
    waterRate: 'ค่าน้ำ',
    electricRate: 'ค่าไฟ',
    size: 'ขนาด',
    amenities: 'สิ่งอำนวยความสะดวก',
    description: 'รายละเอียด',
    selectType: 'เลือกประเภท',
    selectAmenities: 'เลือกสิ่งอำนวยความสะดวก',
    selected: 'รายการ',
    update: 'อัปเดต',
    create: 'สร้าง',
    updating: 'กำลังอัปเดต…',
    creating: 'กำลังสร้าง…',
    operationFailed: 'การดำเนินการล้มเหลว',
    perUnit: '/หน่วย',
  },
};

export default function RoomForm({ initial }: RoomFormProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = translations[locale as 'en' | 'th'] || translations.en;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial);

  const [amenities, setAmenities] = useState<string[]>(
    Array.isArray(initial?.amenities) ? (initial!.amenities as string[]) : []
  );
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const amenitiesLabel = useMemo(
    () =>
      amenities.length
        ? `${amenities.length} ${t.selected}`
        : t.selectAmenities,
    [amenities, t]
  );

  const toggleAmenity = (name: string) => {
    setAmenities(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
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
        setError(result.error || t.operationFailed);
      } else {
        router.push('/rooms');
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      {isEdit && <input type="hidden" name="id" defaultValue={initial?.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t.roomNumber} required>
          <input
            name="number"
            defaultValue={initial?.number ?? ''}
            required
            className="input"
          />
        </Field>

        <Field label={t.type} required>
          <select
            name="type"
            required
            defaultValue={initial?.type ?? ''}
            className="input"
          >
            <option value="" disabled>
              {t.selectType}
            </option>
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label[locale as 'en' | 'th'] || o.label.en}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.status}>
          <select
            name="status"
            defaultValue={initial?.status ?? 'available'}
            className="input"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label[locale as 'en' | 'th'] || o.label.en}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.floor}>
          <input
            name="floor"
            type="number"
            min={1}
            defaultValue={initial?.floor ?? ''}
            className="input"
          />
        </Field>

        <Field label={`${t.dailyRate} (฿)`}>
          <input
            name="rate_daily"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_daily ?? ''}
            className="input"
          />
        </Field>

        <Field label={`${t.monthlyRate} (฿)`}>
          <input
            name="rate_monthly"
            type="number"
            step="0.01"
            defaultValue={initial?.rate_monthly ?? ''}
            className="input"
          />
        </Field>

        <Field label={`${t.waterRate} (฿${t.perUnit})`}>
          <input
            name="water_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.water_rate ?? ''}
            className="input"
          />
        </Field>

        <Field label={`${t.electricRate} (฿${t.perUnit})`}>
          <input
            name="electric_rate"
            type="number"
            step="0.01"
            defaultValue={initial?.electric_rate ?? ''}
            className="input"
          />
        </Field>

        <Field label={`${t.size} (m²)`}>
          <input
            name="size"
            type="number"
            step="0.1"
            defaultValue={initial?.size ?? ''}
            className="input"
          />
        </Field>

        <Field label={t.amenities}>
          <div className="relative">
            <button
              type="button"
              className="input text-left flex items-center justify-between"
              onClick={() => setAmenitiesOpen(v => !v)}
            >
              <span>{amenitiesLabel}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {amenitiesOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border dark:border-gray-600 bg-background dark:bg-gray-800 shadow-lg p-2 max-h-56 overflow-auto">
                {AMENITY_OPTIONS.map(item => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/60 dark:hover:bg-gray-700/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600"
                      checked={amenities.includes(item.value)}
                      onChange={() => toggleAmenity(item.value)}
                    />
                    <span className="text-sm text-foreground dark:text-gray-100">
                      {item.label[locale as 'en' | 'th'] || item.label.en}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </Field>

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

      <Field label={t.description}>
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ''}
          className="input"
        />
      </Field>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isEdit
            ? isPending
              ? t.updating
              : t.update
            : isPending
              ? t.creating
              : t.create}
        </button>
      </div>

      <style jsx>{`
        .input {
          @apply w-full rounded-xl border border-border dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-colors;
        }
      `}</style>
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

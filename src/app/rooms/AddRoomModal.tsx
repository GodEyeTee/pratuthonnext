// src/app/rooms/AddRoomModal.tsx
'use client';

import { useLocale } from '@/hooks/useLocale';
import { Plus, X } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { createRoomAction } from './actions';

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
    addRoom: 'Add Room',
    createRoom: 'Create Room',
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
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    perUnit: '/unit',
  },
  th: {
    addRoom: 'เพิ่มห้อง',
    createRoom: 'สร้างห้องใหม่',
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
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    saving: 'กำลังบันทึก…',
    perUnit: '/หน่วย',
  },
};

export default function AddRoomModal() {
  const { locale } = useLocale();
  const t = translations[locale as 'en' | 'th'] || translations.en;

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const amenitiesLabel = useMemo(
    () =>
      amenities.length
        ? `${amenities.length} ${t.selected}`
        : t.selectAmenities,
    [amenities, t]
  );

  const toggleAmenity = (value: string) => {
    setAmenities(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
  };

  const submit = (formData: FormData) => {
    setError(null);
    formData.set('amenities', JSON.stringify(amenities));
    if (!formData.get('images')) formData.set('images', JSON.stringify([]));
    if (!formData.get('status')) formData.set('status', 'available');
    if (!formData.get('water_rate')) formData.set('water_rate', '18');
    if (!formData.get('electric_rate')) formData.set('electric_rate', '7');

    startTransition(async () => {
      const res = await createRoomAction(formData);
      if (res?.error) setError(res.error);
      else {
        setOpen(false);
        setAmenities([]);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 active:scale-[.98] transition-all flex items-center gap-2 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        {t.addRoom}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-background dark:bg-gray-900 rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-border dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">
                {t.createRoom}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-muted/60 dark:hover:bg-gray-700/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t.roomNumber} required>
                  <input
                    name="number"
                    required
                    placeholder="101"
                    className="input"
                  />
                </Field>

                <Field label={t.type} required>
                  <select
                    name="type"
                    required
                    defaultValue=""
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
                    defaultValue="available"
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
                    placeholder="1"
                    className="input"
                  />
                </Field>

                <Field label={`${t.dailyRate} (฿)`}>
                  <input
                    name="rate_daily"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="input"
                  />
                </Field>

                <Field label={`${t.monthlyRate} (฿)`}>
                  <input
                    name="rate_monthly"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="input"
                  />
                </Field>

                <Field label={`${t.waterRate} (฿${t.perUnit})`}>
                  <input
                    name="water_rate"
                    type="number"
                    step="0.01"
                    placeholder="18"
                    className="input"
                  />
                </Field>

                <Field label={`${t.electricRate} (฿${t.perUnit})`}>
                  <input
                    name="electric_rate"
                    type="number"
                    step="0.01"
                    placeholder="7"
                    className="input"
                  />
                </Field>

                <Field label={`${t.size} (m²)`}>
                  <input
                    name="size"
                    type="number"
                    step="0.1"
                    placeholder="28"
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
                            <span className="text-sm">
                              {item.label[locale as 'en' | 'th'] ||
                                item.label.en}
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
                <input type="hidden" name="images" value={JSON.stringify([])} />
              </div>

              <Field label={t.description}>
                <textarea name="description" rows={3} className="input" />
              </Field>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isPending ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          @apply w-full rounded-xl border border-border dark:border-gray-600 bg-background dark:bg-gray-800 px-3 py-2 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-colors;
        }
      `}</style>
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

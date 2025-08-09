'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useNotifications } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RoomData {
  id: string;
  number: string;
  type: 'standard' | 'deluxe' | 'suite';
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  rate_daily: number;
  rate_monthly: number;
  water_rate: number;
  electric_rate: number;
  size?: number | null;
  description?: string | null;
}

interface RoomFormProps {
  room?: RoomData;
}

interface FormData {
  number: string;
  type: 'standard' | 'deluxe' | 'suite';
  floor: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  rateDaily: string;
  rateMonthly: string;
  waterRate: string;
  electricRate: string;
  size: string;
  description: string;
}

export default function RoomForm({ room }: RoomFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('rooms');
  const { success, error } = useNotifications();

  const [form, setForm] = useState<FormData>({
    number: room?.number ?? '',
    type: room?.type ?? 'standard',
    floor: room?.floor?.toString() ?? '1',
    status: room?.status ?? 'available',
    rateDaily: room?.rate_daily?.toString() ?? '',
    rateMonthly: room?.rate_monthly?.toString() ?? '',
    waterRate: room?.water_rate?.toString() ?? '18',
    electricRate: room?.electric_rate?.toString() ?? '7',
    size: room?.size?.toString() ?? '',
    description: room?.description ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.number.trim()) newErrors.number = 'กรุณาระบุหมายเลขห้อง';
    if (!form.rateDaily) newErrors.rateDaily = 'กรุณาระบุราคารายวัน';
    if (!form.rateMonthly) newErrors.rateMonthly = 'กรุณาระบุราคารายเดือน';
    if (!form.waterRate) newErrors.waterRate = 'กรุณาระบุค่าน้ำ';
    if (!form.electricRate) newErrors.electricRate = 'กรุณาระบุค่าไฟ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const roomData = {
        number: form.number.trim(),
        type: form.type,
        floor: parseInt(form.floor),
        status: form.status,
        rate_daily: parseFloat(form.rateDaily),
        rate_monthly: parseFloat(form.rateMonthly),
        water_rate: parseFloat(form.waterRate),
        electric_rate: parseFloat(form.electricRate),
        size: form.size ? parseFloat(form.size) : null,
        description: form.description.trim() || null,
      };

      if (room) {
        const { error: e1 } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', room.id);
        if (e1) throw e1;
        success(t('roomDetails'), 'อัปเดตห้องสำเร็จ');
      } else {
        const { error: e2 } = await supabase.from('rooms').insert(roomData);
        if (e2) throw e2;
        success(t('addRoom'), 'เพิ่มห้องสำเร็จ');
      }

      router.push('/rooms');
      router.refresh();
    } catch (err) {
      console.error('Error saving room:', err);
      error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{room ? 'แก้ไขข้อมูลห้องพัก' : t('addRoom')}</CardTitle>
          {room && <Badge variant="outline">ห้อง {room.number}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ข้อมูลห้อง</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="หมายเลขห้อง"
                name="number"
                value={form.number}
                onChange={handleChange}
                error={errors.number}
                required
                placeholder="เช่น 101, 202"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  ประเภทห้อง <span className="text-destructive">*</span>
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm
                             dark:[color-scheme:dark]"
                >
                  <option value="standard">มาตรฐาน</option>
                  <option value="deluxe">ดีลักซ์</option>
                  <option value="suite">สวีท</option>
                </select>
              </div>

              <Input
                label="ชั้น"
                name="floor"
                type="number"
                value={form.floor}
                onChange={handleChange}
                required
                min="1"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  สถานะ <span className="text-destructive">*</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm
                             dark:[color-scheme:dark]"
                >
                  <option value="available">ว่าง</option>
                  <option value="occupied">มีผู้เช่า</option>
                  <option value="maintenance">ซ่อมบำรุง</option>
                  <option value="reserved">จองแล้ว</option>
                </select>
              </div>

              <Input
                label="ขนาดห้อง (ตร.ม.)"
                name="size"
                type="number"
                value={form.size}
                onChange={handleChange}
                placeholder="เช่น 25, 32"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">อัตราค่าเช่า</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="ราคารายวัน (บาท)"
                name="rateDaily"
                type="number"
                value={form.rateDaily}
                onChange={handleChange}
                error={errors.rateDaily}
                required
                min="0"
                step="0.01"
              />
              <Input
                label="ราคารายเดือน (บาท)"
                name="rateMonthly"
                type="number"
                value={form.rateMonthly}
                onChange={handleChange}
                error={errors.rateMonthly}
                required
                min="0"
                step="0.01"
              />
              <Input
                label="ค่าน้ำ (บาท/หน่วย)"
                name="waterRate"
                type="number"
                value={form.waterRate}
                onChange={handleChange}
                error={errors.waterRate}
                required
                min="0"
                step="0.01"
              />
              <Input
                label="ค่าไฟ (บาท/หน่วย)"
                name="electricRate"
                type="number"
                value={form.electricRate}
                onChange={handleChange}
                error={errors.electricRate}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="เช่น สิ่งอำนวยความสะดวก, หมายเหตุ"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> บันทึก
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

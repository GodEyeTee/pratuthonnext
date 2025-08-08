'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Room } from '@/domain/models';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RoomFormProps {
  room?: Room;
}

export default function RoomForm({ room }: RoomFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    number: room?.number ?? '',
    type: room?.type ?? '',
    rateMonthly: room?.rateMonthly?.toString() ?? '',
    rateDaily: room?.rateDaily?.toString() ?? '',
    waterRate: room?.waterRate?.toString() ?? '',
    electricRate: room?.electricRate?.toString() ?? '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (room) {
      await supabase
        .from('rooms')
        .update({
          number: form.number,
          type: form.type,
          rateMonthly: Number(form.rateMonthly),
          rateDaily: Number(form.rateDaily),
          waterRate: Number(form.waterRate),
          electricRate: Number(form.electricRate),
        })
        .eq('id', room.id);
    } else {
      await supabase.from('rooms').insert({
        number: form.number,
        type: form.type,
        rateMonthly: Number(form.rateMonthly),
        rateDaily: Number(form.rateDaily),
        waterRate: Number(form.waterRate),
        electricRate: Number(form.electricRate),
      });
    }
    setLoading(false);
    router.push('/rooms');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{room ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพัก'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">หมายเลขห้อง</label>
              <input
                name="number"
                value={form.number}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">ประเภท</label>
              <input
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">ค่าเช่ารายเดือน</label>
              <input
                type="number"
                name="rateMonthly"
                value={form.rateMonthly}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">ค่าเช่ารายวัน</label>
              <input
                type="number"
                name="rateDaily"
                value={form.rateDaily}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">ค่าน้ำ (หน่วยละ)</label>
              <input
                type="number"
                name="waterRate"
                value={form.waterRate}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">ค่าไฟ (หน่วยละ)</label>
              <input
                type="number"
                name="electricRate"
                value={form.electricRate}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

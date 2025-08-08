import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('number');

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">จัดการห้องพัก</h1>
        <Button asChild>
          <Link href="/rooms/new">เพิ่มห้องพัก</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>รายการห้องพัก</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">หมายเลข</th>
                <th className="py-2 text-left">ประเภท</th>
                <th className="py-2 text-right">รายเดือน</th>
                <th className="py-2 text-right">รายวัน</th>
                <th className="py-2 text-right">ค่าน้ำ</th>
                <th className="py-2 text-right">ค่าไฟ</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rooms?.map(room => (
                <tr key={room.id} className="border-b hover:bg-muted/50">
                  <td className="py-2">{room.number}</td>
                  <td className="py-2">{room.type}</td>
                  <td className="py-2 text-right">{room.rateMonthly}</td>
                  <td className="py-2 text-right">{room.rateDaily}</td>
                  <td className="py-2 text-right">{room.waterRate}</td>
                  <td className="py-2 text-right">{room.electricRate}</td>
                  <td className="py-2 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/rooms/${room.id}/edit`}>แก้ไข</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

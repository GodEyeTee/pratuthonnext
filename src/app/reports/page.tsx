// Server Component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>รายงานสรุป (ตัวอย่าง)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>อัตราเข้าพักรายสัปดาห์</li>
            <li>รายได้จากร้านค้า</li>
            <li>สถานะการซ่อมบำรุง</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

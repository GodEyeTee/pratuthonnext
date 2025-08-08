import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { createClient } from '@/lib/supabase/server';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('number');
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">ว่าง</Badge>;
      case 'occupied':
        return <Badge variant="warning">มีผู้เช่า</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">ซ่อมบำรุง</Badge>;
      case 'reserved':
        return <Badge variant="info">จองแล้ว</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'standard':
        return <Badge variant="outline">มาตรฐาน</Badge>;
      case 'deluxe':
        return <Badge variant="outline">ดีลักซ์</Badge>;
      case 'suite':
        return <Badge variant="outline">สวีท</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการห้องพัก</h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลห้องพัก อัตราค่าเช่า และสถานะ
          </p>
        </div>
        <Button asChild>
          <Link href="/rooms/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มห้องพัก
          </Link>
        </Button>
      </div>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ห้องทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rooms?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ห้องว่าง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {rooms?.filter(r => r.status === 'available').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ห้องที่มีผู้เช่า
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {rooms?.filter(r => r.status === 'occupied').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ซ่อมบำรุง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {rooms?.filter(r => r.status === 'maintenance').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการห้องพัก</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หมายเลข</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ชั้น</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">ราคารายวัน</TableHead>
                <TableHead className="text-right">ราคารายเดือน</TableHead>
                <TableHead className="text-right">ค่าน้ำ/หน่วย</TableHead>
                <TableHead className="text-right">ค่าไฟ/หน่วย</TableHead>
                <TableHead className="text-center">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms && rooms.length > 0 ? (
                rooms.map(room => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.number}</TableCell>
                    <TableCell>{getTypeBadge(room.type)}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{getStatusBadge(room.status)}</TableCell>
                    <TableCell className="text-right">
                      ฿{room.rate_daily.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{room.rate_monthly.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{room.water_rate}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{room.electric_rate}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/rooms/${room.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/rooms/${room.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    ยังไม่มีข้อมูลห้องพัก
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

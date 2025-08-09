import DashboardLayout from '@/components/layout/DashboardLayout';
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
import {
  Calendar,
  Edit,
  Eye,
  Home,
  Plus,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
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

  const stats = [
    {
      label: 'ห้องทั้งหมด',
      value: rooms?.length || 0,
      icon: Home,
      color: 'from-blue-400 to-blue-600',
    },
    {
      label: 'ห้องว่าง',
      value: rooms?.filter(r => r.status === 'available').length || 0,
      icon: Users,
      color: 'from-green-400 to-green-600',
    },
    {
      label: 'ห้องที่มีผู้เช่า',
      value: rooms?.filter(r => r.status === 'occupied').length || 0,
      icon: Calendar,
      color: 'from-orange-400 to-orange-600',
    },
    {
      label: 'ซ่อมบำรุง',
      value: rooms?.filter(r => r.status === 'maintenance').length || 0,
      icon: Wrench,
      color: 'from-red-400 to-red-600',
    },
  ];

  return (
    <DashboardLayout
      title="Room Management"
      subtitle="จัดการข้อมูลห้องพัก อัตราค่าเช่า และสถานะ"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rooms Table */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>รายการห้องพัก</CardTitle>
            <Button asChild>
              <Link href="/rooms/new">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มห้องพัก
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
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
                      <TableRow key={room.id} className="dark:border-gray-700">
                        <TableCell className="font-medium">
                          {room.number}
                        </TableCell>
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
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="dark:border-gray-700">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

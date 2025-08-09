import AddRoomModal from '@/app/rooms/AddRoomModal';
import RoomActions from '@/app/rooms/RoomActions';
import RoomsToolbar from '@/app/rooms/Toolbar';
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
import { Calendar, Edit, Home, Users, Wrench } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

type SearchParams = {
  q?: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
  type?: 'standard' | 'deluxe' | 'suite';
  floor?: string;
  page?: string;
};

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations('rooms');
  const locale = await getLocale();
  const supabase = await createClient();
  const sp = await searchParams;

  const q = (sp.q ?? '').trim();
  const status = sp.status;
  const type = sp.type;
  const floor = sp.floor ? Number(sp.floor) : undefined;
  const page = Math.max(1, Number(sp.page || 1));
  const pageSize = 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('rooms').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (!Number.isNaN(floor as number) && typeof floor === 'number')
    query = query.eq('floor', floor);
  if (q) query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);

  const { data: rooms, count } = await query
    .order('number', { ascending: true })
    .range(from, to);

  const [
    { count: totalAll },
    { count: totalAvail },
    { count: totalOcc },
    { count: totalMaint },
  ] = await Promise.all([
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available'),
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'occupied'),
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'maintenance'),
  ]);

  const stats = [
    {
      label: t('title'),
      value: totalAll || 0,
      icon: Home,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: t('available'),
      value: totalAvail || 0,
      icon: Users,
      color: 'from-green-500 to-green-600',
    },
    {
      label: t('occupied'),
      value: totalOcc || 0,
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
    },
    {
      label: t('maintenance'),
      value: totalMaint || 0,
      icon: Wrench,
      color: 'from-red-500 to-red-600',
    },
  ];

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusBadge = (s: string) => {
    switch (s) {
      case 'available':
        return <Badge variant="success">{t('available')}</Badge>;
      case 'occupied':
        return <Badge variant="warning">{t('occupied')}</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">{t('maintenance')}</Badge>;
      case 'reserved':
        return (
          <Badge variant="info">
            {locale === 'th' ? 'จองแล้ว' : 'Reserved'}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{s}</Badge>;
    }
  };

  const typeBadge = (tp: string) => {
    switch (tp) {
      case 'standard':
        return <Badge variant="outline">standard</Badge>;
      case 'deluxe':
        return <Badge variant="outline">deluxe</Badge>;
      case 'suite':
        return <Badge variant="outline">suite</Badge>;
      default:
        return <Badge variant="outline">{tp}</Badge>;
    }
  };

  return (
    <DashboardLayout title={t('title')} subtitle={t('roomList')}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card
              key={i}
              className="bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-semibold mt-2">{stat.value}</p>
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

        {/* Toolbar */}
        <RoomsToolbar />

        {/* Table */}
        <Card className="bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('roomList')}</CardTitle>
            {/* ใช้ป็อปอัปแทนการลิงก์ */}
            <AddRoomModal />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-800">
                    <TableHead>{t('roomNumber')}</TableHead>
                    <TableHead>{t('roomType')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">
                      {t('dailyRate')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('monthlyRate')}
                    </TableHead>
                    <TableHead className="text-right">น้ำ/หน่วย</TableHead>
                    <TableHead className="text-right">ไฟ/หน่วย</TableHead>
                    <TableHead className="text-center" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rooms?.length ?? 0) > 0 ? (
                    rooms!.map(room => (
                      <TableRow key={room.id} className="dark:border-gray-800">
                        <TableCell className="font-medium">
                          {room.number}
                        </TableCell>
                        <TableCell>{typeBadge(room.type)}</TableCell>
                        <TableCell>{statusBadge(room.status)}</TableCell>
                        <TableCell className="text-right">
                          ฿{Number(room.rate_daily).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{Number(room.rate_monthly).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{Number(room.water_rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{Number(room.electric_rate)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              title="Edit"
                            >
                              <Link href={`/rooms/${room.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <RoomActions id={room.id} number={room.number} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="dark:border-gray-800">
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        {locale === 'th'
                          ? 'ยังไม่มีข้อมูลห้องพัก'
                          : 'No rooms yet'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                searchParams={sp}
                page={page}
                total={total}
                pageSize={pageSize}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Pagination({
  searchParams,
  page,
  total,
  pageSize,
}: {
  searchParams: Record<string, any>;
  page: number;
  total: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {from + 1}-{Math.min(to + 1, total)} / {total}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={{
            pathname: '/rooms',
            query: { ...searchParams, page: Math.max(1, page - 1) },
          }}
          className="px-3 py-1.5 rounded-md border hover:bg-accent/60 aria-disabled:opacity-50"
          aria-disabled={page === 1}
        >
          ‹ Prev
        </Link>
        <Link
          href={{
            pathname: '/rooms',
            query: { ...searchParams, page: Math.min(totalPages, page + 1) },
          }}
          className="px-3 py-1.5 rounded-md border hover:bg-accent/60 aria-disabled:opacity-50"
          aria-disabled={page === totalPages}
        >
          Next ›
        </Link>
      </div>
    </div>
  );
}

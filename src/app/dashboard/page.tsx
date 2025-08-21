// src/app/dashboard/page.tsx
// Server Component
import DayOverviewCard from '@/components/widgets/DayOverviewCard';
import WeatherCard from '@/components/widgets/WeatherCard';
import { getCurrentSession } from '@/lib/auth.server';
import { Activity, CalendarDays, Hotel, Users } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getCurrentSession();

  // ยังไม่ได้ล็อกอิน
  if (!session) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          You are not signed in{' '}
          <a href="/login" className="text-blue-600 underline">
            Login
          </a>
        </p>
      </div>
    );
  }

  // ถ้าเป็นผู้ใช้ทั่วไป -> ไปหน้าแดชบอร์ดของตนเอง
  if (session.role === 'user') {
    redirect('/dashboard/user'); // ใช้ redirect ใน server component ตามแนวทาง App Router
  }

  // ----- เนื้อหาแดชบอร์ดปกติ (admin/support) ด้านล่างเท่าเดิม -----
  const stats = [
    {
      label: 'Total Rooms',
      value: '24',
      icon: Hotel,
      color: 'from-blue-500 to-blue-600',
      trend: '+2%',
    },
    {
      label: 'Occupied',
      value: '18',
      icon: Users,
      color: 'from-green-500 to-green-600',
      trend: '+5%',
    },
    {
      label: 'Vacant',
      value: '6',
      icon: Activity,
      color: 'from-amber-500 to-amber-600',
      trend: '-3%',
    },
    {
      label: 'Check-ins Today',
      value: '5',
      icon: CalendarDays,
      color: 'from-violet-500 to-violet-600',
      trend: '+1',
    },
  ];

  const week = [
    { day: 'Mon', value: 72 },
    { day: 'Tue', value: 75 },
    { day: 'Wed', value: 78 },
    { day: 'Thu', value: 80 },
    { day: 'Fri', value: 83 },
    { day: 'Sat', value: 85 },
    { day: 'Sun', value: 79 },
  ];

  const maintenance = [
    { room: 'A-203', title: 'Aircon not cooling', priority: 'High' },
    { room: 'B-105', title: 'Leaking faucet', priority: 'Medium' },
    { room: 'C-310', title: 'Broken wardrobe hinge', priority: 'Low' },
  ];

  const upcoming = [
    { date: 'Today', name: 'P. Phon', room: 'A-108', type: 'Check-in' },
    { date: 'Tomorrow', name: 'N. Suda', room: 'B-204', type: 'Check-in' },
    { date: 'Aug 12', name: 'J. Arun', room: 'C-101', type: 'Check-out' },
  ];

  const todos = [
    {
      text: 'Review maintenance ticket • A-203 (Aircon)',
      color: 'bg-rose-500',
    },
    { text: 'Confirm today check-ins with FO team', color: 'bg-emerald-500' },
    { text: 'Update weekly occupancy note', color: 'bg-sky-500' },
  ];

  const eventColorByType: Record<string, string> = {
    'Check-in': 'bg-emerald-500',
    'Check-out': 'bg-amber-500',
  };

  const events = upcoming.map(u => ({
    text: `${u.type}: ${u.name} • Room ${u.room} (${u.date})`,
    color: eventColorByType[u.type] ?? 'bg-amber-500',
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {session.email ?? 'User'}
        </p>
      </div>

      {/* Weather + Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Weather — Ratchaburi (TH) */}
        <div className="xl:col-span-2">
          <WeatherCard
            title="Today • Thailand"
            locationName="Ratchaburi"
            latitude={13.525}
            longitude={99.828}
            timezone="Asia/Bangkok"
            days={7}
            revalidateSeconds={1800}
          />
        </div>

        {/* Stats */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800 hover:shadow-lg transition-all"
            >
              <div className="p-6 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-semibold mt-2 text-foreground">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-xs font-medium ${
                          String(stat.trend).startsWith('+')
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl p-3 bg-gradient-to-br from-muted to-background">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day overview */}
      <DayOverviewCard todos={todos} events={events} />
    </div>
  );
}

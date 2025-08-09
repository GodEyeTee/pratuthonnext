'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Activity, CalendarDays, Hotel, Users, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      </DashboardLayout>
    );
  }

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
      label: 'Check‑ins Today',
      value: '5',
      icon: CalendarDays,
      color: 'from-violet-500 to-violet-600',
      trend: '+1',
    },
  ];

  // Weekly (แสดงอาทิตย์) occupancy % for Mon–Sun
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
    { date: 'Today', name: 'P. Phon', room: 'A-108', type: 'Check‑in' },
    { date: 'Tomorrow', name: 'N. Suda', room: 'B-204', type: 'Check‑in' },
    { date: 'Aug 12', name: 'J. Arun', room: 'C-101', type: 'Check‑out' },
  ];

  return (
    <DashboardLayout title="Rooms" subtitle="Manage and monitor your rooms">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card
              key={i}
              className="hover:shadow-lg transition-all bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800"
            >
              <CardContent className="p-6 pt-4">
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
                        className={`text-xs font-medium ${String(stat.trend).startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {stat.trend}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        vs last week
                      </span>
                    </div>
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

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Occupancy */}
          <Card className="lg:col-span-2 bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-3">
                {week.map(d => (
                  <div key={d.day} className="flex flex-col items-center">
                    <div className="h-28 w-full rounded-md bg-muted overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400"
                        style={{ height: `${d.value}%` }}
                      />
                    </div>
                    <span className="mt-2 text-xs text-muted-foreground">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Occupancy percentage by day (Mon–Sun).
              </p>
            </CardContent>
          </Card>

          {/* Open Maintenance (replaces Energy Monitors) */}
          <Card className="bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">
                Open Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenance.map((m, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground leading-tight">
                          {m.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Room {m.room} • {m.priority} priority
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming section (replaces Solar Batteries list) */}
        <Card className="bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {upcoming.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground leading-tight">
                        {u.type} — {u.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.date} • Room {u.room}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

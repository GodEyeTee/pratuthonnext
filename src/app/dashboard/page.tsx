'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Activity, Battery, Sun, Zap } from 'lucide-react';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: 'Total Devices',
      value: '24',
      icon: Battery,
      color: 'from-blue-400 to-blue-600',
      trend: '+12%',
    },
    {
      label: 'Active Now',
      value: '18',
      icon: Activity,
      color: 'from-green-400 to-green-600',
      trend: '+8%',
    },
    {
      label: 'Energy Today',
      value: '45.2 kWh',
      icon: Zap,
      color: 'from-purple-400 to-purple-600',
      trend: '-3%',
    },
    {
      label: 'Solar Production',
      value: '32.8 kWh',
      icon: Sun,
      color: 'from-orange-400 to-orange-600',
      trend: '+15%',
    },
  ];

  return (
    <DashboardLayout title="Devices" subtitle="Manage and monitor your devices">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-all dark:bg-gray-800 dark:border-gray-700"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-xs font-medium ${
                          stat.trend.startsWith('+')
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {stat.trend}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        from last month
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Solar Batteries */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Solar Batteries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  'Stackable LiFePO4 Battery',
                  'Stack All in One',
                  'Wall Mounted All in One',
                ].map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-accent/50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <Battery className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          SL2V 100AH
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{85 + i * 5}%</p>
                      <p className="text-xs text-muted-foreground">Charged</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Energy Monitors */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Energy Monitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Owl Intuition-e Online', 'Efergy E-max XL Kit'].map(
                  (name, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-accent/50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-orange-500" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            MAX {i === 0 ? '100' : '200'} AMP, 90-600
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

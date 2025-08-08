'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { CreditCard, Home, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Profile {
  display_name: string | null;
  role: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUser(user);

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error?.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                email: user.email,
                display_name: user.email,
                role: 'user',
              },
            ])
            .select()
            .single();
          setProfile(newProfile);
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>กรุณาเข้าสู่ระบบ</p>
      </div>
    );

  const stats = [
    { label: 'ห้องทั้งหมด', value: '24', icon: Home, color: 'blue' },
    { label: 'ห้องที่ถูกเช่า', value: '18', icon: Users, color: 'green' },
    {
      label: 'รายได้เดือนนี้',
      value: '฿45,280',
      icon: CreditCard,
      color: 'purple',
    },
    { label: 'อัตราการเช่า', value: '75%', icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            สวัสดี, {profile?.display_name || user.email}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            ยินดีต้อนรับกลับสู่ระบบจัดการหอพัก
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(item => (
                  <div
                    key={item}
                    className="flex items-center space-x-4 p-4 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        ห้อง {100 + item} ได้รับการจองแล้ว
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item} ชั่วโมงที่แล้ว
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลผู้ใช้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">อีเมล</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">บทบาท</span>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full bg-${
                    profile?.role === 'admin'
                      ? 'red'
                      : profile?.role === 'support'
                        ? 'blue'
                        : 'green'
                  }-500/10 text-${
                    profile?.role === 'admin'
                      ? 'red'
                      : profile?.role === 'support'
                        ? 'blue'
                        : 'green'
                  }-600`}
                >
                  {profile?.role || 'user'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">
                  สมาชิกตั้งแต่
                </span>
                <span className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

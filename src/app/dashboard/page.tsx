// app/dashboard/page.tsx หรือ components/Dashboard.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { User } from '@supabase/supabase-js';

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
        // 1. Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // 2. Get profile with role
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // ถ้าไม่มี profile ให้สร้างใหม่
          if (error.code === 'PGRST116') {
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  display_name: user.email,
                  role: 'user', // default role
                },
              ])
              .select()
              .single();

            setProfile(newProfile);
          }
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
    return <div className="container py-6">กำลังโหลด...</div>;

  if (!user) return <div className="container py-6">กรุณาเข้าสู่ระบบ</div>;

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">
        ยินดีต้อนรับ, {profile?.display_name || user.email}!
      </h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>ข้อมูลผู้ใช้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Email: {user.email}</p>
          <p>
            Role: <span className="font-bold">{profile?.role || 'user'}</span>
          </p>
          <p>
            สมาชิกตั้งแต่: {new Date(user.created_at).toLocaleDateString('th-TH')}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ไม่มีสิทธิ์เข้าถึง</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={
                profile?.role === 'admin' ? 'text-green-600' : 'text-muted-foreground'
              }
            >
              คุณ{profile?.role === 'admin' ? 'มี' : 'ไม่มี'}สิทธิ์เข้าถึงส่วนนี้
              (ต้องการสิทธิ์: admin)
            </p>
            {profile?.role === 'admin' && (
              <Button className="mt-4">กลับหน้าแรก</Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ไม่มีสิทธิ์เข้าถึง</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={
                ['admin', 'support'].includes(profile?.role || '')
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }
            >
              คุณ{['admin', 'support'].includes(profile?.role || '') ? 'มี' : 'ไม่มี'}สิทธิ์เข้าถึงส่วนนี้
              (ต้องการสิทธิ์: admin, support)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ไม่มีสิทธิ์เข้าถึง</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={
                profile?.role === 'admin' ? 'text-green-600' : 'text-muted-foreground'
              }
            >
              คุณ{profile?.role === 'admin' ? 'มี' : 'ไม่มี'}สิทธิ์เข้าถึงส่วนนี้
              (ต้องการสิทธิ์: admin)
            </p>
          </CardContent>
        </Card>
      </div>

      {profile?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-2">
            <Button>จัดการผู้ใช้</Button>
            <Button variant="secondary">ดูรายงาน</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

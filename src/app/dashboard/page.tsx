// app/dashboard/page.tsx หรือ components/Dashboard.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
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

  if (loading) return <div>กำลังโหลด...</div>;

  if (!user) return <div>กรุณาเข้าสู่ระบบ</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        ยินดีต้อนรับ, {profile?.display_name || user.email}!
      </h1>

      <div className="mb-4">
        <p>Email: {user.email}</p>
        <p>
          Role: <span className="font-bold">{profile?.role || 'user'}</span>
        </p>
        <p>
          สมาชิกตั้งแต่: {new Date(user.created_at).toLocaleDateString('th-TH')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
          <p
            className={
              profile?.role === 'admin' ? 'text-green-500' : 'text-gray-500'
            }
          >
            คุณ{profile?.role === 'admin' ? 'มี' : 'ไม่มี'}สิทธิ์เข้าถึงส่วนนี้
            (ต้องการสิทธิ์: admin)
          </p>
          {profile?.role === 'admin' && (
            <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
              กลับหน้าแรก
            </button>
          )}
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
          <p
            className={
              ['admin', 'support'].includes(profile?.role)
                ? 'text-green-500'
                : 'text-gray-500'
            }
          >
            คุณ{['admin', 'support'].includes(profile?.role) ? 'มี' : 'ไม่มี'}
            สิทธิ์เข้าถึงส่วนนี้ (ต้องการสิทธิ์: admin, support)
          </p>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
          <p
            className={
              profile?.role === 'admin' ? 'text-green-500' : 'text-gray-500'
            }
          >
            คุณ{profile?.role === 'admin' ? 'มี' : 'ไม่มี'}สิทธิ์เข้าถึงส่วนนี้
            (ต้องการสิทธิ์: admin)
          </p>
        </div>
      </div>

      {/* Admin Panel - แสดงเฉพาะ admin */}
      {profile?.role === 'admin' && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
            จัดการผู้ใช้
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded">
            ดูรายงาน
          </button>
        </div>
      )}
    </div>
  );
}

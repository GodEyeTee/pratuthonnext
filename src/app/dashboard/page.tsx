import LogoutButton from '@/components/LogoutButton';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-700">
                {user.user_metadata?.full_name || user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ยินดีต้อนรับสู่ระบบ!
              </h2>
              <p className="text-gray-600 mb-4">
                คุณได้ล็อกอินเข้าสู่ระบบเรียบร้อยแล้ว
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ข้อมูลผู้ใช้:
                </h3>
                <div className="text-left text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>อีเมล:</strong> {user.email}
                  </p>
                  <p>
                    <strong>ชื่อ:</strong>{' '}
                    {user.user_metadata?.full_name || 'ไม่ระบุ'}
                  </p>
                  <p>
                    <strong>ID:</strong> {user.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ความปลอดภัย
                  </h3>
                  <p className="text-gray-600 text-sm">
                    ระบบของเราใช้ Supabase ในการจัดการการยืนยันตัวตน
                    ทำให้ข้อมูลของคุณปลอดภัย
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ประสิทธิภาพ
                  </h3>
                  <p className="text-gray-600 text-sm">
                    ใช้ Next.js 15 ที่ทำงานได้เร็วและมีประสิทธิภาพสูง
                    พร้อมรองรับผู้ใช้จำนวนมาก
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ติดตามข้อผิดพลาด
                  </h3>
                  <p className="text-gray-600 text-sm">
                    ระบบติดตามข้อผิดพลาดด้วย Sentry
                    เพื่อให้แน่ใจว่าระบบทำงานได้อย่างราบรื่น
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

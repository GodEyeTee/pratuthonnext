import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center items-center min-h-screen py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ยินดีต้อนรับสู่ระบบของเรา
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              ระบบจัดการผู้ใช้งานที่ปลอดภัยและใช้งานง่าย
            </p>
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                เริ่มต้นใช้งาน
              </h2>
              <p className="text-gray-600 mb-6">
                ล็อกอินเข้าสู่ระบบเพื่อเข้าถึง Dashboard และใช้งานฟีเจอร์ต่างๆ
              </p>
              <Link
                href="/login"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium inline-block"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

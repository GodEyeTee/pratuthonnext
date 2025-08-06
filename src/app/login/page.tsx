import GoogleButton from '@/components/GoogleButton';
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ล็อกอินเข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ใช้บัญชี Google เพื่อเข้าสู่ระบบ
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <GoogleButton />
        </div>
      </div>
    </div>
  );
}

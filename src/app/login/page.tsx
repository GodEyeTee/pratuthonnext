'use client';

import GoogleButton from '@/components/GoogleButton';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // เช็ค error parameter จาก URL
    const errorParam = searchParams?.get('error');
    if (errorParam === 'auth_callback_error') {
      setError('เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองใหม่อีกครั้ง');
    }
  }, [searchParams]);

  const handleLoginError = (errorMessage: string) => {
    console.error('Login error:', errorMessage);
    setError(errorMessage);
  };

  const handleLoginSuccess = () => {
    setError(null);
    console.log('Login initiated successfully');
  };

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
          <GoogleButton
            onError={handleLoginError}
            onSuccess={handleLoginSuccess}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  เกิดข้อผิดพลาดในการล็อกอิน
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-sm text-red-600 underline hover:no-underline"
                >
                  ปิดข้อความนี้
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            หากพบปัญหาในการล็อกอิน กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useErrorHandler } from '@/components/ErrorBoundary';
import { signInWithGoogle } from '@/lib/auth-utils';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

interface GoogleButtonProps {
  redirectTo?: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleButton({
  redirectTo,
  disabled = false,
  className = '',
  onSuccess,
  onError,
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleError = useErrorHandler();

  const handleGoogleLogin = async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle(redirectTo);

      if (result.error) {
        setError(result.error);
        onError?.(result.error);
        return;
      }

      // Success callback
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง';

      setError(errorMessage);
      onError?.(errorMessage);
      handleError(error, { context: 'GoogleButton' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGoogleLogin}
        disabled={loading || disabled}
        className={`
          flex items-center justify-center w-full px-4 py-3 text-sm font-medium 
          text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm 
          hover:bg-gray-50 hover:border-gray-400 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
          transition-all duration-200
          ${className}
        `}
        aria-label={loading ? 'กำลังล็อกอิน...' : 'ล็อกอินด้วย Google'}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 mr-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span>กำลังล็อกอิน...</span>
          </>
        ) : (
          <>
            <FcGoogle className="w-5 h-5 mr-3" />
            <span>ล็อกอินด้วย Google</span>
          </>
        )}
      </button>

      {/* ✅ Error display */}
      {error && (
        <div
          className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-4 h-4 text-red-400 mt-0.5"
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
            <div className="ml-2">
              <h3 className="font-medium">ไม่สามารถล็อกอินได้</h3>
              <p className="mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs underline hover:no-underline"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Help text */}
      <p className="text-xs text-gray-500 text-center">
        การล็อกอินแสดงว่าคุณยอมรับ{' '}
        <a href="/terms" className="underline hover:no-underline">
          เงื่อนไขการใช้งาน
        </a>{' '}
        และ{' '}
        <a href="/privacy" className="underline hover:no-underline">
          นโยบายความเป็นส่วนตัว
        </a>
      </p>
    </div>
  );
}

/**
 * Compact version for navigation or small spaces
 */
export function GoogleButtonCompact({
  redirectTo,
  disabled = false,
  onSuccess,
  onError,
}: Omit<GoogleButtonProps, 'className'>) {
  const [loading, setLoading] = useState(false);
  const handleError = useErrorHandler();

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      const result = await signInWithGoogle(redirectTo);
      if (result.error) {
        onError?.(result.error);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      handleError(err as Error);
      onError?.('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      title="ล็อกอินด้วย Google"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      ) : (
        <FcGoogle className="w-4 h-4" />
      )}
      <span className="ml-2 hidden sm:inline">Google</span>
    </button>
  );
}

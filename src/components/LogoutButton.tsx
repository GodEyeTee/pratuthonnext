'use client';

import { signOut } from '@/lib/auth-client';
import { captureError } from '@/lib/sentry-utils';
import { useState } from 'react';

interface LogoutButtonProps {
  variant?: 'default' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  confirmRequired?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function LogoutButton({
  variant = 'danger',
  size = 'md',
  className = '',
  showIcon = false,
  confirmRequired = false,
  onSuccess,
  onError,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (loading) return;

    // Show confirmation dialog if required
    if (confirmRequired && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);
    setShowConfirm(false);

    try {
      const result = await signOut();

      if (result.error) {
        setError(result.error);
        onError?.(result.error);
        return;
      }

      // Success callback
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage = 'เกิดข้อผิดพลาดในการออกจากระบบ';

      setError(errorMessage);
      onError?.(errorMessage);
      captureError(error, { context: 'LogoutButton' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setError(null);
  };

  // ✅ Button variants
  const variants = {
    default: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline:
      'border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500',
    ghost: 'text-red-700 hover:bg-red-50 focus:ring-red-500',
  };

  // ✅ Button sizes
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const baseClasses = `
    inline-flex items-center font-medium rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  // ✅ Confirmation dialog
  if (showConfirm) {
    return (
      <div className="inline-flex flex-col space-y-2">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800 mb-3">
            คุณแน่ใจหรือไม่ที่ต้องการออกจากระบบ?
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'กำลังออก...' : 'ใช่, ออกจากระบบ'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col space-y-2">
      <button
        onClick={handleLogout}
        disabled={loading}
        className={baseClasses}
        aria-label={loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
      >
        {loading && (
          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin opacity-75"></div>
        )}

        {showIcon && !loading && (
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        )}

        <span>{loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
      </button>

      {/* ✅ Error display */}
      {error && (
        <div
          className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md max-w-xs"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
              aria-label="ปิดข้อความแสดงข้อผิดพลาด"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

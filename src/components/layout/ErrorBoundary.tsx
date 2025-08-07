'use client';

import * as Sentry from '@sentry/nextjs';
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Error Boundary Component for catching React errors
 * Clean Architecture - Presentation Layer
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to Sentry if available
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          errorBoundary: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-gray-600 mb-6">
            ขออภัยในความไม่สะดวก เกิดข้อผิดพลาดที่ไม่คาดคิดขณะใช้งาน
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 text-left">
              <h3 className="font-semibold text-red-800 mb-2">
                Error Details:
              </h3>
              <pre className="text-xs text-red-700 whitespace-pre-wrap">
                {error.message}
              </pre>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={retry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              ลองใหม่
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              รีโหลดหน้า
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for handling async errors
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Async error caught:', error, errorInfo);

    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: errorInfo,
      });
    }
  };
}

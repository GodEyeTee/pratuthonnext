'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
}

export interface ToastOptions {
  type?: ToastType;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
}

// Toast Context Types
interface ToastContextType {
  toasts: Toast[];
  toast: (title: string, options?: ToastOptions) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// Create Toast Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Default toast duration (5 seconds)
const DEFAULT_DURATION = 5000;

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add toast
  const addToast = useCallback((title: string, options: ToastOptions = {}): string => {
    const id = generateId();
    const toast: Toast = {
      id,
      type: options.type || 'info',
      title,
      description: options.description,
      action: options.action,
      duration: options.duration ?? DEFAULT_DURATION,
      persistent: options.persistent || false,
    };

    setToasts(prev => [...prev, toast]);

    // Auto dismiss after duration (unless persistent)
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, toast.duration);
    }

    return id;
  }, []);

  // Dismiss toast
  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, description?: string) => {
    return addToast(title, { type: 'success', description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast(title, { type: 'error', description, duration: 7000 }); // Longer duration for errors
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast(title, { type: 'warning', description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast(title, { type: 'info', description });
  }, [addToast]);

  const value: ToastContextType = {
    toasts,
    toast: addToast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// useToast Hook
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Container Component
function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

// Toast Item Component
interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const getToastStyles = (type: ToastType) => {
    const baseStyles = 'pointer-events-auto bg-white border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out';
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-200 bg-green-50`;
      case 'error':
        return `${baseStyles} border-red-200 bg-red-50`;
      case 'warning':
        return `${baseStyles} border-yellow-200 bg-yellow-50`;
      case 'info':
      default:
        return `${baseStyles} border-blue-200 bg-blue-50`;
    }
  };

  const getIconColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
  };

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
      default:
        return 'text-blue-900';
    }
  };

  const getIcon = (type: ToastType) => {
    const iconClass = `w-5 h-5 ${getIconColor(type)}`;
    
    switch (type) {
      case 'success':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={getToastStyles(toast.type)}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon(toast.type)}
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className={`text-sm font-medium ${getTextColor(toast.type)}`}>
            {toast.title}
          </h4>
          
          {toast.description && (
            <p className={`mt-1 text-sm ${getTextColor(toast.type)} opacity-90`}>
              {toast.description}
            </p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`mt-2 text-sm font-medium ${getTextColor(toast.type)} underline hover:no-underline`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onDismiss}
            className={`inline-flex rounded-md ${getTextColor(toast.type)} opacity-50 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
          >
            <span className="sr-only">ปิด</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility hook for common toast patterns
export function useNotifications() {
  const { success, error, warning, info } = useToast();

  return {
    // Auth notifications
    signInSuccess: () => success('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับกลับมา'),
    signOutSuccess: () => success('ออกจากระบบสำเร็จ', 'ขอบคุณที่ใช้บริการ'),
    authError: (message: string) => error('ไม่สามารถเข้าสู่ระบบได้', message),
    
    // CRUD notifications
    createSuccess: (item: string) => success(`สร้าง${item}สำเร็จ`),
    updateSuccess: (item: string) => success(`อัปเดต${item}สำเร็จ`),
    deleteSuccess: (item: string) => success(`ลบ${item}สำเร็จ`),
    createError: (item: string) => error(`ไม่สามารถสร้าง${item}ได้`),
    updateError: (item: string) => error(`ไม่สามารถอัปเดต${item}ได้`),
    deleteError: (item: string) => error(`ไม่สามารถลบ${item}ได้`),
    
    // Permission notifications
    accessDenied: () => warning('ไม่มีสิทธิ์เข้าถึง', 'คุณไม่มีสิทธิ์ในการดำเนินการนี้'),
    roleChanged: (newRole: string) => success('เปลี่ยนบทบาทสำเร็จ', `บทบาทใหม่: ${newRole}`),
    
    // Generic notifications
    success,
    error,
    warning,
    info,
  };
}
'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  size?: ModalSize; // ขนาดกล่อง
  closeOnEsc?: boolean; // ปิดด้วย ESC (default: true)
  closeOnBackdrop?: boolean; // ปิดเมื่อคลิกพื้นหลัง (default: true)
  initialFocusRef?: React.RefObject<HTMLElement>;
  footer?: React.ReactNode; // ปุ่ม/แอคชันส่วนท้าย
  className?: string;
}

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ');
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true,
  initialFocusRef,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    // เก็บโฟกัสก่อนเปิด
    lastFocusedRef.current = document.activeElement as HTMLElement | null;

    // ล็อกสกอร์ล
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // โฟกัส element แรก
    const toFocus =
      initialFocusRef?.current ??
      (modalRef.current?.querySelector<HTMLElement>(
        '[data-autofocus="true"]'
      ) ||
        modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ));

    // ป้องกัน null
    if (toFocus && typeof toFocus.focus === 'function') {
      toFocus.focus();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      // คืนโฟกัส
      if (
        lastFocusedRef.current &&
        typeof lastFocusedRef.current.focus === 'function'
      ) {
        lastFocusedRef.current.focus();
      }
    };
  }, [open, initialFocusRef]);

  // ปิดด้วย ESC
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, onClose]);

  // Focus trap แบบปลอดภัย
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;
    const focusable = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled'));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) return; // กัน undefined

    const isShift = e.shiftKey;
    const active = document.activeElement as HTMLElement | null;

    if (isShift && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!isShift && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onKeyDown={onKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => closeOnBackdrop && onClose()}
      />

      {/* Panel */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full',
          sizeClass[size],
          'rounded-2xl border bg-white text-slate-900 shadow-2xl ring-1 ring-black/5',
          'dark:bg-gray-900 dark:text-slate-100 dark:border-gray-800',
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start gap-3 border-b px-5 py-4 dark:border-gray-800">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-base font-semibold leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              )}
            </div>
            <Button
              aria-label="Close"
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-autofocus="true"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </div>
        )}

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t px-5 py-3 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import RoomForm from './RoomForm';

export default function AddRoomModal({
  triggerClassName,
  triggerLabel,
}: {
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const t = useTranslations('rooms');
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function onClickOverlay(e: React.MouseEvent) {
    // close when clicking outside dialog
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className={triggerClassName}>
        <Plus className="mr-2 h-4 w-4" />
        {triggerLabel ?? t('addRoom')}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          onMouseDown={onClickOverlay}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            ref={dialogRef}
            className={cn(
              'relative z-10 w-full max-w-2xl',
              'rounded-2xl border bg-background text-foreground shadow-xl',
              'dark:border-gray-800'
            )}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-800">
              <h3 className="text-lg font-semibold">{t('addRoom')}</h3>
              <button
                className="p-2 rounded-md hover:bg-accent/60"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content: ใช้ RoomForm เดิม (บันทึกเสร็จจะ push('/rooms') + refresh เอง ทำให้ modal ปิดเองจากการรีเฟรชคอมโพเนนต์) */}
            <div className="p-4 sm:p-6">
              <RoomForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

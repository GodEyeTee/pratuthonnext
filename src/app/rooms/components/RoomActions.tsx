// src/app/rooms/components/RoomActions.tsx
'use client';

import { deleteRoomAction } from '@/app/rooms/actions';
import { useLocale } from '@/hooks/useLocale';
import { Edit, EllipsisVertical, Trash } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

const translations = {
  en: {
    edit: 'Edit',
    delete: 'Delete',
    deleting: 'Deleting…',
    confirmDelete: 'Delete this room? This action cannot be undone.',
    failedDelete: 'Failed to delete',
  },
  th: {
    edit: 'แก้ไข',
    delete: 'ลบ',
    deleting: 'กำลังลบ…',
    confirmDelete: 'ต้องการลบห้องนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
    failedDelete: 'ไม่สามารถลบได้',
  },
};

type DeleteResp = { success: boolean; error?: string };

export default function RoomActions({
  id,
  editHref,
  onDeletedRedirect,
}: {
  id: string;
  editHref: string;
  onDeletedRedirect?: { pathname: string; query?: Record<string, any> };
}) {
  const { locale } = useLocale();
  const t = translations[locale as 'en' | 'th'] || translations.en;

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const onDelete = () => {
    if (!confirm(t.confirmDelete)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', id);
      const res = (await deleteRoomAction(fd)) as DeleteResp;
      if (!res.success) {
        alert(res.error || t.failedDelete);
      } else if (onDeletedRedirect) {
        const q = new URLSearchParams(
          onDeletedRedirect.query as any
        ).toString();
        window.location.href = q
          ? `${onDeletedRedirect.pathname}?${q}`
          : onDeletedRedirect.pathname;
      } else {
        window.location.reload();
      }
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-2 rounded-lg hover:bg-muted/60 dark:hover:bg-gray-700/60 transition-colors"
        aria-label="Actions"
        title="Actions"
        onClick={() => setOpen(v => !v)}
        disabled={pending}
      >
        <EllipsisVertical className="w-5 h-5 text-muted-foreground dark:text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border dark:border-gray-600 bg-popover dark:bg-gray-800 text-popover-foreground shadow-lg z-50">
          <div className="py-1">
            <Link
              href={editHref}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 dark:hover:bg-gray-700/60 rounded-t-xl transition-colors"
              onClick={() => setOpen(false)}
            >
              <Edit className="w-4 h-4" />
              {t.edit}
            </Link>
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-b-xl transition-colors"
              disabled={pending}
            >
              <Trash className="w-4 h-4" />
              {pending ? t.deleting : t.delete}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

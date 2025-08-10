// src/app/rooms/components/RoomActions.tsx
'use client';

import { deleteRoomAction } from '@/app/rooms/actions';
import { EllipsisVertical } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

export default function RoomActions({
  id,
  editHref,
  onDeletedRedirect,
}: {
  id: string;
  editHref: string;
  onDeletedRedirect?: { pathname: string; query?: Record<string, any> };
}) {
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
    if (!confirm('Delete this room? This action cannot be undone.')) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', id);
      const res = await deleteRoomAction(fd);
      if (res?.error) {
        alert(res.error);
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
        className="p-2 rounded-lg hover:bg-muted/60"
        aria-label="Actions"
        title="Actions"
        onClick={() => setOpen(v => !v)}
        disabled={pending}
      >
        <EllipsisVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border bg-popover text-popover-foreground shadow-lg z-20">
          <div className="py-1">
            <Link
              href={editHref}
              className="block px-3 py-2 text-sm hover:bg-muted/60 rounded-t-xl"
              onClick={() => setOpen(false)}
            >
              Edit
            </Link>
            <button
              onClick={onDelete}
              className="w-full text-left px-3 py-2 text-sm hover:bg-rose-500/10 text-rose-600 dark:text-rose-300 rounded-b-xl"
              disabled={pending}
            >
              {pending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

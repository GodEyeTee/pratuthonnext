'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function WeatherRefreshButton({
  tag,
  onRefreshStart,
  onRefreshEnd,
  className,
}: {
  tag: string;
  onRefreshStart?: () => void;
  onRefreshEnd?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [loading, startTransition] = React.useTransition();

  async function action(formData: FormData) {
    'use server';
    // เพื่อ enable server action ผ่าน prop เรา bind ใน WeatherCard แล้วเรียกที่นั่นแทน
  }

  return (
    <form
      action={async () => {}}
      onSubmit={e => {
        e.preventDefault();
      }}
    >
      <button
        type="button"
        aria-label="Refresh weather"
        disabled={loading}
        onClick={() => {
          onRefreshStart?.();
          startTransition(async () => {
            // เรียก endpoint server action ผ่านไฟล์ที่ bind จาก server component
            // เราจะส่ง function เข้ามาทาง props แทน (ดู WeatherCard)
          });
        }}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-sm transition-all
          ${loading ? 'opacity-60 cursor-wait' : 'hover:brightness-110 active:scale-95'}
          ${className ?? ''}`}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Updating…' : 'Refresh'}
      </button>
    </form>
  );
}

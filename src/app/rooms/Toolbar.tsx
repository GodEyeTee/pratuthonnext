'use client';

import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

// debounce เล็ก ๆ แทนการติดตั้งแพ็กเกจ
function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300
) {
  const fnRef = useRef(fn);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fn]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}

export default function RoomsToolbar() {
  const tRooms = useTranslations('rooms');
  const tCommon = useTranslations('common');

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key: string, value?: string) => {
    const p = new URLSearchParams(params.toString());
    if (value && value.length) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.push(`${pathname}?${p.toString()}`);
  };

  const onSearch = useDebouncedCallback((v: string) => setParam('q', v), 300);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <input
          defaultValue={params.get('q') ?? ''}
          onChange={e => onSearch(e.target.value)}
          placeholder={tCommon('search')}
          className="w-full sm:max-w-xs h-10 px-3 rounded-md border bg-background"
          aria-label="Search rooms"
        />
        <select
          className="h-10 px-3 rounded-md border bg-background"
          value={params.get('status') ?? ''}
          onChange={e => setParam('status', e.target.value || undefined)}
          aria-label="Filter by status"
        >
          <option value="">{tRooms('status')}</option>
          <option value="available">{tRooms('available')}</option>
          <option value="occupied">{tRooms('occupied')}</option>
          <option value="maintenance">{tRooms('maintenance')}</option>
          <option value="reserved">Reserved</option>
        </select>
        <select
          className="h-10 px-3 rounded-md border bg-background"
          value={params.get('type') ?? ''}
          onChange={e => setParam('type', e.target.value || undefined)}
          aria-label="Filter by type"
        >
          <option value="">{tRooms('roomType')}</option>
          <option value="standard">standard</option>
          <option value="deluxe">deluxe</option>
          <option value="suite">suite</option>
        </select>
      </div>

      <Button asChild>
        <Link href="/rooms/new">+ {tRooms('addRoom')}</Link>
      </Button>
    </div>
  );
}

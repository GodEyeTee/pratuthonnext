// src/app/rooms/Toolbar.tsx
'use client';

import AddRoomModal from '@/app/rooms/AddRoomModal';
import Link from 'next/link';
import { useMemo } from 'react';

type Query = {
  q?: string;
  status?: string;
  type?: string;
  floor?: string;
  page?: string;
  perPage?: string;
};

export default function RoomsToolbar({
  defaultQuery,
  total,
}: {
  defaultQuery?: Query;
  total?: number;
}) {
  const q = defaultQuery?.q ?? '';
  const perPage = defaultQuery?.perPage ?? '10';

  const filterHref = useMemo(
    () => ({ pathname: '/rooms', query: { ...defaultQuery, page: '1' } }),
    [defaultQuery]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: summary + actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total ? `${total} rooms` : '—'} • Page size
          <span className="ml-1 inline-flex items-center gap-1">
            <span className="rounded-md border px-2 py-1 text-foreground bg-background">
              {perPage}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl border hover:bg-muted/50">
            Import
          </button>
          <button className="px-3 py-2 rounded-xl border hover:bg-muted/50">
            Export
          </button>
          <AddRoomModal />
        </div>
      </div>

      {/* Filters row (GET form) */}
      <form className="flex flex-wrap items-center gap-2 bg-card/70 border rounded-2xl p-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search room number, type…"
          className="px-3 py-2 rounded-xl bg-background border focus:outline-none focus:ring-2 focus:ring-primary/40 w-[260px]"
        />

        {/* Quick filters (optional — เปลี่ยนค่าจริงตามต้องการได้) */}
        <select
          name="status"
          defaultValue={defaultQuery?.status ?? ''}
          className="px-3 py-2 rounded-xl bg-background border"
        >
          <option value="">All status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
        <select
          name="type"
          defaultValue={defaultQuery?.type ?? ''}
          className="px-3 py-2 rounded-xl bg-background border"
        >
          <option value="">All types</option>
          <option value="standard">Standard</option>
          <option value="deluxe">Deluxe</option>
          <option value="suite">Suite</option>
        </select>
        <input
          type="number"
          name="floor"
          min={1}
          placeholder="Floor"
          defaultValue={defaultQuery?.floor ?? ''}
          className="px-3 py-2 rounded-xl bg-background border w-24"
        />

        <input type="hidden" name="page" value="1" />
        <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[.98] transition">
          Apply
        </button>

        {(defaultQuery?.q ||
          defaultQuery?.status ||
          defaultQuery?.type ||
          defaultQuery?.floor) && (
          <Link
            href="/rooms"
            className="px-4 py-2 rounded-xl border hover:bg-muted/50 text-foreground"
          >
            Reset
          </Link>
        )}
      </form>
    </div>
  );
}

// src/app/rooms/Toolbar.tsx
'use client';

import AddRoomModal from '@/app/rooms/AddRoomModal';
import { useLocale } from '@/hooks/useLocale';
import { Download, Filter, Search, Upload } from 'lucide-react';
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

const translations = {
  en: {
    rooms: 'rooms',
    pageSize: 'Page size',
    import: 'Import',
    export: 'Export',
    search: 'Search room number, type…',
    allStatus: 'All status',
    available: 'Available',
    occupied: 'Occupied',
    maintenance: 'Maintenance',
    reserved: 'Reserved',
    allTypes: 'All types',
    standard: 'Standard',
    deluxe: 'Deluxe',
    suite: 'Suite',
    floor: 'Floor',
    apply: 'Apply',
    reset: 'Reset',
  },
  th: {
    rooms: 'ห้อง',
    pageSize: 'จำนวนต่อหน้า',
    import: 'นำเข้า',
    export: 'ส่งออก',
    search: 'ค้นหาเลขห้อง, ประเภท…',
    allStatus: 'สถานะทั้งหมด',
    available: 'ว่าง',
    occupied: 'มีผู้เช่า',
    maintenance: 'ปรับปรุง',
    reserved: 'จองแล้ว',
    allTypes: 'ประเภททั้งหมด',
    standard: 'มาตรฐาน',
    deluxe: 'ดีลักซ์',
    suite: 'สวีท',
    floor: 'ชั้น',
    apply: 'ค้นหา',
    reset: 'ล้าง',
  },
};

export default function RoomsToolbar({
  defaultQuery,
  total,
}: {
  defaultQuery?: Query;
  total?: number;
}) {
  const { locale } = useLocale();
  const t = translations[locale as 'en' | 'th'] || translations.en;

  const q = defaultQuery?.q ?? '';
  const perPage = defaultQuery?.perPage ?? '10';

  const hasFilters = useMemo(
    () =>
      !!(
        defaultQuery?.q ||
        defaultQuery?.status ||
        defaultQuery?.type ||
        defaultQuery?.floor
      ),
    [defaultQuery]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: summary + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground dark:text-gray-400">
          {total !== undefined ? `${total} ${t.rooms}` : '—'} • {t.pageSize}
          <span className="ml-2 inline-flex items-center gap-1">
            <span className="rounded-md border border-border dark:border-gray-600 px-2 py-1 text-foreground dark:text-gray-100 bg-background dark:bg-gray-800">
              {perPage}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t.import}</span>
          </button>
          <button className="px-3 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.export}</span>
          </button>
          <AddRoomModal />
        </div>
      </div>

      {/* Filters row */}
      <form className="flex flex-wrap items-center gap-2 bg-card/70 dark:bg-gray-800/70 border border-border dark:border-gray-700 rounded-2xl p-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder={t.search}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background dark:bg-gray-800 border border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-colors"
          />
        </div>

        <select
          name="status"
          defaultValue={defaultQuery?.status ?? ''}
          className="px-3 py-2 rounded-xl bg-background dark:bg-gray-800 border border-border dark:border-gray-600 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-colors"
        >
          <option value="">{t.allStatus}</option>
          <option value="available">{t.available}</option>
          <option value="occupied">{t.occupied}</option>
          <option value="maintenance">{t.maintenance}</option>
          <option value="reserved">{t.reserved}</option>
        </select>

        <select
          name="type"
          defaultValue={defaultQuery?.type ?? ''}
          className="px-3 py-2 rounded-xl bg-background dark:bg-gray-800 border border-border dark:border-gray-600 text-foreground dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-colors"
        >
          <option value="">{t.allTypes}</option>
          <option value="standard">{t.standard}</option>
          <option value="deluxe">{t.deluxe}</option>
          <option value="suite">{t.suite}</option>
        </select>

        <input
          type="number"
          name="floor"
          min={1}
          placeholder={t.floor}
          defaultValue={defaultQuery?.floor ?? ''}
          className="w-24 px-3 py-2 rounded-xl bg-background dark:bg-gray-800 border border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary/30 transition-colors"
        />

        <input type="hidden" name="page" value="1" />

        <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary/90 dark:hover:bg-primary active:scale-[.98] transition-all flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {t.apply}
        </button>

        {hasFilters && (
          <Link
            href="/rooms"
            className="px-4 py-2 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 text-foreground dark:text-gray-100 transition-colors"
          >
            {t.reset}
          </Link>
        )}
      </form>
    </div>
  );
}

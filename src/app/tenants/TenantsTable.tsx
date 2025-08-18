'use client';

import * as React from 'react';
import AddTenantModal from './AddTenantModal';
import TenantActions from './TenantActions';
import type { TenantRow } from './page';

type SortKey = 'name' | 'email' | 'phone' | 'room' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

const T = {
  en: {
    search: 'Search…',
    status: 'Status',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    rows: 'rows',
    of: 'of',
    results: 'results',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    room: 'Room',
    statusCol: 'Status',
    actions: 'Actions',
    noData: 'No tenants',
    add: 'Add Tenant',
  },
  th: {
    search: 'ค้นหา…',
    status: 'สถานะ',
    all: 'ทั้งหมด',
    active: 'ใช้งาน',
    inactive: 'ปิดใช้งาน',
    rows: 'แถว',
    of: 'จาก',
    results: 'รายการ',
    name: 'ชื่อ',
    email: 'อีเมล',
    phone: 'โทร',
    room: 'ห้อง',
    statusCol: 'สถานะ',
    actions: 'การทำงาน',
    noData: 'ยังไม่มีผู้เช่า',
    add: 'เพิ่มผู้เช่า',
  },
};

// — ถ้าคุณมีระบบ locale อยู่แล้ว สามารถดึงจาก hook ของคุณได้
const useTexts = () => {
  // ปรับให้เลือกภาษาได้จริงตามโปรเจกต์คุณ (ตอนนี้ fix เป็น TH/EN ตาม browser)
  const isTH =
    typeof navigator !== 'undefined' &&
    navigator.language?.toLowerCase().startsWith('th');
  return isTH ? T.th : T.en;
};

export default function TenantsTable({
  initialTenants,
}: {
  initialTenants: TenantRow[];
}) {
  const t = useTexts();

  // ----- local state -----
  const [rows, setRows] = React.useState<TenantRow[]>(initialTenants);
  const [q, setQ] = React.useState('');
  const dq = React.useDeferredValue(q); // ลด re-render หนักตอนพิมพ์
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [sortKey, setSortKey] = React.useState<SortKey>('created_at');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  // ----- derived: filter + search + sort -----
  const filtered = React.useMemo(() => {
    const ql = dq.trim().toLowerCase();
    let arr = rows;

    if (status !== 'all') {
      arr = arr.filter(r => (r.status ?? 'active') === status);
    }
    if (ql) {
      arr = arr.filter(r => {
        const bag =
          `${r.name || ''} ${r.email || ''} ${r.phone || ''} ${r.room || ''}`.toLowerCase();
        return bag.includes(ql);
      });
    }
    return arr;
  }, [rows, dq, status]);

  const sorted = React.useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const key = sortKey;
    return [...filtered].sort((a, b) => {
      const A = (a[key] ?? '') as string;
      const B = (b[key] ?? '') as string;
      // จัดการวันที่แบบ string
      if (key === 'created_at') {
        const aT = A ? Date.parse(A) : 0;
        const bT = B ? Date.parse(B) : 0;
        return (aT - bT) * dir;
      }
      return String(A).localeCompare(String(B)) * dir;
    });
  }, [filtered, sortDir, sortKey]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = React.useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  // reset หน้าเมื่อ filter/search/size เปลี่ยน
  React.useEffect(() => setPage(1), [dq, status, pageSize]);

  // ----- sort toggle -----
  const toggleSort = (k: SortKey) => {
    if (sortKey !== k) {
      setSortKey(k);
      setSortDir('asc');
    } else {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    }
  };

  // ----- optimistic callbacks -----
  const onCreated = (x: TenantRow) => setRows(s => [x, ...s]);
  const onUpdated = (x: TenantRow) =>
    setRows(s => s.map(r => (r.id === x.id ? { ...r, ...x } : r)));
  const onDeleted = (id: string) => setRows(s => s.filter(r => r.id !== id));

  // ----- UI -----
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[280px]">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t.search}
              className="h-10 w-full rounded-xl border border-border bg-background px-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20l-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground px-1">
              {t.status}
            </span>
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { label: t.all, value: 'all' },
                { label: t.active, value: 'active' },
                { label: t.inactive, value: 'inactive' },
              ]}
            />
          </div>
        </div>

        <AddTenantModal onCreated={onCreated} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              <Th>#</Th>
              <Th
                sortable
                active={sortKey === 'name'}
                dir={sortDir}
                onClick={() => toggleSort('name')}
              >
                {t.name}
              </Th>
              <Th
                sortable
                active={sortKey === 'email'}
                dir={sortDir}
                onClick={() => toggleSort('email')}
              >
                {t.email}
              </Th>
              <Th
                sortable
                active={sortKey === 'phone'}
                dir={sortDir}
                onClick={() => toggleSort('phone')}
              >
                {t.phone}
              </Th>
              <Th
                sortable
                active={sortKey === 'room'}
                dir={sortDir}
                onClick={() => toggleSort('room')}
              >
                {t.room}
              </Th>
              <Th
                sortable
                active={sortKey === 'status'}
                dir={sortDir}
                onClick={() => toggleSort('status')}
              >
                {t.statusCol}
              </Th>
              <Th className="text-right">{t.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  {t.noData}
                </td>
              </tr>
            ) : (
              paged.map((r, i) => (
                <tr
                  key={r.id}
                  className={i % 2 ? 'bg-muted/20 dark:bg-gray-800/30' : ''}
                >
                  <Td className="text-muted-foreground">
                    {(pageSafe - 1) * pageSize + i + 1}
                  </Td>
                  <Td>
                    <div className="font-medium">{r.name}</div>
                  </Td>
                  <Td>{r.email || '-'}</Td>
                  <Td>{r.phone || '-'}</Td>
                  <Td>{r.room || '-'}</Td>
                  <Td>
                    <StatusPill status={r.status ?? 'active'} />
                  </Td>
                  <Td className="text-right">
                    <TenantActions
                      row={r}
                      onUpdated={onUpdated}
                      onDeleted={onDeleted}
                    />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {t.of} {total} {t.results}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map(n => (
              <option key={n} value={n}>
                {n} {t.rows}
              </option>
            ))}
          </select>
          <Pager page={pageSafe} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}

/* ---------- tiny UI bits ---------- */
function Th({
  children,
  sortable,
  active,
  dir,
  onClick,
  className,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  active?: boolean;
  dir?: 'asc' | 'desc';
  onClick?: () => void;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 text-left font-medium select-none ${className ?? ''} ${
        sortable ? 'cursor-pointer hover:underline underline-offset-4' : ''
      }`}
      onClick={onClick}
    >
      <div className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="opacity-60">
            {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        )}
      </div>
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 ${className ?? ''}`}>{children}</td>;
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-border bg-muted/40 p-0.5 dark:border-gray-700">
      {options.map(op => {
        const active = op.value === value;
        return (
          <button
            key={op.value}
            type="button"
            onClick={() => onChange(op.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              active
                ? 'bg-background shadow-sm dark:bg-gray-900'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
        className="h-9 w-9 rounded-lg border border-border dark:border-gray-700 disabled:opacity-40"
        aria-label="Previous"
      >
        ‹
      </button>
      <span className="px-2 text-sm tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
        className="h-9 w-9 rounded-lg border border-border dark:border-gray-700 disabled:opacity-40"
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}

function StatusPill({ status }: { status: 'active' | 'inactive' }) {
  const cls =
    status === 'active'
      ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-400/30'
      : 'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-400 border border-slate-500/20 dark:border-slate-400/30';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ${cls}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`}
      />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

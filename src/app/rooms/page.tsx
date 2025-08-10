// src/app/rooms/page.tsx
import RoomsToolbar from '@/app/rooms/Toolbar';
import RoomActions from '@/app/rooms/components/RoomActions';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

type SP = {
  q?: string;
  status?: string;
  type?: string;
  floor?: string;
  page?: string;
  perPage?: string;
};

export const dynamic = 'force-dynamic';

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams; // ✅ Next 15: await
  const supabase = await createClient(); // ✅ await

  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(5, parseInt(sp.perPage || '10', 10) || 10)
  );
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const q = sp.q?.trim();
  const status = sp.status?.trim();
  const type = sp.type?.trim();
  const floor = sp.floor ? parseInt(sp.floor, 10) : undefined;

  let query = supabase
    .from('rooms')
    .select('id, number, type, status, floor, rate_daily, rate_monthly, size', {
      count: 'exact',
    })
    .order('number', { ascending: true })
    .range(from, to);

  if (q) {
    // หาในหมายเลขห้อง/ชนิดห้อง
    query = query.or(`number.ilike.%${q}%,type.ilike.%${q}%`);
  }
  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (typeof floor === 'number' && !Number.isNaN(floor))
    query = query.eq('floor', floor);

  const { data: rooms, count, error } = await query;
  if (error) {
    console.error('[rooms.list] ', error.message);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          Rooms
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage inventory, status, and pricing.
        </p>
      </div>

      {/* Toolbar */}
      <RoomsToolbar
        defaultQuery={sp}
        total={typeof count === 'number' ? count : undefined}
      />

      {/* Table Card */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-muted/60 backdrop-blur px-4 py-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-[48px_1.2fr_.9fr_.9fr_.7fr_.8fr_.8fr_80px]">
            <div className="px-2">
              <input
                aria-label="select all"
                type="checkbox"
                className="size-4 rounded border-muted-foreground/30"
              />
            </div>
            <div className="px-2">Room</div>
            <div className="px-2">Type</div>
            <div className="px-2">Status</div>
            <div className="px-2">Floor</div>
            <div className="px-2">Daily</div>
            <div className="px-2">Monthly</div>
            <div className="px-2 text-right">Action</div>
          </div>
        </div>

        {/* Rows */}
        <ul className="divide-y">
          {rooms?.map(r => (
            <li
              key={r.id}
              className="px-2 sm:px-4 bg-transparent hover:bg-muted/40 transition-colors"
            >
              <div className="grid grid-cols-[48px_1.2fr_.9fr_.9fr_.7fr_.8fr_.8fr_80px] items-center gap-2">
                <div className="py-3 px-2">
                  <input
                    aria-label="select row"
                    type="checkbox"
                    className="size-4 rounded border-muted-foreground/30"
                  />
                </div>

                {/* Room number & subtitle */}
                <Cell>
                  <div className="font-medium text-foreground">{r.number}</div>
                  {r.size && (
                    <div className="text-xs text-muted-foreground">
                      {r.size} m²
                    </div>
                  )}
                </Cell>

                {/* Type */}
                <Cell>
                  <BadgeTone tone={typeTone(r.type)} label={r.type} />
                </Cell>

                {/* Status */}
                <Cell>
                  <BadgeTone tone={statusTone(r.status)} label={r.status} />
                </Cell>

                {/* Floor */}
                <Cell>{r.floor}</Cell>

                {/* Daily */}
                <Cell>฿{Number(r.rate_daily).toLocaleString()}</Cell>

                {/* Monthly */}
                <Cell>฿{Number(r.rate_monthly).toLocaleString()}</Cell>

                {/* Actions */}
                <div className="py-3 pr-2 ml-auto flex items-center justify-end">
                  <RoomActions
                    id={String(r.id)}
                    editHref={`/rooms/${r.id}`}
                    onDeletedRedirect={{ pathname: '/rooms', query: sp }}
                  />
                </div>
              </div>
            </li>
          ))}
          {!rooms?.length && (
            <li className="p-10 text-center text-muted-foreground">
              No rooms found.
            </li>
          )}
        </ul>
      </div>

      {/* Pagination */}
      {typeof count === 'number' && count > perPage && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(count / perPage)} — {count} total rooms
          </div>
          <div className="space-x-2">
            {page > 1 && (
              <Link
                href={{
                  pathname: '/rooms',
                  query: { ...sp, page: String(page - 1) },
                }}
                className="px-3 py-1.5 rounded-xl border hover:bg-muted/50"
              >
                Previous
              </Link>
            )}
            {page < Math.ceil(count / perPage) && (
              <Link
                href={{
                  pathname: '/rooms',
                  query: { ...sp, page: String(page + 1) },
                }}
                className="px-3 py-1.5 rounded-xl border hover:bg-muted/50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small UI helpers ---------- */

function Cell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`py-3 px-2 ${className}`}>{children}</div>;
}

function BadgeTone({
  tone,
  label,
}: {
  tone: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'slate';
  label: string;
}) {
  const map: Record<string, string> = {
    green:
      'bg-emerald-500/15 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-300',
    amber:
      'bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
    red: 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300',
    blue: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300',
    violet:
      'bg-violet-500/15 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300',
    slate:
      'bg-slate-500/15 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[tone]}`}
    >
      {label}
    </span>
  );
}

function statusTone(
  status?: string
): 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'slate' {
  switch ((status || '').toLowerCase()) {
    case 'available':
      return 'green';
    case 'occupied':
      return 'blue';
    case 'maintenance':
      return 'amber';
    case 'reserved':
      return 'violet';
    default:
      return 'slate';
  }
}
function typeTone(
  type?: string
): 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'slate' {
  switch ((type || '').toLowerCase()) {
    case 'standard':
      return 'slate';
    case 'deluxe':
      return 'green';
    case 'suite':
      return 'violet';
    default:
      return 'blue';
  }
}

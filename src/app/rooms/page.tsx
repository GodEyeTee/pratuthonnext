// src/app/rooms/page.tsx
export const runtime = 'nodejs';

import RoomsToolbar from '@/app/rooms/Toolbar';
import RoomActions from '@/app/rooms/components/RoomActions';
import { adminDb } from '@/lib/firebase/admin';
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

// ---------- ADD: tone helpers to fix TS2304 ----------
type Tone = 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'slate';

function typeTone(type?: string): Tone {
  switch ((type || '').toLowerCase()) {
    case 'standard':
      return 'slate';
    case 'deluxe':
      return 'violet';
    case 'suite':
      return 'blue';
    default:
      return 'slate';
  }
}

function statusTone(status?: string): Tone {
  switch ((status || '').toLowerCase()) {
    case 'available':
      return 'green';
    case 'occupied':
      return 'amber';
    case 'maintenance':
      return 'red';
    case 'reserved':
      return 'blue';
    default:
      return 'slate';
  }
}
// -----------------------------------------------------

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(5, parseInt(sp.perPage || '10', 10) || 10)
  );

  let rooms: any[] = [];
  let total = 0;

  try {
    // Simplified query approach to avoid index requirements
    // First, get all rooms with basic ordering
    let baseQuery = adminDb.collection('rooms').orderBy('number');

    // If searching by room number, use startAt/endAt
    if (sp.q?.trim()) {
      baseQuery = baseQuery.startAt(sp.q.trim()).endAt(sp.q.trim() + '\uf8ff');
    }

    // Get all matching documents
    const allDocs = await baseQuery.get();
    let filteredDocs = allDocs.docs;

    // Apply client-side filtering for additional criteria
    if (sp.status?.trim()) {
      filteredDocs = filteredDocs.filter(
        doc => doc.data().status === sp.status?.trim()
      );
    }

    if (sp.type?.trim()) {
      filteredDocs = filteredDocs.filter(
        doc => doc.data().type === sp.type?.trim()
      );
    }

    if (sp.floor?.trim()) {
      const floor = parseInt(sp.floor, 10);
      if (!isNaN(floor)) {
        filteredDocs = filteredDocs.filter(doc => doc.data().floor === floor);
      }
    }

    // Calculate pagination
    total = filteredDocs.length;
    const offset = (page - 1) * perPage;
    const paginatedDocs = filteredDocs.slice(offset, offset + perPage);

    rooms = paginatedDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching rooms:', error);
    // Fallback to simple query without filters
    try {
      const simpleQuery = await adminDb
        .collection('rooms')
        .orderBy('number')
        .limit(perPage)
        .get();

      rooms = simpleQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      total = rooms.length;
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <RoomsToolbar defaultQuery={sp} total={total} />

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="sticky top-0 z-10 bg-muted/60 dark:bg-gray-800/60 backdrop-blur px-4 py-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-[48px_1.2fr_.9fr_.9fr_.7fr_.8fr_.8fr_80px] gap-2">
            <div className="px-2">
              <input
                type="checkbox"
                className="size-4 rounded border-muted-foreground/30 dark:border-gray-600"
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

        <ul className="divide-y divide-border dark:divide-gray-700">
          {rooms.map((r: any, idx: number) => (
            <li
              key={r.id}
              className={`px-2 sm:px-4 transition-colors ${
                idx % 2 === 0
                  ? 'bg-transparent dark:bg-gray-900/30'
                  : 'bg-muted/20 dark:bg-gray-800/30'
              } hover:bg-muted/40 dark:hover:bg-gray-700/40`}
            >
              <div className="grid grid-cols-[48px_1.2fr_.9fr_.9fr_.7fr_.8fr_.8fr_80px] items-center gap-2">
                <div className="py-3 px-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-muted-foreground/30 dark:border-gray-600"
                  />
                </div>

                <Cell>
                  <div className="font-medium text-foreground dark:text-gray-100">
                    {r.number}
                  </div>
                  {r.size && (
                    <div className="text-xs text-muted-foreground dark:text-gray-400">
                      {r.size} m²
                    </div>
                  )}
                </Cell>

                <Cell>
                  <BadgeTone tone={typeTone(r.type)} label={r.type} />
                </Cell>
                <Cell>
                  <BadgeTone tone={statusTone(r.status)} label={r.status} />
                </Cell>
                <Cell>{r.floor}</Cell>
                <Cell>฿{Number(r.rate_daily || 0).toLocaleString()}</Cell>
                <Cell>฿{Number(r.rate_monthly || 0).toLocaleString()}</Cell>

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
          {!rooms.length && (
            <li className="p-10 text-center text-muted-foreground dark:text-gray-400">
              No rooms found.
            </li>
          )}
        </ul>
      </div>

      {total > perPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-sm text-muted-foreground dark:text-gray-400">
            Page {page} of {Math.ceil(total / perPage)} — {total} total rooms
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={{
                  pathname: '/rooms',
                  query: { ...sp, page: String(page - 1) },
                }}
                className="px-3 py-1.5 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < Math.ceil(total / perPage) && (
              <Link
                href={{
                  pathname: '/rooms',
                  query: { ...sp, page: String(page + 1) },
                }}
                className="px-3 py-1.5 rounded-xl border border-border dark:border-gray-600 hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
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
      'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-400/30',
    amber:
      'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400 border border-amber-500/20 dark:border-amber-400/30',
    red: 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400 border border-rose-500/20 dark:border-rose-400/30',
    blue: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400 border border-blue-500/20 dark:border-blue-400/30',
    violet:
      'bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400 border border-violet-500/20 dark:border-violet-400/30',
    slate:
      'bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-400 border border-slate-500/20 dark:border-slate-400/30',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[tone]}`}
    >
      {label}
    </span>
  );
}

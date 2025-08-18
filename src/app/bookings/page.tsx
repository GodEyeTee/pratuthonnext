export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { adminDb } from '@/lib/firebase/admin';
import type { DocumentData, Query } from 'firebase-admin/firestore';
import Link from 'next/link';
import AddBookingModal from './AddBookingModal';
import BookingActions from './BookingActions';

type SearchParams = {
  q?: string;
  from?: string;
  to?: string;
  page?: string;
  perPage?: string;
};

type RoomLite = { id: string; label: string };
type TenantLite = { id: string; name: string };

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const anyVal = v as any;
  if (anyVal?.toDate) {
    try {
      return anyVal.toDate();
    } catch {}
  }
  const d = new Date(anyVal);
  return Number.isNaN(+d) ? null : d;
}

function normalizeDateValue(v?: string) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(+d) ? '' : d.toISOString().slice(0, 10);
}

function fmtDateTime(d: Date | null) {
  if (!d) return <span>—</span>;
  const date = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(d);
  const time = new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
  }).format(d);
  return (
    <span className="inline-flex flex-col leading-tight">
      <span>{date}</span>
      <span className="text-xs text-muted-foreground">{time}</span>
    </span>
  );
}
function fmtDate(d: Date | null) {
  if (!d) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d);
}

function makePseudoCode(createdAtISO: string | null, id: string) {
  try {
    const ymd = createdAtISO
      ? createdAtISO.slice(0, 10).replace(/-/g, '')
      : '00000000';
    const short = id.replace(/-/g, '').slice(-6).toUpperCase();
    return `BK-${ymd}-${short}`;
  } catch {
    return `BK-${id.slice(0, 6)}`;
  }
}

type BookingRow = {
  id: string;
  code: string;
  bookingDate: Date | null;
  roomNumber: string;
  roomId?: string | null;
  tenantId?: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  imageUrl?: string | null;
};

function tenantRoomRaw(x: any): string | null {
  const v = x?.roomId ?? x?.room_id ?? x?.room ?? null;
  if (!v) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

async function fetchRoomsAndTenants(): Promise<{
  rooms: RoomLite[];
  tenants: TenantLite[];
  map: { room: Record<string, string>; tenant: Record<string, string> };
  labelToId: Record<string, string>;
  tenantRoomPref: Record<string, string | null>; // raw from tenants
}> {
  const [roomSnap, tenantSnap] = await Promise.all([
    adminDb.collection('rooms').get(),
    adminDb.collection('tenants').get(),
  ]);

  const rooms = roomSnap.docs.map(d => {
    const x = d.data() as any;
    const label = String(x?.number ?? x?.name ?? x?.code ?? d.id);
    return { id: d.id, label };
  });

  const tenants = tenantSnap.docs.map(d => {
    const x = d.data() as any;
    const name = String(x?.name ?? d.id);
    return { id: d.id, name };
  });

  // id -> label
  const idToLabel = Object.fromEntries(rooms.map(r => [r.id, r.label]));

  // label -> id (รองรับทั้ง label ที่เป็น number/string)
  const labelToId: Record<string, string> = {};
  rooms.forEach(r => {
    labelToId[String(r.label)] = r.id;
  });

  const tenantRoomPref: Record<string, string | null> = {};
  tenantSnap.docs.forEach(d => {
    tenantRoomPref[d.id] = tenantRoomRaw(d.data());
  });

  return {
    rooms,
    tenants,
    map: {
      room: idToLabel,
      tenant: Object.fromEntries(tenants.map(t => [t.id, t.name])),
    },
    labelToId,
    tenantRoomPref,
  };
}

async function fetchBookings(opts: {
  page: number;
  perPage: number;
  q?: string;
  from?: string;
  to?: string;
}): Promise<{ bookings: BookingRow[]; count: number }> {
  const { page, perPage, q, from, to } = opts;
  let qref: Query<DocumentData> = adminDb.collection('bookings');

  if (from) qref = qref.where('createdAt', '>=', new Date(from));
  if (to) {
    const e = new Date(to);
    e.setHours(23, 59, 59, 999);
    qref = qref.where('createdAt', '<=', e);
  }

  if (q && q.trim()) {
    const qLower = q.trim().toLowerCase();
    const known = [
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'paid',
      'unpaid',
    ];
    if (known.includes(qLower)) qref = qref.where('status', '==', qLower);
    else qref = qref.where('roomNumber', '==', q.trim());
  }

  qref = qref.orderBy('createdAt', 'desc');

  const total = (await qref.count().get()).data()?.count ?? 0;
  const snap = await qref
    .offset((page - 1) * perPage)
    .limit(perPage)
    .get();

  const bookings = snap.docs.map(d => {
    const x = d.data() as any;
    const createdAt = toDate(x?.createdAt);
    return {
      id: d.id,
      code: makePseudoCode(createdAt ? createdAt.toISOString() : null, d.id),
      bookingDate: createdAt,
      roomNumber: String(x?.roomNumber ?? x?.room_id ?? '—'),
      roomId: x?.roomId ?? x?.room_id ?? null,
      tenantId: x?.tenantId ?? null,
      checkIn: toDate(x?.checkInDate ?? x?.check_in_date),
      checkOut: toDate(x?.checkOutDate ?? x?.check_out_date),
      guests: Number(x?.guests ?? 1),
      status: (x?.status as BookingRow['status']) ?? 'pending',
      imageUrl: x?.imageUrl ?? null,
    };
  });

  return { bookings, count: total as number };
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp: SearchParams = searchParams ?? {};
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(5, parseInt(sp.perPage || '10', 10) || 10)
  );

  const [{ bookings, count }, meta] = await Promise.all([
    fetchBookings({
      page,
      perPage,
      q: sp.q?.trim() || undefined,
      from: sp.from || undefined,
      to: sp.to || undefined,
    }),
    fetchRoomsAndTenants(),
  ]);
  const { rooms, tenants, map, labelToId, tenantRoomPref } = meta;

  const totalPages = Math.max(1, Math.ceil(count / perPage));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* header + filters */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Booking History
          </h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, create, and manage reservations.
          </p>
        </div>

        <form className="flex flex-wrap items-center gap-2 bg-card/70 border rounded-2xl p-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Search status or room number…"
            className="px-3 py-2 rounded-xl bg-background border focus:outline-none focus:ring-2 focus:ring-primary/40 w-[260px]"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              name="from"
              defaultValue={normalizeDateValue(sp.from)}
              className="px-3 py-2 rounded-xl bg-background border focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="From"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              name="to"
              defaultValue={normalizeDateValue(sp.to)}
              className="px-3 py-2 rounded-xl bg-background border focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="To"
            />
          </div>
          <input type="hidden" name="page" value="1" />
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[.98] transition">
            Apply
          </button>
          {(sp.q || sp.from || sp.to) && (
            <Link
              href="/bookings"
              className="px-4 py-2 rounded-xl border hover:bg-muted/50 text-foreground"
            >
              Reset
            </Link>
          )}
        </form>
      </div>

      {/* add */}
      <div className="flex items-center justify-end">
        <AddBookingModal
          rooms={rooms}
          tenants={tenants}
          tenantRoomMap={tenantRoomPref} // raw (id หรือ label)
          roomLabelMap={map.room} // id -> label
          roomLabelToId={labelToId} // label -> id
        />
      </div>

      {/* table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="sticky top-0 z-10 bg-muted/60 backdrop-blur px-4 py-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-[96px_1.2fr_1fr_.9fr_1fr_1fr_1fr_.8fr_.8fr_56px]">
            <div className="px-2">Image</div>
            <div className="px-2">Booking ID</div>
            <div className="px-2">Booking Date</div>
            <div className="px-2">Tenant</div>
            <div className="px-2">Room</div>
            <div className="px-2">Check-In</div>
            <div className="px-2">Check-Out</div>
            <div className="px-2 text-right">Guests</div>
            <div className="px-2">Status</div>
            <div className="px-2 text-right">Actions</div>
          </div>
        </div>
        <ul className="divide-y">
          {bookings.map((bk, idx) => {
            const tenantName = bk.tenantId
              ? (meta.map.tenant[bk.tenantId] ?? bk.tenantId)
              : '—';
            const roomLabel =
              bk.roomNumber ||
              (bk.roomId ? (meta.map.room[bk.roomId] ?? bk.roomId) : '—');
            return (
              <li
                key={bk.id}
                className={`px-2 sm:px-4 ${idx % 2 ? 'bg-muted/20' : 'bg-transparent'} hover:bg-muted/40 transition-colors`}
              >
                <div className="grid grid-cols-[96px_1.2fr_1fr_.9fr_1fr_1fr_1fr_.8fr_.8fr_56px] items-center gap-2">
                  <div className="py-3 pl-2">
                    <div className="w-24 h-16 rounded-xl overflow-hidden bg-muted">
                      {bk.imageUrl ? (
                        <img
                          src={bk.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="py-3 px-3">
                    <div className="font-medium truncate">{bk.code}</div>
                    <div className="sm:hidden text-xs text-muted-foreground">
                      {fmtDateTime(bk.bookingDate)}
                    </div>
                  </div>
                  <div className="py-3 px-3 hidden sm:flex">
                    {fmtDateTime(bk.bookingDate)}
                  </div>
                  <div className="py-3 px-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-sky-200/60 text-sky-700 dark:bg-sky-300/20 dark:text-sky-300">
                      {tenantName}
                    </span>
                  </div>
                  <div className="py-3 px-3">{roomLabel}</div>
                  <div className="py-3 px-3 hidden sm:flex">
                    {fmtDate(bk.checkIn)}
                  </div>
                  <div className="py-3 px-3 hidden sm:flex">
                    {fmtDate(bk.checkOut)}
                  </div>
                  <div className="py-3 px-2 ml-auto flex items-center justify-end gap-2">
                    <span className="text-foreground font-medium">
                      {bk.guests}
                    </span>
                    <span className="text-muted-foreground text-sm hidden md:inline">
                      {bk.guests > 1 ? 'Guests' : 'Guest'}
                    </span>
                  </div>
                  <div className="py-3 px-3">
                    <StatusPill status={bk.status} />
                  </div>
                  <div className="py-2 pr-2 ml-auto flex items-center justify-end">
                    <BookingActions
                      row={bk}
                      rooms={rooms}
                      tenants={tenants}
                      tenantRoomMap={tenantRoomPref}
                      roomLabelMap={map.room}
                    />
                  </div>
                </div>
              </li>
            );
          })}
          {bookings.length === 0 && (
            <li className="p-10 text-center text-muted-foreground">
              No bookings found.
            </li>
          )}
        </ul>
      </div>

      {count > perPage && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.max(1, Math.ceil(count / perPage))} — {count}{' '}
            total bookings
          </div>
          <div className="space-x-2">
            {page > 1 && (
              <Link
                href={{
                  pathname: '/bookings',
                  query: { ...sp, page: String(page - 1) },
                }}
                className="px-3 py-1.5 rounded-xl border hover:bg-muted/50"
              >
                Previous
              </Link>
            )}
            {page < Math.max(1, Math.ceil(count / perPage)) && (
              <Link
                href={{
                  pathname: '/bookings',
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

function StatusPill({ status }: { status: BookingRow['status'] }) {
  const m: Record<BookingRow['status'], string> = {
    pending:
      'bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20',
    confirmed:
      'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20',
    cancelled:
      'bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/20',
    completed:
      'bg-slate-500/15 text-slate-700 dark:bg-slate-400/20 dark:text-slate-300 border border-slate-500/20',
  };
  const cls = m[status] ?? 'bg-muted text-foreground';
  const pretty = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {pretty}
    </span>
  );
}

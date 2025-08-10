import { adminDb } from '@/lib/firebase/admin';
import type { DocumentData, Query } from 'firebase-admin/firestore';
import { EllipsisVertical } from 'lucide-react';
import Link from 'next/link';

type SP = {
  q?: string;
  from?: string;
  to?: string;
  page?: string;
  perPage?: string;
};

export const dynamic = 'force-dynamic';

/** Firestore fetch + aggregate count()
 * ใช้ offset+limit เพื่อให้พฤติกรรมเหมือนโค้ดเดิม (ง่ายสุดสำหรับ page/perPage)
 * NOTE: ถ้าดาต้าใหญ่ แนะนำเปลี่ยนเป็น cursor (startAfter) ตาม docs เพื่อประหยัดอ่านดีกว่า offset. :contentReference[oaicite:9]{index=9}
 */
async function fetchBookings(opts: {
  page: number;
  perPage: number;
  q?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}) {
  const { page, perPage, q, from, to } = opts;

  let qref: Query<DocumentData> = adminDb.collection('bookings');

  // filter ช่วงวันที่ (อิง createdAt)
  if (from) {
    const start = new Date(from);
    qref = qref.where('createdAt', '>=', start);
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    qref = qref.where('createdAt', '<=', end);
  }

  // filter แบบง่ายด้วยสถานะหรือเลขห้อง (Firestore ไม่รองรับ OR text search ตรงๆ)
  if (q && q.trim()) {
    const qLower = q.trim().toLowerCase();
    const knownStatuses = [
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'paid',
      'unpaid',
    ];
    if (knownStatuses.includes(qLower)) {
      qref = qref.where('status', '==', qLower);
    } else {
      // ถ้ามีฟิลด์ roomNumber ให้ใช้ exact match; ไม่มีก็ข้าม
      qref = qref.where('roomNumber', '==', q.trim());
    }
  }

  qref = qref.orderBy('createdAt', 'desc');

  // รวมจำนวนทั้งหมดด้วย count() aggregation (เร็วกว่าโหลดเอกสารทั้งหมด) :contentReference[oaicite:10]{index=10}
  const countSnap = await qref.count().get();
  const total = countSnap.data().count as number;

  // หน้า: ใช้ offset + limit (สะดวกกับ page/perPage เดิม แต่มีค่าอ่านมากกว่า cursor) :contentReference[oaicite:11]{index=11}
  const offset = (page - 1) * perPage;
  const snap = await qref.offset(offset).limit(perPage).get();

  const bookings = snap.docs.map(d => mapBooking(d.id, d.data()));
  return { bookings, count: total };
}

function toDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  // Firestore Timestamp (Admin SDK)
  if (val?.toDate) {
    try {
      return val.toDate();
    } catch {}
  }
  // string ISO
  try {
    return new Date(val);
  } catch {
    return null;
  }
}

function mapBooking(id: string, data: DocumentData) {
  const createdAt = toDate(data.createdAt);
  const checkIn = toDate(data.checkInDate ?? data.check_in_date);
  const checkOut = toDate(data.checkOutDate ?? data.check_out_date);
  const roomType = (data.roomType ??
    data.booking_type ??
    data.bookingType ??
    '—') as string;
  const roomNumber = String(data.roomNumber ?? data.room_id ?? '—');
  const imageUrl = (data.imageUrl ?? null) as string | null;
  const guests = (data.guests ?? 1) as number;

  return {
    id,
    code: makePseudoCode(createdAt ? createdAt.toISOString() : null, id),
    bookingDate: createdAt,
    roomType,
    roomNumber,
    checkIn,
    checkOut,
    guests,
    imageUrl,
  };
}

// ---------- Page ----------
export default async function BookingsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = searchParams;

  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(5, parseInt(sp.perPage || '10', 10) || 10)
  );

  const { bookings, count } = await fetchBookings({
    page,
    perPage,
    q: sp.q?.trim() || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Booking History
          </h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, and review reservations.
          </p>
        </div>

        {/* Toolbar (GET) */}
        <form className="flex flex-wrap items-center gap-2 bg-card/70 border rounded-2xl p-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Search room, status…"
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
          <button
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[.98] transition"
            aria-label="Apply filters"
          >
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

      {/* Table card */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-muted/60 backdrop-blur px-4 py-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-[96px_1.2fr_1fr_.9fr_1fr_1fr_1fr_56px]">
            <div className="px-2">Image</div>
            <div className="px-2">Booking ID</div>
            <div className="px-2">Booking Date</div>
            <div className="px-2">Room Type</div>
            <div className="px-2">Room Number</div>
            <div className="px-2">Check-In</div>
            <div className="px-2">Check-Out</div>
            <div className="px-2 text-right">Guests</div>
          </div>
        </div>

        {/* Rows */}
        <ul className="divide-y">
          {bookings.map((bk, idx) => (
            <li
              key={bk.id}
              className={`px-2 sm:px-4 ${idx % 2 ? 'bg-muted/20' : 'bg-transparent'} hover:bg-muted/40 transition-colors`}
            >
              <div className="grid grid-cols-[96px_1.2fr_1fr_.9fr_1fr_1fr_1fr_56px] items-center gap-2">
                {/* Image */}
                <div className="py-3 pl-2">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-muted">
                    {bk.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
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

                {/* Booking ID */}
                <Cell>
                  <div className="font-medium truncate">{bk.code}</div>
                  <div className="sm:hidden text-xs text-muted-foreground">
                    {fmtDateTime(bk.bookingDate)}
                  </div>
                </Cell>

                {/* Booking Date */}
                <Cell className="hidden sm:flex">
                  {fmtDateTime(bk.bookingDate)}
                </Cell>

                {/* Room Type */}
                <Cell className="hidden sm:flex">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-lime-200/60 text-lime-700 dark:bg-lime-300/20 dark:text-lime-300">
                    {bk.roomType}
                  </span>
                </Cell>

                {/* Room Number */}
                <Cell className="hidden sm:flex">{bk.roomNumber}</Cell>

                {/* Check-In */}
                <Cell className="hidden sm:flex">{fmtDate(bk.checkIn)}</Cell>

                {/* Check-Out */}
                <Cell className="hidden sm:flex">{fmtDate(bk.checkOut)}</Cell>

                {/* Guests + menu */}
                <div className="py-3 pr-2 ml-auto flex items-center justify-end gap-2">
                  <span className="text-foreground font-medium">
                    {bk.guests}
                  </span>
                  <span className="text-muted-foreground text-sm hidden md:inline">
                    {bk.guests > 1 ? 'Guests' : 'Guest'}
                  </span>
                  <button
                    className="p-2 rounded-lg hover:bg-muted/60"
                    aria-label="Booking actions"
                    title="Actions"
                  >
                    <EllipsisVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {!bookings.length && (
            <li className="p-10 text-center text-muted-foreground">
              No bookings found.
            </li>
          )}
        </ul>
      </div>

      {/* Pagination */}
      {typeof count === 'number' && count > perPage && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(count / perPage)} — {count} total bookings
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
            {page < Math.ceil(count / perPage) && (
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

/* ---------- tiny UI helpers ---------- */
function Cell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`py-3 px-3 ${className}`}>{children}</div>;
}

function fmtDateTime(d: Date | null) {
  if (!d) return '—';
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
function normalizeDateValue(v?: string) {
  if (!v) return '';
  try {
    const d = new Date(v);
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}
function makePseudoCode(createdAtISO: string | null, id: string): string {
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

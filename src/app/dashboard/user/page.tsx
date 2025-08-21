'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Home,
  ShoppingBag,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/** ========= UI Types (ไม่ไปกระทบ domain types ของโปรเจกต์) ========= */
type BookingUI = {
  id: string;
  status?: string;
  /** label ห้องที่พร้อมแสดงผลแล้ว */
  roomLabel?: string;
};

type PaymentUI = {
  id: string;
  amount?: number;
  payment_date?: string | number | Date;
};

type OrderUI = {
  id: string;
  created_at?: string | number | Date;
  total?: number;
};

const thb = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
    n
  );

function formatDateTime(v?: string | number | Date) {
  if (v == null) return '-';
  const d = new Date(v); // แปลงหลังจากเช็กไม่เป็น undefined แล้ว (narrowing) :contentReference[oaicite:1]{index=1}
  if (Number.isNaN(d.getTime())) return '-'; // กัน Invalid Date ตามแนวทาง MDN Date constructor :contentReference[oaicite:2]{index=2}
  return d.toLocaleString('th-TH');
}

/** ========= Component ========= */
export default function UserDashboardPage() {
  const { user } = useAuth();

  const [booking, setBooking] = useState<BookingUI | null>(null);
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [orders, setOrders] = useState<OrderUI[]>([]);
  const [credit, setCredit] = useState<{
    credit_used: number;
    credit_available: number;
  }>({
    credit_used: 0,
    credit_available: 500,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setBooking(null);
      setPayments([]);
      setOrders([]);
      setCredit({ credit_used: 0, credit_available: 500 });
      setLoading(false);
      return;
    }
    void loadUserData(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const loadUserData = async (uid: string) => {
    setLoading(true);
    try {
      // Booking ปัจจุบัน
      const bookingQ = query(
        collection(db, 'bookings'),
        where('tenant_id', '==', uid),
        where('status', 'in', ['confirmed', 'checked_in']),
        limit(1)
      );
      const bookingSnap = await getDocs(bookingQ);
      const first = bookingSnap.docs[0];

      if (first) {
        const data = first.data() as any;
        const roomLabel =
          data?.room_no ??
          data?.roomNo ??
          data?.room?.name ??
          data?.room ??
          data?.room_id ??
          '-';

        setBooking({
          id: first.id,
          status: data?.status,
          roomLabel,
        });
      } else {
        setBooking(null);
      }

      // Payments ล่าสุด
      const paymentsQ = query(
        collection(db, 'payments'),
        where('booking.tenant_id', '==', uid),
        orderBy('payment_date', 'desc'),
        limit(5)
      );
      const paymentsSnap = await getDocs(paymentsQ);
      setPayments(
        paymentsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      );

      // Orders ล่าสุด
      const ordersQ = query(
        collection(db, 'orders'),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc'),
        limit(5)
      );
      const ordersSnap = await getDocs(ordersQ);
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

      // เครดิตร้านค้า
      const creditRef = doc(db, 'shop_credits', uid);
      const creditDoc = await getDoc(creditRef);
      setCredit(
        creditDoc.exists()
          ? ((creditDoc.data() as any) ?? {
              credit_used: 0,
              credit_available: 500,
            })
          : { credit_used: 0, credit_available: 500 }
      );
    } finally {
      setLoading(false);
    }
  };

  const totalOwed = useMemo(() => {
    const sum = payments.reduce((acc, p) => acc + (p.amount ?? 0), 0);
    return sum < 0 ? 0 : sum;
  }, [payments]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-6 w-40 bg-muted rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* สรุปยอดต่าง ๆ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">ห้องพัก</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl">
            {booking?.roomLabel ?? '-'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">ยอดค้างชำระ</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl">{thb(totalOwed)}</CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">เครดิตร้านค้า</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl">
            {thb(credit.credit_available)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">สถานะ</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={booking ? 'success' : 'secondary'}>
              {booking ? 'เข้าพัก' : 'ว่าง'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* ประวัติการชำระเงิน */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการชำระเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>ยังไม่มีประวัติการชำระเงิน</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {payments.map(p => (
                <li key={p.id} className="flex justify-between border-b pb-2">
                  <div>{formatDateTime(p.payment_date)}</div>
                  <div>{thb(p.amount ?? 0)}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* คำสั่งซื้อล่าสุด */}
      <Card>
        <CardHeader>
          <CardTitle>คำสั่งซื้อล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>ยังไม่มีคำสั่งซื้อ</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {orders.map(o => (
                <li key={o.id} className="flex justify-between border-b pb-2">
                  <div>{formatDateTime(o.created_at)}</div>
                  <div>{thb(o.total ?? 0)}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <a href="/shop">ไปที่ร้านค้า</a>
        </Button>
        <Button variant="secondary" asChild>
          <a href="/profile">แก้ไขโปรไฟล์</a>
        </Button>
      </div>
    </div>
  );
}

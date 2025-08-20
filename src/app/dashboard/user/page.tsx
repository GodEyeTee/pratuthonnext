'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Booking, Order, Payment, ShopCredit } from '@/domain/models';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import {
  collection,
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

/** ---------- helpers ---------- */
function toDateFromString(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
const thb = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
    n
  );

/** ---------- component ---------- */
export default function UserDashboard() {
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [credit, setCredit] = useState<
    Pick<ShopCredit, 'credit_used' | 'credit_available'>
  >({
    credit_used: 0,
    credit_available: 500,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      // ไม่มีผู้ใช้ -> เคลียร์ state ให้ deterministic
      setBooking(null);
      setPayments([]);
      setOrders([]);
      setCredit({ credit_used: 0, credit_available: 500 });
      setLoading(false);
      return;
    }
    void loadUserData(uid);
  }, [user?.uid]);

  const loadUserData = async (uid: string) => {
    setLoading(true);
    try {
      // Booking ปัจจุบัน (confirmed/checked_in)
      const bookingQ = query(
        collection(db, 'bookings'),
        where('tenant_id', '==', uid),
        where('status', 'in', ['confirmed', 'checked_in']),
        limit(1)
      );
      const bookingSnap = await getDocs(bookingQ);

      // ✅ หลีกเลี่ยง ternary + docs[0] เพื่อให้ TS แคบชนิดได้
      const firstBookingDoc = bookingSnap.docs[0];
      if (firstBookingDoc) {
        setBooking({
          id: firstBookingDoc.id,
          ...(firstBookingDoc.data() as any),
        } as Booking);
      } else {
        setBooking(null);
      }

      // Payments ล่าสุด
      const paymentsQ = query(
        collection(db, 'payments'),
        where('booking.tenant_id', '==', uid), // ถ้า schema จริงเป็น 'tenant_id' ตรง ๆ ให้เปลี่ยนเป็น field นั้น
        orderBy('payment_date', 'desc'),
        limit(5)
      );
      const paymentsSnap = await getDocs(paymentsQ);
      setPayments(
        paymentsSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        })) as Payment[]
      );

      // Orders ล่าสุด
      const ordersQ = query(
        collection(db, 'orders'),
        where('user_id', '==', uid),
        orderBy('created_at', 'desc'),
        limit(5)
      );
      const ordersSnap = await getDocs(ordersQ);
      setOrders(
        ordersSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        })) as Order[]
      );

      // Credit
      const creditQ = query(
        collection(db, 'shop_credits'),
        where('user_id', '==', uid),
        limit(1)
      );
      const creditSnap = await getDocs(creditQ);

      // ✅ เช่นเดียวกัน: เช็ค doc ตัวแรกก่อน
      const firstCreditDoc = creditSnap.docs[0];
      if (firstCreditDoc) {
        const c = firstCreditDoc.data() as ShopCredit;
        setCredit({
          credit_used: c?.credit_used ?? 0,
          credit_available: c?.credit_available ?? 500,
        });
      } else {
        setCredit({ credit_used: 0, credit_available: 500 });
      }
    } catch (e) {
      console.error(e);
      // ตั้งค่า fallback เพื่อป้องกันการอ้างอิง undefined
      setBooking(null);
      setPayments([]);
      setOrders([]);
      setCredit({ credit_used: 0, credit_available: 500 });
    } finally {
      setLoading(false);
    }
  };

  // สรุปยอดค้างชำระแบบ safe
  const totalOwed = useMemo(
    () =>
      (payments ?? [])
        .filter(p => p && (p.status === 'pending' || p.status === 'overdue'))
        .reduce(
          (sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0),
          0
        ),
    [payments]
  );

  if (loading) {
    return (
      <DashboardLayout title="แดชบอร์ด" subtitle="ภาพรวมการเช่าของคุณ">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="แดชบอร์ด" subtitle="ภาพรวมการเช่าของคุณ">
      <div className="space-y-6">
        {/* Alert ค้างชำระ */}
        {totalOwed > 0 && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold">มียอดค้างชำระ</p>
                <p className="text-sm text-muted-foreground">
                  จำนวน {thb(totalOwed)} กรุณาชำระภายในกำหนด
                </p>
              </div>
              <Button variant="destructive" size="sm">
                ชำระเงิน
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ห้องพัก</p>
                  <p className="text-2xl font-bold">
                    {booking ? `ห้อง ${booking.room_id}` : '-'}
                  </p>
                </div>
                <Home className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ยอดค้างชำระ</p>
                  <p className="text-2xl font-bold">{thb(totalOwed)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">เครดิตร้านค้า</p>
                  <p className="text-2xl font-bold">
                    {thb(credit.credit_available)}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">สถานะ</p>
                  <Badge variant={booking ? 'success' : 'secondary'}>
                    {booking ? 'เช่าอยู่' : 'ว่าง'}
                  </Badge>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking ปัจจุบัน */}
        {booking && (
          <Card>
            <CardHeader>
              <CardTitle>การเช่าปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">ห้อง</p>
                  <p className="font-semibold">{booking.room_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ประเภท</p>
                  <p className="font-semibold">
                    {booking.booking_type === 'monthly'
                      ? 'รายเดือน'
                      : booking.booking_type === 'daily'
                        ? 'รายวัน'
                        : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">วันเช็คอิน</p>
                  <p className="font-semibold">
                    {(() => {
                      const d = toDateFromString(booking.check_in_date);
                      return d ? d.toLocaleDateString('th-TH') : '-';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">สถานะ</p>
                  <Badge variant="success">{booking.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments ล่าสุด */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>ประวัติการชำระเงิน</CardTitle>
            <Button variant="ghost" size="sm">
              ดูทั้งหมด
            </Button>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                ยังไม่มีประวัติการชำระเงิน
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.payment_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const d = toDateFromString(p.payment_date);
                          return d ? d.toLocaleDateString('th-TH') : '-';
                        })()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{thb(p.amount)}</p>
                      <Badge
                        variant={
                          p.status === 'paid'
                            ? 'success'
                            : p.status === 'overdue'
                              ? 'destructive'
                              : 'warning'
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders ล่าสุด */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>คำสั่งซื้อล่าสุด</CardTitle>
            <Button variant="ghost" size="sm">
              ดูทั้งหมด
            </Button>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                ยังไม่มีคำสั่งซื้อ
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {o.items?.length ?? 0} รายการ
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {o.delivery_type === 'delivery' ? 'จัดส่ง' : 'รับเอง'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{thb(o.total)}</p>
                      <Badge>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

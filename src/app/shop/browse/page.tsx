'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { Order, OrderItem, Product, ShopCredit } from '@/domain/models';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { db } from '@/lib/firebase/client';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CreditCard, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/** ---------- UI Types ---------- */
type SettingsShop = { delivery_fee?: number };
type Booking = { status?: string; plan?: string; rental_type?: string }; // ใช้เฉพาะฟิลด์ที่ต้องเช็ค

export default function BrowseShopPage() {
  const { user, role } = useAuth();
  const { success, error } = useToast();
  const isStaff = role === 'admin' || role === 'support';

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Map<string, OrderItem>>(new Map());
  const [credit, setCredit] = useState<ShopCredit | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>(
    'pickup'
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // ---------- effects ----------
  useEffect(() => {
    void Promise.all([loadProducts(), loadSettings()]);
    if (!isStaff) void loadCredit();
  }, [user?.uid]); // eslint-disable-line

  // ---------- loaders ----------
  async function loadProducts() {
    try {
      const q = query(
        collection(db, 'products'),
        where('active', '==', true),
        orderBy('category'),
        orderBy('name')
      );
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    } catch (e) {
      console.error('loadProducts', e);
    }
  }

  async function loadSettings() {
    try {
      const s = await getDoc(doc(db, 'settings', 'shop'));
      const data = (s.exists() ? (s.data() as SettingsShop) : {}) || {};
      setDeliveryFee(Number(data.delivery_fee ?? 0));
    } catch {}
  }

  async function loadCredit() {
    if (!user) return;
    try {
      const [creditDoc, bookingSnap] = await Promise.all([
        getDoc(doc(db, 'shop_credits', user.uid)),
        getDocs(
          query(
            collection(db, 'bookings'),
            where('tenant_id', '==', user.uid),
            where('status', 'in', ['confirmed', 'checked_in']),
            limit(1)
          )
        ),
      ]);

      // ตรวจเป็นผู้เช่ารายเดือน
      const currentBooking = bookingSnap.docs[0]?.data() as Booking | undefined;
      const rentalToken = (
        currentBooking?.rental_type ||
        currentBooking?.plan ||
        ''
      )
        .toString()
        .toLowerCase();
      const isMonthly = ['monthly', 'รายเดือน', 'month'].some(t =>
        rentalToken.includes(t)
      );

      if (creditDoc.exists()) {
        const c = creditDoc.data() as ShopCredit & {
          enabled?: boolean;
          limit?: number;
        };
        // ถ้าไม่ได้เช่ารายเดือน -> treat เป็น disabled
        const enabled = Boolean(c.enabled && isMonthly);
        setCredit({
          ...c,
          enabled,
          // รองรับเอกสารเก่า: ถ้าไม่มี limit ให้ default 500
          limit: (c as any).limit ?? 500,
        } as any);
      } else {
        // ไม่มีเครดิต -> disabled
        setCredit({
          credit_available: 0,
          credit_used: 0,
          enabled: false,
        } as any);
      }
    } catch (e) {
      console.error('loadCredit', e);
    }
  }

  // ---------- cart helpers ----------
  function addToCart(p: Product) {
    setCart(prev => {
      const next = new Map(prev);
      const ex = next.get(p.id);
      if (ex) {
        ex.quantity += 1;
        ex.total = ex.quantity * ex.price;
      } else {
        next.set(p.id, {
          product_id: p.id,
          product_name: p.name,
          quantity: 1,
          price: p.price,
          total: p.price,
        });
      }
      return next;
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev => {
      const next = new Map(prev);
      const item = next.get(productId);
      if (item) {
        item.quantity = Math.max(0, item.quantity + delta);
        item.total = item.quantity * item.price;
        if (item.quantity === 0) next.delete(productId);
      }
      return next;
    });
  }

  const grouped = useMemo(() => {
    return products.reduce<Record<string, Product[]>>((acc, p) => {
      const key = String(p.category ?? '');
      (acc[key] ||= []).push(p);
      return acc;
    }, {});
  }, [products]);

  function calcTotal() {
    const subtotal = Array.from(cart.values()).reduce((s, i) => s + i.total, 0);
    const delivery = deliveryType === 'delivery' ? deliveryFee : 0;
    return { subtotal, delivery, total: subtotal + delivery };
  }

  /*** ✅ แก้ TS2869: coalesce ก่อน แล้วค่อยคำนวณ ***/
  function canUseCredit(): boolean {
    if (!credit || !credit.enabled) return false;

    const limit = (credit as any).limit ?? 500; // number
    const used = Number((credit as any).credit_used ?? 0); // number
    const avail = Number(credit.credit_available ?? 0); // number

    // วงเงินคงเหลือตาม limit (ต้องไม่ติดลบ)
    const remainingByLimit = Math.max(0, limit - used); // <- ไม่มี ?? ติดท้ายที่ทั้งนิพจน์
    // เครดิตที่ใช้ได้ = น้อยสุดระหว่างยอดคงเหลือในบัญชี กับ วงเงินคงเหลือตาม limit
    const remaining = Math.min(avail, remainingByLimit);

    return calcTotal().total <= remaining;
  }

  // ---------- submit ----------
  async function submitOrder() {
    if (!user) return;
    if (cart.size === 0) return;

    // ผู้ใช้ทั่วไปเท่านั้น
    if (isStaff) return;

    const { subtotal, delivery, total } = calcTotal();
    const useCredit = canUseCredit();

    setLoading(true);
    try {
      const orderData: Partial<Order> = {
        user_id: user.uid,
        items: Array.from(cart.values()),
        subtotal,
        delivery_fee: delivery,
        total,
        status: 'pending',
        payment_status: useCredit ? 'credit' : 'pending',
        delivery_type: deliveryType,
        notes,
        created_at: serverTimestamp() as any,
      };
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      if (useCredit) {
        await updateDoc(doc(db, 'shop_credits', user.uid), {
          credit_used: ((credit as any).credit_used ?? 0) + total,
          credit_available: Math.max(
            0,
            (credit as any).credit_available - total
          ),
          updated_at: serverTimestamp(),
        });
      }

      // หักสต็อก
      for (const item of cart.values()) {
        const ref = doc(db, 'products', item.product_id);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          const currentStock = snapshot.data().stock || 0;
          await updateDoc(ref, {
            stock: Math.max(0, currentStock - item.quantity),
          });
        }
      }

      // reset
      setCart(new Map());
      setNotes('');
      success('สั่งซื้อสำเร็จ');
    } catch (e: any) {
      console.error(e);
      error(e?.message ?? 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  // ---------- UI ----------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">ร้านค้า</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* รายการสินค้า */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category || 'ไม่ระบุหมวดหมู่'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{p.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ฿{p.price} / {p.unit || 'ชิ้น'}
                        </p>
                        <Badge
                          variant={p.stock > 0 ? 'success' : 'destructive'}
                        >
                          คงเหลือ {p.stock}
                        </Badge>
                      </div>

                      {cart.has(p.id) ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(p.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">
                            {cart.get(p.id)?.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(p.id, +1)}
                            disabled={
                              p.stock <= (cart.get(p.id)?.quantity || 0)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addToCart(p)}
                          disabled={p.stock === 0}
                        >
                          เพิ่ม
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ตะกร้า */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                ตะกร้าสินค้า
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.size === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  ยังไม่มีสินค้าในตะกร้า
                </p>
              ) : (
                <div className="space-y-4">
                  {Array.from(cart.values()).map(it => (
                    <div
                      key={it.product_id}
                      className="flex justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium">{it.product_name}</p>
                        <p className="text-muted-foreground">
                          {it.quantity} x ฿{it.price}
                        </p>
                      </div>
                      <p className="font-semibold">฿{it.total}</p>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ยอดรวม</span>
                      <span>฿{calcTotal().subtotal}</span>
                    </div>
                    {deliveryType === 'delivery' && (
                      <div className="flex justify-between text-sm">
                        <span>ค่าจัดส่ง</span>
                        <span>฿{deliveryFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>รวมทั้งหมด</span>
                      <span>฿{calcTotal().total}</span>
                    </div>
                  </div>

                  {credit && (
                    <div className="rounded-lg bg-accent/50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" /> เครดิตคงเหลือ
                        </span>
                        <span className="font-semibold">
                          ฿{credit.credit_available ?? 0}
                        </span>
                      </div>
                      {canUseCredit() ? (
                        <p className="text-xs text-success mt-1">
                          สามารถใช้เครดิตได้
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          ใช้เครดิตได้เฉพาะผู้เช่ารายเดือน และไม่เกินวงเงิน
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">วิธีรับสินค้า</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          deliveryType === 'pickup' ? 'default' : 'outline'
                        }
                        onClick={() => setDeliveryType('pickup')}
                      >
                        รับเอง
                      </Button>
                      <Button
                        variant={
                          deliveryType === 'delivery' ? 'default' : 'outline'
                        }
                        onClick={() => setDeliveryType('delivery')}
                      >
                        จัดส่ง (+฿{deliveryFee})
                      </Button>
                    </div>
                  </div>

                  <Input
                    label="หมายเหตุ"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม"
                  />

                  <Button
                    fullWidth
                    onClick={submitOrder}
                    loading={loading}
                    disabled={cart.size === 0}
                  >
                    ยืนยันสั่งซื้อ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

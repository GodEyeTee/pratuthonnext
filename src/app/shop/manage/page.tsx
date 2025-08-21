'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import KebabMenu from '@/components/ui/KebabMenu';
import type { Order, OrderItem, Product } from '@/domain/models';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { db } from '@/lib/firebase/client';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Barcode,
  Check,
  CreditCard,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

/** ---------- local types (ไม่ไปแตะ domain) ---------- */
type SettingsShop = { delivery_fee?: number };
type Tenant = {
  id: string;
  room_no?: string;
  name?: string;
  shop_credit_enabled?: boolean;
  shop_credit_limit?: number;
};
type ProductWithBarcode = Product & { barcode?: string };

/** ----------------------------------------------- */
export default function ManageShopPage() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [products, setProducts] = useState<ProductWithBarcode[]>([]);
  const [editing, setEditing] = useState<Partial<ProductWithBarcode> | null>(
    null
  );
  const [posCart, setPosCart] = useState<Map<string, OrderItem>>(new Map());
  const [scanCode, setScanCode] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantSearch, setTenantSearch] = useState('');

  const isStaff = role === 'admin' || role === 'support';

  useEffect(() => {
    void Promise.all([loadProducts(), loadSettings(), loadTenants()]);
    scanRef.current?.focus();
  }, []);

  /** ---------- loaders ---------- */
  async function loadProducts() {
    const snap = await getDocs(
      query(collection(db, 'products'), orderBy('name'))
    );
    setProducts(
      snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      })) as ProductWithBarcode[]
    );
  }

  async function loadSettings() {
    const s = await getDoc(doc(db, 'settings', 'shop'));
    const data = (s.exists() ? (s.data() as SettingsShop) : {}) || {};
    setDeliveryFee(Number(data.delivery_fee ?? 0));
  }

  async function loadTenants() {
    const snap = await getDocs(collection(db, 'tenants'));
    setTenants(
      snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Tenant[]
    );
  }

  /** ---------- Product CRUD ---------- */
  async function saveProduct(p: Partial<ProductWithBarcode>) {
    try {
      if (!p.name || p.price == null) return error('กรุณากรอกชื่อและราคา');

      if (p.id) {
        await updateDoc(doc(db, 'products', p.id), {
          name: p.name,
          price: p.price,
          stock: p.stock ?? 0,
          category: p.category ?? '',
          unit: p.unit ?? 'ชิ้น',
          barcode: p.barcode ?? '',
          active: p.active ?? true,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'products'), {
          name: p.name,
          price: p.price,
          stock: p.stock ?? 0,
          category: p.category ?? '',
          unit: p.unit ?? 'ชิ้น',
          barcode: p.barcode ?? '',
          active: p.active ?? true,
          created_at: serverTimestamp(),
        });
      }

      setEditing(null);
      await loadProducts();
      success('บันทึกสินค้าเรียบร้อย');
    } catch (e: any) {
      error(e?.message ?? 'บันทึกไม่สำเร็จ');
    }
  }

  async function removeProduct(id: string) {
    await deleteDoc(doc(db, 'products', id));
    await loadProducts();
    success('ลบสินค้าแล้ว');
  }

  /** ---------- POS / Barcode ---------- */
  async function addByBarcode(code: string) {
    if (!code) return;
    setScanCode('');
    // ค้นหาตาม field 'barcode'
    const snap = await getDocs(
      query(collection(db, 'products'), where('barcode', '==', code), limit(1))
    );
    const doc0 = snap.docs[0];
    if (!doc0) return error('ไม่พบสินค้า');
    const p = { id: doc0.id, ...(doc0.data() as any) } as ProductWithBarcode;
    addToCart(p);
  }

  function addToCart(p: ProductWithBarcode) {
    setPosCart(prev => {
      const next = new Map(prev);
      const ex = next.get(p.id);
      if (ex) {
        if (ex.quantity + 1 > (p.stock ?? 0)) return next;
        ex.quantity += 1;
        ex.total = ex.quantity * ex.price;
      } else {
        if ((p.stock ?? 0) <= 0) return next;
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

  function updateQty(id: string, delta: number) {
    setPosCart(prev => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) {
        item.quantity = Math.max(0, item.quantity + delta);
        item.total = item.quantity * item.price;
        if (item.quantity === 0) next.delete(id);
      }
      return next;
    });
  }

  const posTotal = useMemo(
    () => Array.from(posCart.values()).reduce((s, i) => s + i.total, 0),
    [posCart]
  );

  async function checkoutPOS(payment: 'cash' | 'online') {
    try {
      const items = Array.from(posCart.values());
      if (items.length === 0) return;

      // ✅ แก้ type ให้ตรงกับ union ของ Order
      const orderData: Partial<Order> = {
        user_id: 'POS',
        items,
        subtotal: posTotal,
        delivery_fee: 0,
        total: posTotal,
        status: 'delivered', // แทน 'completed' ให้ตรง union
        payment_status: 'paid', // map 'cash' | 'online' -> 'paid'
        delivery_type: 'pickup',
        notes: `POS sale (${payment})`, // เก็บวิธีจ่ายไว้ในบันทึก
        created_at: serverTimestamp() as any,
      };

      await addDoc(collection(db, 'orders'), orderData);

      // หักสต็อก
      for (const it of items) {
        const ref = doc(db, 'products', it.product_id);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          const currentStock = snapshot.data().stock || 0;
          await updateDoc(ref, {
            stock: Math.max(0, currentStock - it.quantity),
          });
        }
      }
      setPosCart(new Map());
      success('ชำระเงินสำเร็จ (POS)');
    } catch (e: any) {
      error(e?.message ?? 'ไม่สำเร็จ');
    }
  }

  /** ---------- Settings ---------- */
  async function saveSettings() {
    await setDoc(
      doc(db, 'settings', 'shop'),
      { delivery_fee: Number(deliveryFee) },
      { merge: true }
    );
    success('บันทึกค่าจัดส่งแล้ว');
  }

  /** ---------- Credit Permissions ---------- */
  const filteredTenants = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      t =>
        (t.room_no || '').toLowerCase().includes(q) ||
        (t.name || '').toLowerCase().includes(q)
    );
  }, [tenantSearch, tenants]);

  async function setTenantCredit(t: Tenant, enabled: boolean, limit = 500) {
    await updateDoc(doc(db, 'tenants', t.id), {
      shop_credit_enabled: enabled,
      shop_credit_limit: Number(limit),
      updated_at: serverTimestamp(),
    });
    await setDoc(
      doc(db, 'shop_credits', t.id),
      { enabled, limit: Number(limit) },
      { merge: true }
    );
    success('อัปเดตสิทธิ์ค้างสินค้าแล้ว');
  }

  /** ---------- UI ---------- */
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">
        ร้านค้า • จัดการ (POS / สินค้า / ค่าจัดส่ง / เครดิต)
      </h1>

      {/* POS */}
      <Card>
        <CardHeader>
          <CardTitle>POS ขายหน้าร้าน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              ref={scanRef}
              label="สแกนบาร์โค้ด"
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addByBarcode(scanCode.trim());
              }}
              leftIcon={<Barcode className="h-4 w-4" />}
              placeholder="สแกนแล้วกด Enter"
            />
            <Input
              label="ค้นหาสินค้า"
              placeholder="พิมพ์ชื่อแล้วคลิกเพิ่ม"
              onChange={() => {}}
              helperText="(สำหรับค้นหาแบบ manual ใช้รายการด้านล่าง)"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Card>
              <CardHeader>
                <CardTitle>รายการสินค้า</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {products.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ฿{p.price} • คงเหลือ {p.stock} • {p.barcode || '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => addToCart(p)}>
                        เพิ่ม
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  ตะกร้า POS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from(posCart.values()).map(it => (
                  <div
                    key={it.product_id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{it.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.quantity} x ฿{it.price}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQty(it.product_id, -1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{it.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQty(it.product_id, +1)}
                      >
                        +
                      </Button>
                      <span className="w-16 text-right font-semibold">
                        ฿{it.total}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>รวม</span>
                  <span>฿{posTotal}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    leftIcon={<Check className="h-4 w-4" />}
                    onClick={() => checkoutPOS('cash')}
                  >
                    ชำระสด
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    onClick={() => checkoutPOS('online')}
                  >
                    ชำระออนไลน์
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* สินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>จัดการสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() =>
              setEditing({ name: '', price: 0, stock: 0, active: true })
            }
          >
            เพิ่มสินค้า
          </Button>

          {editing && (
            <div className="grid md:grid-cols-5 gap-3 p-3 rounded-lg border">
              <Input
                label="ชื่อ"
                value={editing.name as any}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
              />
              <Input
                label="ราคา"
                type="number"
                value={editing.price as any}
                onChange={e =>
                  setEditing({ ...editing, price: Number(e.target.value) })
                }
              />
              <Input
                label="สต็อก"
                type="number"
                value={editing.stock as any}
                onChange={e =>
                  setEditing({ ...editing, stock: Number(e.target.value) })
                }
              />
              <Input
                label="หมวดหมู่"
                value={(editing as any).category || ''}
                onChange={e =>
                  setEditing({ ...editing, category: e.target.value })
                }
              />
              <Input
                label="บาร์โค้ด"
                value={(editing as any).barcode || ''}
                onChange={e =>
                  setEditing({ ...editing, barcode: e.target.value })
                }
              />
              <div className="col-span-full flex gap-2 justify-end">
                <Button
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={() => saveProduct(editing)}
                >
                  บันทึก
                </Button>
                {editing.id && (
                  <Button
                    variant="destructive"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => editing?.id && removeProduct(editing.id)}
                  >
                    ลบ
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-2">
            {products.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ฿{p.price} • คงเหลือ {p.stock} • {p.barcode || '—'}
                  </div>
                </div>
                <KebabMenu
                  items={[
                    { label: 'แก้ไข', onSelect: () => setEditing(p) },
                    {
                      label: 'ลบ',
                      destructive: true,
                      onSelect: () => removeProduct(p.id),
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ค่าจัดส่ง */}
      <Card>
        <CardHeader>
          <CardTitle>ตั้งค่าค่าจัดส่ง</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-end">
          <Input
            label="ค่าจัดส่ง (บาท)"
            type="number"
            value={deliveryFee}
            onChange={e => setDeliveryFee(Number(e.target.value))}
          />
          <Button
            leftIcon={<Save className="h-4 w-4" />}
            onClick={saveSettings}
          >
            บันทึก
          </Button>
        </CardContent>
      </Card>

      {/* สิทธิ์ค้างสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>สิทธิ์ค้างสินค้า (เฉพาะผู้เช่ารายเดือน)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="ค้นหา (ชื่อ/ห้อง)"
            value={tenantSearch}
            onChange={e => setTenantSearch(e.target.value)}
          />
          <div className="space-y-2">
            {filteredTenants.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{t.name || '-'}</div>
                  <div className="text-xs text-muted-foreground">
                    ห้อง {t.room_no || '-'} • เครดิต:{' '}
                    {t.shop_credit_enabled ? 'เปิด' : 'ปิด'} • วงเงิน{' '}
                    {t.shop_credit_limit ?? 500}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      setTenantCredit(t, true, t.shop_credit_limit ?? 500)
                    }
                  >
                    เปิด
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setTenantCredit(t, false, t.shop_credit_limit ?? 500)
                    }
                  >
                    ปิด
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

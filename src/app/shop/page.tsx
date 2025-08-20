'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
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
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CreditCard, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ShopPage() {
  const { user, role } = useAuth();
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Map<string, OrderItem>>(new Map());
  const [credit, setCredit] = useState<ShopCredit | null>(null);
  const [orderModal, setOrderModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>(
    'pickup'
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isStaff = role === 'admin' || role === 'support';
  const deliveryFee = 20;

  useEffect(() => {
    loadProducts();
    if (!isStaff) loadCredit();
  }, [user]);

  const loadProducts = async () => {
    try {
      const q = query(
        collection(db, 'products'),
        where('active', '==', true),
        orderBy('category'),
        orderBy('name')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadCredit = async () => {
    if (!user) return;
    try {
      const creditDoc = await getDoc(doc(db, 'shop_credits', user.uid));
      if (creditDoc.exists()) {
        setCredit(creditDoc.data() as ShopCredit);
      }
    } catch (err) {
      console.error('Error loading credit:', err);
    }
  };

  const addToCart = (product: Product) => {
    const newCart = new Map(cart);
    const existing = newCart.get(product.id);

    if (existing) {
      existing.quantity += 1;
      existing.total = existing.quantity * existing.price;
    } else {
      newCart.set(product.id, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
      });
    }

    setCart(newCart);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = new Map(cart);
    const item = newCart.get(productId);

    if (item) {
      item.quantity = Math.max(0, item.quantity + delta);
      item.total = item.quantity * item.price;

      if (item.quantity === 0) {
        newCart.delete(productId);
      }
    }

    setCart(newCart);
  };

  const calculateTotal = () => {
    const subtotal = Array.from(cart.values()).reduce(
      (sum, item) => sum + item.total,
      0
    );
    const delivery = deliveryType === 'delivery' ? deliveryFee : 0;
    return { subtotal, delivery, total: subtotal + delivery };
  };

  const canUseCredit = () => {
    if (!credit || !credit.enabled) return false;
    const { total } = calculateTotal();
    return credit.credit_available >= total;
  };

  const submitOrder = async () => {
    if (cart.size === 0) {
      error('กรุณาเลือกสินค้า');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, delivery, total } = calculateTotal();
      const useCredit = !isStaff && credit && canUseCredit();

      const orderData: Partial<Order> = {
        user_id: user!.uid,
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

      // Update credit if used
      if (useCredit && credit) {
        await updateDoc(doc(db, 'shop_credits', user!.uid), {
          credit_used: credit.credit_used + total,
          credit_available: credit.credit_available - total,
          updated_at: serverTimestamp(),
        });
      }

      // Update stock
      for (const item of cart.values()) {
        const productRef = doc(db, 'products', item.product_id);
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          await updateDoc(productRef, {
            stock: Math.max(0, currentStock - item.quantity),
          });
        }
      }

      success('สั่งซื้อสำเร็จ');
      setCart(new Map());
      setOrderModal(false);
      setNotes('');
    } catch (err: any) {
      error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- FIX TS2532: ให้ TS เห็นว่าอาร์เรย์ถูกกำหนดก่อน push ----
  const groupedProducts = products.reduce<Record<string, Product[]>>(
    (acc, product) => {
      // ไม่เดา schema เพิ่ม: แปลง key เป็น string อย่างปลอดภัย
      const key = String(product.category ?? '');
      const arr = acc[key] ?? (acc[key] = []);
      arr.push(product);
      return acc;
    },
    {}
  );

  return (
    <DashboardLayout title="ร้านค้า" subtitle="สั่งซื้อสินค้าและบริการ">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Products */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category || 'ไม่ระบุหมวดหมู่'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ฿{product.price} / {product.unit || 'ชิ้น'}
                        </p>
                        <Badge
                          variant={
                            product.stock > 0 ? 'success' : 'destructive'
                          }
                        >
                          คงเหลือ {product.stock}
                        </Badge>
                      </div>

                      {cart.has(product.id) ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(product.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">
                            {cart.get(product.id)?.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(product.id, 1)}
                            disabled={
                              product.stock <=
                              (cart.get(product.id)?.quantity || 0)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
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

        {/* Cart */}
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
                  {Array.from(cart.values()).map(item => (
                    <div
                      key={item.product_id}
                      className="flex justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} x ฿{item.price}
                        </p>
                      </div>
                      <p className="font-semibold">฿{item.total}</p>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ยอดรวม</span>
                      <span>฿{calculateTotal().subtotal}</span>
                    </div>
                    {deliveryType === 'delivery' && (
                      <div className="flex justify-between text-sm">
                        <span>ค่าจัดส่ง</span>
                        <span>฿{deliveryFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>รวมทั้งหมด</span>
                      <span>฿{calculateTotal().total}</span>
                    </div>
                  </div>

                  {!isStaff && credit && (
                    <div className="rounded-lg bg-accent/50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          เครดิตคงเหลือ
                        </span>
                        <span className="font-semibold">
                          ฿{credit.credit_available}
                        </span>
                      </div>
                      {canUseCredit() && (
                        <p className="text-xs text-success mt-1">
                          สามารถใช้เครดิตได้
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    fullWidth
                    onClick={() => setOrderModal(true)}
                    disabled={cart.size === 0}
                  >
                    สั่งซื้อ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Modal */}
      <Modal
        open={orderModal}
        onClose={() => setOrderModal(false)}
        title="ยืนยันการสั่งซื้อ"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">วิธีรับสินค้า</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={deliveryType === 'pickup' ? 'default' : 'outline'}
                onClick={() => setDeliveryType('pickup')}
              >
                รับเอง
              </Button>
              <Button
                variant={deliveryType === 'delivery' ? 'default' : 'outline'}
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

          <div className="rounded-lg bg-accent/50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ยอดรวม</span>
                <span>฿{calculateTotal().subtotal}</span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between">
                  <span>ค่าจัดส่ง</span>
                  <span>฿{deliveryFee}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>รวมทั้งหมด</span>
                <span>฿{calculateTotal().total}</span>
              </div>
              {!isStaff && credit && canUseCredit() && (
                <div className="flex justify-between text-success">
                  <span>ชำระด้วยเครดิต</span>
                  <span>-฿{calculateTotal().total}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOrderModal(false)}>
              ยกเลิก
            </Button>
            <Button onClick={submitOrder} loading={loading}>
              ยืนยันสั่งซื้อ
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

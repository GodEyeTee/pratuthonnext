'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { db } from '@/lib/firebase/client';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { Calculator, Droplets, Plus, Save, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Room {
  id: string;
  number: string;
  type: string;
  status: string;
  rate_monthly: number;
  water_rate: number;
  electric_rate: number;
  common_fee?: number;
}

interface MeterReading {
  id: string;
  roomId: string;
  month: string; // '01' - '12'
  year: number; // ค.ศ.
  waterMeter: number;
  electricMeter: number;
  waterUsage?: number;
  electricUsage?: number;
  waterCost?: number;
  electricCost?: number;
  commonFee?: number;
  totalCost?: number;
  recordedBy: string;
  recordedAt: Date;
  previousReading?: {
    waterMeter: number;
    electricMeter: number;
  } | null;
}

export default function MeterReadingsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  // Form states
  const [waterMeter, setWaterMeter] = useState('');
  const [electricMeter, setElectricMeter] = useState('');
  const [commonFee, setCommonFee] = useState('');

  const currentMonthLabel = new Date().toLocaleDateString('th-TH', {
    month: 'long',
  });
  const currentBuddhistYear = new Date().getFullYear() + 543;

  useEffect(() => {
    loadRooms();
    loadReadings();
  }, []);

  const loadRooms = async () => {
    try {
      const q = query(
        collection(db, 'rooms'),
        where('status', 'in', ['occupied', 'maintenance'])
      );
      const snapshot = await getDocs(q);
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Room, 'id'>),
      })) as Room[];
      setRooms(roomsData);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const loadReadings = async () => {
    try {
      const mm = new Date().getMonth() + 1;
      const yyyy = new Date().getFullYear();

      const q = query(
        collection(db, 'meter_readings'),
        where('year', '==', yyyy),
        where('month', '==', mm.toString().padStart(2, '0')),
        orderBy('recordedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const readingsData = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          recordedAt: data?.recordedAt?.toDate?.() || new Date(),
        } as MeterReading;
      });

      setReadings(readingsData);
    } catch (err) {
      console.error('Error loading readings:', err);
    }
  };

  const getPreviousReading = async (
    roomId: string
  ): Promise<MeterReading | null> => {
    try {
      const d = new Date();
      const prevMonthNum = d.getMonth() === 0 ? 12 : d.getMonth(); // 1..12
      const prevYear =
        d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();

      const q = query(
        collection(db, 'meter_readings'),
        where('roomId', '==', roomId),
        where('year', '==', prevYear),
        where('month', '==', prevMonthNum.toString().padStart(2, '0')),
        orderBy('recordedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const first = snapshot.docs[0];
      if (!first) return null;

      const data: any = first.data();
      return {
        id: first.id,
        ...data,
        recordedAt: data?.recordedAt?.toDate?.() || new Date(),
      } as MeterReading;
    } catch (err) {
      console.error('Error getting previous reading:', err);
      return null;
    }
  };

  const handleSaveReading = async () => {
    if (!selectedRoom || !waterMeter || !electricMeter) {
      error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const water = parseFloat(waterMeter);
      const electric = parseFloat(electricMeter);
      const common = parseFloat(commonFee) || selectedRoom.common_fee || 0;

      const prevReading = await getPreviousReading(selectedRoom.id);

      const waterUsage = prevReading
        ? Math.max(0, water - prevReading.waterMeter)
        : 0;
      const electricUsage = prevReading
        ? Math.max(0, electric - prevReading.electricMeter)
        : 0;

      const waterCost = waterUsage * selectedRoom.water_rate;
      const electricCost = electricUsage * selectedRoom.electric_rate;
      const totalCost = waterCost + electricCost + common;

      const readingData = {
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.number,
        month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        year: new Date().getFullYear(),
        waterMeter: water,
        electricMeter: electric,
        waterUsage,
        electricUsage,
        waterCost,
        electricCost,
        commonFee: common,
        totalCost,
        recordedBy: 'current_user', // TODO: inject from auth context
        recordedAt: serverTimestamp(),
        previousReading: prevReading
          ? {
              waterMeter: prevReading.waterMeter,
              electricMeter: prevReading.electricMeter,
            }
          : null,
      };

      await addDoc(collection(db, 'meter_readings'), readingData);

      success('บันทึกค่ามิเตอร์สำเร็จ');
      setIsModalOpen(false);
      resetForm();
      loadReadings();
    } catch (err: any) {
      error('เกิดข้อผิดพลาด: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setWaterMeter('');
    setElectricMeter('');
    setCommonFee('');
    setSelectedRoom(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);

  return (
    <DashboardLayout
      title="จดมิเตอร์น้ำ/ไฟ"
      subtitle={`ประจำเดือน ${currentMonthLabel} ${currentBuddhistYear}`}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ห้องที่จดแล้ว</p>
                  <p className="text-2xl font-bold">{readings.length}</p>
                </div>
                <Calculator className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    ห้องที่ยังไม่จด
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      rooms.filter(
                        r => !readings.find(rd => rd.roomId === r.id)
                      ).length
                    }
                  </p>
                </div>
                <Droplets className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">รวมค่าใช้จ่าย</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      readings.reduce((sum, r) => sum + (r.totalCost || 0), 0)
                    )}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>สถานะการจดมิเตอร์</CardTitle>
            <Button
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              จดมิเตอร์
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {rooms.map(room => {
                const reading = readings.find(r => r.roomId === room.id);
                const isRecorded = Boolean(reading);

                return (
                  <div
                    key={room.id}
                    className={cx(
                      'rounded-lg border p-4 cursor-pointer transition-colors',
                      isRecorded
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'hover:bg-accent/50'
                    )}
                    onClick={() => {
                      if (!isRecorded) {
                        setSelectedRoom(room);
                        setIsModalOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">ห้อง {room.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.type}
                        </p>
                      </div>
                      <Badge variant={isRecorded ? 'success' : 'secondary'}>
                        {isRecorded ? 'จดแล้ว' : 'รอจด'}
                      </Badge>
                    </div>

                    {isRecorded && (
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>น้ำ:</span>
                          <span>{reading?.waterUsage ?? 0} หน่วย</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ไฟ:</span>
                          <span>{reading?.electricUsage ?? 0} หน่วย</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>รวม:</span>
                          <span>{formatCurrency(reading?.totalCost ?? 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Record Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          title={`จดมิเตอร์${selectedRoom ? ` - ห้อง ${selectedRoom.number}` : ''}`}
          size="md"
        >
          <div className="space-y-4">
            {!selectedRoom && (
              <div className="grid grid-cols-2 gap-2">
                {rooms
                  .filter(r => !readings.find(rd => rd.roomId === r.id))
                  .map(room => (
                    <Button
                      key={room.id}
                      variant="outline"
                      onClick={() => setSelectedRoom(room)}
                    >
                      ห้อง {room.number}
                    </Button>
                  ))}
              </div>
            )}

            {selectedRoom && (
              <>
                <div className="rounded-lg bg-accent/50 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ห้อง:</span>
                      <span className="ml-2 font-semibold">
                        {selectedRoom.number}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ประเภท:</span>
                      <span className="ml-2">{selectedRoom.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">อัตราน้ำ:</span>
                      <span className="ml-2">
                        {selectedRoom.water_rate} บาท/หน่วย
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">อัตราไฟ:</span>
                      <span className="ml-2">
                        {selectedRoom.electric_rate} บาท/หน่วย
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="มิเตอร์น้ำ"
                    type="number"
                    value={waterMeter}
                    onChange={e => setWaterMeter(e.target.value)}
                    leftIcon={<Droplets className="h-4 w-4" />}
                    placeholder="เลขมิเตอร์ปัจจุบัน"
                    required
                  />
                  <Input
                    label="มิเตอร์ไฟ"
                    type="number"
                    value={electricMeter}
                    onChange={e => setElectricMeter(e.target.value)}
                    leftIcon={<Zap className="h-4 w-4" />}
                    placeholder="เลขมิเตอร์ปัจจุบัน"
                    required
                  />
                </div>

                <Input
                  label="ค่าส่วนกลาง (ถ้ามี)"
                  type="number"
                  value={commonFee}
                  onChange={e => setCommonFee(e.target.value)}
                  placeholder={`${selectedRoom.common_fee || 0} บาท`}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleSaveReading}
                    loading={loading}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    บันทึก
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

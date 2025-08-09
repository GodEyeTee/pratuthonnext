'use client';

import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';

export default function RoomActions({
  id,
  number,
}: {
  id: string;
  number: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { success, error } = useNotifications();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (loading) return;
    if (!confirm(`ยืนยันการลบห้อง ${number}?`)) return;
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        error('ลบไม่สำเร็จ', deleteError.message || 'ไม่มีสิทธิ์ลบห้อง');
        return;
      }

      success('ลบสำเร็จ', `ลบห้อง ${number} แล้ว`);
      startTransition(() => router.refresh());
    } catch (e: any) {
      console.error('Error:', e);
      error('ลบไม่สำเร็จ', e?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive"
      title="Delete"
      aria-label="Delete room"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

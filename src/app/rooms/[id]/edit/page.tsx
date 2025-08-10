import RoomForm from '@/app/rooms/components/RoomForm';
import { createClient } from '@/lib/supabase/server';

interface EditRoomPageProps {
  params: { id: string };
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const supabase = await createClient();
  const { data: room, error } = await supabase
    .from('rooms')
    .select(
      'id, number, type, status, floor, rate_daily, rate_monthly, water_rate, electric_rate'
    )
    .eq('id', params.id)
    .single();

  if (error || !room) {
    // คุณอาจ redirect/notFound() ตาม UX ที่ต้องการ
    return <div className="container py-6">Room not found.</div>;
  }

  return (
    <div className="container py-6 max-w-2xl">
      <RoomForm
        initial={{
          id: String(room.id),
          number: room.number,
          type: room.type,
          status: room.status,
          floor: room.floor,
          rate_daily: room.rate_daily,
          rate_monthly: room.rate_monthly,
          water_rate: room.water_rate,
          electric_rate: room.electric_rate,
        }}
      />
    </div>
  );
}

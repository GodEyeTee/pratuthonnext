/*
 * Edit room page
 *
 * Fetches the specified room by id and passes it to the RoomForm for editing.
 */

import RoomForm from '@/app/rooms/components/RoomForm';
import { createServerSupabase } from '@/lib/supabaseClient.server';
import { notFound } from 'next/navigation';

interface EditRoomPageProps {
  params: { id: string };
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const supabase = createServerSupabase();
  const { data: room, error } = await supabase
    .from('rooms')
    .select(
      'id, number, type, status, floor, rate_daily, rate_monthly, water_rate, electric_rate'
    )
    .eq('id', params.id)
    .single();
  if (error || !room) {
    console.error('Failed to fetch room for editing:', error?.message);
    notFound();
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Room</h1>
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

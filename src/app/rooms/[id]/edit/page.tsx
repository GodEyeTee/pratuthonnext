import { createClient } from '@/lib/supabase/server';
import RoomForm from '../../RoomForm';

interface EditRoomPageProps {
  params: { id: string };
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const supabase = await createClient();
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', params.id)
    .single();

  return (
    <div className="container py-6 max-w-2xl">
      <RoomForm room={room!} />
    </div>
  );
}

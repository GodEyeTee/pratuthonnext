export const runtime = 'nodejs';

import RoomForm from '@/app/rooms/components/RoomForm';
import { adminDb } from '@/lib/firebase/admin';
import { notFound } from 'next/navigation';

type P = { id: string };

export default async function EditRoomPage({ params }: { params: Promise<P> }) {
  const { id } = await params;

  const snap = await adminDb.collection('rooms').doc(id).get();
  if (!snap.exists) notFound();

  const r = snap.data() as any;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Room</h1>
      <RoomForm
        initial={{
          id,
          number: r.number,
          type: r.type,
          status: r.status,
          floor: r.floor,
          rate_daily: r.rate_daily,
          rate_monthly: r.rate_monthly,
          water_rate: r.water_rate,
          electric_rate: r.electric_rate,
          size: r.size ?? null,
          amenities: r.amenities ?? [],
          images: r.images ?? [],
          description: r.description ?? '',
        }}
      />
    </div>
  );
}

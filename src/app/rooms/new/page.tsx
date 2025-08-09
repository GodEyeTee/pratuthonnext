/*
 * Create new room page
 *
 * Renders the RoomForm without initial data, allowing the admin or support
 * staff to create a new room. Server side code can be added here if you
 * want to prefetch enumeration data (e.g. room types).
 */

import RoomForm from '../components/RoomForm';

export default function NewRoomPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create Room</h1>
      <RoomForm />
    </div>
  );
}

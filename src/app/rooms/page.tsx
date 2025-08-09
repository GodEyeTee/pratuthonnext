/*
 * Rooms listing page
 *
 * This server component lists all rooms and allows filtering by status, type,
 * floor and search term. It uses server‑side Supabase queries with
 * column selection and pagination to reduce payload size and latency.
 */

import RoomActions from '@/app/rooms/components/RoomActions';
import { createServerSupabase } from '@/lib/supabaseClient.server';
import Link from 'next/link';

// Define the allowed query string parameters and their types
type RoomsSearchParams = {
  q?: string;
  status?: string;
  type?: string;
  floor?: string;
  page?: string;
  perPage?: string;
};

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: RoomsSearchParams;
}) {
  const supabase = createServerSupabase();
  // Parse pagination
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = parseInt(searchParams.perPage || '20', 10);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  // Build filters
  const q = searchParams.q?.trim();
  const status = searchParams.status?.trim();
  const type = searchParams.type?.trim();
  const floor = searchParams.floor
    ? parseInt(searchParams.floor, 10)
    : undefined;
  // Build base query selecting only columns needed
  let listQuery = supabase
    .from('rooms')
    .select(
      'id, number, type, status, floor, rate_daily, rate_monthly, water_rate, electric_rate',
      { count: 'exact' }
    )
    .order('number', { ascending: true })
    .range(from, to);
  if (q) {
    listQuery = listQuery.ilike('number', `%${q}%`);
  }
  if (status) {
    listQuery = listQuery.eq('status', status);
  }
  if (type) {
    listQuery = listQuery.eq('type', type);
  }
  if (typeof floor === 'number' && !isNaN(floor)) {
    listQuery = listQuery.eq('floor', floor);
  }
  // Example of calling an RPC function to compute aggregate stats. Replace
  // `rooms_stats_filtered` with your own function or remove if unused.
  const statsPromise = supabase.rpc('rooms_stats_filtered', {
    p_q: q || null,
    p_status: status || null,
    p_type: type || null,
    p_floor: typeof floor === 'number' ? floor : null,
  });
  const [{ data: rooms, count, error }, { data: stats }] = await Promise.all([
    listQuery,
    statsPromise,
  ]);
  if (error) {
    console.error('Failed to fetch rooms:', error.message);
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rooms</h1>
        <Link
          href="/rooms/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Room
        </Link>
      </div>
      {/* Search and filters could go here */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Number</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Floor</th>
              <th className="px-3 py-2 text-left">Daily Rate</th>
              <th className="px-3 py-2 text-left">Monthly Rate</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms?.map(room => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">{room.number}</td>
                <td className="px-3 py-2 whitespace-nowrap capitalize">
                  {room.type}
                </td>
                <td className="px-3 py-2 whitespace-nowrap capitalize">
                  {room.status}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{room.floor}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {room.rate_daily}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {room.rate_monthly}
                </td>
                <td className="px-3 py-2 whitespace-nowrap space-x-2">
                  <Link
                    href={`/rooms/${room.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  {/* Delete action */}
                  <RoomActions id={String(room.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      {typeof count === 'number' && (
        <div className="flex justify-between items-center mt-4">
          <div>
            Page {page} of {Math.ceil(count / perPage)} (Total {count} rooms)
          </div>
          <div className="space-x-2">
            {page > 1 && (
              <Link
                href={{
                  pathname: '/rooms',
                  query: { ...searchParams, page: (page - 1).toString() },
                }}
                className="px-3 py-1 border rounded"
              >
                Previous
              </Link>
            )}
            {page < Math.ceil(count / perPage) && (
              <Link
                href={{
                  pathname: '/rooms',
                  query: { ...searchParams, page: (page + 1).toString() },
                }}
                className="px-3 py-1 border rounded"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

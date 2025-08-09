import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';

export default async function BookingsPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      *,
      rooms (number, type, floor),
      tenants (first_name, last_name, phone)
    `
    )
    .order('created_at', { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title="Bookings" subtitle="Manage bookings">
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Room</th>
                  <th className="text-left py-3">Tenant</th>
                  <th className="text-left py-3">Type</th>
                  <th className="text-left py-3">Check In</th>
                  <th className="text-left py-3">Check Out</th>
                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings?.map(booking => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-3">{booking.rooms?.number}</td>
                    <td className="py-3">
                      {booking.tenants?.first_name} {booking.tenants?.last_name}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{booking.booking_type}</Badge>
                    </td>
                    <td className="py-3">
                      {new Date(booking.check_in_date).toLocaleDateString(
                        'th-TH'
                      )}
                    </td>
                    <td className="py-3">
                      {booking.check_out_date
                        ? new Date(booking.check_out_date).toLocaleDateString(
                            'th-TH'
                          )
                        : '-'}
                    </td>
                    <td className="py-3">{getStatusBadge(booking.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

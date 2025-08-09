import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { Mail, Phone, User } from 'lucide-react';

export default async function TenantsPage() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from('tenants')
    .select(
      `
      *,
      bookings!inner (
        status,
        room_id,
        rooms (number, type, floor)
      )
    `
    )
    .eq('bookings.status', 'active')
    .order('created_at', { ascending: false });

  return (
    <DashboardLayout title="Tenants" subtitle="Manage tenants">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants?.map(tenant => (
          <Card key={tenant.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Room {tenant.bookings?.[0]?.rooms?.number}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {tenant.first_name} {tenant.last_name}
              </h3>
              <div className="space-y-2 text-sm">
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {tenant.phone}
                  </div>
                )}
                {tenant.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {tenant.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

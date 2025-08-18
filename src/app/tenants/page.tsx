export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import TenantsTable from '@/app/tenants/TenantsTable';
import { adminDb } from '@/lib/firebase/admin';

export type TenantRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  room?: string | null;
  status?: 'active' | 'inactive';
  created_at?: string | null;
  updated_at?: string | null;
};

export default async function TenantsPage() {
  const snap = await adminDb
    .collection('tenants')
    .orderBy('created_at', 'desc')
    .get();
  const tenants: TenantRow[] = snap.docs.map(d => {
    const x = d.data() as any;
    return {
      id: d.id,
      name: x.name ?? '',
      email: x.email ?? null,
      phone: x.phone ?? null,
      room: x.room ?? null,
      status: (x.status as 'active' | 'inactive') ?? 'active',
      created_at: x.created_at ?? null,
      updated_at: x.updated_at ?? null,
    };
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Manage building/room tenants
          </p>
        </div>
      </div>

      <TenantsTable initialTenants={tenants} />
    </div>
  );
}

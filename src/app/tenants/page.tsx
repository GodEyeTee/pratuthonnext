import { adminDb } from '@/lib/firebase/admin';
import Link from 'next/link';

type Tenant = {
  id: string;
  name: string;
  email?: string | null;
  roomNumber?: string | number | null;
  createdAt?: Date | string | null;
};

export default async function TenantsPage() {
  const snap = await adminDb
    .collection('tenants')
    .orderBy('createdAt', 'desc')
    .get();
  const tenants: Tenant[] = snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as any),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <Link
          href="/tenants/new"
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Add Tenant
        </Link>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 text-sm text-muted-foreground border-b">
          All Tenants
        </div>
        <ul className="divide-y">
          {tenants.map((tenant: Tenant) => {
            const date = tenant.createdAt
              ? tenant.createdAt instanceof Date
                ? tenant.createdAt
                : new Date(tenant.createdAt)
              : null;
            return (
              <li
                key={tenant.id}
                className="px-4 py-3 hover:bg-muted/40 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {tenant.email || '-'} • Room {tenant.roomNumber ?? '-'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {date ? date.toLocaleDateString() : '-'}
                </div>
              </li>
            );
          })}
          {!tenants.length && (
            <li className="p-10 text-center text-muted-foreground">
              No tenants.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

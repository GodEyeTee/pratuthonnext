import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { adminDb } from '@/lib/firebase/admin';
import { Shield, UserCheck, UserPlus, Users } from 'lucide-react';

type Profile = {
  id: string;
  email: string | null;
  display_name?: string | null; // legacy field
  displayName?: string | null; // new field
  role: 'admin' | 'support' | 'user' | string;
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
};

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin':
      return <Badge variant="destructive">Admin</Badge>;
    case 'support':
      return <Badge variant="info">Support</Badge>;
    default:
      return <Badge variant="success">User</Badge>;
  }
}

export default async function AdminUsersPage() {
  // อ่านจาก Firestore (users)
  const snap = await adminDb
    .collection('users')
    .orderBy('createdAt', 'desc')
    .get();
  const profiles: Profile[] = snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as any),
  }));

  const admins =
    profiles.filter((p: Profile) => p.role === 'admin').length || 0;
  const supports =
    profiles.filter((p: Profile) => p.role === 'support').length || 0;
  const users = profiles.filter((p: Profile) => p.role === 'user').length || 0;

  const stats = [
    {
      label: 'Total Users',
      value: profiles.length || 0,
      icon: Users,
      color: 'from-blue-400 to-blue-600',
    },
    {
      label: 'Admins',
      value: admins,
      icon: Shield,
      color: 'from-red-400 to-red-600',
    },
    {
      label: 'Support Staff',
      value: supports,
      icon: UserCheck,
      color: 'from-orange-400 to-orange-600',
    },
    {
      label: 'Regular Users',
      value: users,
      icon: UserPlus,
      color: 'from-green-400 to-green-600',
    },
  ];

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage users and their roles"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="py-3 text-left font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="py-3 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="py-3 text-left font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="py-3 text-left font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile: Profile) => {
                    const created =
                      (profile.createdAt ?? profile.created_at) || null;
                    const createdDate =
                      created instanceof Date
                        ? created
                        : created
                          ? new Date(created as string)
                          : null;
                    return (
                      <tr
                        key={profile.id}
                        className="border-b dark:border-gray-700 hover:bg-accent/50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3">{profile.email ?? '-'}</td>
                        <td className="py-3">
                          {profile.displayName ?? profile.display_name ?? '-'}
                        </td>
                        <td className="py-3">{getRoleBadge(profile.role)}</td>
                        <td className="py-3 text-muted-foreground">
                          {createdDate
                            ? createdDate.toLocaleDateString('th-TH')
                            : '-'}
                        </td>
                        <td className="py-3 text-right">
                          <Button size="sm" variant="ghost">
                            Edit Role
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

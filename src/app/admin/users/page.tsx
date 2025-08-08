import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Email</th>
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Role</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {profiles?.map(profile => (
                <tr key={profile.id} className="border-b hover:bg-muted/50">
                  <td className="py-2">{profile.email}</td>
                  <td className="py-2">{profile.display_name}</td>
                  <td className="py-2 capitalize">{profile.role}</td>
                  <td className="py-2 text-right">
                    <Button size="sm" variant="ghost">Edit Role</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

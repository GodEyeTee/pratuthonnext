import { createClient } from '@/lib/supabase/server';

export default async function AdminUsersPage() {
  const supabase = await createClient(); // เพิ่ม await

  // Get all users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1>Manage Users</h1>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles?.map(profile => (
            <tr key={profile.id}>
              <td>{profile.email}</td>
              <td>{profile.display_name}</td>
              <td>{profile.role}</td>
              <td>
                <button>Edit Role</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

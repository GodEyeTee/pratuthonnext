/*
 * Profile page
 *
 * This server component renders the profile page for the currently logged in
 * user. It allows the user to view and update their display name and avatar.
 * Only the owner can edit their profile; this is enforced in the middleware
 * and again in the server action. If no user is logged in, the middleware
 * will have already redirected the request to `/login`.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '../../lib/supabaseClient.server';

// Server action to update the profile. This runs only on the server.
export async function updateProfileAction(prevState: any, formData: FormData) {
  'use server';
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  const displayName = formData.get('display_name') as string;
  const avatarUrl = formData.get('avatar_url') as string | null;
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, avatar_url: avatarUrl })
    .eq('id', user.id);
  if (error) {
    // In a real app, you may want to surface this error to the client
    console.error('Failed to update profile:', error.message);
  }
  // Revalidate the profile page so the updated data is reflected
  revalidatePath('/profile');
  return { success: !error };
}

export default async function ProfilePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  // Fetch profile record for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">My Profile</h1>
      <form
        action={updateProfileAction}
        className="space-y-4"
        encType="multipart/form-data"
      >
        <div>
          <label htmlFor="email" className="block mb-1 text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user.email ?? ''}
            disabled
            className="w-full p-2 border rounded bg-gray-200 cursor-not-allowed"
          />
        </div>
        <div>
          <label
            htmlFor="display_name"
            className="block mb-1 text-sm font-medium"
          >
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            defaultValue={profile?.display_name ?? ''}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label
            htmlFor="avatar_url"
            className="block mb-1 text-sm font-medium"
          >
            Avatar URL
          </label>
          <input
            id="avatar_url"
            name="avatar_url"
            type="url"
            defaultValue={profile?.avatar_url ?? ''}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

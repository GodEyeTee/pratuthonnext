// Server Component — ใช้ server action อัปเดตโปรไฟล์
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// server action: ห้ามใส่ method/encType ที่ <form> ฝั่ง client (React จัดการให้)
export async function updateProfileAction(formData: FormData): Promise<void> {
  'use server';
  const supabase = await createClient(); // ✅ Next 15: ต้อง await
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const displayName =
    (formData.get('display_name') as string | null)?.trim() || null;
  const avatarUrl =
    (formData.get('avatar_url') as string | null)?.trim() || null;

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, avatar_url: avatarUrl })
    .eq('id', user.id);

  if (error) {
    console.error('[profile.update]', error.message);
  }
  revalidatePath('/profile');
}

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient(); // ✅ await
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          You are not signed in.{' '}
          <a className="text-blue-600 underline" href="/login">
            Login
          </a>
        </p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground dark:bg-gray-900/80 dark:border-gray-800">
        <div className="p-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user.email ?? ''}
              disabled
              className="w-full p-2 rounded-md border bg-muted text-foreground/80 cursor-not-allowed"
            />
          </div>

          {/* Profile form */}
          {/* ✅ อย่าใส่ method/encType เมื่อ action เป็น function */}
          <form action={updateProfileAction} className="space-y-4">
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
                className="w-full p-2 rounded-md border bg-background"
                placeholder="Your name"
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
                className="w-full p-2 rounded-md border bg-background"
                placeholder="https://…"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use a direct image link or configure storage upload later.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Save changes
              </button>
              <a
                href="/settings"
                className="px-4 py-2 rounded-md border hover:bg-muted"
              >
                Go to settings
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Preview */}
      {(profile?.avatar_url || profile?.display_name) && (
        <div className="rounded-xl border bg-card dark:bg-gray-900/80 dark:border-gray-800">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  N/A
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Display name</div>
              <div className="text-lg font-medium">
                {profile?.display_name || '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

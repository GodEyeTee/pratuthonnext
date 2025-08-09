/*
 * Help & FAQ page
 *
 * This static page provides basic help and frequently asked questions for
 * tenants and staff. You can expand this page with more content or link to
 * external documentation as needed.
 */

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Help & FAQ</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-2">How do I book a room?</h2>
          <p>
            Contact the admin or support team, or navigate to the bookings
            section (if you have access) to select an available room and submit
            a booking request.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-2">
            How do I update my profile?
          </h2>
          <p>
            Go to the profile page using the sidebar, edit your display name and
            avatar, then click <strong>Save Changes</strong>.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-2">
            Who can access rooms and bookings?
          </h2>
          <p>
            Only users with <em>admin</em> or <em>support</em> roles can view or
            manage rooms, tenants and bookings. Regular tenants can only manage
            their own profile.
          </p>
        </section>
      </div>
    </div>
  );
}

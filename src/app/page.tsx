export default function LandingPage() {
  return (
    <main className="min-h-[80vh] flex items-center">
      <div className="mx-auto max-w-5xl px-6 space-y-8">
        <section className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Pratuthong Rooms
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ระบบจัดการห้องเช่าแบบเรียลไทม์ — จอง ตรวจสอบสถานะ
            และดูประวัติการเข้าพักได้ในที่เดียว
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
            >
              Login with Google
            </a>
            <a
              href="#features"
              className="px-5 py-2.5 rounded-xl border hover:bg-muted"
            >
              Learn more
            </a>
          </div>
        </section>

        <section
          id="features"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[
            ['จัดการห้องพัก', 'สร้าง/อัปเดตสถานะห้อง, ราคาต่อวัน/เดือน'],
            ['การจอง', 'ดูตารางจอง ตรวจสอบเข้า-ออก และประวัติ'],
            ['สิทธิ์การเข้าถึง', 'RBAC: admin/support/user ปลอดภัย'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border p-5 bg-card">
              <div className="text-lg font-semibold">{title}</div>
              <div className="text-sm text-muted-foreground">{desc}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

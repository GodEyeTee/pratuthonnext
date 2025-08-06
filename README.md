# 📄 ระบบ Authentication และ Backend ด้วย Next.js 15 + Supabase + Sentry

โปรเจกต์นี้เป็นระบบจัดการผู้ใช้งานที่สมบูรณ์ สร้างด้วย Next.js 15, Supabase สำหรับ Authentication และ Database, และ Sentry สำหรับติดตามข้อผิดพลาด

## 🔧 เทคโนโลยีที่ใช้

- **Frontend Framework**: Next.js 15 (App Router)
- **Database + Auth**: Supabase (PostgreSQL)
- **Error Monitoring**: Sentry
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## ✍️ Feature หลัก

- ✅ ระบบล็อกอินผ่าน Google OAuth (Single click auth)
- ✅ Routing แบบปลอดภัยด้วย Middleware
- ✅ ป้องกัน unauthorized access
- ✅ รองรับการตรวจสอบ error ด้วย Sentry
- ✅ โครงสร้างไฟล์ปลอดภัยและเข้าใจง่าย

## 🚀 การติดตั้งและตั้งค่า

### ขั้นตอนที่ 1: Clone หรือดาวน์โหลดโปรเจกต์

```bash
git clone <your-repo-url>
cd pratuthong
npm install
```

### ขั้นตอนที่ 2: ตั้งค่า Supabase

1. **สมัครบัญชี Supabase**: เข้าไปที่ [https://supabase.com/](https://supabase.com/)
2. **สร้าง Project**:

- ตั้งชื่อ project (เช่น pratuthong-auth)
- เลือก Region (แนะนำ Singapore สำหรับผู้ใช้ในไทย)
- รอจนกว่าจะสร้างเสร็จ (ประมาณ 2-5 นาที)

3. **ตั้งค่า Google OAuth**:

- ไปที่แท็บ Authentication > Providers
- เปิด Google provider
- กรอก Client ID และ Client Secret จาก Google Developer Console
- ตั้งค่า Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

4. **รับค่า Environment Variables**:

- ไปที่ Project Settings > API
- คัดลอกค่าต่อไปนี้:
- Project URL
- anon public key
- service_role key

### ขั้นตอนที่ 3: ตั้งค่า Google Developer Console

1. **สร้าง Project บน Google Cloud**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. **เปิด Google+ API**:

- ไปที่ APIs & Services > Library
- ค้นหา "Google+ API" และเปิดใช้งาน

3. **สร้าง OAuth 2.0 Credentials**:

- ไปที่ APIs & Services > Credentials
- สร้าง OAuth 2.0 Client ID
- เลือก Application type: Web application
- เพิ่ม Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

### ขั้นตอนที่ 4: ตั้งค่า Sentry (ไม่บังคับ แต่แนะนำ)

1. **สมัครบัญชี Sentry**: [https://sentry.io/](https://sentry.io/)
2. **สร้าง Project**: เลือก Next.js
3. **รับ DSN**: คัดลอก DSN จาก project settings

### ขั้นตอนที่ 5: ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ใน root directory และเพิ่มค่าต่อไปนี้:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Sentry Configuration
SENTRY_DSN=your-sentry-dsn-here
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn-here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### ขั้นตอนที่ 6: รันโปรเจกต์

```bash
npm run dev
```

เปิด browser ที่ [http://localhost:3000](http://localhost:3000)

## 📂 โครงสร้างโฟลเดอร์

```
src/
├── app/
│ ├── layout.tsx
│ ├── page.tsx
│ ├── login/
│ │ └── page.tsx
│ ├── dashboard/
│ │ └── page.tsx (Protected)
│ └── middleware.ts
├── lib/
│ ├── supabaseClient.ts
│ ├── auth.ts (session checker)
│ └── sentry.ts
├── types/
│ └── user.ts
├── components/
│ ├── GoogleButton.tsx
│ └── LogoutButton.tsx
└── utils/
└── validate.ts
```

## 🛋️ การทำงานของระบบ

### Authentication Flow

1. **หน้า /login**: แสดงปุ่ม Google Sign-In
2. **Supabase Redirect**:

- ผู้ใช้คลิกปุ่ม Google
- Supabase redirect ไปยัง Google
- Google ยืนยันตัวตนและ redirect กลับ

3. **Session Management**:

- Supabase เก็บ session ใน cookie
- Middleware ตรวจสอบ session ทุกครั้งที่มีการเข้าถึงหน้าที่ป้องกัน

### Secure Routing

- **Middleware**: ตรวจสอบ session ทุกหน้าใน protected route (`/dashboard/*`)
- **Auto Redirect**: ถ้าไม่มี session จะ redirect ไปหน้า `/login`
- **Auto Login**: ถ้ามี session แล้วพยายามเข้าหน้า `/login` จะ redirect ไป `/dashboard`

## 🔌 API และ Routes

### Protected Routes

- `/dashboard/*` - ต้องการการล็อกอิน

### Public Routes

- `/` - หน้าแรก
- `/login` - หน้าล็อกอิน

## ⚡ Performance & Security

✅ **ใช้ Supabase Auth Session cookie** (ไม่เก็บ token ฝั่ง client)
✅ **เปิดการตรวจสอบ CORS** เฉพาะ origin ที่เชื่อถือได้
✅ **ใช้ Supabase RLS** (Row Level Security)
✅ **ใช้ Middleware** ตรวจทุก API และ Route
✅ **ใช้ Sentry** คอย log ทุก error ทั้ง client และ server

## 🚨 การป้องกันช่องโหว่

| ปัญหา                  | วิธีจัดการ                                           |
| ---------------------- | ---------------------------------------------------- |
| CVE-2025-29927         | ใช้ Middleware ที่ป้องกัน bypass ได้หมด              |
| useState misuse        | แยก state management, หลีกเลี่ยง nested useEffect    |
| Sensitive API exposure | ตรวจ input, sanitize, และใช้ Server-side calls       |
| ซ้ำซ้อน API call       | ใช้ caching และ optimize database queries            |
| Session leak           | ใช้ @supabase/auth-helpers-nextjs + middleware guard |
| Memory leak            | Unsubscribe listener ทุกครั้งที่ unmount component   |

## 📊 การขยายโปรเจกต์

### หากต้องการเพิ่มฟีเจอร์:

- **React Query**: สำหรับการจัดการ server state
- **React Hook Form**: สำหรับฟอร์มที่ซับซ้อน
- **Prisma**: สำหรับ query ที่ซับซ้อนขึ้น (แต่ยังใช้ Supabase DB)
- **Atomic Design**: หาก component เยอะ

### หากโปรเจกต์โต:

- เพิ่ม Prisma เพื่อ query ซับซ้อนมากขึ้น
- ใช้ Redis สำหรับ caching
- เพิ่ม CI/CD pipeline
- ใช้ Docker สำหรับ deployment

## 🤝 การมีส่วนร่วม

1. Fork โปรเจกต์
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไปยัง branch
5. สร้าง Pull Request

## 📄 ใบอนุญาต

MIT License

## 🆘 การสนับสนุน

หากพบปัญหาหรือมีคำถาม:

- สร้าง Issue บน GitHub
- ติดต่อผู้พัฒนา
- อ่าน documentation เพิ่มเติมที่ [Supabase Docs](https://supabase.com/docs) และ [Next.js Docs](https://nextjs.org/docs)

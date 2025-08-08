# 🏠 Room Rental Management System

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.11-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

> **ระบบจัดการห้องเช่าทั้งรายวันและรายเดือน** พร้อมระบบ RBAC (Role-Based Access Control) ที่สมบูรณ์แบบ

## ✨ Features

### 🔐 **Security & RBAC**

- **Role-Based Access Control**: Admin, Support, User roles
- **OAuth Integration**: Google Sign-In with Supabase Auth
- **Row Level Security**: Database-level protection
- **Session Management**: Secure session handling with automatic refresh

### 🏠 **Room Management**

- **Daily & Monthly Rentals**: Flexible rental periods
- **Room Status Tracking**: Available, Occupied, Maintenance
- **Booking System**: Easy reservation management
- **Payment Tracking**: Rental payment monitoring

### 🎨 **Modern UI/UX**

- **Clean Architecture**: Well-structured codebase
- **Dark/Light Themes**: Automatic system preference detection
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Thai/English Support**: Multi-language interface

### 📊 **Dashboard & Monitoring**

- **Real-time Statistics**: Room occupancy, revenue tracking
- **Activity Logging**: Complete audit trail
- **Error Monitoring**: Sentry integration for production monitoring

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.18.0 or higher
- **npm** 11.4.1 or higher
- **Supabase Account** (free tier available)
- **Sentry Account** (optional, for error monitoring)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/room-rental-system.git
cd room-rental-system

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Environment Setup

Edit `.env.local` with your configuration:

```env
# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Error Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn

# Application Settings
NEXT_PUBLIC_APP_NAME="Room Rental System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database schema (create tables for rooms, bookings, etc.)
3. Set up Row Level Security policies
4. Create your first admin user

### 4. Start Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:3000
```

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 15)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │ Components  │  │   Hooks     │        │
│  │   /app      │  │   /ui       │  │  /auth      │        │
│  │             │  │  /layout    │  │  /locale    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    Middleware Layer                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │          RBAC Middleware & Route Protection             │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Backend (Supabase)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PostgreSQL  │  │   Auth      │  │  Real-time  │        │
│  │    RLS      │  │  OAuth      │  │    APIs     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🎭 Role System

### 👑 Admin (ผู้ดูแลระบบ)

- Full system management
- User role management
- Room and booking oversight
- Financial reports access
- System settings configuration

### 🛠️ Support (ฝ่ายสนับสนุน)

- Customer assistance
- Booking management
- Basic reporting access
- Room status updates

### 👤 User (ผู้เช่า)

- View available rooms
- Make bookings
- Manage own profile
- View booking history

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth-related pages
│   ├── admin/          # Admin pages
│   ├── api/            # API routes
│   └── dashboard/      # Dashboard pages
├── components/         # React components
│   ├── ui/            # Design system components
│   └── layout/        # Layout components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
│   ├── auth/          # Authentication utilities
│   ├── rbac/          # RBAC system
│   └── utils/         # General utilities
├── types/             # TypeScript definitions
└── constants/         # Application constants
```

## 🔧 Development

### Fixed Issues ✅

เวอร์ชันนี้แก้ไขปัญหาสำคัญต่อไปนี้:

1. **TypeScript Errors**: แก้ไข type safety issues ทั้งหมด
2. **JSX Syntax**: แก้ไข React component syntax errors
3. **Deprecated Packages**: ลบ `@tailwindcss/aspect-ratio` และใช้ native CSS `aspect-ratio`
4. **Clean Architecture**: ปรับปรุงโครงสร้างไฟล์ให้เป็น Clean Architecture
5. **File Organization**: ย้ายไฟล์ไปตำแหน่งที่เหมาะสม

### Code Style

```bash
# Lint code
npm run lint

# Format code with Prettier
npm run lint:fix

# Type check
npm run type-check
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Project Structure (Updated)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-related pages
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── ui/               # Design system components
│   └── layout/           # Layout components (ErrorBoundary, RoleGuard)
├── hooks/                # Custom React hooks (useAuth, useLocale, useTheme, useToast)
├── lib/                  # Core business logic & utilities
│   ├── auth.server.ts    # Server-side auth utilities
│   ├── auth.client.ts    # Client-side auth utilities
│   ├── rbac.middleware.ts # RBAC middleware
│   ├── rbac.config.ts    # RBAC configuration
│   ├── i18n.config.ts    # Internationalization config
│   ├── theme.config.ts   # Theme configuration
│   ├── env.validation.ts # Environment validation
│   ├── sentry.utils.ts   # Error monitoring utilities
│   └── utils.ts          # General utilities
├── types/                # TypeScript definitions
│   └── rbac.ts          # RBAC type definitions
└── instrumentation.ts    # Next.js instrumentation (Sentry)
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (Error Monitoring)
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn

# Application
NEXT_PUBLIC_APP_NAME="Room Rental System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Key Changes Made

- ✅ **Fixed all TypeScript errors** with proper type safety
- ✅ **Removed deprecated packages** (`@tailwindcss/aspect-ratio`)
- ✅ **Improved Clean Architecture** with better file organization
- ✅ **Fixed JSX syntax issues** in hook components
- ✅ **Enhanced RBAC system** for room rental management
- ✅ **Updated dependencies** to latest stable versions
- ✅ **Added comprehensive error handling** with Sentry integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 📧 **Email**: support@roomrental.com
- 💬 **Issues**: [GitHub Issues](https://github.com/your-username/room-rental-system/issues)

---

**Built with ❤️ for efficient room rental management**

# 🛡️ Enterprise RBAC System

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.11-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **ระบบจัดการสิทธิ์แบบ Role-Based Access Control (RBAC) ที่สมบูรณ์แบบ** พร้อมระบบภาษาไทย-อังกฤษ, Theme System, และ Enterprise-grade Security

## ✨ Features

### 🔐 **Security & Authentication**

- **OAuth Integration**: Google Sign-In with Supabase Auth
- **Role-Based Access Control**: Admin, Support, User roles with granular permissions
- **Row Level Security**: Database-level protection with Supabase RLS
- **Session Management**: Secure session handling with automatic refresh
- **Audit Logging**: Complete activity tracking for compliance
- **Middleware Protection**: Route-level security with Next.js middleware

### 🎨 **Modern UI/UX**

- **Design System**: Consistent, reusable components with TypeScript
- **Dark/Light Themes**: Automatic system preference detection + manual toggle
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: WCAG 2.1 compliant with proper ARIA support
- **Micro-interactions**: Smooth animations and loading states
- **Toast Notifications**: User-friendly feedback system

### 🌍 **Internationalization**

- **Multi-language Support**: Thai (default) and English
- **Dynamic Switching**: Real-time language change without reload
- **Locale-aware Formatting**: Date, time, currency, and number formatting
- **Cultural Adaptation**: Right-to-left (RTL) ready for future expansion

### 🏗️ **Architecture**

- **Next.js 15**: Latest App Router with Server Components
- **TypeScript**: Full type safety with strict mode
- **Component Architecture**: Atomic design with clear separation of concerns
- **Custom Hooks**: Reusable logic with React hooks pattern
- **Error Boundaries**: Graceful error handling with Sentry integration
- **Performance Optimized**: Code splitting, lazy loading, and caching

### 📊 **Monitoring & Analytics**

- **Error Tracking**: Sentry integration for production monitoring
- **Performance Metrics**: Real-time performance monitoring
- **Health Checks**: API health endpoints for deployment monitoring
- **Audit Dashboard**: Complete user activity tracking

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.18.0 or higher
- **npm** 11.4.1 or higher
- **Supabase Account** (free tier available)
- **Sentry Account** (optional, for error monitoring)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/rbac-system.git
cd rbac-system

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

# Required: Authentication
NEXTAUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Error Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn
```

### 3. Database Setup

```bash
# Run database migrations
npx supabase db push

# Or copy SQL schema to Supabase SQL Editor
# File: src/lib/db/schema.sql
```

### 4. Create Admin User

```sql
-- In Supabase SQL Editor, replace with your email
UPDATE auth.users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 5. Start Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:3000
```

## 🏛️ Architecture Overview

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

```typescript
permissions: [
  'users:*', // Full user management
  'settings:*', // System settings
  'reports:*', // All reports
  'audit:read', // Audit logs
];
routes: ['/admin/*', '/dashboard', '/profile', '/settings'];
```

### 🛠️ Support (ฝ่ายสนับสนุน)

```typescript
permissions: [
  'users:read', // View users
  'users:update', // Help users
  'reports:read', // View reports
  'dashboard:support',
];
routes: ['/support', '/dashboard', '/profile', '/reports'];
```

### 👤 User (ผู้ใช้ทั่วไป)

```typescript
permissions: ['profile:read', 'profile:update', 'dashboard:user'];
routes: ['/dashboard', '/profile'];
```

## 🧩 Component System

### Core Components

```typescript
// Buttons
<Button variant="primary|secondary|destructive" size="sm|md|lg" />
<PrimaryButton>Click me</PrimaryButton>
<DangerButton>Delete</DangerButton>

// Cards
<Card variant="elevated|outlined" hover={true} />
<StatsCard title="Users" value="1,234" trend={{value: 12, isPositive: true}} />
<FeatureCard title="Feature" description="..." action={{label: "Learn more", onClick: fn}} />

// Navigation
<Navbar brand={brand} items={navItems} user={user} onLogout={fn} />

// Forms & Inputs
<Input placeholder="Enter text..." />
<Select options={options} value={value} onChange={fn} />
```

### Protection Components

```typescript
// Role-based protection
<RoleGuard allowedRoles={['admin', 'support']}>
  <AdminPanel />
</RoleGuard>

// Permission-based protection
<PermissionGuard requiredPermissions={['users:read']}>
  <UsersList />
</PermissionGuard>

// Convenient shortcuts
<AdminOnly><Component /></AdminOnly>
<SupportOrAdmin><Component /></SupportOrAdmin>
```

## 🪝 Hooks System

### Authentication Hooks

```typescript
// Primary auth hook
const { user, loading, hasRole, hasPermission } = useAuth();

// Role checks
const isAdmin = useIsAdmin();
const isSupport = useIsSupport();

// Permission checks
const { canManageUsers, canAccessAdmin } = usePermissions();

// User information
const { displayName, avatarUrl, memberSince } = useUserInfo();
```

### UI/UX Hooks

```typescript
// Theme management
const { theme, mode, toggleMode, isDark } = useTheme();

// Internationalization
const { locale, setLocale, t } = useLocale();
const { formatDate, formatCurrency } = useFormatting();

// Notifications
const { success, error, warning } = useNotifications();
```

## 🛣️ API Routes

### Protected Endpoints

```typescript
// User Management (Admin only)
GET / api / admin / users; // List users
POST / api / admin / users; // Create user
PUT / api / admin / users / [id]; // Update user
DELETE / api / admin / users / [id]; // Delete user

// Dashboard Data
GET / api / dashboard / stats; // Statistics
GET / api / dashboard / activity; // Activity logs

// Profile Management
GET / api / profile; // Own profile
PUT / api / profile; // Update profile

// Health Check
GET / api / health; // System health
```

### API Protection Pattern

```typescript
export const GET = withRBACProtection(
  async (req, user) => {
    // user object guaranteed with required permissions
    return NextResponse.json({ data: 'success' });
  },
  ['required:permission']
);
```

## 🌐 Internationalization

### Usage

```typescript
// Basic translation
const { t } = useTranslation();
t('auth.signIn'); // 'เข้าสู่ระบบ' or 'Sign In'

// Namespaced translations
const { tAuth, tNav } = useTranslation();
tAuth('signIn'); // auth.signIn
tNav('dashboard'); // navigation.dashboard

// Formatting
const { formatDate, formatCurrency } = useFormatting();
formatDate(new Date()); // Locale-aware formatting
```

### Adding New Languages

1. Create translation file: `src/locales/[locale].json`
2. Add to `AVAILABLE_LOCALES` in `src/locales/index.ts`
3. Update type definitions if needed

## 🎨 Theming

### Using Themes

```typescript
// Theme context
const { mode, setMode, toggleMode } = useTheme();

// Semantic colors
const colors = useSemanticColors();
const { success, warning, error } = colors;

// CSS variables (auto-generated)
.my-component {
  background: rgb(var(--background));
  color: rgb(var(--foreground));
}
```

### Custom Theme

```typescript
// Extend theme in src/styles/themes/index.ts
export const customTheme: Theme = {
  mode: 'light',
  colors: {
    primary: { 500: '#your-color' },
    // ... other colors
  },
  // ... other properties
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test Button.test.tsx

# Run in watch mode
npm run test:watch
```

### Writing Tests

```typescript
import { renderWithProviders, createMockUser } from '../../../tests/utils/testUtils';

test('admin can access admin panel', () => {
  const adminUser = createMockUser('admin');

  renderWithProviders(<AdminPanel />, { user: adminUser });

  expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
});
```

## 🚀 Deployment

### Development

```bash
# Start development server
npm run dev

# With Docker
docker-compose up -d
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start

# With Docker
docker build -t rbac-system .
docker run -p 3000:3000 rbac-system
```

### Environment Variables

Ensure these are set in production:

```env
NODE_ENV=production
NEXTAUTH_SECRET=your-secure-secret
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

## 📈 Performance

### Optimizations Included

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Built-in bundle analyzer
- **Caching**: Aggressive caching strategies
- **Database Indexes**: Optimized queries
- **CDN Ready**: Static asset optimization

### Monitoring

```bash
# Bundle analysis
npm run analyze

# Performance testing
npm run test:performance

# Health check
curl http://localhost:3000/api/health
```

## 🔧 Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth-related pages
│   ├── admin/          # Admin pages
│   ├── api/            # API routes
│   └── dashboard/      # Dashboard pages
├── components/         # React components
│   ├── ui/            # Design system
│   ├── layout/        # Layout components
│   └── forms/         # Form components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
│   ├── auth/          # Authentication
│   ├── rbac/          # RBAC system
│   └── utils/         # General utilities
├── styles/            # Styling
├── types/             # TypeScript definitions
├── constants/         # Application constants
└── locales/           # Internationalization
```

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Pre-commit Hooks

```bash
# Install Husky
npm run prepare

# Hooks will run automatically on commit
git commit -m "feat: add new feature"
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Development Guidelines

- Follow **TypeScript best practices**
- Write **comprehensive tests**
- Update **documentation**
- Follow **conventional commits**
- Ensure **accessibility compliance**

## 📋 Roadmap

### Phase 1: Core Features ✅

- [x] RBAC implementation
- [x] Authentication system
- [x] Basic UI components
- [x] Internationalization
- [x] Theme system

### Phase 2: Enhanced Features 🚧

- [ ] Advanced audit logging
- [ ] Bulk user operations
- [ ] Custom permissions per user
- [ ] Advanced reporting dashboard
- [ ] Email notifications

### Phase 3: Enterprise Features 📅

- [ ] SSO integration (SAML, LDAP)
- [ ] Multi-tenancy support
- [ ] Advanced security features
- [ ] API rate limiting
- [ ] Advanced analytics

## 🆘 Support

### Documentation

- [API Documentation](./docs/api.md)
- [Component Storybook](http://localhost:6006) (run `npm run storybook`)
- [Architecture Guide](./docs/architecture.md)

### Getting Help

- 📧 **Email**: Shiroaims@gmail.com
- 💬 **Discord**: [Join our community](https://discord.gg/)
- 📝 **Issues**: [GitHub Issues](https://github.com/GodEyeTee/pratuthonnext/issues)

### Common Issues

**Q: Users can't access admin routes after role change**
A: Check database role assignment and restart the session

**Q: Theme doesn't persist after refresh**
A: Verify localStorage is enabled and working

**Q: Translations not loading**
A: Check locale files and ensure proper import structure

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Supabase** for the backend infrastructure
- **Tailwind CSS** for the utility-first CSS framework
- **React Community** for the ecosystem
- **TypeScript Team** for type safety

---

**Built with ❤️ by GodEyeTee**

_For a secure, scalable, and maintainable RBAC system_

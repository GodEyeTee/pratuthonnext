'use client';

import {
  ConditionalRender,
  RoleGuard,
  SupportOrAdmin,
} from '@/components/layout/RoleGuard';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeatureCard,
  StatsCard,
} from '@/components/ui/Card';
import type { NavItem } from '@/components/ui/Navbar';
import { Navbar } from '@/components/ui/Navbar';
import { ROLE_DISPLAY } from '@/constants/rbac';
import { useAuth, usePermissions, useUserInfo } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useLocale';
import { useNotifications } from '@/hooks/useToast';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { displayName, avatarUrl, memberSince, lastSignIn } = useUserInfo();
  const { canManageUsers, canAccessAdmin, canViewReports } = usePermissions();
  const { t, locale } = useTranslation();
  const { success } = useNotifications();

  // Navigation items based on user role
  const navigationItems: NavItem[] = [
    {
      label: { th: 'แดชบอร์ด', en: 'Dashboard' },
      href: '/dashboard',
      allowedRoles: ['admin', 'support', 'user'],
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
        </svg>
      ),
    },
    {
      label: { th: 'ผู้ใช้งาน', en: 'Users' },
      href: '/admin/users',
      allowedRoles: ['admin'],
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
    {
      label: { th: 'รายงาน', en: 'Reports' },
      href: '/reports',
      allowedRoles: ['admin', 'support'],
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      label: { th: 'ตั้งค่า', en: 'Settings' },
      href: '/settings',
      allowedRoles: ['admin', 'support', 'user'],
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  const handleQuickAction = (action: string) => {
    success(t('common.success'), `${action} action performed`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const roleDisplay = ROLE_DISPLAY[user.role];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar
        brand={{
          name: 'RBAC System',
          href: '/',
          logo: (
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          ),
        }}
        items={navigationItems}
        user={{
          name: displayName,
          email: user.email,
          avatar: avatarUrl,
          role: user.role,
        }}
        locale={locale}
        onLanguageChange={newLocale => {
          // Language change logic would be handled by the locale provider
          console.log('Change language to:', newLocale);
        }}
        onLogout={signOut}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('dashboard.welcome')}, {displayName}!
              </h1>
              <p className="text-muted-foreground mt-1">
                {locale === 'th'
                  ? 'ยินดีต้อนรับสู่ระบบจัดการ RBAC'
                  : 'Welcome to the RBAC Management System'}
              </p>
            </div>

            {/* Role Badge */}
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleDisplay.bgColor} ${roleDisplay.textColor} ${roleDisplay.borderColor} border`}
            >
              <span className="mr-1">{roleDisplay.icon}</span>
              {t(`roles.${user.role}`)}
            </div>
          </div>

          {/* User Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-semibold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {displayName}
                  </h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    {memberSince && (
                      <span>
                        {t('profile.memberSince')}: {memberSince}
                      </span>
                    )}
                    {lastSignIn && (
                      <span>
                        {t('profile.lastSignIn')}: {lastSignIn}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <RoleGuard allowedRoles={['admin']}>
            <StatsCard
              title={t('dashboard.totalUsers')}
              value="1,234"
              description="Active users in system"
              trend={{ value: 12, isPositive: true }}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              }
            />
          </RoleGuard>

          <SupportOrAdmin>
            <StatsCard
              title={t('dashboard.activeUsers')}
              value="892"
              description="Users active in last 30 days"
              trend={{ value: 8, isPositive: true }}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
          </SupportOrAdmin>

          <RoleGuard allowedRoles={['admin']}>
            <StatsCard
              title={t('dashboard.newUsers')}
              value="47"
              description="New registrations this month"
              trend={{ value: 23, isPositive: true }}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              }
            />
          </RoleGuard>

          <StatsCard
            title={t('dashboard.systemHealth')}
            value="99.9%"
            description="System uptime"
            trend={{ value: 0.1, isPositive: true }}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Management Card - Admin Only */}
          <ConditionalRender roles={['admin']}>
            <FeatureCard
              title={t('users.title')}
              description={
                locale === 'th'
                  ? 'จัดการผู้ใช้งาน เปลี่ยนบทบาท และดูประวัติการใช้งาน'
                  : 'Manage users, change roles, and view usage history'
              }
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              }
              action={{
                label: locale === 'th' ? 'จัดการผู้ใช้' : 'Manage Users',
                onClick: () => handleQuickAction('User Management'),
              }}
            />
          </ConditionalRender>

          {/* Reports Card - Admin & Support */}
          <ConditionalRender roles={['admin', 'support']}>
            <FeatureCard
              title={t('navigation.reports')}
              description={
                locale === 'th'
                  ? 'ดูรายงานการใช้งาน สถิติ และแนวโน้ม'
                  : 'View usage reports, statistics, and trends'
              }
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
              action={{
                label: locale === 'th' ? 'ดูรายงาน' : 'View Reports',
                onClick: () => handleQuickAction('Reports'),
              }}
            />
          </ConditionalRender>

          {/* Profile Card - All Users */}
          <FeatureCard
            title={t('profile.title')}
            description={
              locale === 'th'
                ? 'จัดการข้อมูลส่วนตัว การตั้งค่า และความปลอดภัย'
                : 'Manage personal information, settings, and security'
            }
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            action={{
              label: locale === 'th' ? 'แก้ไขโปรไฟล์' : 'Edit Profile',
              onClick: () => handleQuickAction('Profile'),
            }}
          />

          {/* Settings Card - Admin Only */}
          <ConditionalRender roles={['admin']}>
            <FeatureCard
              title={t('navigation.settings')}
              description={
                locale === 'th'
                  ? 'ตั้งค่าระบบ จัดการการอนุญาต และกำหนดค่าความปลอดภัย'
                  : 'System settings, permission management, and security configuration'
              }
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              action={{
                label: locale === 'th' ? 'ตั้งค่าระบบ' : 'System Settings',
                onClick: () => handleQuickAction('Settings'),
              }}
            />
          </ConditionalRender>

          {/* Support Card - All Users */}
          <FeatureCard
            title={locale === 'th' ? 'ช่วยเหลือ' : 'Support'}
            description={
              locale === 'th'
                ? 'ติดต่อฝ่ายสนับสนุน คู่มือการใช้งาน และคำถามที่พบบ่อย'
                : 'Contact support, user guides, and frequently asked questions'
            }
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            action={{
              label: locale === 'th' ? 'ขอความช่วยเหลือ' : 'Get Help',
              onClick: () => handleQuickAction('Support'),
            }}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleQuickAction('Profile Update')}
                variant="outline"
              >
                {t('profile.updateProfile')}
              </Button>

              <ConditionalRender roles={['admin']}>
                <Button
                  onClick={() => handleQuickAction('Add User')}
                  variant="default"
                >
                  {t('users.addUser')}
                </Button>
              </ConditionalRender>

              <ConditionalRender roles={['admin', 'support']}>
                <Button
                  onClick={() => handleQuickAction('Generate Report')}
                  variant="secondary"
                >
                  {locale === 'th' ? 'สร้างรายงาน' : 'Generate Report'}
                </Button>
              </ConditionalRender>

              <Button
                onClick={() => handleQuickAction('Export Data')}
                variant="ghost"
              >
                {locale === 'th' ? 'ส่งออกข้อมูล' : 'Export Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

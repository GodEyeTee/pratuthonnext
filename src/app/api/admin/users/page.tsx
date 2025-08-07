'use client';

import { withRoleGuard } from '@/components/layout/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ROLE_DISPLAY, canManageRole } from '@/constants/rbac';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useLocale';
import { useNotifications } from '@/hooks/useToast';
import type { UserRole, UserWithRole } from '@/types/rbac';
import { useState } from 'react';

// Mock data - replace with actual API calls
const mockUsers: UserWithRole[] = [
  {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
    name: 'Admin User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    email_verified: true,
    last_sign_in_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    email: 'support@example.com',
    role: 'support',
    name: 'Support Agent',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    email_verified: true,
    last_sign_in_at: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    email: 'user@example.com',
    role: 'user',
    name: 'Regular User',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    email_verified: true,
    last_sign_in_at: '2024-01-13T09:15:00Z',
  },
];

function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { t, locale } = useTranslation();
  const { success, error, warning } = useNotifications();

  const [users, setUsers] = useState<UserWithRole[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Check if current user can manage this role
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser || !canManageRole(currentUser.role, targetUser.role)) {
        warning(
          t('users.roleChangeError'),
          'ไม่มีสิทธิ์เปลี่ยนบทบาทของผู้ใช้คนนี้'
        );
        return;
      }

      // API call would go here
      // await updateUserRole(userId, newRole);

      // Update local state (replace with actual API response)
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, role: newRole, updated_at: new Date().toISOString() }
            : user
        )
      );

      success(
        t('users.roleChanged'),
        `เปลี่ยนบทบาทเป็น ${t(`roles.${newRole}`)} แล้ว`
      );
      setShowRoleChangeModal(false);
      setSelectedUser(null);
    } catch (err) {
      error(t('users.roleChangeError'), 'เกิดข้อผิดพลาดในการเปลี่ยนบทบาท');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;

    const confirmDelete = window.confirm(
      locale === 'th'
        ? 'คุณแน่ใจหรือไม่ที่ต้องการลบผู้ใช้คนนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
        : 'Are you sure you want to delete this user? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      // API call would go here
      // await deleteUser(userId);

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      success(t('users.userDeleted'));
    } catch (err) {
      error(t('users.userDeleteError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'th' ? 'th-TH' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('users.title')}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'th'
            ? 'จัดการผู้ใช้งาน เปลี่ยนบทบาท และดูสถิติการใช้งาน'
            : 'Manage users, change roles, and view usage statistics'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ผู้ใช้ทั้งหมด
                </p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-blue-600"
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
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ผู้ดูแลระบบ
                </p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600">👑</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ฝ่ายสนับสนุน
                </p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'support').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">🛠️</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ผู้ใช้ทั่วไป
                </p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'user').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">👤</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder={
                  locale === 'th'
                    ? 'ค้นหาชื่อหรืออีเมล...'
                    : 'Search by name or email...'
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={e =>
                  setRoleFilter(e.target.value as UserRole | 'all')
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">
                  {locale === 'th' ? 'บทบาททั้งหมด' : 'All Roles'}
                </option>
                <option value="admin">{t('roles.admin')}</option>
                <option value="support">{t('roles.support')}</option>
                <option value="user">{t('roles.user')}</option>
              </select>
            </div>

            {/* Add User Button */}
            <Button
              onClick={() => alert('Add user functionality coming soon!')}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {t('users.addUser')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('users.userList')} ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {locale === 'th' ? 'ผู้ใช้' : 'User'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {locale === 'th' ? 'บทบาท' : 'Role'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {locale === 'th' ? 'สมาชิกตั้งแต่' : 'Member Since'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {locale === 'th' ? 'เข้าสู่ระบบล่าสุด' : 'Last Sign In'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {locale === 'th' ? 'การจัดการ' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map(user => {
                  const roleDisplay = ROLE_DISPLAY[user.role];
                  const canManageThisUser =
                    currentUser && canManageRole(currentUser.role, user.role);

                  return (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {user.name?.charAt(0) || user.email.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {user.name || user.email.split('@')[0]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleDisplay.bgColor} ${roleDisplay.textColor}`}
                        >
                          <span className="mr-1">{roleDisplay.icon}</span>
                          {t(`roles.${user.role}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.last_sign_in_at
                          ? formatDate(user.last_sign_in_at)
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {canManageThisUser && user.id !== currentUser?.id && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleChangeModal(true);
                              }}
                            >
                              {t('users.changeRole')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              {t('common.delete')}
                            </Button>
                          </>
                        )}
                        {user.id === currentUser?.id && (
                          <span className="text-muted-foreground italic">
                            {locale === 'th' ? '(คุณ)' : '(You)'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Modal */}
      {showRoleChangeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{t('users.changeRole')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {locale === 'th' ? 'เปลี่ยนบทบาทของ:' : 'Change role for:'}
                  </p>
                  <p className="font-medium">
                    {selectedUser.name || selectedUser.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">
                    {locale === 'th' ? 'เลือกบทบาทใหม่:' : 'Select new role:'}
                  </p>
                  <div className="space-y-2">
                    {(['admin', 'support', 'user'] as UserRole[]).map(role => {
                      const roleDisplay = ROLE_DISPLAY[role];
                      const canAssignRole =
                        currentUser && canManageRole(currentUser.role, role);

                      return (
                        <button
                          key={role}
                          onClick={() =>
                            handleRoleChange(selectedUser.id, role)
                          }
                          disabled={
                            !canAssignRole || selectedUser.role === role
                          }
                          className={`w-full p-3 rounded-lg border text-left transition-colors ${
                            selectedUser.role === role
                              ? 'border-primary bg-primary/10 text-primary'
                              : canAssignRole
                                ? 'border-border hover:border-primary hover:bg-muted/50'
                                : 'border-border opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-2">{roleDisplay.icon}</span>
                            <div>
                              <div className="font-medium">
                                {t(`roles.${role}`)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t(`roles.${role}Description`)}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRoleChangeModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Protect the page with admin role
export default withRoleGuard(UserManagementPage, ['admin']);

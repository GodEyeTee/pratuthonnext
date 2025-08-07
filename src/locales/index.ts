/**
 * Internationalization (i18n) System
 */

export type Locale = 'th' | 'en';

export interface TranslationNamespace {
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
    confirm: string;
    yes: string;
    no: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    sort: string;
    export: string;
    import: string;
    refresh: string;
  };

  auth: {
    signIn: string;
    signOut: string;
    signUp: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    resetPassword: string;
    signInWithGoogle: string;
    signInSuccess: string;
    signInError: string;
    signOutSuccess: string;
    signOutError: string;
    unauthorized: string;
    sessionExpired: string;
  };

  navigation: {
    home: string;
    dashboard: string;
    profile: string;
    settings: string;
    admin: string;
    support: string;
    users: string;
    reports: string;
    help: string;
    about: string;
  };

  roles: {
    admin: string;
    support: string;
    user: string;
    adminDescription: string;
    supportDescription: string;
    userDescription: string;
  };

  dashboard: {
    welcome: string;
    overview: string;
    statistics: string;
    recentActivity: string;
    quickActions: string;
    totalUsers: string;
    activeUsers: string;
    newUsers: string;
    systemHealth: string;
  };

  profile: {
    title: string;
    personalInfo: string;
    name: string;
    emailAddress: string;
    role: string;
    lastSignIn: string;
    memberSince: string;
    updateProfile: string;
    changePassword: string;
    deleteAccount: string;
    profileUpdated: string;
    profileUpdateError: string;
  };

  users: {
    title: string;
    userList: string;
    addUser: string;
    editUser: string;
    deleteUser: string;
    userDetails: string;
    changeRole: string;
    roleChanged: string;
    roleChangeError: string;
    userDeleted: string;
    userDeleteError: string;
    confirmDelete: string;
    deleteWarning: string;
  };

  errors: {
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    networkError: string;
    genericError: string;
    tryAgain: string;
    goHome: string;
    contactSupport: string;
  };

  validation: {
    required: string;
    invalidEmail: string;
    passwordTooShort: string;
    passwordsNotMatch: string;
    invalidFormat: string;
    fieldRequired: string;
  };
}

// Thai translations
export const th: TranslationNamespace = {
  common: {
    loading: 'กำลังโหลด...',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    create: 'สร้าง',
    update: 'อัปเดต',
    confirm: 'ยืนยัน',
    yes: 'ใช่',
    no: 'ไม่',
    success: 'สำเร็จ',
    error: 'ข้อผิดพลาด',
    warning: 'คำเตือน',
    info: 'ข้อมูล',
    close: 'ปิด',
    back: 'ย้อนกลับ',
    next: 'ถัดไป',
    previous: 'ก่อนหน้า',
    search: 'ค้นหา',
    filter: 'กรอง',
    sort: 'เรียง',
    export: 'ส่งออก',
    import: 'นำเข้า',
    refresh: 'รีเฟรช',
  },

  auth: {
    signIn: 'เข้าสู่ระบบ',
    signOut: 'ออกจากระบบ',
    signUp: 'สมัครสมาชิก',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    confirmPassword: 'ยืนยันรหัสผ่าน',
    forgotPassword: 'ลืมรหัสผ่าน',
    resetPassword: 'รีเซ็ตรหัสผ่าน',
    signInWithGoogle: 'เข้าสู่ระบบด้วย Google',
    signInSuccess: 'เข้าสู่ระบบสำเร็จ',
    signInError: 'ไม่สามารถเข้าสู่ระบบได้',
    signOutSuccess: 'ออกจากระบบสำเร็จ',
    signOutError: 'ไม่สามารถออกจากระบบได้',
    unauthorized: 'ไม่มีสิทธิ์เข้าถึง',
    sessionExpired: 'เซสชันหมดอายุ',
  },

  navigation: {
    home: 'หน้าแรก',
    dashboard: 'แดชบอร์ด',
    profile: 'โปรไฟล์',
    settings: 'ตั้งค่า',
    admin: 'ผู้ดูแลระบบ',
    support: 'ฝ่ายสนับสนุน',
    users: 'ผู้ใช้งาน',
    reports: 'รายงาน',
    help: 'ช่วยเหลือ',
    about: 'เกี่ยวกับเรา',
  },

  roles: {
    admin: 'ผู้ดูแลระบบ',
    support: 'ฝ่ายสนับสนุน',
    user: 'ผู้ใช้งาน',
    adminDescription: 'สามารถจัดการระบบและผู้ใช้ทั้งหมด',
    supportDescription: 'สามารถช่วยเหลือผู้ใช้และดูรายงาน',
    userDescription: 'สามารถจัดการโปรไฟล์ของตนเอง',
  },

  dashboard: {
    welcome: 'ยินดีต้อนรับ',
    overview: 'ภาพรวม',
    statistics: 'สถิติ',
    recentActivity: 'กิจกรรมล่าสุด',
    quickActions: 'การกระทำด่วน',
    totalUsers: 'ผู้ใช้ทั้งหมด',
    activeUsers: 'ผู้ใช้ที่ใช้งานอยู่',
    newUsers: 'ผู้ใช้ใหม่',
    systemHealth: 'สถานะระบบ',
  },

  profile: {
    title: 'โปรไฟล์',
    personalInfo: 'ข้อมูลส่วนตัว',
    name: 'ชื่อ',
    emailAddress: 'ที่อยู่อีเมล',
    role: 'บทบาท',
    lastSignIn: 'เข้าสู่ระบบครั้งล่าสุด',
    memberSince: 'สมาชิกตั้งแต่',
    updateProfile: 'อัปเดตโปรไฟล์',
    changePassword: 'เปลี่ยนรหัสผ่าน',
    deleteAccount: 'ลบบัญชี',
    profileUpdated: 'อัปเดตโปรไฟล์สำเร็จ',
    profileUpdateError: 'ไม่สามารถอัปเดตโปรไฟล์ได้',
  },

  users: {
    title: 'จัดการผู้ใช้งาน',
    userList: 'รายชื่อผู้ใช้',
    addUser: 'เพิ่มผู้ใช้',
    editUser: 'แก้ไขผู้ใช้',
    deleteUser: 'ลบผู้ใช้',
    userDetails: 'รายละเอียดผู้ใช้',
    changeRole: 'เปลี่ยนบทบาท',
    roleChanged: 'เปลี่ยนบทบาทสำเร็จ',
    roleChangeError: 'ไม่สามารถเปลี่ยนบทบาทได้',
    userDeleted: 'ลบผู้ใช้สำเร็จ',
    userDeleteError: 'ไม่สามารถลบผู้ใช้ได้',
    confirmDelete: 'ยืนยันการลบ',
    deleteWarning: 'การดำเนินการนี้ไม่สามารถย้อนกลับได้',
  },

  errors: {
    notFound: 'ไม่พบหน้าที่ต้องการ',
    unauthorized: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
    forbidden: 'การเข้าถึงถูกปฏิเสธ',
    serverError: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์',
    networkError: 'เกิดข้อผิดพลาดเครือข่าย',
    genericError: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
    tryAgain: 'ลองใหม่อีกครั้ง',
    goHome: 'กลับหน้าแรก',
    contactSupport: 'ติดต่อฝ่ายสนับสนุน',
  },

  validation: {
    required: 'ฟิลด์นี้จำเป็น',
    invalidEmail: 'รูปแบบอีเมลไม่ถูกต้อง',
    passwordTooShort: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
    passwordsNotMatch: 'รหัสผ่านไม่ตรงกัน',
    invalidFormat: 'รูปแบบไม่ถูกต้อง',
    fieldRequired: 'กรุณากรอกข้อมูลในฟิลด์นี้',
  },
};

// English translations
export const en: TranslationNamespace = {
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
  },

  auth: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    signInWithGoogle: 'Sign in with Google',
    signInSuccess: 'Successfully signed in',
    signInError: 'Unable to sign in',
    signOutSuccess: 'Successfully signed out',
    signOutError: 'Unable to sign out',
    unauthorized: 'Unauthorized access',
    sessionExpired: 'Session expired',
  },

  navigation: {
    home: 'Home',
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    admin: 'Admin',
    support: 'Support',
    users: 'Users',
    reports: 'Reports',
    help: 'Help',
    about: 'About',
  },

  roles: {
    admin: 'Administrator',
    support: 'Support',
    user: 'User',
    adminDescription: 'Full access to all system features and user management',
    supportDescription: 'Can assist users and view reports',
    userDescription: 'Can manage own profile and access user dashboard',
  },

  dashboard: {
    welcome: 'Welcome',
    overview: 'Overview',
    statistics: 'Statistics',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    newUsers: 'New Users',
    systemHealth: 'System Health',
  },

  profile: {
    title: 'Profile',
    personalInfo: 'Personal Information',
    name: 'Name',
    emailAddress: 'Email Address',
    role: 'Role',
    lastSignIn: 'Last Sign In',
    memberSince: 'Member Since',
    updateProfile: 'Update Profile',
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    profileUpdated: 'Profile updated successfully',
    profileUpdateError: 'Unable to update profile',
  },

  users: {
    title: 'User Management',
    userList: 'User List',
    addUser: 'Add User',
    editUser: 'Edit User',
    deleteUser: 'Delete User',
    userDetails: 'User Details',
    changeRole: 'Change Role',
    roleChanged: 'Role changed successfully',
    roleChangeError: 'Unable to change role',
    userDeleted: 'User deleted successfully',
    userDeleteError: 'Unable to delete user',
    confirmDelete: 'Confirm Delete',
    deleteWarning: 'This action cannot be undone',
  },

  errors: {
    notFound: 'Page not found',
    unauthorized: 'You do not have permission to access this page',
    forbidden: 'Access denied',
    serverError: 'Server error occurred',
    networkError: 'Network error occurred',
    genericError: 'An unexpected error occurred',
    tryAgain: 'Try again',
    goHome: 'Go home',
    contactSupport: 'Contact support',
  },

  validation: {
    required: 'This field is required',
    invalidEmail: 'Invalid email format',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordsNotMatch: 'Passwords do not match',
    invalidFormat: 'Invalid format',
    fieldRequired: 'Please fill in this field',
  },
};

// Translation utilities
export const translations = { th, en };

export function getTranslations(locale: Locale): TranslationNamespace {
  return translations[locale] || translations.th;
}

export function createTranslationFunction(locale: Locale) {
  const t = getTranslations(locale);

  return function translate(key: string): string {
    const keys = key.split('.');
    let current: any = t;

    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      current = current[k];
    }

    return current;
  };
}

// Default locale
export const DEFAULT_LOCALE: Locale = 'th';

// Available locales
export const AVAILABLE_LOCALES: Locale[] = ['th', 'en'];

// Locale display names
export const LOCALE_NAMES: Record<Locale, string> = {
  th: 'ไทย',
  en: 'English',
};

// Locale flags/icons
export const LOCALE_FLAGS: Record<Locale, string> = {
  th: '🇹🇭',
  en: '🇺🇸',
};

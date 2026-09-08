/**
 * سطح دسترسی ادمین — mock فرانت (localStorage)
 */
import { ROUTES } from './routes';

export type AdminPermission =
  | 'dashboard'
  | 'bookings'
  | 'consultations'
  | 'reminders'
  | 'services'
  | 'laserServices'
  | 'nursingServices'
  | 'dental-tariffs'
  | 'fieldStaff'
  | 'doctors'
  | 'consultationPrices'
  | 'gallery'
  | 'memberships'
  | 'wallets'
  | 'shop'
  | 'commissions'
  | 'facilities'
  | 'club'
  | 'visitors'
  | 'partners'
  | 'insurances'
  | 'reviews'
  | 'complaints'
  | 'help'
  | 'installments'
  | 'patients'
  | 'access';

export type AdminRole = {
  id: string;
  name: string;
  description?: string;
  permissions: AdminPermission[];
};

export type AdminUser = {
  id: string;
  username: string;
  password: string;
  displayName: string;
  roleId: string;
  active: boolean;
};

export type AdminSession = {
  userId: string;
  username: string;
  displayName: string;
  roleId: string;
  roleName: string;
  permissions: AdminPermission[];
};

export const ADMIN_PERMISSION_META: {
  id: AdminPermission;
  label: string;
  href: string;
}[] = [
  { id: 'dashboard', label: 'داشبورد', href: ROUTES.admin.dashboard },
  { id: 'bookings', label: 'رزروها', href: ROUTES.admin.bookings },
  { id: 'consultations', label: 'مشاوره‌ها', href: ROUTES.admin.consultations },
  { id: 'reminders', label: 'یادآورها', href: ROUTES.admin.reminders },
  { id: 'services', label: 'سرویس‌ها', href: ROUTES.admin.services },
  { id: 'services', label: 'آموزش دندان', href: ROUTES.admin.dentalEducation },
  { id: 'laserServices', label: 'لیزر', href: ROUTES.admin.laserServices },
  { id: 'nursingServices', label: 'پرستاری', href: ROUTES.admin.nursingServices },
  { id: 'dental-tariffs', label: 'تعرفه دندان', href: ROUTES.admin.dentalTariffs },
  { id: 'fieldStaff', label: 'پرسنل میدانی', href: ROUTES.admin.fieldStaff },
  { id: 'doctors', label: 'پزشکان', href: ROUTES.admin.doctors },
  { id: 'consultationPrices', label: 'قیمت مشاوره', href: ROUTES.admin.consultationPrices },
  { id: 'gallery', label: 'گالری', href: ROUTES.admin.gallery },
  { id: 'memberships', label: 'عضویت‌ها', href: ROUTES.admin.memberships },
  { id: 'wallets', label: 'کیف اعتبار', href: ROUTES.admin.wallets },
  { id: 'wallets', label: 'فعال‌سازی اعتبار', href: ROUTES.admin.creditActivation },
  { id: 'shop', label: 'فروشگاه', href: ROUTES.admin.shop },
  { id: 'commissions', label: 'پورسانت‌ها', href: ROUTES.admin.commissions },
  { id: 'facilities', label: 'تسهیلات', href: ROUTES.admin.facilities },
  { id: 'club', label: 'باشگاه', href: ROUTES.admin.club },
  { id: 'visitors', label: 'ویزیتورها', href: ROUTES.admin.visitors },
  { id: 'partners', label: 'همکاری‌ها', href: ROUTES.admin.partners },
  { id: 'insurances', label: 'بیمه‌ها و استعلام', href: ROUTES.admin.insurances },
  { id: 'reviews', label: 'نظرات پزشکان', href: ROUTES.admin.reviews },
  { id: 'complaints', label: 'شکایات', href: ROUTES.admin.complaints },
  { id: 'help', label: 'آموزش سامانه', href: ROUTES.admin.help },
  { id: 'installments', label: 'اقساط', href: ROUTES.admin.installments },
  { id: 'patients', label: 'تأیید کاربری / فرانشیز', href: ROUTES.admin.patients },
  { id: 'access', label: 'سطح دسترسی', href: ROUTES.admin.access },
];

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = ADMIN_PERMISSION_META.map(
  (item) => item.id,
);

export const DEFAULT_ADMIN_ROLES: AdminRole[] = [
  {
    id: 'superadmin',
    name: 'مدیر کل',
    description: 'دسترسی کامل به همه بخش‌ها',
    permissions: [...ALL_ADMIN_PERMISSIONS],
  },
  {
    id: 'ops',
    name: 'منشی / عملیات',
    description: 'رزرو، مشاوره و یادآور',
    permissions: ['dashboard', 'bookings', 'consultations', 'reminders', 'fieldStaff'],
  },
  {
    id: 'content',
    name: 'محتوا',
    description: 'سرویس‌ها، لیزر، پرستاری، پزشکان، گالری و قیمت',
    permissions: [
      'dashboard',
      'services',
      'laserServices',
      'nursingServices',
      'dental-tariffs',
      'fieldStaff',
      'doctors',
      'consultationPrices',
      'gallery',
    ],
  },
  {
    id: 'finance',
    name: 'مالی',
    description: 'عضویت، کیف اعتبار، فروشگاه، پورسانت و تسهیلات',
    permissions: [
      'dashboard',
      'memberships',
      'wallets',
      'shop',
      'commissions',
      'facilities',
      'installments',
      'insurances',
      'patients',
      'complaints',
    ],
  },
];

/**
 * Role/user shells for localStorage prototype + seed metadata.
 * Real passwords are NOT stored here — see ADMIN-CREDENTIALS.local.json
 * (gitignored) or ADMIN_PASSWORD_* env vars consumed by prisma/seed.ts.
 */
export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: '',
    displayName: 'مدیر کل',
    roleId: 'superadmin',
    active: true,
  },
  {
    id: 'user-ops',
    username: 'ops',
    password: '',
    displayName: 'منشی',
    roleId: 'ops',
    active: true,
  },
  {
    id: 'user-content',
    username: 'content',
    password: '',
    displayName: 'مدیر محتوا',
    roleId: 'content',
    active: true,
  },
  {
    id: 'user-finance',
    username: 'finance',
    password: '',
    displayName: 'مالی',
    roleId: 'finance',
    active: true,
  },
];

export function permissionForPath(pathname: string): AdminPermission | null {
  if (pathname === ROUTES.admin.homeVisits || pathname.startsWith(`${ROUTES.admin.homeVisits}/`)) {
    return 'fieldStaff';
  }
  const exact = ADMIN_PERMISSION_META.find((item) => item.href === pathname);
  if (exact) return exact.id;
  // nested admin paths under known prefixes
  const match = ADMIN_PERMISSION_META.find(
    (item) => item.href !== ROUTES.admin.dashboard && pathname.startsWith(item.href),
  );
  return match?.id || null;
}

export function canAccessAdminPath(
  permissions: AdminPermission[] | undefined,
  pathname: string,
): boolean {
  if (
    pathname === ROUTES.admin.staffCommissions ||
    pathname.startsWith(`${ROUTES.admin.staffCommissions}/`)
  ) {
    return hasPermission(permissions, 'fieldStaff') || hasPermission(permissions, 'commissions');
  }
  const needed = permissionForPath(pathname);
  if (!needed) return true;
  return hasPermission(permissions, needed);
}

export function hasPermission(
  permissions: AdminPermission[] | undefined,
  permission: AdminPermission,
): boolean {
  return Array.isArray(permissions) && permissions.includes(permission);
}

export function firstAllowedAdminPath(permissions: AdminPermission[]): string {
  for (const item of ADMIN_PERMISSION_META) {
    if (permissions.includes(item.id)) return item.href;
  }
  return ROUTES.admin.login;
}

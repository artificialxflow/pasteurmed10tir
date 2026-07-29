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
  { id: 'laserServices', label: 'لیزر', href: ROUTES.admin.laserServices },
  { id: 'nursingServices', label: 'پرستاری', href: ROUTES.admin.nursingServices },
  { id: 'doctors', label: 'پزشکان', href: ROUTES.admin.doctors },
  { id: 'consultationPrices', label: 'قیمت مشاوره', href: ROUTES.admin.consultationPrices },
  { id: 'gallery', label: 'گالری', href: ROUTES.admin.gallery },
  { id: 'memberships', label: 'عضویت‌ها', href: ROUTES.admin.memberships },
  { id: 'wallets', label: 'کیف اعتبار', href: ROUTES.admin.wallets },
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
  { id: 'patients', label: 'بیماران', href: ROUTES.admin.patients },
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
    permissions: ['dashboard', 'bookings', 'consultations', 'reminders'],
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

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'pasteur1403',
    displayName: 'مدیر کل',
    roleId: 'superadmin',
    active: true,
  },
  {
    id: 'user-ops',
    username: 'ops',
    password: 'ops1403',
    displayName: 'منشی',
    roleId: 'ops',
    active: true,
  },
  {
    id: 'user-content',
    username: 'content',
    password: 'content1403',
    displayName: 'مدیر محتوا',
    roleId: 'content',
    active: true,
  },
  {
    id: 'user-finance',
    username: 'finance',
    password: 'finance1403',
    displayName: 'مالی',
    roleId: 'finance',
    active: true,
  },
];

export function permissionForPath(pathname: string): AdminPermission | null {
  const exact = ADMIN_PERMISSION_META.find((item) => item.href === pathname);
  if (exact) return exact.id;
  // nested admin paths under known prefixes
  const match = ADMIN_PERMISSION_META.find(
    (item) => item.href !== ROUTES.admin.dashboard && pathname.startsWith(item.href),
  );
  return match?.id || null;
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

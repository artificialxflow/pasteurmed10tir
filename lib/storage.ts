/**
 * مدیریت localStorage — پاستور پلاس (SSR-safe)
 */
import {
  PASTEUR_DATA,
  type ClubTier,
  type ConsultationType,
  type GalleryItem,
  type LaserService,
  type Membership,
  type NursingService,
  type PasteurSettings,
  type Product,
  type Service,
  type SpecialtyTariffs,
  type Visitor,
} from './data';
import {
  ALL_ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_ROLES,
  DEFAULT_ADMIN_USERS,
  firstAllowedAdminPath,
  hasPermission,
  type AdminPermission,
  type AdminRole,
  type AdminSession,
  type AdminUser,
} from './adminAccess';
import {
  buildDueDates,
  DEFAULT_BASE_INSURANCES,
  DEFAULT_COMPLEMENTARY_INSURANCES,
  DEFAULT_HELP_ITEMS,
  normalizePatientPhone,
  type Complaint,
  type ComplaintStatus,
  type DoctorReview,
  type HelpItem,
  type InstallmentPlan,
  type InsuranceCompany,
  type InsuranceInquiry,
  type InsuranceInquiryStatus,
  type PatientProfile,
} from './patient';
import {
  computeWalletCeiling,
  DEFAULT_WALLET_SETTINGS,
  type Wallet,
  type WalletKind,
  type WalletSettings,
  type WalletStatus,
  type WalletTransaction,
  type WalletTransactionStatus,
  type WalletTransactionType,
} from './wallet';

export type {
  ClubTier,
  GalleryItem,
  LaserService,
  Membership,
  NursingService,
  Product,
  Service,
  Visitor,
  Wallet,
  WalletKind,
  WalletSettings,
  WalletStatus,
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
};

export type Booking = {
  id: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  type?: string;
  typeLabel?: string;
  day?: string;
  timeValue?: string | number;
  timeLabel?: string;
  patientName?: string;
  patientPhone?: string;
  amount?: number;
  isDeposit?: boolean;
  depositNonRefundable?: boolean;
  status?: string;
  createdAt?: string;
  dateLabel?: string;
  referralCode?: string;
  [key: string]: unknown;
};

export type Member = {
  id: string;
  planId?: string;
  planName?: string;
  patientName?: string;
  patientPhone?: string;
  amount?: number;
  status?: string;
  validityLabel?: string;
  membershipDurationLabel?: string;
  discountPercent?: number;
  createdAt?: string;
  [key: string]: unknown;
};

export type ShopOrder = {
  id: string;
  status?: string;
  [key: string]: unknown;
};

export type ServiceItem = Service & {
  active?: boolean;
};

export type Commission = {
  id: string;
  visitorId?: number | string;
  visitorName?: string;
  referralCode?: string;
  commissionRate?: number;
  commissionAmount?: number;
  sourceType?: string;
  sourceLabel?: string;
  customerName?: string;
  customerPhone?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type CommissionInput = {
  referralCode?: string;
  amount?: number;
  sourceType?: string;
  sourceLabel?: string;
  customerName?: string;
  customerPhone?: string;
};

export type ClubHistoryItem = {
  points: number;
  reason: string;
  date: string;
};

export type ClubProfile = {
  phone: string;
  points: number;
  visits: number;
  referrals: number;
  referredPhones: string[];
  redeemed: unknown[];
  history: ClubHistoryItem[];
  brushHistory?: string[];
  [key: string]: unknown;
};

export type BrushStatus = {
  canBrush: boolean;
  brushesToday: number;
  maxPerDay: number;
  remainingCooldownMs: number | null;
  errorMessage: string | null;
};

export type BrushResult =
  | { ok: true; profile: ClubProfile }
  | { ok: false; error: string };

const BRUSH_POINTS = 5;
const BRUSH_MAX_PER_DAY = 3;
const BRUSH_COOLDOWN_MS = 8 * 60 * 60 * 1000;

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeBrushHistory(profile: ClubProfile): string[] {
  if (!Array.isArray(profile.brushHistory)) return [];
  return profile.brushHistory.filter((entry) => typeof entry === 'string');
}

function formatBrushRemainingTime(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours.toLocaleString('fa-IR')} ساعت و ${minutes.toLocaleString('fa-IR')} دقیقه`;
  }
  if (hours > 0) {
    return `${hours.toLocaleString('fa-IR')} ساعت`;
  }
  return `${minutes.toLocaleString('fa-IR')} دقیقه`;
}

function getBrushStatusForProfile(profile: ClubProfile, now = new Date()): BrushStatus {
  const brushHistory = normalizeBrushHistory(profile);
  const todayKey = localDayKey(now);
  const brushesToday = brushHistory.filter(
    (iso) => localDayKey(new Date(iso)) === todayKey,
  ).length;

  if (brushesToday >= BRUSH_MAX_PER_DAY) {
    return {
      canBrush: false,
      brushesToday,
      maxPerDay: BRUSH_MAX_PER_DAY,
      remainingCooldownMs: null,
      errorMessage: `سقف روزانه (${BRUSH_MAX_PER_DAY.toLocaleString('fa-IR')} بار) تکمیل شده است. فردا دوباره امتحان کنید.`,
    };
  }

  const lastBrushAt = brushHistory.length
    ? new Date(brushHistory[brushHistory.length - 1]!).getTime()
    : null;

  if (lastBrushAt !== null) {
    const elapsed = now.getTime() - lastBrushAt;
    const remaining = BRUSH_COOLDOWN_MS - elapsed;
    if (remaining > 0) {
      return {
        canBrush: false,
        brushesToday,
        maxPerDay: BRUSH_MAX_PER_DAY,
        remainingCooldownMs: remaining,
        errorMessage: `حداقل ۸ ساعت بین هر «مسواک زدم» لازم است. ${formatBrushRemainingTime(remaining)} دیگر صبر کنید.`,
      };
    }
  }

  return {
    canBrush: true,
    brushesToday,
    maxPerDay: BRUSH_MAX_PER_DAY,
    remainingCooldownMs: null,
    errorMessage: null,
  };
}

export type ShopCartItem = {
  id: string | number;
  qty: number;
  [key: string]: unknown;
};

export type BookingStats = {
  totalBookings: number;
  todayVisitors: number;
  revenue: number;
  activeMembers: number;
  commissionsTotal: number;
  recentBookings: Booking[];
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

function digitsOnly(value?: string | null): string {
  return (value || '').replace(/[^\d]/g, '');
}

export const KEYS = {
  bookings: 'pasteur_bookings',
  pendingBooking: 'pasteur_pending_booking',
  pendingPayment: 'pasteur_pending_payment',
  members: 'pasteur_members',
  products: 'pasteur_products',
  shopOrders: 'pasteur_shop_orders',
  adminSession: 'pasteur_admin_session',
  adminRoles: 'pasteur_admin_roles',
  adminUsers: 'pasteur_admin_users',
  consultations: 'pasteur_consultations',
  reminders: 'pasteur_reminders',
  club: 'pasteur_club',
  gallery: 'pasteur_gallery',
  services: 'pasteur_services',
  laserServices: 'pasteur_laser_services',
  membershipPlans: 'pasteur_membership_plans',
  nursingServices: 'pasteur_nursing_services',
  consultationTypes: 'pasteur_consultation_types',
  specialtyTariffs: 'pasteur_specialty_tariffs',
  settings: 'pasteur_settings',
  visitors: 'pasteur_visitors',
  commissions: 'pasteur_commissions',
  facilityRequests: 'pasteur_facility_requests',
  shopVipPhones: 'pasteur_shop_vip_phones',
  membershipApplications: 'pasteur_membership_applications',
  partnerRequests: 'pasteur_partner_requests',
  extraDoctors: 'pasteur_extra_doctors',
  lastPayment: 'pasteur_last_payment',
  lastBooking: 'pasteur_last_booking',
  appView: 'pasteur_app_view',
  shopCart: 'pasteur_app_shop_cart',
  shopCustomerType: 'pasteur_app_shop_customer_type',
  shopVipPhone: 'pasteur_app_shop_vip_phone',
  walletSettings: 'pasteur_wallet_settings',
  wallets: 'pasteur_wallets',
  patients: 'pasteur_patients',
  patientSession: 'pasteur_patient_session',
  baseInsurances: 'pasteur_base_insurances',
  complementaryInsurances: 'pasteur_complementary_insurances',
  insuranceInquiries: 'pasteur_insurance_inquiries',
  doctorReviews: 'pasteur_doctor_reviews',
  complaints: 'pasteur_complaints',
  helpItems: 'pasteur_help_items',
  installmentPlans: 'pasteur_installment_plans',
} as const;

export const PasteurStorage = {
  KEYS,

  get(key: string): unknown {
    if (!canUseStorage()) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    if (!canUseStorage()) return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (!canUseStorage()) return;
    localStorage.removeItem(key);
  },

  getSession(key: string): unknown {
    if (!canUseStorage()) return null;
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(key: string, value: unknown): void {
    if (!canUseStorage()) return;
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  removeSession(key: string): void {
    if (!canUseStorage()) return;
    sessionStorage.removeItem(key);
  },

  getBookings(): Booking[] {
    return (this.get(this.KEYS.bookings) as Booking[] | null) || [];
  },

  saveBooking(booking: Booking): Booking {
    const list = this.getBookings();
    list.unshift(booking);
    this.set(this.KEYS.bookings, list);
    return booking;
  },

  updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    const list = this.getBookings();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.bookings, list);
    return list[idx];
  },

  isSlotBooked(
    doctorId: string,
    day: string,
    type: string,
    timeValue: string | number
  ): boolean {
    return this.getBookings().some(
      (b) =>
        b.status !== 'cancelled' &&
        b.doctorId === doctorId &&
        b.day === day &&
        b.type === type &&
        b.timeValue === timeValue
    );
  },

  getPendingBooking(): Record<string, unknown> | null {
    return (this.get(this.KEYS.pendingBooking) as Record<string, unknown> | null) || null;
  },

  setPendingBooking(data: unknown): void {
    this.set(this.KEYS.pendingBooking, data);
  },

  clearPendingBooking(): void {
    this.remove(this.KEYS.pendingBooking);
  },

  getPendingPayment(): Record<string, unknown> | null {
    return (this.get(this.KEYS.pendingPayment) as Record<string, unknown> | null) || null;
  },

  setPendingPayment(data: unknown): void {
    this.set(this.KEYS.pendingPayment, data);
  },

  clearPendingPayment(): void {
    this.remove(this.KEYS.pendingPayment);
  },

  getLastPayment(): Record<string, unknown> | null {
    return (this.getSession(this.KEYS.lastPayment) as Record<string, unknown> | null) || null;
  },

  setLastPayment(data: unknown): void {
    this.setSession(this.KEYS.lastPayment, data);
  },

  clearLastPayment(): void {
    this.removeSession(this.KEYS.lastPayment);
  },

  getSessionLastBooking(): Booking | null {
    return (this.getSession(this.KEYS.lastBooking) as Booking | null) || null;
  },

  setSessionLastBooking(data: unknown): void {
    this.setSession(this.KEYS.lastBooking, data);
  },

  clearSessionLastBooking(): void {
    this.removeSession(this.KEYS.lastBooking);
  },

  getMembers(): Member[] {
    return (this.get(this.KEYS.members) as Member[] | null) || [];
  },

  saveMember(member: Member): Member {
    const list = this.getMembers();
    list.unshift(member);
    this.set(this.KEYS.members, list);
    return member;
  },

  getMembershipApplications(): Record<string, unknown>[] {
    return (this.get(this.KEYS.membershipApplications) as Record<string, unknown>[] | null) || [];
  },

  saveMembershipApplication(application: Record<string, unknown>): Record<string, unknown> {
    const list = this.getMembershipApplications();
    list.unshift(application);
    this.set(this.KEYS.membershipApplications, list);
    return application;
  },

  getProducts(): Product[] {
    const stored = this.get(this.KEYS.products) as Product[] | null;
    const source = stored || PASTEUR_DATA.products.map((p) => ({ ...p }));
    return source
      .filter((p) => ['پزشکی', 'دندانپزشکی'].includes(String(p.category)))
      .map((p) => ({ ...p }));
  },

  saveProducts(products: Product[]): void {
    this.set(this.KEYS.products, products);
  },

  getShopOrders(): ShopOrder[] {
    return (this.get(this.KEYS.shopOrders) as ShopOrder[] | null) || [];
  },

  saveShopOrder(order: ShopOrder): ShopOrder {
    const list = this.getShopOrders();
    list.unshift(order);
    this.set(this.KEYS.shopOrders, list);
    return order;
  },

  updateShopOrder(id: string, updates: Partial<ShopOrder>): ShopOrder | null {
    const list = this.getShopOrders();
    const idx = list.findIndex((order) => order.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.shopOrders, list);
    return list[idx];
  },

  initProductsIfNeeded(): void {
    if (!this.get(this.KEYS.products)) {
      this.saveProducts(PASTEUR_DATA.products.map((p) => ({ ...p })));
    }
  },

  getServices(): ServiceItem[] {
    const stored = this.get(this.KEYS.services) as ServiceItem[] | null;
    const source: ServiceItem[] =
      stored || PASTEUR_DATA.services.map((s) => ({ ...s, active: true as boolean }));
    return source
      .map((service, index) => ({
        ...service,
        id: service.id || `service-${index + 1}`,
        active: service.active !== false,
      }))
      .filter((service) => service.title && service.href);
  },

  saveServices(services: ServiceItem[]): void {
    this.set(this.KEYS.services, services);
  },

  initServicesIfNeeded(): void {
    if (!this.get(this.KEYS.services)) {
      this.saveServices(
        PASTEUR_DATA.services.map((service) => ({
          ...service,
          active: true,
        }))
      );
    }
  },

  getVisitors(): Visitor[] {
    const stored = this.get(this.KEYS.visitors) as Visitor[] | null;
    if (stored) return stored;
    return PASTEUR_DATA.visitors.map((v) => ({ ...v }));
  },

  saveVisitors(visitors: Visitor[]): void {
    this.set(this.KEYS.visitors, visitors);
  },

  findVisitorByCode(code?: string | null): Visitor | null {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) return null;
    return (
      this.getVisitors().find(
        (v) => v.code.toUpperCase() === normalized && v.status === 'active'
      ) || null
    );
  },

  getCommissions(): Commission[] {
    return (this.get(this.KEYS.commissions) as Commission[] | null) || [];
  },

  saveCommission(data: CommissionInput): Commission | null {
    const visitor = this.findVisitorByCode(data.referralCode);
    if (!visitor) return null;
    const baseAmount = Number(data.amount || 0);
    const commissionAmount = Math.round((baseAmount * visitor.commissionRate) / 100);
    const item: Commission = {
      id: this.generateId(),
      visitorId: visitor.id,
      visitorName: visitor.name,
      referralCode: visitor.code,
      commissionRate: visitor.commissionRate,
      commissionAmount,
      sourceType: data.sourceType,
      sourceLabel: data.sourceLabel,
      customerName: data.customerName || '—',
      customerPhone: data.customerPhone || '—',
      amount: baseAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const list = this.getCommissions();
    list.unshift(item);
    this.set(this.KEYS.commissions, list);
    this.addReferralClubPoints(visitor, data);
    return item;
  },

  addReferralClubPoints(visitor: Visitor, data: CommissionInput): ClubProfile | null {
    const visitorPhone = digitsOnly(visitor.phone);
    const customerPhone = digitsOnly(data.customerPhone);
    if (!visitorPhone || !customerPhone || visitorPhone === customerPhone) return null;

    const profile = this.getClubProfile(visitorPhone);
    profile.referrals = Number(profile.referrals || 0);
    profile.referredPhones = Array.isArray(profile.referredPhones) ? profile.referredPhones : [];
    if (profile.referredPhones.includes(customerPhone)) return profile;

    profile.referrals += 1;
    profile.referredPhones.unshift(customerPhone);
    profile.points += 100;
    profile.history.unshift({
      points: 100,
      reason: `معرفی بیمار جدید: ${data.customerName || customerPhone}`,
      date: new Date().toISOString(),
    });
    return this.saveClubProfile(visitorPhone, profile);
  },

  updateCommission(id: string, updates: Partial<Commission>): Commission | null {
    const list = this.getCommissions();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.commissions, list);
    return list[idx];
  },

  getFacilityRequests(): Record<string, unknown>[] {
    return (this.get(this.KEYS.facilityRequests) as Record<string, unknown>[] | null) || [];
  },

  saveFacilityRequest(request: Record<string, unknown>): Record<string, unknown> {
    const list = this.getFacilityRequests();
    list.unshift(request);
    this.set(this.KEYS.facilityRequests, list);
    return request;
  },

  updateFacilityRequest(
    id: string,
    updates: Record<string, unknown>
  ): Record<string, unknown> | null {
    const list = this.getFacilityRequests();
    const idx = list.findIndex((request) => request.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.facilityRequests, list);
    return list[idx];
  },

  getExtraDoctors(): Record<string, unknown>[] {
    return (this.get(this.KEYS.extraDoctors) as Record<string, unknown>[] | null) || [];
  },

  saveExtraDoctor(doctor: Record<string, unknown>): Record<string, unknown> {
    const list = this.getExtraDoctors();
    list.unshift(doctor);
    this.set(this.KEYS.extraDoctors, list);
    return doctor;
  },

  getPartnerRequests(): Record<string, unknown>[] {
    return (this.get(this.KEYS.partnerRequests) as Record<string, unknown>[] | null) || [];
  },

  savePartnerRequest(request: Record<string, unknown>): Record<string, unknown> {
    const list = this.getPartnerRequests();
    list.unshift(request);
    this.set(this.KEYS.partnerRequests, list);
    return request;
  },

  updatePartnerRequest(
    id: string,
    updates: Record<string, unknown>
  ): Record<string, unknown> | null {
    const list = this.getPartnerRequests();
    const idx = list.findIndex((request) => request.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.partnerRequests, list);
    return list[idx];
  },

  activateShopVip(phone?: string | null): void {
    const key = digitsOnly(phone);
    if (!key) return;
    const list = (this.get(this.KEYS.shopVipPhones) as string[] | null) || [];
    if (!list.includes(key)) {
      list.push(key);
      this.set(this.KEYS.shopVipPhones, list);
    }
  },

  isShopVip(phone?: string | null): boolean {
    const key = digitsOnly(phone);
    if (!key) return false;
    const vipPhones = (this.get(this.KEYS.shopVipPhones) as string[] | null) || [];
    const memberPhones = this.getMembers()
      .filter((m) => m.status === 'paid' && ['vip', 'shop-vip'].includes(String(m.planId)))
      .map((m) => digitsOnly(m.patientPhone));
    return vipPhones.includes(key) || memberPhones.includes(key);
  },

  getAppView(): string | null {
    if (!canUseStorage()) return null;
    return localStorage.getItem(this.KEYS.appView);
  },

  setAppView(view: string): void {
    if (!canUseStorage()) return;
    localStorage.setItem(this.KEYS.appView, view);
  },

  getShopCart(): ShopCartItem[] {
    if (!canUseStorage()) return [];
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.shopCart) || '[]') as ShopCartItem[];
    } catch {
      return [];
    }
  },

  setShopCart(cart: ShopCartItem[]): void {
    if (!canUseStorage()) return;
    localStorage.setItem(this.KEYS.shopCart, JSON.stringify(cart));
  },

  getShopCustomerType(): string {
    if (!canUseStorage()) return 'regular';
    return localStorage.getItem(this.KEYS.shopCustomerType) || 'regular';
  },

  setShopCustomerType(type: string, phone = ''): void {
    if (!canUseStorage()) return;
    localStorage.setItem(this.KEYS.shopCustomerType, type);
    if (phone) localStorage.setItem(this.KEYS.shopVipPhone, phone);
  },

  getShopVipPhone(): string {
    if (!canUseStorage()) return '';
    return localStorage.getItem(this.KEYS.shopVipPhone) || '';
  },

  initAdminAccessIfNeeded(): void {
    if (!this.get(this.KEYS.adminRoles)) {
      this.saveAdminRoles(DEFAULT_ADMIN_ROLES.map((role) => ({ ...role, permissions: [...role.permissions] })));
    }
    if (!this.get(this.KEYS.adminUsers)) {
      this.saveAdminUsers(DEFAULT_ADMIN_USERS.map((user) => ({ ...user })));
    }
  },

  getAdminRoles(): AdminRole[] {
    this.initAdminAccessIfNeeded();
    const stored = (this.get(this.KEYS.adminRoles) as AdminRole[] | null) || [];
    return stored.map((role) => ({
      ...role,
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
    }));
  },

  saveAdminRoles(roles: AdminRole[]): void {
    this.set(this.KEYS.adminRoles, roles);
  },

  resetAdminRoles(): void {
    this.saveAdminRoles(DEFAULT_ADMIN_ROLES.map((role) => ({ ...role, permissions: [...role.permissions] })));
  },

  getAdminUsers(): AdminUser[] {
    this.initAdminAccessIfNeeded();
    const stored = (this.get(this.KEYS.adminUsers) as AdminUser[] | null) || [];
    return stored.map((user) => ({ ...user }));
  },

  saveAdminUsers(users: AdminUser[]): void {
    this.set(this.KEYS.adminUsers, users);
  },

  resetAdminUsers(): void {
    this.saveAdminUsers(DEFAULT_ADMIN_USERS.map((user) => ({ ...user })));
  },

  findAdminUser(username: string, password: string): AdminUser | null {
    const normalized = username.trim().toLowerCase();
    return (
      this.getAdminUsers().find(
        (user) =>
          user.active !== false &&
          user.username.trim().toLowerCase() === normalized &&
          user.password === password,
      ) || null
    );
  },

  buildAdminSession(user: AdminUser): AdminSession | null {
    const role = this.getAdminRoles().find((item) => item.id === user.roleId);
    if (!role) return null;
    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      roleId: role.id,
      roleName: role.name,
      permissions: [...role.permissions],
    };
  },

  isAdminLoggedIn(): boolean {
    return Boolean(this.getAdminSession());
  },

  getAdminSession(): AdminSession | null {
    if (!canUseStorage()) return null;
    this.initAdminAccessIfNeeded();
    try {
      const raw = sessionStorage.getItem(this.KEYS.adminSession);
      if (!raw) return null;
      // migrate legacy boolean session
      if (raw === 'true') {
        const admin = this.getAdminUsers().find((u) => u.username === 'admin');
        if (!admin) return null;
        const session = this.buildAdminSession(admin);
        if (session) this.setAdminSession(session);
        return session;
      }
      const parsed = JSON.parse(raw) as AdminSession;
      if (!parsed?.userId || !Array.isArray(parsed.permissions)) return null;
      // refresh permissions from latest role definition
      const user = this.getAdminUsers().find((u) => u.id === parsed.userId);
      if (!user || user.active === false) return null;
      return this.buildAdminSession(user);
    } catch {
      return null;
    }
  },

  setAdminSession(session: AdminSession): void {
    if (!canUseStorage()) return;
    sessionStorage.setItem(this.KEYS.adminSession, JSON.stringify(session));
  },

  adminLogin(username: string, password: string): AdminSession | null {
    const user = this.findAdminUser(username, password);
    if (!user) return null;
    const session = this.buildAdminSession(user);
    if (!session) return null;
    this.setAdminSession(session);
    return session;
  },

  adminLogout(): void {
    if (!canUseStorage()) return;
    sessionStorage.removeItem(this.KEYS.adminSession);
  },

  adminHasPermission(permission: AdminPermission): boolean {
    const session = this.getAdminSession();
    return hasPermission(session?.permissions, permission);
  },

  adminHomePath(): string {
    const session = this.getAdminSession();
    return firstAllowedAdminPath(session?.permissions || []);
  },

  /** Ensure at least one superadmin-like user keeps access permission. */
  ensureAccessPermissionCoverage(roles: AdminRole[], users: AdminUser[]): AdminRole[] {
    const next = roles.map((role) => ({
      ...role,
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
    }));
    const accessHolders = users.filter((user) => {
      if (user.active === false) return false;
      const role = next.find((r) => r.id === user.roleId);
      return role?.permissions.includes('access');
    });
    if (accessHolders.length) return next;
    const superRole = next.find((role) => role.id === 'superadmin');
    if (superRole && !superRole.permissions.includes('access')) {
      superRole.permissions = [...ALL_ADMIN_PERMISSIONS];
    }
    return next;
  },

  generateId(): string {
    return `PST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  },

  formatHour(h: number | string): string {
    return `ساعت ${h}`;
  },

  getBookingStats(): BookingStats {
    const bookings = this.getBookings();
    const today = new Date().toLocaleDateString('fa-IR');
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const todayBookings = confirmed.filter(
      (b) =>
        b.dateLabel === today ||
        b.createdAt?.startsWith(new Date().toISOString().slice(0, 10))
    );
    const revenue = confirmed.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const members = this.getMembers().filter((m) => m.status === 'paid');
    const commissions = this.getCommissions();

    return {
      totalBookings: confirmed.length,
      todayVisitors: todayBookings.length,
      revenue,
      activeMembers: members.length,
      commissionsTotal: commissions.reduce(
        (sum, c) => sum + (Number(c.commissionAmount) || 0),
        0
      ),
      recentBookings: bookings.slice(0, 8),
    };
  },

  getConsultations(): Record<string, unknown>[] {
    return (this.get(this.KEYS.consultations) as Record<string, unknown>[] | null) || [];
  },

  saveConsultation(item: Record<string, unknown>): Record<string, unknown> {
    const list = this.getConsultations();
    list.unshift(item);
    this.set(this.KEYS.consultations, list);
    return item;
  },

  updateConsultation(
    id: string,
    updates: Record<string, unknown>
  ): Record<string, unknown> | null {
    const list = this.getConsultations();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.consultations, list);
    return list[idx];
  },

  getReminders(): Record<string, unknown>[] {
    return (this.get(this.KEYS.reminders) as Record<string, unknown>[] | null) || [];
  },

  saveReminder(reminder: Record<string, unknown>): Record<string, unknown> {
    const list = this.getReminders();
    list.unshift(reminder);
    this.set(this.KEYS.reminders, list);
    return reminder;
  },

  updateReminder(
    id: string,
    updates: Record<string, unknown>
  ): Record<string, unknown> | null {
    const list = this.getReminders();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.reminders, list);
    return list[idx];
  },

  deleteReminder(id: string): void {
    const list = this.getReminders().filter((r) => r.id !== id);
    this.set(this.KEYS.reminders, list);
  },

  getClubProfile(phone?: string | null): ClubProfile {
    const key = digitsOnly(phone) || 'guest';
    const all = (this.get(this.KEYS.club) as Record<string, ClubProfile> | null) || {};
    if (!all[key]) {
      all[key] = {
        phone: key,
        points: 0,
        visits: 0,
        referrals: 0,
        referredPhones: [],
        redeemed: [],
        history: [],
      };
      this.set(this.KEYS.club, all);
    }
    all[key].referrals = Number(all[key].referrals || 0);
    all[key].referredPhones = Array.isArray(all[key].referredPhones)
      ? all[key].referredPhones
      : [];
    all[key].redeemed = Array.isArray(all[key].redeemed) ? all[key].redeemed : [];
    all[key].history = Array.isArray(all[key].history) ? all[key].history : [];
    all[key].brushHistory = normalizeBrushHistory(all[key]);
    return all[key];
  },

  saveClubProfile(phone: string | null | undefined, profile: ClubProfile): ClubProfile {
    const key = digitsOnly(phone) || 'guest';
    const all = (this.get(this.KEYS.club) as Record<string, ClubProfile> | null) || {};
    all[key] = profile;
    this.set(this.KEYS.club, all);
    return profile;
  },

  addClubPoints(phone: string | null | undefined, points: number, reason: string): ClubProfile {
    const profile = this.getClubProfile(phone);
    profile.points += points;
    profile.history.unshift({ points, reason, date: new Date().toISOString() });
    return this.saveClubProfile(phone, profile);
  },

  getBrushStatus(profile: ClubProfile): BrushStatus {
    return getBrushStatusForProfile(profile);
  },

  recordBrush(phone: string | null | undefined): BrushResult {
    const key = digitsOnly(phone);
    if (!key || key.length < 10) {
      return { ok: false, error: 'ابتدا شماره موبایل باشگاه را وارد کنید.' };
    }

    const profile = this.getClubProfile(key);
    const status = getBrushStatusForProfile(profile);
    if (!status.canBrush) {
      return { ok: false, error: status.errorMessage || 'در حال حاضر امکان ثبت مسواک وجود ندارد.' };
    }

    const nowIso = new Date().toISOString();
    profile.brushHistory = [...normalizeBrushHistory(profile), nowIso];
    profile.points += BRUSH_POINTS;
    profile.history.unshift({
      points: BRUSH_POINTS,
      reason: 'مسواک زدم',
      date: nowIso,
    });

    return { ok: true, profile: this.saveClubProfile(key, profile) };
  },

  getClubTier(points: number): ClubTier {
    const tiers = PASTEUR_DATA.clubTiers.map((t) => ({ ...t })).sort(
      (a, b) => b.minPoints - a.minPoints
    );
    return tiers.find((t) => points >= t.minPoints) || tiers[tiers.length - 1];
  },

  getGallery(): GalleryItem[] {
    const stored = this.get(this.KEYS.gallery) as GalleryItem[] | null;
    if (stored) return stored;
    return PASTEUR_DATA.galleryItems.map((g) => ({ ...g }));
  },

  saveGallery(items: GalleryItem[]): void {
    this.set(this.KEYS.gallery, items);
  },

  initGalleryIfNeeded(): void {
    if (!this.get(this.KEYS.gallery)) {
      this.saveGallery(PASTEUR_DATA.galleryItems.map((g) => ({ ...g })));
    }
  },

  getLaserServices(): LaserService[] {
    const stored = this.get(this.KEYS.laserServices) as LaserService[] | null;
    const source = stored || PASTEUR_DATA.laserServices.map((s) => ({ ...s }));
    return source.map((service, index) => ({
      ...service,
      id: service.id || `laser-${index + 1}`,
      active: service.active !== false,
    }));
  },

  saveLaserServices(services: LaserService[]): void {
    this.set(this.KEYS.laserServices, services);
  },

  initLaserServicesIfNeeded(): void {
    if (!this.get(this.KEYS.laserServices)) {
      this.saveLaserServices(PASTEUR_DATA.laserServices.map((s) => ({ ...s })));
    }
  },

  resetLaserServices(): void {
    this.saveLaserServices(PASTEUR_DATA.laserServices.map((s) => ({ ...s })));
  },

  getMembershipPlans(): Membership[] {
    const stored = this.get(this.KEYS.membershipPlans) as Membership[] | null;
    const source = stored || PASTEUR_DATA.memberships.map((m) => ({ ...m, features: [...m.features] }));
    return source
      .filter((m) => m.id === 'regular' || m.id === 'vip')
      .map((m) => ({
        ...m,
        features: [...(m.features || [])],
        downPaymentPercent: Number(m.downPaymentPercent ?? (m.id === 'vip' ? 20 : 30)),
      }));
  },

  saveMembershipPlans(plans: Membership[]): void {
    this.set(this.KEYS.membershipPlans, plans);
  },

  initMembershipPlansIfNeeded(): void {
    if (!this.get(this.KEYS.membershipPlans)) {
      this.saveMembershipPlans(
        PASTEUR_DATA.memberships.map((m) => ({ ...m, features: [...m.features] })),
      );
    }
  },

  resetMembershipPlans(): void {
    this.saveMembershipPlans(
      PASTEUR_DATA.memberships.map((m) => ({ ...m, features: [...m.features] })),
    );
  },

  getNursingServices(): NursingService[] {
    const stored = this.get(this.KEYS.nursingServices) as NursingService[] | null;
    const source = stored || PASTEUR_DATA.nursingServices.map((s) => ({
      ...s,
      items: (s.items || []).map((item) => ({ ...item })),
    }));
    return source.map((service, index) => ({
      ...service,
      id: service.id || `nursing-${index + 1}`,
      items: Array.isArray(service.items) ? service.items.map((item) => ({ ...item })) : [],
      active: service.active !== false,
    }));
  },

  saveNursingServices(services: NursingService[]): void {
    this.set(this.KEYS.nursingServices, services);
  },

  initNursingServicesIfNeeded(): void {
    if (!this.get(this.KEYS.nursingServices)) {
      this.saveNursingServices(
        PASTEUR_DATA.nursingServices.map((s) => ({
          ...s,
          items: (s.items || []).map((item) => ({ ...item })),
        })),
      );
    }
  },

  resetNursingServices(): void {
    this.saveNursingServices(
      PASTEUR_DATA.nursingServices.map((s) => ({
        ...s,
        items: (s.items || []).map((item) => ({ ...item })),
      })),
    );
  },

  getSettings(): PasteurSettings {
    const stored = this.get(this.KEYS.settings) as Partial<PasteurSettings> | null;
    return {
      dentalReservationFee: Number(
        stored?.dentalReservationFee ?? PASTEUR_DATA.settings.dentalReservationFee,
      ),
    };
  },

  saveSettings(settings: PasteurSettings): void {
    this.set(this.KEYS.settings, {
      dentalReservationFee: Number(settings.dentalReservationFee || 0),
    });
  },

  initSettingsIfNeeded(): void {
    if (!this.get(this.KEYS.settings)) {
      this.saveSettings({ ...PASTEUR_DATA.settings });
    }
  },

  resetSettings(): void {
    this.saveSettings({ ...PASTEUR_DATA.settings });
  },

  getDentalReservationFee(): number {
    this.initSettingsIfNeeded();
    return this.getSettings().dentalReservationFee;
  },

  getConsultationTypes(): ConsultationType[] {
    const stored = this.get(this.KEYS.consultationTypes) as ConsultationType[] | null;
    const source = stored || PASTEUR_DATA.consultationTypes.map((type) => ({ ...type }));
    return source.map((type) => ({
      ...type,
      priceNum: Number(type.priceNum || 0),
      price: type.price || `${Number(type.priceNum || 0).toLocaleString('fa-IR')} تومان`,
    }));
  },

  saveConsultationTypes(types: ConsultationType[]): void {
    this.set(
      this.KEYS.consultationTypes,
      types.map((type) => ({
        ...type,
        priceNum: Number(type.priceNum || 0),
        price: `${Number(type.priceNum || 0).toLocaleString('fa-IR')} تومان`,
      })),
    );
  },

  initConsultationPricingIfNeeded(): void {
    if (!this.get(this.KEYS.consultationTypes)) {
      this.saveConsultationTypes(PASTEUR_DATA.consultationTypes.map((type) => ({ ...type })));
    }
    if (!this.get(this.KEYS.specialtyTariffs)) {
      this.saveSpecialtyTariffs({ ...PASTEUR_DATA.specialtyTariffs });
    }
  },

  resetConsultationTypes(): void {
    this.saveConsultationTypes(PASTEUR_DATA.consultationTypes.map((type) => ({ ...type })));
  },

  getSpecialtyTariffs(): SpecialtyTariffs {
    const stored = this.get(this.KEYS.specialtyTariffs) as SpecialtyTariffs | null;
    return stored ? { ...stored } : { ...PASTEUR_DATA.specialtyTariffs };
  },

  saveSpecialtyTariffs(tariffs: SpecialtyTariffs): void {
    this.set(this.KEYS.specialtyTariffs, tariffs);
  },

  resetSpecialtyTariffs(): void {
    this.saveSpecialtyTariffs({ ...PASTEUR_DATA.specialtyTariffs });
  },

  getLastBooking(): Booking | null {
    const bookings = this.getBookings().filter((b) => b.status === 'confirmed');
    return bookings[0] || null;
  },

  getWalletSettings(): WalletSettings {
    this.initWalletSettingsIfNeeded();
    const stored = this.get(this.KEYS.walletSettings) as WalletSettings | null;
    return {
      ...DEFAULT_WALLET_SETTINGS,
      ...(stored || {}),
    };
  },

  saveWalletSettings(settings: WalletSettings): WalletSettings {
    const cleaned: WalletSettings = {
      regularCap: Number(settings.regularCap || DEFAULT_WALLET_SETTINGS.regularCap),
      membershipVipCap: Number(settings.membershipVipCap || DEFAULT_WALLET_SETTINGS.membershipVipCap),
      shopVipCap: Number(settings.shopVipCap || DEFAULT_WALLET_SETTINGS.shopVipCap),
      graceMonths: Number(settings.graceMonths ?? DEFAULT_WALLET_SETTINGS.graceMonths),
      installmentMin: Number(settings.installmentMin ?? DEFAULT_WALLET_SETTINGS.installmentMin),
      installmentMax: Number(settings.installmentMax ?? DEFAULT_WALLET_SETTINGS.installmentMax),
    };
    this.set(this.KEYS.walletSettings, cleaned);
    return cleaned;
  },

  initWalletSettingsIfNeeded(): void {
    if (!this.get(this.KEYS.walletSettings)) {
      this.saveWalletSettings(DEFAULT_WALLET_SETTINGS);
    }
  },

  getWalletsMap(): Record<string, Wallet> {
    return (this.get(this.KEYS.wallets) as Record<string, Wallet> | null) || {};
  },

  listWallets(): Wallet[] {
    return Object.values(this.getWalletsMap()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  saveWallet(wallet: Wallet): Wallet {
    const key = digitsOnly(wallet.phone);
    const all = this.getWalletsMap();
    all[key] = {
      ...wallet,
      phone: key,
      transactions: Array.isArray(wallet.transactions) ? wallet.transactions : [],
      activeKinds: Array.isArray(wallet.activeKinds) ? wallet.activeKinds : ['regular'],
    };
    this.set(this.KEYS.wallets, all);
    return all[key];
  },

  deriveWalletKindsFromUser(phone?: string | null): WalletKind[] {
    const key = digitsOnly(phone);
    if (!key) return ['regular'];

    const kinds: WalletKind[] = ['regular'];
    const paidMembers = this.getMembers().filter(
      (m) => m.status === 'paid' && digitsOnly(m.patientPhone) === key,
    );

    for (const member of paidMembers) {
      const planId = String(member.planId || '');
      if (planId === 'regular') kinds.push('regular');
      if (planId === 'vip') {
        kinds.push('membership-vip');
        kinds.push('shop-vip');
      }
      if (planId === 'shop-vip') kinds.push('shop-vip');
    }

    if (this.isShopVip(key)) kinds.push('shop-vip');

    return [...new Set(kinds)];
  },

  getOrCreateWallet(phone?: string | null): Wallet | null {
    const key = digitsOnly(phone);
    if (!key) return null;

    this.initWalletSettingsIfNeeded();
    const settings = this.getWalletSettings();
    const all = this.getWalletsMap();
    const now = new Date().toISOString();

    if (!all[key]) {
      const activeKinds = this.deriveWalletKindsFromUser(key);
      all[key] = {
        phone: key,
        balance: 0,
        ceiling: computeWalletCeiling(activeKinds, settings),
        activeKinds,
        status: 'active',
        transactions: [],
        createdAt: now,
        updatedAt: now,
      };
      this.set(this.KEYS.wallets, all);
    }

    return all[key];
  },

  syncWalletFromMembership(phone?: string | null): Wallet | null {
    const wallet = this.getOrCreateWallet(phone);
    if (!wallet) return null;

    const settings = this.getWalletSettings();
    const derived = this.deriveWalletKindsFromUser(phone);
    const merged = [...new Set([...wallet.activeKinds, ...derived])];
    const newCeiling = computeWalletCeiling(merged, settings);

    wallet.activeKinds = merged;
    wallet.ceiling = newCeiling;
    wallet.updatedAt = new Date().toISOString();
    return this.saveWallet(wallet);
  },

  upgradeWalletForUser(phone?: string | null, kinds: WalletKind[] = []): Wallet | null {
    const wallet = this.getOrCreateWallet(phone);
    if (!wallet || !kinds.length) return wallet;

    const settings = this.getWalletSettings();
    const merged = [...new Set([...wallet.activeKinds, ...kinds])];
    const oldCeiling = wallet.ceiling;
    const newCeiling = computeWalletCeiling(merged, settings);

    wallet.activeKinds = merged;
    wallet.ceiling = newCeiling;
    wallet.updatedAt = new Date().toISOString();

    if (newCeiling > oldCeiling) {
      wallet.transactions.unshift({
        id: this.generateId(),
        type: 'upgrade',
        amount: newCeiling - oldCeiling,
        balanceAfter: wallet.balance,
        description: `ارتقای سقف اعتبار به ${newCeiling.toLocaleString('fa-IR')} تومان`,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
    }

    return this.saveWallet(wallet);
  },

  addTransaction(
    phone: string | null | undefined,
    input: {
      type: WalletTransactionType;
      amount: number;
      description: string;
      status?: WalletTransactionStatus;
    },
  ): Wallet | null {
    const wallet = this.getOrCreateWallet(phone);
    if (!wallet) return null;

    const status = input.status || 'completed';
    let balanceAfter = wallet.balance;

    if (status === 'completed') {
      if (input.type === 'credit') {
        balanceAfter = Math.min(wallet.balance + input.amount, wallet.ceiling);
      } else if (input.type === 'debit') {
        balanceAfter = Math.max(0, wallet.balance - input.amount);
      }
    }

    wallet.balance = balanceAfter;
    wallet.transactions.unshift({
      id: this.generateId(),
      type: input.type,
      amount: input.amount,
      balanceAfter,
      description: input.description,
      status,
      createdAt: new Date().toISOString(),
    });
    wallet.updatedAt = new Date().toISOString();
    return this.saveWallet(wallet);
  },

  updateWalletStatus(phone: string | null | undefined, status: WalletStatus): Wallet | null {
    const wallet = this.getOrCreateWallet(phone);
    if (!wallet) return null;
    wallet.status = status;
    wallet.updatedAt = new Date().toISOString();
    return this.saveWallet(wallet);
  },

  updateWalletTransactionStatus(
    phone: string | null | undefined,
    transactionId: string,
    status: WalletTransactionStatus,
  ): Wallet | null {
    const wallet = this.getOrCreateWallet(phone);
    if (!wallet) return null;

    const tx = wallet.transactions.find((item) => item.id === transactionId);
    if (!tx) return wallet;

    tx.status = status;
    wallet.updatedAt = new Date().toISOString();
    return this.saveWallet(wallet);
  },

  initWalletsIfNeeded(): void {
    this.initWalletSettingsIfNeeded();
  },

  // —— بیمار / بیمه / نظرات / شکایات / راهنما / اقساط ——

  initPatientDomainIfNeeded(): void {
    if (!this.get(this.KEYS.baseInsurances)) {
      this.set(this.KEYS.baseInsurances, DEFAULT_BASE_INSURANCES.map((i) => ({ ...i })));
    }
    if (!this.get(this.KEYS.complementaryInsurances)) {
      this.set(
        this.KEYS.complementaryInsurances,
        DEFAULT_COMPLEMENTARY_INSURANCES.map((i) => ({ ...i })),
      );
    }
    if (!this.get(this.KEYS.helpItems)) {
      this.set(this.KEYS.helpItems, DEFAULT_HELP_ITEMS.map((i) => ({ ...i })));
    }
    if (!this.get(this.KEYS.patients)) this.set(this.KEYS.patients, {});
    if (!this.get(this.KEYS.insuranceInquiries)) this.set(this.KEYS.insuranceInquiries, []);
    if (!this.get(this.KEYS.doctorReviews)) this.set(this.KEYS.doctorReviews, []);
    if (!this.get(this.KEYS.complaints)) this.set(this.KEYS.complaints, []);
    if (!this.get(this.KEYS.installmentPlans)) this.set(this.KEYS.installmentPlans, []);
  },

  getBaseInsurances(): InsuranceCompany[] {
    this.initPatientDomainIfNeeded();
    return ((this.get(this.KEYS.baseInsurances) as InsuranceCompany[] | null) || []).map((i) => ({
      ...i,
    }));
  },

  saveBaseInsurances(list: InsuranceCompany[]): void {
    this.set(this.KEYS.baseInsurances, list);
  },

  getComplementaryInsurances(): InsuranceCompany[] {
    this.initPatientDomainIfNeeded();
    return (
      (this.get(this.KEYS.complementaryInsurances) as InsuranceCompany[] | null) || []
    ).map((i) => ({ ...i }));
  },

  saveComplementaryInsurances(list: InsuranceCompany[]): void {
    this.set(this.KEYS.complementaryInsurances, list);
  },

  getPatientProfile(phone?: string | null): PatientProfile | null {
    this.initPatientDomainIfNeeded();
    const key = normalizePatientPhone(phone);
    if (!key) return null;
    const all = (this.get(this.KEYS.patients) as Record<string, PatientProfile> | null) || {};
    return all[key] ? { ...all[key] } : null;
  },

  savePatientProfile(profile: PatientProfile): PatientProfile {
    this.initPatientDomainIfNeeded();
    const key = normalizePatientPhone(profile.phone);
    const all = (this.get(this.KEYS.patients) as Record<string, PatientProfile> | null) || {};
    const next: PatientProfile = {
      ...profile,
      phone: key,
      franchiseAmount: Number(profile.franchiseAmount || 0),
      updatedAt: new Date().toISOString(),
    };
    all[key] = next;
    this.set(this.KEYS.patients, all);
    return next;
  },

  listPatientProfiles(): PatientProfile[] {
    this.initPatientDomainIfNeeded();
    const all = (this.get(this.KEYS.patients) as Record<string, PatientProfile> | null) || {};
    return Object.values(all).map((p) => ({ ...p }));
  },

  patientLogin(phone: string, name: string): PatientProfile {
    const key = normalizePatientPhone(phone);
    const existing = this.getPatientProfile(key);
    const now = new Date().toISOString();
    const profile =
      existing ||
      this.savePatientProfile({
        phone: key,
        name: name.trim() || 'بیمار',
        franchiseAmount: 50000,
        createdAt: now,
        updatedAt: now,
      });
    if (name.trim() && profile.name !== name.trim()) {
      profile.name = name.trim();
      this.savePatientProfile(profile);
    }
    if (canUseStorage()) {
      sessionStorage.setItem(this.KEYS.patientSession, JSON.stringify({ phone: key }));
    }
    return profile;
  },

  getPatientSession(): PatientProfile | null {
    if (!canUseStorage()) return null;
    try {
      const raw = sessionStorage.getItem(this.KEYS.patientSession);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { phone?: string };
      return this.getPatientProfile(parsed.phone);
    } catch {
      return null;
    }
  },

  patientLogout(): void {
    if (!canUseStorage()) return;
    sessionStorage.removeItem(this.KEYS.patientSession);
  },

  getInsuranceInquiries(): InsuranceInquiry[] {
    this.initPatientDomainIfNeeded();
    return ((this.get(this.KEYS.insuranceInquiries) as InsuranceInquiry[] | null) || []).map(
      (i) => ({ ...i }),
    );
  },

  saveInsuranceInquiry(inquiry: InsuranceInquiry): InsuranceInquiry {
    const list = this.getInsuranceInquiries();
    list.unshift(inquiry);
    this.set(this.KEYS.insuranceInquiries, list);
    return inquiry;
  },

  updateInsuranceInquiry(
    id: string,
    status: InsuranceInquiryStatus,
  ): InsuranceInquiry | null {
    const list = this.getInsuranceInquiries();
    const idx = list.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    list[idx] = {
      ...list[idx],
      status,
      resolvedAt: new Date().toISOString(),
    };
    this.set(this.KEYS.insuranceInquiries, list);
    return list[idx];
  },

  getDoctorReviews(): DoctorReview[] {
    this.initPatientDomainIfNeeded();
    return ((this.get(this.KEYS.doctorReviews) as DoctorReview[] | null) || []).map((r) => ({
      ...r,
    }));
  },

  saveDoctorReview(review: DoctorReview): DoctorReview {
    const list = this.getDoctorReviews();
    list.unshift(review);
    this.set(this.KEYS.doctorReviews, list);
    return review;
  },

  updateDoctorReviewStatus(
    id: string,
    status: DoctorReview['status'],
  ): DoctorReview | null {
    const list = this.getDoctorReviews();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], status };
    this.set(this.KEYS.doctorReviews, list);
    return list[idx];
  },

  getApprovedReviewsForDoctor(doctorId: string | number): DoctorReview[] {
    return this.getDoctorReviews().filter(
      (r) => String(r.doctorId) === String(doctorId) && r.status === 'approved',
    );
  },

  getComplaints(): Complaint[] {
    this.initPatientDomainIfNeeded();
    return ((this.get(this.KEYS.complaints) as Complaint[] | null) || []).map((c) => ({
      ...c,
    }));
  },

  saveComplaint(complaint: Complaint): Complaint {
    const list = this.getComplaints();
    list.unshift(complaint);
    this.set(this.KEYS.complaints, list);
    return complaint;
  },

  updateComplaintStatus(id: string, status: ComplaintStatus): Complaint | null {
    const list = this.getComplaints();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], status };
    this.set(this.KEYS.complaints, list);
    return list[idx];
  },

  getHelpItems(): HelpItem[] {
    this.initPatientDomainIfNeeded();
    return ((this.get(this.KEYS.helpItems) as HelpItem[] | null) || []).map((h) => ({ ...h }));
  },

  saveHelpItems(items: HelpItem[]): void {
    this.set(this.KEYS.helpItems, items);
  },

  getInstallmentPlans(phone?: string | null): InstallmentPlan[] {
    this.initPatientDomainIfNeeded();
    const all = ((this.get(this.KEYS.installmentPlans) as InstallmentPlan[] | null) || []).map(
      (p) => ({ ...p }),
    );
    const key = normalizePatientPhone(phone);
    if (!key) return all;
    return all.filter((p) => p.phone === key);
  },

  saveInstallmentPlan(plan: InstallmentPlan): InstallmentPlan {
    const list = this.getInstallmentPlans();
    list.unshift(plan);
    this.set(this.KEYS.installmentPlans, list);
    return plan;
  },

  createMembershipInstallmentPlan(input: {
    phone?: string | null;
    patientName?: string;
    amount?: number;
    planName?: string;
  }): InstallmentPlan | null {
    const phone = normalizePatientPhone(input.phone);
    if (!phone) return null;
    const total = Math.max(0, Number(input.amount || 0));
    const count = 6;
    const plan: InstallmentPlan = {
      id: this.generateId(),
      phone,
      patientName: input.patientName,
      source: 'membership',
      title: `اقساط ${input.planName || 'عضویت'}`,
      totalAmount: total,
      paidAmount: Math.round(total / count),
      installmentCount: count,
      dueDates: buildDueDates(count),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.saveInstallmentPlan(plan);
    const nextDue = plan.dueDates[0];
    if (nextDue) {
      this.saveReminder({
        id: this.generateId(),
        type: 'installment',
        phone,
        title: `سررسید قسط — ${plan.title}`,
        message: `قسط بعدی طرح «${plan.title}» در تاریخ ${nextDue}`,
        dueDate: nextDue,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
    return plan;
  },
};

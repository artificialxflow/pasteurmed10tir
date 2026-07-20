/**
 * مدیریت localStorage — پاستور پلاس (SSR-safe)
 */
import {
  PASTEUR_DATA,
  type ClubTier,
  type GalleryItem,
  type Product,
  type Service,
  type Visitor,
} from './data';

export type { ClubTier, GalleryItem, Product, Service, Visitor };

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
  [key: string]: unknown;
};

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
  consultations: 'pasteur_consultations',
  reminders: 'pasteur_reminders',
  club: 'pasteur_club',
  gallery: 'pasteur_gallery',
  services: 'pasteur_services',
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

  isAdminLoggedIn(): boolean {
    if (!canUseStorage()) return false;
    return sessionStorage.getItem(this.KEYS.adminSession) === 'true';
  },

  adminLogin(): void {
    if (!canUseStorage()) return;
    sessionStorage.setItem(this.KEYS.adminSession, 'true');
  },

  adminLogout(): void {
    if (!canUseStorage()) return;
    sessionStorage.removeItem(this.KEYS.adminSession);
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

  getLastBooking(): Booking | null {
    const bookings = this.getBookings().filter((b) => b.status === 'confirmed');
    return bookings[0] || null;
  },
};

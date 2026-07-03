/**
 * مدیریت localStorage — پاستور پلاس
 */
const PasteurStorage = {
  KEYS: {
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
    visitors: 'pasteur_visitors',
    commissions: 'pasteur_commissions',
    facilityRequests: 'pasteur_facility_requests',
    shopVipPhones: 'pasteur_shop_vip_phones',
    membershipApplications: 'pasteur_membership_applications',
  },

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getBookings() {
    return this.get(this.KEYS.bookings) || [];
  },

  saveBooking(booking) {
    const list = this.getBookings();
    list.unshift(booking);
    this.set(this.KEYS.bookings, list);
    return booking;
  },

  updateBooking(id, updates) {
    const list = this.getBookings();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.bookings, list);
    return list[idx];
  },

  isSlotBooked(doctorId, day, type, timeValue) {
    return this.getBookings().some(
      (b) =>
        b.status !== 'cancelled' &&
        b.doctorId === doctorId &&
        b.day === day &&
        b.type === type &&
        b.timeValue === timeValue
    );
  },

  getPendingBooking() {
    return this.get(this.KEYS.pendingBooking);
  },

  setPendingBooking(data) {
    this.set(this.KEYS.pendingBooking, data);
  },

  clearPendingBooking() {
    localStorage.removeItem(this.KEYS.pendingBooking);
  },

  getPendingPayment() {
    return this.get(this.KEYS.pendingPayment);
  },

  setPendingPayment(data) {
    this.set(this.KEYS.pendingPayment, data);
  },

  clearPendingPayment() {
    localStorage.removeItem(this.KEYS.pendingPayment);
  },

  getMembers() {
    return this.get(this.KEYS.members) || [];
  },

  saveMember(member) {
    const list = this.getMembers();
    list.unshift(member);
    this.set(this.KEYS.members, list);
    return member;
  },

  getMembershipApplications() {
    return this.get(this.KEYS.membershipApplications) || [];
  },

  saveMembershipApplication(application) {
    const list = this.getMembershipApplications();
    list.unshift(application);
    this.set(this.KEYS.membershipApplications, list);
    return application;
  },

  getProducts() {
    const stored = this.get(this.KEYS.products);
    if (stored) return stored;
    return PASTEUR_DATA.products.map((p) => ({ ...p }));
  },

  saveProducts(products) {
    this.set(this.KEYS.products, products);
  },

  getShopOrders() {
    return this.get(this.KEYS.shopOrders) || [];
  },

  saveShopOrder(order) {
    const list = this.getShopOrders();
    list.unshift(order);
    this.set(this.KEYS.shopOrders, list);
    return order;
  },

  updateShopOrder(id, updates) {
    const list = this.getShopOrders();
    const idx = list.findIndex((order) => order.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.shopOrders, list);
    return list[idx];
  },

  initProductsIfNeeded() {
    if (!this.get(this.KEYS.products)) {
      this.saveProducts(PASTEUR_DATA.products.map((p) => ({ ...p })));
    }
  },

  getVisitors() {
    const stored = this.get(this.KEYS.visitors);
    if (stored) return stored;
    return PASTEUR_DATA.visitors.map((v) => ({ ...v }));
  },

  saveVisitors(visitors) {
    this.set(this.KEYS.visitors, visitors);
  },

  findVisitorByCode(code) {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) return null;
    return this.getVisitors().find((v) => v.code.toUpperCase() === normalized && v.status === 'active') || null;
  },

  getCommissions() {
    return this.get(this.KEYS.commissions) || [];
  },

  saveCommission(data) {
    const visitor = this.findVisitorByCode(data.referralCode);
    if (!visitor) return null;
    const baseAmount = Number(data.amount || 0);
    const commissionAmount = Math.round((baseAmount * visitor.commissionRate) / 100);
    const item = {
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

  addReferralClubPoints(visitor, data) {
    const visitorPhone = visitor.phone?.replace(/[^\d]/g, '');
    const customerPhone = data.customerPhone?.replace(/[^\d]/g, '');
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

  updateCommission(id, updates) {
    const list = this.getCommissions();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.commissions, list);
    return list[idx];
  },

  getFacilityRequests() {
    return this.get(this.KEYS.facilityRequests) || [];
  },

  saveFacilityRequest(request) {
    const list = this.getFacilityRequests();
    list.unshift(request);
    this.set(this.KEYS.facilityRequests, list);
    return request;
  },

  activateShopVip(phone) {
    const key = phone?.replace(/[^\d]/g, '');
    if (!key) return;
    const list = this.get(this.KEYS.shopVipPhones) || [];
    if (!list.includes(key)) {
      list.push(key);
      this.set(this.KEYS.shopVipPhones, list);
    }
  },

  isShopVip(phone) {
    const key = phone?.replace(/[^\d]/g, '');
    if (!key) return false;
    const vipPhones = this.get(this.KEYS.shopVipPhones) || [];
    const memberPhones = this.getMembers()
      .filter((m) => m.status === 'paid' && ['vip', 'shop-vip'].includes(m.planId))
      .map((m) => m.patientPhone?.replace(/[^\d]/g, ''));
    return vipPhones.includes(key) || memberPhones.includes(key);
  },

  isAdminLoggedIn() {
    return sessionStorage.getItem(this.KEYS.adminSession) === 'true';
  },

  adminLogin() {
    sessionStorage.setItem(this.KEYS.adminSession, 'true');
  },

  adminLogout() {
    sessionStorage.removeItem(this.KEYS.adminSession);
  },

  generateId() {
    return `PST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  },

  formatHour(h) {
    return `ساعت ${h}`;
  },

  getBookingStats() {
    const bookings = this.getBookings();
    const today = new Date().toLocaleDateString('fa-IR');
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const todayBookings = confirmed.filter((b) => b.dateLabel === today || b.createdAt?.startsWith(new Date().toISOString().slice(0, 10)));
    const revenue = confirmed.reduce((sum, b) => sum + (b.amount || 0), 0);
    const members = this.getMembers().filter((m) => m.status === 'paid');
    const commissions = this.getCommissions();

    return {
      totalBookings: confirmed.length,
      todayVisitors: todayBookings.length,
      revenue,
      activeMembers: members.length,
      commissionsTotal: commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      recentBookings: bookings.slice(0, 8),
    };
  },

  getConsultations() {
    return this.get(this.KEYS.consultations) || [];
  },

  saveConsultation(item) {
    const list = this.getConsultations();
    list.unshift(item);
    this.set(this.KEYS.consultations, list);
    return item;
  },

  updateConsultation(id, updates) {
    const list = this.getConsultations();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.consultations, list);
    return list[idx];
  },

  getReminders() {
    return this.get(this.KEYS.reminders) || [];
  },

  saveReminder(reminder) {
    const list = this.getReminders();
    list.unshift(reminder);
    this.set(this.KEYS.reminders, list);
    return reminder;
  },

  updateReminder(id, updates) {
    const list = this.getReminders();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.set(this.KEYS.reminders, list);
    return list[idx];
  },

  deleteReminder(id) {
    const list = this.getReminders().filter((r) => r.id !== id);
    this.set(this.KEYS.reminders, list);
  },

  getClubProfile(phone) {
    const key = phone?.replace(/[^\d]/g, '') || 'guest';
    const all = this.get(this.KEYS.club) || {};
    if (!all[key]) {
      all[key] = { phone: key, points: 0, visits: 0, referrals: 0, referredPhones: [], redeemed: [], history: [] };
      this.set(this.KEYS.club, all);
    }
    all[key].referrals = Number(all[key].referrals || 0);
    all[key].referredPhones = Array.isArray(all[key].referredPhones) ? all[key].referredPhones : [];
    all[key].redeemed = Array.isArray(all[key].redeemed) ? all[key].redeemed : [];
    all[key].history = Array.isArray(all[key].history) ? all[key].history : [];
    return all[key];
  },

  saveClubProfile(phone, profile) {
    const key = phone?.replace(/[^\d]/g, '') || 'guest';
    const all = this.get(this.KEYS.club) || {};
    all[key] = profile;
    this.set(this.KEYS.club, all);
    return profile;
  },

  addClubPoints(phone, points, reason) {
    const profile = this.getClubProfile(phone);
    profile.points += points;
    profile.history.unshift({ points, reason, date: new Date().toISOString() });
    return this.saveClubProfile(phone, profile);
  },

  getClubTier(points) {
    const tiers = [...PASTEUR_DATA.clubTiers].sort((a, b) => b.minPoints - a.minPoints);
    return tiers.find((t) => points >= t.minPoints) || tiers[tiers.length - 1];
  },

  getGallery() {
    const stored = this.get(this.KEYS.gallery);
    if (stored) return stored;
    return PASTEUR_DATA.galleryItems.map((g) => ({ ...g }));
  },

  saveGallery(items) {
    this.set(this.KEYS.gallery, items);
  },

  initGalleryIfNeeded() {
    if (!this.get(this.KEYS.gallery)) {
      this.saveGallery(PASTEUR_DATA.galleryItems.map((g) => ({ ...g })));
    }
  },

  getLastBooking() {
    const bookings = this.getBookings().filter((b) => b.status === 'confirmed');
    return bookings[0] || null;
  },
};

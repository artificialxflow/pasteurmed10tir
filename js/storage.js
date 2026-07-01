/**
 * مدیریت localStorage — موسسه پاستور
 */
const PasteurStorage = {
  KEYS: {
    bookings: 'pasteur_bookings',
    pendingBooking: 'pasteur_pending_booking',
    pendingPayment: 'pasteur_pending_payment',
    members: 'pasteur_members',
    products: 'pasteur_products',
    adminSession: 'pasteur_admin_session',
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

  getProducts() {
    const stored = this.get(this.KEYS.products);
    if (stored) return stored;
    return PASTEUR_DATA.products.map((p) => ({ ...p }));
  },

  saveProducts(products) {
    this.set(this.KEYS.products, products);
  },

  initProductsIfNeeded() {
    if (!this.get(this.KEYS.products)) {
      this.saveProducts(PASTEUR_DATA.products.map((p) => ({ ...p })));
    }
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

    return {
      totalBookings: confirmed.length,
      todayVisitors: todayBookings.length,
      revenue,
      activeMembers: members.length,
      recentBookings: bookings.slice(0, 8),
    };
  },
};

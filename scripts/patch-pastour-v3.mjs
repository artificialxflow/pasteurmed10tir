import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storagePath = path.join(root, 'pastour', 'js', 'storage.js');

let s = fs.readFileSync(storagePath, 'utf8');

if (!s.includes("patients: 'pasteur_patients'")) {
  if (!s.includes("partnerRequests: 'pasteur_partner_requests',")) {
    throw new Error('KEYS partnerRequests not found');
  }
  s = s.replace(
    "partnerRequests: 'pasteur_partner_requests',\n  },",
    `partnerRequests: 'pasteur_partner_requests',
    patients: 'pasteur_patients',
    patientSession: 'pasteur_patient_session',
    baseInsurances: 'pasteur_base_insurances',
    complementaryInsurances: 'pasteur_complementary_insurances',
    insuranceInquiries: 'pasteur_insurance_inquiries',
    doctorReviews: 'pasteur_doctor_reviews',
    complaints: 'pasteur_complaints',
    helpItems: 'pasteur_help_items',
    installmentPlans: 'pasteur_installment_plans',
  },`,
  );
}

const patientBlock = `
  // —— بیمار / بیمه / نظرات / شکایات / راهنما / اقساط (v3) ——
  DEFAULT_BASE_INSURANCES: [
    { id: 'tamin', name: 'تأمین اجتماعی', active: true },
    { id: 'salamat', name: 'بیمه سلامت', active: true },
    { id: 'niroo', name: 'نیروهای مسلح', active: true },
  ],
  DEFAULT_COMPLEMENTARY_INSURANCES: [
    { id: 'dana', name: 'بیمه دانا', active: true },
    { id: 'asia', name: 'بیمه آسیا', active: true },
    { id: 'alborz', name: 'بیمه البرز', active: true },
    { id: 'pasargad', name: 'بیمه پاسارگاد', active: true },
    { id: 'saman', name: 'بیمه سامان', active: true },
  ],
  DEFAULT_HELP_ITEMS: [
    {
      id: 'help-booking',
      title: 'آموزش رزرو نوبت دندانپزشکی',
      description: 'مراحل انتخاب پزشک، روز، ساعت و پرداخت بیعانه',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      active: true,
    },
    {
      id: 'help-account',
      title: 'راهنمای پنل کاربری و بیمه (PDF)',
      description: 'ثبت مشخصات، بیمه پایه/تکمیلی و فرانشیز',
      type: 'pdf',
      url: 'privacy.html',
      active: true,
    },
  ],

  normalizePatientPhone(phone) {
    return String(phone || '')
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[^\\d]/g, '');
  },

  initPatientDomainIfNeeded() {
    if (!this.get(this.KEYS.baseInsurances)) {
      this.set(this.KEYS.baseInsurances, this.DEFAULT_BASE_INSURANCES.map((i) => ({ ...i })));
    }
    if (!this.get(this.KEYS.complementaryInsurances)) {
      this.set(
        this.KEYS.complementaryInsurances,
        this.DEFAULT_COMPLEMENTARY_INSURANCES.map((i) => ({ ...i })),
      );
    }
    if (!this.get(this.KEYS.helpItems)) {
      this.set(this.KEYS.helpItems, this.DEFAULT_HELP_ITEMS.map((i) => ({ ...i })));
    }
    if (!this.get(this.KEYS.patients)) this.set(this.KEYS.patients, {});
    if (!this.get(this.KEYS.insuranceInquiries)) this.set(this.KEYS.insuranceInquiries, []);
    if (!this.get(this.KEYS.doctorReviews)) this.set(this.KEYS.doctorReviews, []);
    if (!this.get(this.KEYS.complaints)) this.set(this.KEYS.complaints, []);
    if (!this.get(this.KEYS.installmentPlans)) this.set(this.KEYS.installmentPlans, []);
  },

  getBaseInsurances() {
    this.initPatientDomainIfNeeded();
    return (this.get(this.KEYS.baseInsurances) || []).map((i) => ({ ...i }));
  },
  saveBaseInsurances(list) {
    this.set(this.KEYS.baseInsurances, list);
  },
  getComplementaryInsurances() {
    this.initPatientDomainIfNeeded();
    return (this.get(this.KEYS.complementaryInsurances) || []).map((i) => ({ ...i }));
  },
  saveComplementaryInsurances(list) {
    this.set(this.KEYS.complementaryInsurances, list);
  },

  getPatientProfile(phone) {
    this.initPatientDomainIfNeeded();
    const key = this.normalizePatientPhone(phone);
    if (!key) return null;
    const all = this.get(this.KEYS.patients) || {};
    return all[key] ? { ...all[key] } : null;
  },

  savePatientProfile(profile) {
    this.initPatientDomainIfNeeded();
    const key = this.normalizePatientPhone(profile.phone);
    const all = this.get(this.KEYS.patients) || {};
    const next = {
      ...profile,
      phone: key,
      franchiseAmount: Number(profile.franchiseAmount || 0),
      updatedAt: new Date().toISOString(),
    };
    all[key] = next;
    this.set(this.KEYS.patients, all);
    return next;
  },

  patientLogin(phone, name) {
    const key = this.normalizePatientPhone(phone);
    const existing = this.getPatientProfile(key);
    const now = new Date().toISOString();
    let profile = existing;
    if (!profile) {
      profile = this.savePatientProfile({
        phone: key,
        name: (name || '').trim() || 'بیمار',
        franchiseAmount: 50000,
        createdAt: now,
        updatedAt: now,
      });
    } else if ((name || '').trim() && profile.name !== name.trim()) {
      profile.name = name.trim();
      this.savePatientProfile(profile);
    }
    sessionStorage.setItem(this.KEYS.patientSession, JSON.stringify({ phone: key }));
    return profile;
  },

  getPatientSession() {
    try {
      const raw = sessionStorage.getItem(this.KEYS.patientSession);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return this.getPatientProfile(parsed.phone);
    } catch {
      return null;
    }
  },

  patientLogout() {
    sessionStorage.removeItem(this.KEYS.patientSession);
  },

  getInsuranceInquiries() {
    this.initPatientDomainIfNeeded();
    return (this.get(this.KEYS.insuranceInquiries) || []).map((i) => ({ ...i }));
  },
  saveInsuranceInquiry(inquiry) {
    const list = this.getInsuranceInquiries();
    list.unshift(inquiry);
    this.set(this.KEYS.insuranceInquiries, list);
    return inquiry;
  },
  updateInsuranceInquiry(id, status) {
    const list = this.getInsuranceInquiries();
    const idx = list.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], status, resolvedAt: new Date().toISOString() };
    this.set(this.KEYS.insuranceInquiries, list);
    return list[idx];
  },

  getDoctorReviews() {
    this.initPatientDomainIfNeeded();
    return (this.get(this.KEYS.doctorReviews) || []).map((r) => ({ ...r }));
  },
  saveDoctorReview(review) {
    const list = this.getDoctorReviews();
    list.unshift(review);
    this.set(this.KEYS.doctorReviews, list);
    return review;
  },
  getApprovedReviewsForDoctor(doctorId) {
    return this.getDoctorReviews().filter(
      (r) => String(r.doctorId) === String(doctorId) && r.status === 'approved',
    );
  },

  getComplaints() {
    this.initPatientDomainIfNeeded();
    return (this.get(this.KEYS.complaints) || []).map((c) => ({ ...c }));
  },
  saveComplaint(complaint) {
    const list = this.getComplaints();
    list.unshift(complaint);
    this.set(this.KEYS.complaints, list);
    return complaint;
  },

  getHelpItems() {
    this.initPatientDomainIfNeeded();
    return (this.get(this.KEYS.helpItems) || []).map((h) => ({ ...h }));
  },
  saveHelpItems(items) {
    this.set(this.KEYS.helpItems, items);
  },

  getInstallmentPlans(phone) {
    this.initPatientDomainIfNeeded();
    const all = (this.get(this.KEYS.installmentPlans) || []).map((p) => ({ ...p }));
    const key = this.normalizePatientPhone(phone);
    if (!key) return all;
    return all.filter((p) => p.phone === key);
  },
  saveInstallmentPlan(plan) {
    const list = this.get(this.KEYS.installmentPlans) || [];
    list.unshift(plan);
    this.set(this.KEYS.installmentPlans, list);
    return plan;
  },
  buildDueDates(count, start) {
    const dates = [];
    const base = start ? new Date(start) : new Date();
    for (let i = 1; i <= count; i += 1) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  },
  createMembershipInstallmentPlan({ phone, patientName, amount, planName }) {
    const key = this.normalizePatientPhone(phone);
    if (!key) return null;
    const total = Math.max(0, Number(amount || 0));
    const count = 6;
    const plan = {
      id: this.generateId(),
      phone: key,
      patientName,
      source: 'membership',
      title: 'اقساط ' + (planName || 'عضویت'),
      totalAmount: total,
      paidAmount: Math.round(total / count),
      installmentCount: count,
      dueDates: this.buildDueDates(count),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.saveInstallmentPlan(plan);
    if (plan.dueDates[0] && typeof this.saveReminder === 'function') {
      this.saveReminder({
        id: this.generateId(),
        type: 'installment',
        phone: key,
        title: 'سررسید قسط — ' + plan.title,
        message: 'قسط بعدی طرح «' + plan.title + '» در تاریخ ' + plan.dueDates[0],
        dueDate: plan.dueDates[0],
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
    return plan;
  },
`;

if (!s.includes('initPatientDomainIfNeeded')) {
  const marker = '\n  getLastBooking() {';
  const idx = s.lastIndexOf(marker);
  if (idx === -1) throw new Error('getLastBooking marker not found');
  // Insert patient domain before getLastBooking, keep getLastBooking at end
  s = s.slice(0, idx) + '\n' + patientBlock + s.slice(idx);
  fs.writeFileSync(storagePath, s, 'utf8');
  console.log('storage: patient domain inserted');
} else {
  console.log('storage: already has patient domain');
}

// Verify
const verify = fs.readFileSync(storagePath, 'utf8');
if (!verify.includes('createMembershipInstallmentPlan')) {
  throw new Error('storage patch failed verification');
}
console.log('storage OK');

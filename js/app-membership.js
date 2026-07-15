/**
 * عضویت دندانپزشکی — اپ
 */
const AppMembership = {
  getDurationOptions() {
    const pricing = PASTEUR_DATA.membershipPricing || {
      regularPerPerson: 1000000,
      regularTwoYearPerPerson: 1600000,
      vipPerPerson: 1600000,
      vipTwoYearPerPerson: 2560000,
    };
    return PASTEUR_DATA.membershipCoveragePlans || [
      { id: 'one-year', title: 'عضویت یک‌ساله', duration: '۱ ساله', regularPerPerson: pricing.regularPerPerson, vipPerPerson: pricing.vipPerPerson, regularValidity: '۱ ساله', vipValidity: '۱ ساله', discountPercent: 0 },
      { id: 'two-year', title: 'عضویت دوساله', duration: '۲ ساله', regularPerPerson: pricing.regularTwoYearPerPerson, vipPerPerson: pricing.vipTwoYearPerPerson, regularValidity: '۲ ساله', vipValidity: '۲ ساله', discountPercent: 20 },
    ];
  },

  getMembershipPlans() {
    return ['regular', 'vip']
      .map((id) => PASTEUR_DATA.memberships.find((m) => m.id === id))
      .filter(Boolean);
  },

  normalizeCount(value) {
    return Math.max(1, parseInt(value, 10) || 1);
  },

  getUnitPrice(tier, planId) {
    const plan = this.getDurationOptions().find((p) => p.id === planId);
    if (!plan) return 0;
    return tier === 'vip' ? plan.vipPerPerson : plan.regularPerPerson;
  },

  getValidityLabel(tier, planId) {
    const plan = this.getDurationOptions().find((p) => p.id === planId);
    if (!plan) return tier === 'vip' ? '۲۴ ماهه' : '۱۵ ماهه';
    return tier === 'vip' ? plan.vipValidity : plan.regularValidity;
  },

  formatToman(num) {
    return Number(num || 0).toLocaleString('fa-IR') + ' تومان';
  },

  formatRial(num) {
    return Number(num || 0).toLocaleString('fa-IR') + ' ریال';
  },

  getLoanPlan(tier) {
    return this.getMembershipPlans().find((p) => p.id === tier) || this.getMembershipPlans()[0];
  },

  getLoanMonthOptions(tier) {
    const plan = this.getLoanPlan(tier);
    const maxMonths = Number(plan?.loanTermLabel?.replace(/[^\d]/g, '') || (tier === 'vip' ? 24 : 15));
    return Array.from({ length: maxMonths }, (_, i) => i + 1)
      .filter((month) => [3, 6, 10, 12, 15, 18, 24, maxMonths].includes(month) && month <= maxMonths)
      .filter((month, index, arr) => arr.indexOf(month) === index);
  },

  calculateLoan({ tier, amount, months }) {
    const plan = this.getLoanPlan(tier);
    const limit = Number(plan?.loanLimit || 0);
    const validAmount = Math.min(Math.max(0, Number(amount || 0)), limit);
    const term = Math.max(1, Number(months || 1));
    const totalRepayment = Math.round(validAmount * 1.12);
    const installment = Math.ceil(totalRepayment / term);
    return { plan, limit, validAmount, totalRepayment, installment, months: term };
  },

  readApplicationForm() {
    const planId = document.getElementById('app-plan')?.value;
    const plan = this.getDurationOptions().find((p) => p.id === planId);
    const tier = document.getElementById('app-tier')?.value || 'regular';
    const memberCount = this.normalizeCount(document.getElementById('app-member-count')?.value);
    const unitPriceToman = this.getUnitPrice(tier, planId);
    const amountToman = unitPriceToman * memberCount;
    const referralCode = document.getElementById('app-referral')?.value.trim().toUpperCase() || '';
    const visitor = PasteurStorage.findVisitorByCode(referralCode);
    return {
      id: PasteurStorage.generateId(),
      date: document.getElementById('app-date')?.value || new Date().toLocaleDateString('fa-IR'),
      referralCode,
      visitorName: visitor?.name || document.getElementById('app-agent-name')?.value || '—',
      patientName: document.getElementById('app-name')?.value.trim() || '',
      nationalId: document.getElementById('app-national-id')?.value.trim() || '',
      age: document.getElementById('app-age')?.value || '',
      job: document.getElementById('app-job')?.value.trim() || '',
      postalCode: document.getElementById('app-postal')?.value.trim() || '',
      phone: document.getElementById('app-phone')?.value.trim() || '',
      homeAddress: document.getElementById('app-home-address')?.value.trim() || '',
      workAddress: document.getElementById('app-work-address')?.value.trim() || '',
      planId: plan?.id,
      planTitle: plan ? `${plan.title} (${plan.duration})` : '—',
      validityLabel: this.getValidityLabel(tier, planId),
      membershipDurationLabel: this.getValidityLabel(tier, planId),
      discountPercent: plan?.discountPercent || 0,
      tier,
      tierLabel: tier === 'vip' ? 'VIP' : 'عادی',
      memberCount,
      unitPriceToman,
      amountRial: amountToman * 10,
      amountToman,
      medicalHistory: document.getElementById('app-medical-history')?.value.trim() || '',
      dependents: [
        document.getElementById('app-dependent-1')?.value.trim(),
        document.getElementById('app-dependent-2')?.value.trim(),
        document.getElementById('app-dependent-3')?.value.trim(),
        document.getElementById('app-dependent-4')?.value.trim(),
      ].filter(Boolean),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  },

  updateAmountPreview() {
    const el = document.getElementById('app-amount-preview');
    if (!el) return;
    const data = this.readApplicationForm();
    const discountLabel = data.discountPercent
      ? ` | تخفیف: ${data.discountPercent.toLocaleString('fa-IR')}٪`
      : '';
    el.textContent =
      `${this.formatToman(data.unitPriceToman)} × ${data.memberCount.toLocaleString('fa-IR')} نفر = ${this.formatToman(data.amountToman)} | مدت: ${data.validityLabel}${discountLabel}`;
  },

  renderContractHtml(data, logoSrc = '../../assets/logo/logo.png') {
    return `
      <div style="border:2px solid #0f172a;padding:1rem;border-radius:0.75rem">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.75rem;margin-bottom:0.75rem;gap:0.5rem;flex-wrap:wrap">
          <img src="${logoSrc}" alt="پاستور پلاس" style="height:2.5rem" />
          <div style="text-align:center;flex:1">
            <p style="font-weight:800;margin:0">فرم پیشنهاد صدور عضویت</p>
            <p style="color:#64748b;font-size:0.75rem;margin:0.25rem 0 0">پاستور پلاس</p>
          </div>
          <p style="font-size:0.7rem;color:#64748b;margin:0">تاریخ: ${data.date || '—'}</p>
        </div>
        <p style="font-size:0.8rem;line-height:1.8;margin:0.35rem 0"><strong>کد نمایندگی:</strong> ${data.referralCode || '—'} | <strong>نماینده:</strong> ${data.visitorName}</p>
        <p style="font-size:0.8rem;line-height:1.8;margin:0.35rem 0"><strong>نام:</strong> ${data.patientName || '—'} | <strong>کد ملی:</strong> ${data.nationalId || '—'} | <strong>تماس:</strong> ${data.phone || '—'}</p>
        <p style="font-size:0.8rem;line-height:1.8;margin:0.35rem 0"><strong>مدت:</strong> ${data.planTitle} | <strong>پوشش:</strong> ${data.tierLabel} | <strong>اعضا:</strong> ${data.memberCount.toLocaleString('fa-IR')} نفر</p>
        <p style="font-size:0.8rem;line-height:1.8;margin:0.35rem 0"><strong>هر نفر:</strong> ${this.formatToman(data.unitPriceToman)} | <strong>کل:</strong> ${this.formatRial(data.amountRial)}</p>
        <p style="font-size:0.8rem;line-height:1.8;margin:0.35rem 0"><strong>اعضای تحت پوشش:</strong> ${data.dependents.length ? data.dependents.join('، ') : '—'}</p>
        <p style="font-size:0.75rem;line-height:1.8;margin-top:0.75rem;padding-top:0.75rem;border-top:1px dashed #cbd5e1">
          این قرارداد بر اساس شرایط عضویت پاستور پلاس، ${data.memberCount.toLocaleString('fa-IR')} عضو، مدت ${data.membershipDurationLabel} و مبلغ ${this.formatRial(data.amountRial)} صادر می‌شود.
        </p>
      </div>`;
  },

  buildPaymentPayloadFromApplication(data) {
    const membership = PASTEUR_DATA.memberships.find((m) => m.id === data.tier);
    return {
      kind: 'membership',
      planId: data.tier,
      planName: `${membership?.name || data.tier} — ${data.planTitle} — ${data.memberCount} نفر`,
      patientName: data.patientName,
      patientPhone: data.phone,
      amount: data.amountToman,
      validityLabel: data.validityLabel,
      membershipDurationLabel: data.membershipDurationLabel,
      discountPercent: data.discountPercent,
      referralCode: data.referralCode,
      successTo: typeof appHref === 'function' ? appHref('dental/success.html') : 'success.html',
      returnTo: typeof appHref === 'function' ? appHref('dental/membership.html') : 'membership.html',
    };
  },

  buildPaymentPayload({ tier, planId, memberCount, name, phone, referralCode }) {
    const validityLabel = this.getValidityLabel(tier, planId);
    const unitPrice = this.getUnitPrice(tier, planId);
    const plan = this.getDurationOptions().find((p) => p.id === planId);
    const membership = PASTEUR_DATA.memberships.find((m) => m.id === tier);
    return {
      kind: 'membership',
      planId: tier,
      planName: `${membership?.name || tier} — عضویت ${validityLabel} — ${memberCount} نفر`,
      patientName: name,
      patientPhone: phone,
      amount: unitPrice * memberCount,
      validityLabel,
      membershipDurationLabel: validityLabel,
      discountPercent: plan?.discountPercent || 0,
      referralCode: referralCode || '',
      successTo: typeof appHref === 'function' ? appHref('dental/success.html') : 'success.html',
      returnTo: typeof appHref === 'function' ? appHref('dental/membership.html') : 'membership.html',
    };
  },
};

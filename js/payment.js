/**
 * پرداخت mock — پاستور پلاس
 */
const PaymentFlow = {
  isAppContext() {
    return window.location.pathname.replace(/\\/g, '/').includes('/app/');
  },

  defaultCancelHref(pending) {
    if (pending?.returnTo) return pending.returnTo;
    if (this.isAppContext() && typeof appHref === 'function') {
      if (pending?.planId === 'shop-vip') return appHref('shop-vip.html');
      if (pending?.kind === 'membership') return appHref('dental/membership.html');
      return appHref('dental/general.html');
    }
    if (pending?.kind === 'membership') return 'membership.html';
    return '../dental/general.html';
  },

  defaultSuccessHref(pending) {
    if (pending?.successTo) return pending.successTo;
    if (pending?.planId === 'shop-vip') {
      return this.isAppContext() && typeof appHref === 'function'
        ? appHref('shop-catalog.html?vip=paid')
        : '../shop.html?vip=paid';
    }
    return 'success.html';
  },

  init() {
    const pending = PasteurStorage.getPendingPayment();
    if (!pending) {
      if (this.isAppContext() && typeof appHref === 'function') {
        window.location.href = appHref('index.html');
      } else {
        window.location.href = '../dental/general.html';
      }
      return;
    }
    this.renderSummary(pending);
    this.bindEvents(pending);
  },

  formatPrice(amount) {
    if (!amount) return 'رایگان';
    return amount.toLocaleString('fa-IR') + ' تومان';
  },

  summaryRow(label, value, { last, total, app } = {}) {
    if (app) {
      return `<div class="app-summary-row${last ? ' app-summary-row--total' : ''}"><span class="app-text-muted">${label}</span><span class="${total ? 'app-font-bold app-text-teal' : 'app-font-bold'}">${value}</span></div>`;
    }
    if (last) {
      return `<div class="flex justify-between pt-2 text-base"><span class="font-bold">${label}</span><span class="font-bold text-teal-700">${value}</span></div>`;
    }
    return `<div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500">${label}</span><span class="font-semibold">${value}</span></div>`;
  },

  renderSummary(data) {
    const el = document.getElementById('payment-summary');
    if (!el) return;
    const app = this.isAppContext();
    const wrap = (title, rows) => {
      if (app) {
        return `<div class="app-card app-summary"><h2 class="app-font-bold app-mb-3" style="font-size:1.05rem;margin-top:0">${title}</h2>${rows}</div>`;
      }
      return `<h2 class="font-bold text-lg mb-4">${title}</h2><div class="space-y-3 text-sm">${rows}</div>`;
    };

    if (data.kind === 'booking') {
      const rows = [
        this.summaryRow('مراجع:', data.patientName, { app }),
        this.summaryRow('موبایل:', data.patientPhone, { app }),
        this.summaryRow('پزشک:', data.doctorName, { app }),
        this.summaryRow('نوع خدمت:', data.typeLabel, { app }),
        this.summaryRow('روز:', data.day, { app }),
        this.summaryRow('زمان:', data.timeLabel, { app }),
        data.referralCode ? this.summaryRow('کد معرف:', data.referralCode, { app }) : '',
        this.summaryRow('مبلغ قابل پرداخت:', this.formatPrice(data.amount), { last: true, total: true, app }),
      ].join('');
      el.innerHTML = wrap('خلاصه رزرو', rows);
    } else if (data.planId === 'shop-vip') {
      const rows = [
        this.summaryRow('نام:', data.patientName, { app }),
        this.summaryRow('موبایل:', data.patientPhone, { app }),
        this.summaryRow('حق عضویت:', this.formatPrice(data.amountToman || data.amount / 10), { last: true, total: true, app }),
      ].join('');
      el.innerHTML = wrap('VIP تجهیزات', rows);
    } else if (data.kind === 'membership') {
      const rows = [
        this.summaryRow('نام:', data.patientName, { app }),
        this.summaryRow('طرح:', data.planName, { app }),
        data.membershipDurationLabel || data.validityLabel
          ? this.summaryRow('مدت عضویت:', data.membershipDurationLabel || data.validityLabel, { app })
          : '',
        data.discountPercent
          ? this.summaryRow('تخفیف مدت‌دار:', `${data.discountPercent.toLocaleString('fa-IR')}٪`, { app })
          : '',
        data.referralCode ? this.summaryRow('کد معرف:', data.referralCode, { app }) : '',
        this.summaryRow('مبلغ واریزی:', this.formatPrice(data.amount), { last: true, total: true, app }),
      ].join('');
      el.innerHTML = wrap('خلاصه عضویت', rows);
    }
  },

  bindEvents(pending) {
    document.getElementById('btn-pay')?.addEventListener('click', () => {
      const btn = document.getElementById('btn-pay');
      btn.disabled = true;
      btn.innerHTML = this.isAppContext()
        ? '<span class="app-pay-loading">⏳</span> در حال اتصال به درگاه...'
        : '<span class="inline-block animate-spin">⏳</span> در حال اتصال به درگاه...';

      setTimeout(() => {
        this.completePayment(pending);
        window.location.href = this.defaultSuccessHref(pending);
      }, 1500);
    });

    document.getElementById('btn-fail')?.addEventListener('click', () => {
      sessionStorage.setItem('pasteur_last_payment', JSON.stringify({
        ...pending,
        status: 'failed',
        failedAt: new Date().toISOString(),
      }));
      window.location.href = 'failed.html';
    });

    document.getElementById('btn-cancel')?.addEventListener('click', () => {
      PasteurStorage.clearPendingPayment();
      window.location.href = this.defaultCancelHref(pending);
    });
  },

  completePayment(pending) {
    const completed = {
      ...pending,
      status: 'paid',
      paidAt: new Date().toISOString(),
    };
    if (pending.kind === 'booking') {
      const booking = PasteurStorage.saveBooking({
        id: PasteurStorage.generateId(),
        doctorId: pending.doctorId,
        doctorName: pending.doctorName,
        specialty: pending.specialty,
        type: pending.type,
        typeLabel: pending.typeLabel,
        day: pending.day,
        timeValue: pending.timeValue,
        timeLabel: pending.timeLabel,
        patientName: pending.patientName,
        patientPhone: pending.patientPhone,
        amount: pending.amount,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        dateLabel: new Date().toLocaleDateString('fa-IR'),
      });
      const profile = PasteurStorage.addClubPoints(pending.patientPhone, 50, 'رزرو نوبت');
      profile.visits += 1;
      PasteurStorage.saveClubProfile(pending.patientPhone, profile);
      if (pending.referralCode) {
        PasteurStorage.saveCommission({
          referralCode: pending.referralCode,
          sourceType: 'booking',
          sourceLabel: pending.typeLabel,
          customerName: pending.patientName,
          customerPhone: pending.patientPhone,
          amount: pending.amount,
        });
      }
      sessionStorage.setItem('pasteur_last_booking', JSON.stringify(booking));
    } else if (pending.planId === 'shop-vip') {
      PasteurStorage.activateShopVip(pending.patientPhone);
      AppShop?.setCustomerType?.('vip', pending.patientPhone);
      if (pending.referralCode) {
        PasteurStorage.saveCommission({
          referralCode: pending.referralCode,
          sourceType: 'shop-vip',
          sourceLabel: pending.planName,
          customerName: pending.patientName,
          customerPhone: pending.patientPhone,
          amount: pending.amount,
        });
      }
    } else if (pending.kind === 'membership') {
      PasteurStorage.saveMember({
        id: PasteurStorage.generateId(),
        planId: pending.planId,
        planName: pending.planName,
        patientName: pending.patientName,
        patientPhone: pending.patientPhone,
        amount: pending.amount,
        validityLabel: pending.validityLabel,
        membershipDurationLabel: pending.membershipDurationLabel,
        discountPercent: pending.discountPercent,
        status: 'paid',
        createdAt: new Date().toISOString(),
      });
      if (pending.planId === 'vip' || pending.planId === 'shop-vip') {
        PasteurStorage.activateShopVip(pending.patientPhone);
      }
      if (pending.referralCode) {
        PasteurStorage.saveCommission({
          referralCode: pending.referralCode,
          sourceType: pending.planId === 'shop-vip' ? 'shop-vip' : 'membership',
          sourceLabel: pending.planName,
          customerName: pending.patientName,
          customerPhone: pending.patientPhone,
          amount: pending.amount,
        });
      }
    }
    sessionStorage.setItem('pasteur_last_payment', JSON.stringify(completed));
    PasteurStorage.clearPendingPayment();
  },
};

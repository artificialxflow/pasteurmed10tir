/**
 * پرداخت mock — پاستور پلاس
 */
const PaymentFlow = {
  init() {
    const pending = PasteurStorage.getPendingPayment();
    if (!pending) {
      window.location.href = '../dental/general.html';
      return;
    }
    this.renderSummary(pending);
    this.bindEvents(pending);
  },

  formatPrice(amount) {
    if (!amount) return 'رایگان';
    return amount.toLocaleString('fa-IR') + ' تومان';
  },

  renderSummary(data) {
    const el = document.getElementById('payment-summary');
    if (!el) return;

    if (data.kind === 'booking') {
      el.innerHTML = `
        <h2 class="font-bold text-lg mb-4">خلاصه رزرو</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">مراجع:</span><span class="font-semibold">${data.patientName}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">موبایل:</span><span class="font-semibold">${data.patientPhone}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">پزشک:</span><span class="font-semibold">${data.doctorName}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">نوع خدمت:</span><span class="font-semibold">${data.typeLabel}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">روز:</span><span class="font-semibold">${data.day}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">زمان:</span><span class="font-semibold">${data.timeLabel}</span>
          </div>
          ${data.referralCode ? `
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">کد معرف:</span><span class="font-semibold">${data.referralCode}</span>
          </div>` : ''}
          <div class="flex justify-between pt-2 text-base">
            <span class="font-bold">مبلغ قابل پرداخت:</span>
            <span class="font-bold text-teal-700">${this.formatPrice(data.amount)}</span>
          </div>
        </div>`;
    } else if (data.kind === 'membership') {
      el.innerHTML = `
        <h2 class="font-bold text-lg mb-4">خلاصه عضویت</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">نام:</span><span class="font-semibold">${data.patientName}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">طرح:</span><span class="font-semibold">${data.planName}</span>
          </div>
          ${data.referralCode ? `
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="text-slate-500">کد معرف:</span><span class="font-semibold">${data.referralCode}</span>
          </div>` : ''}
          <div class="flex justify-between pt-2 text-base">
            <span class="font-bold">مبلغ واریزی:</span>
            <span class="font-bold text-teal-700">${this.formatPrice(data.amount)}</span>
          </div>
        </div>`;
    }
  },

  bindEvents(pending) {
    document.getElementById('btn-pay')?.addEventListener('click', () => {
      const btn = document.getElementById('btn-pay');
      btn.disabled = true;
      btn.innerHTML = '<span class="inline-block animate-spin">⏳</span> در حال اتصال به درگاه...';

      setTimeout(() => {
        const success = Math.random() > 0.1;
        if (success) {
          this.completePayment(pending);
          window.location.href = pending.successTo || (pending.planId === 'shop-vip' ? '../shop.html?vip=paid' : 'success.html');
        } else {
          window.location.href = 'failed.html';
        }
      }, 1500);
    });

    document.getElementById('btn-cancel')?.addEventListener('click', () => {
      PasteurStorage.clearPendingPayment();
      window.location.href = pending.returnTo || (pending.kind === 'membership' ? 'membership.html' : 'general.html');
    });
  },

  completePayment(pending) {
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
    } else if (pending.kind === 'membership') {
      PasteurStorage.saveMember({
        id: PasteurStorage.generateId(),
        planId: pending.planId,
        planName: pending.planName,
        patientName: pending.patientName,
        patientPhone: pending.patientPhone,
        amount: pending.amount,
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
    PasteurStorage.clearPendingPayment();
  },
};

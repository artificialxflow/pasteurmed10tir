import {
  completeMembershipPayment,
  completeShopVipPayment,
} from '@/lib/commerce/payment-service';
import { createShopOrderRecord } from '@/lib/commerce/shop-order-service';
import { createBookingRecord } from '@/lib/operations/booking-service';
import type { PendingPayment } from '@/lib/payment';

export async function completePendingPaymentOnServer(pending: PendingPayment) {
  if (pending.kind === 'booking') {
    const booking = await createBookingRecord({
      doctorId: pending.doctorId ? String(pending.doctorId) : undefined,
      doctorName: pending.doctorName ? String(pending.doctorName) : undefined,
      specialty: pending.specialty ? String(pending.specialty) : undefined,
      type: pending.type ? String(pending.type) : undefined,
      typeLabel: pending.typeLabel ? String(pending.typeLabel) : undefined,
      day: pending.day ? String(pending.day) : undefined,
      timeValue:
        pending.timeValue != null
          ? (pending.timeValue as string | number)
          : undefined,
      timeLabel: pending.timeLabel ? String(pending.timeLabel) : undefined,
      patientName: pending.patientName ? String(pending.patientName) : undefined,
      patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
      amount: Number(pending.amount || 0),
      isDeposit: pending.isDeposit !== false,
      depositNonRefundable: pending.depositNonRefundable !== false,
      referralCode: pending.referralCode ? String(pending.referralCode) : undefined,
    });
    return { booking };
  }

  if (pending.planId === 'shop-vip') {
    const result = await completeShopVipPayment({
      patientName: pending.patientName ? String(pending.patientName) : undefined,
      patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
      planName: pending.planName ? String(pending.planName) : undefined,
      amount: Number(pending.amount || pending.amountToman || 0),
      referralCode: pending.referralCode ? String(pending.referralCode) : undefined,
    });
    return result;
  }

  if (pending.kind === 'membership') {
    const result = await completeMembershipPayment({
      patientName: pending.patientName ? String(pending.patientName) : undefined,
      patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
      planId: pending.planId ? String(pending.planId) : undefined,
      planName: pending.planName ? String(pending.planName) : undefined,
      amount: Number(pending.amount || 0),
      validityLabel: pending.validityLabel ? String(pending.validityLabel) : undefined,
      membershipDurationLabel: pending.membershipDurationLabel
        ? String(pending.membershipDurationLabel)
        : undefined,
      discountPercent:
        pending.discountPercent === undefined || pending.discountPercent === null
          ? undefined
          : Number(pending.discountPercent),
      referralCode: pending.referralCode ? String(pending.referralCode) : undefined,
    });
    return result;
  }

  if (pending.kind === 'shop-order') {
    const order = await createShopOrderRecord({
      customerName: pending.patientName ? String(pending.patientName) : '',
      customerPhone: pending.patientPhone ? String(pending.patientPhone) : '',
      address: pending.address ? String(pending.address) : '',
      customerType: pending.customerType ? String(pending.customerType) : undefined,
      items: Array.isArray(pending.items) ? pending.items : [],
      subtotal: Number(pending.subtotal || 0),
      discount: Number(pending.discount || 0),
      total: Number(pending.amountToman || pending.amount || 0),
      status: 'confirmed',
    });
    return { order };
  }

  if (pending.kind === 'installment') {
    const { applyInstallmentPayment } = await import('@/lib/commerce/installment-service');
    const plan = await applyInstallmentPayment({
      planId: String(pending.planId || ''),
      scheduleItemId: String(pending.scheduleItemId || ''),
      amount: Number(pending.amount || pending.amountToman || 0),
      method: 'zibal',
      trackId: pending.zibalTrackId ? String(pending.zibalTrackId) : null,
      phone: pending.patientPhone ? String(pending.patientPhone) : null,
      note: 'پرداخت آنلاین قسط',
    });
    return { installmentPlan: plan };
  }

  throw new Error('نوع پرداخت پشتیبانی نمی‌شود.');
}

export function pendingAmountToman(pending: PendingPayment): number {
  const fromToman = Number(pending.amountToman || 0);
  if (fromToman > 0) return fromToman;
  return Number(pending.amount || 0);
}

export function resolvePaymentPaths(pending: PendingPayment, basePath: string) {
  const app = basePath.includes('/app');
  let successPath = pending.successTo ? String(pending.successTo) : '';
  if (!successPath) {
    if (pending.kind === 'installment') {
      successPath = app ? '/app/installments?paid=1' : '/installments?paid=1';
    } else if (pending.kind === 'shop-order') {
      successPath = app ? '/app/shop/success' : '/shop/success';
    } else if (pending.planId === 'shop-vip') {
      successPath = app ? '/app/shop-catalog?vip=paid' : '/shop/catalog?vip=paid';
    } else {
      successPath = app ? '/app/dental/success' : '/dental/success';
    }
  }
  let failPath = '';
  if (pending.kind === 'installment') {
    failPath = app ? '/app/installments?paid=0' : '/installments?paid=0';
  } else if (pending.kind === 'shop-order') {
    failPath = app ? '/app/shop/failed' : '/shop/failed';
  } else {
    failPath = `${basePath}/failed`;
  }
  return { successPath, failPath };
}

export function buildPaymentDescription(pending: PendingPayment): string {
  if (pending.kind === 'booking') {
    return `بیعانه رزرو — ${pending.patientName || 'بیمار'}`;
  }
  if (pending.planId === 'shop-vip') {
    return `VIP تجهیزات — ${pending.patientName || 'کاربر'}`;
  }
  if (pending.kind === 'membership') {
    return `عضویت — ${pending.planName || pending.patientName || 'کاربر'}`;
  }
  if (pending.kind === 'shop-order') {
    return `سفارش تجهیزات — ${pending.patientName || 'مشتری'}`;
  }
  if (pending.kind === 'installment') {
    const idx = pending.installmentIndex != null ? ` #${pending.installmentIndex}` : '';
    return `پرداخت قسط${idx} — ${pending.patientName || 'بیمار'}`;
  }
  return 'پرداخت پاستور پلاس';
}

export function buildCompletedPaymentPayload(
  pending: PendingPayment,
  extra?: { refNumber?: string | number; trackId?: string | number },
): PendingPayment & { status: 'paid'; paidAt: string } {
  return {
    ...pending,
    status: 'paid',
    paidAt: new Date().toISOString(),
    zibalRefNumber: extra?.refNumber,
    zibalTrackId: extra?.trackId,
  };
}

export function buildFailedPaymentPayload(
  pending: PendingPayment,
  extra?: { trackId?: string | number; reason?: string },
): PendingPayment & { status: 'failed'; failedAt: string } {
  return {
    ...pending,
    status: 'failed',
    failedAt: new Date().toISOString(),
    zibalTrackId: extra?.trackId,
    failureReason: extra?.reason,
  };
}

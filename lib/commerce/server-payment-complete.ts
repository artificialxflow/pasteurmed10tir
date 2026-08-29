import {
  completeMembershipPayment,
  completeShopVipPayment,
} from '@/lib/commerce/payment-service';
import { createShopOrderRecord } from '@/lib/commerce/shop-order-service';
import { createBookingRecord } from '@/lib/operations/booking-service';
import { createConsultationRecord } from '@/lib/operations/consultation-service';
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
      appointmentDate: pending.appointmentDate ? String(pending.appointmentDate) : undefined,
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
      groupDiscountPercent:
        pending.groupDiscountPercent === undefined || pending.groupDiscountPercent === null
          ? undefined
          : Number(pending.groupDiscountPercent),
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

  if (pending.kind === 'consultation') {
    const consultation = await createConsultationRecord({
      type: pending.type ? String(pending.type) : undefined,
      typeLabel: pending.typeLabel ? String(pending.typeLabel) : undefined,
      category: pending.category ? String(pending.category) : undefined,
      categoryLabel: pending.categoryLabel ? String(pending.categoryLabel) : undefined,
      specialty: pending.specialty ? String(pending.specialty) : undefined,
      specialtyLabel: pending.specialtyLabel ? String(pending.specialtyLabel) : undefined,
      doctorId:
        pending.doctorId != null && pending.doctorId !== ''
          ? (typeof pending.doctorId === 'number' || typeof pending.doctorId === 'string'
              ? pending.doctorId
              : String(pending.doctorId))
          : undefined,
      doctorName: pending.doctorName ? String(pending.doctorName) : undefined,
      patientName: pending.patientName ? String(pending.patientName) : undefined,
      patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
      description: pending.description ? String(pending.description) : undefined,
      estimate: pending.estimate ? String(pending.estimate) : undefined,
      amount: Number(pending.amount || 0),
      priceSource: pending.priceSource ? String(pending.priceSource) : undefined,
      hasImage: Boolean(pending.hasImage),
      onlineInsuranceCovered: Boolean(pending.onlineInsuranceCovered),
      preferredDate: pending.preferredDate ? String(pending.preferredDate) : undefined,
      preferredDateLabel: pending.preferredDateLabel
        ? String(pending.preferredDateLabel)
        : undefined,
      preferredTime: pending.preferredTime ? String(pending.preferredTime) : undefined,
      preferredTimeLabel: pending.preferredTimeLabel
        ? String(pending.preferredTimeLabel)
        : undefined,
    });
    return { consultation };
  }

  if (pending.kind === 'nursing') {
    const serviceTitle = pending.serviceTitle ? String(pending.serviceTitle) : 'پرستاری';
    const itemTitle = pending.itemTitle ? String(pending.itemTitle) : serviceTitle;
    const amount = Number(pending.amountToman || pending.amount || 0);
    const consultation = await createConsultationRecord({
      type: pending.itemId ? String(pending.itemId) : 'nursing-service',
      typeLabel: itemTitle,
      category: 'nursing',
      categoryLabel: 'پرستاری',
      specialty: pending.serviceId ? String(pending.serviceId) : undefined,
      specialtyLabel: serviceTitle,
      patientName: pending.patientName ? String(pending.patientName) : undefined,
      patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
      description: pending.description ? String(pending.description) : undefined,
      estimate: pending.estimate
        ? String(pending.estimate)
        : `${amount.toLocaleString('fa-IR')} تومان`,
      amount,
      priceSource: 'nursing-tariff',
    });
    return { nursingRequest: consultation, consultation };
  }

  if (pending.kind === 'laser') {
    const serviceTitle = pending.serviceTitle ? String(pending.serviceTitle) : 'لیزر و زیبایی';
    const amount = Number(pending.amountToman || pending.amount || 0);
    const booking = await createBookingRecord({
      doctorId: 'laser',
      doctorName: 'لیزر و زیبایی',
      specialty: pending.categoryName
        ? String(pending.categoryName)
        : pending.categoryId
          ? String(pending.categoryId)
          : 'لیزر',
      type: 'laser',
      typeLabel: serviceTitle,
      day: pending.day ? String(pending.day) : undefined,
      appointmentDate: pending.appointmentDate ? String(pending.appointmentDate) : undefined,
      timeValue:
        pending.timeValue != null
          ? (pending.timeValue as string | number)
          : undefined,
      timeLabel: pending.timeLabel ? String(pending.timeLabel) : undefined,
      patientName: pending.patientName ? String(pending.patientName) : undefined,
      patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
      amount,
      isDeposit: pending.isDeposit !== false,
      depositNonRefundable: pending.depositNonRefundable !== false,
      referralCode: pending.referralCode ? String(pending.referralCode) : undefined,
    });
    return { booking, laserBooking: booking };
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
    } else if (pending.kind === 'consultation') {
      successPath = app ? '/app/consultation/success' : '/consultation/success';
    } else if (pending.kind === 'nursing') {
      successPath = app ? '/app/nursing/success' : '/nursing/success';
    } else if (pending.kind === 'laser') {
      successPath = app ? '/app/laser/success' : '/laser/success';
    } else {
      successPath = app ? '/app/dental/success' : '/dental/success';
    }
  }
  let failPath = '';
  if (pending.kind === 'installment') {
    failPath = app ? '/app/installments?paid=0' : '/installments?paid=0';
  } else if (pending.kind === 'shop-order') {
    failPath = app ? '/app/shop/failed' : '/shop/failed';
  } else if (pending.kind === 'consultation') {
    failPath = app ? '/app/consultation/failed' : '/consultation/failed';
  } else if (pending.kind === 'nursing') {
    failPath = app ? '/app/nursing/failed' : '/nursing/failed';
  } else if (pending.kind === 'laser') {
    failPath = app ? '/app/laser/failed' : '/laser/failed';
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
  if (pending.kind === 'consultation') {
    return `مشاوره و ویزیت — ${pending.patientName || 'بیمار'}`;
  }
  if (pending.kind === 'nursing') {
    return `پرستاری — ${pending.itemTitle || pending.serviceTitle || pending.patientName || 'بیمار'}`;
  }
  if (pending.kind === 'laser') {
    return `بیعانه لیزر — ${pending.serviceTitle || pending.patientName || 'مراجع'}`;
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

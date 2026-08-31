import { createBookingApi } from '@/lib/operations/client';
import type { PendingPayment } from '@/lib/payment';
import { PasteurStorage, type Booking } from '@/lib/storage';

export const MIN_ONLINE_PAYMENT_TOMAN = 100;

export function requiresOnlinePayment(amount: number): boolean {
  return Number(amount) >= MIN_ONLINE_PAYMENT_TOMAN;
}

export function pendingPayableAmount(pending: PendingPayment): number {
  return Number(pending.amountToman ?? pending.amount ?? 0);
}

function buildBookingBody(pending: PendingPayment): Record<string, unknown> {
  if (pending.kind === 'laser') {
    return {
      doctorId: 'laser',
      doctorName: 'لیزر و زیبایی',
      specialty: pending.categoryName
        ? String(pending.categoryName)
        : pending.categoryId
          ? String(pending.categoryId)
          : 'لیزر',
      type: 'laser',
      typeLabel: pending.serviceTitle ? String(pending.serviceTitle) : 'لیزر',
      day: pending.day ? String(pending.day) : undefined,
      appointmentDate: pending.appointmentDate ? String(pending.appointmentDate) : undefined,
      timeValue: pending.timeValue,
      timeLabel: pending.timeLabel ? String(pending.timeLabel) : undefined,
      patientName: pending.patientName ? String(pending.patientName) : undefined,
      patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
      amount: 0,
      isDeposit: pending.isDeposit !== false,
      depositNonRefundable: pending.depositNonRefundable !== false,
    };
  }

  return {
    doctorId: pending.doctorId != null ? String(pending.doctorId) : undefined,
    doctorName: pending.doctorName ? String(pending.doctorName) : undefined,
    specialty: pending.specialty ? String(pending.specialty) : undefined,
    type: pending.type ? String(pending.type) : undefined,
    typeLabel: pending.typeLabel ? String(pending.typeLabel) : undefined,
    day: pending.day ? String(pending.day) : undefined,
    appointmentDate: pending.appointmentDate ? String(pending.appointmentDate) : undefined,
    timeValue: pending.timeValue,
    timeLabel: pending.timeLabel ? String(pending.timeLabel) : undefined,
    patientName: pending.patientName ? String(pending.patientName) : undefined,
    patientPhone: pending.patientPhone ? String(pending.patientPhone) : undefined,
    amount: 0,
    isDeposit: pending.isDeposit !== false,
    depositNonRefundable: pending.depositNonRefundable !== false,
    referralCode: pending.referralCode ? String(pending.referralCode) : undefined,
  };
}

export async function completeFreeReservation(pending: PendingPayment) {
  const payable = pendingPayableAmount(pending);
  if (requiresOnlinePayment(payable)) {
    throw new Error('این رزرو نیاز به پرداخت آنلاین دارد.');
  }

  const { booking } = await createBookingApi(buildBookingBody(pending));
  const paid = {
    ...pending,
    amount: payable,
    amountToman: payable,
    status: 'paid',
    paidAt: new Date().toISOString(),
    booking,
  };

  PasteurStorage.setLastPayment(paid);
  PasteurStorage.clearPendingPayment();
  if (pending.kind === 'booking' && booking) {
    PasteurStorage.setSessionLastBooking(booking as Booking);
  }

  return paid;
}

/**
 * پرداخت mock — پاستور پلاس
 */
import { PasteurStorage, type Booking } from './storage';
import {
  completeMembershipPaymentApi,
  completeShopVipPaymentApi,
} from './commerce/client';
import { createBookingApi } from './operations/client';
import { ShopCart } from './shop';

export type PendingPaymentKind = 'booking' | 'membership' | 'shop-vip';

export type PendingPaymentBase = {
  kind?: PendingPaymentKind | string;
  amount?: number;
  amountToman?: number;
  patientName?: string;
  patientPhone?: string;
  referralCode?: string;
  returnTo?: string;
  successTo?: string;
  status?: string;
  paidAt?: string;
  failedAt?: string;
  [key: string]: unknown;
};

export type PendingBookingPayment = PendingPaymentBase & {
  kind: 'booking';
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  type?: string;
  typeLabel?: string;
  day?: string;
  timeValue?: string | number;
  timeLabel?: string;
};

export type PendingMembershipPayment = PendingPaymentBase & {
  kind: 'membership';
  planId?: string;
  planName?: string;
  validityLabel?: string;
  membershipDurationLabel?: string;
  discountPercent?: number;
};

export type PendingShopVipPayment = PendingPaymentBase & {
  kind?: 'shop-vip' | 'membership' | string;
  planId: 'shop-vip';
  planName?: string;
};

export type PendingPayment =
  | PendingBookingPayment
  | PendingMembershipPayment
  | PendingShopVipPayment
  | PendingPaymentBase;

export type CompletedPayment = PendingPayment & {
  status: 'paid';
  paidAt: string;
};

function isAppPath(pathname?: string): boolean {
  const path = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '')).replace(
    /\\/g,
    '/'
  );
  return path.includes('/app');
}

export const PaymentFlow = {
  isAppContext(pathname?: string): boolean {
    return isAppPath(pathname);
  },

  defaultCancelHref(pending?: PendingPayment | null, pathname?: string): string {
    if (pending?.returnTo) return String(pending.returnTo);
    const app = this.isAppContext(pathname);
    if (pending?.planId === 'shop-vip') return app ? '/app/shop-vip' : '/shop/vip';
    if (pending?.kind === 'membership') return app ? '/app/dental/membership' : '/dental/membership';
    return app ? '/app/dental/general' : '/dental/general';
  },

  defaultSuccessHref(pending?: PendingPayment | null, pathname?: string): string {
    if (pending?.successTo) return String(pending.successTo);
    if (pending?.planId === 'shop-vip') {
      return this.isAppContext(pathname)
        ? '/app/shop-catalog?vip=paid'
        : '/shop/catalog?vip=paid';
    }
    return this.isAppContext(pathname) ? '/app/dental/success' : '/dental/success';
  },

  formatPrice(amount?: number | null): string {
    if (!amount) return 'رایگان';
    return amount.toLocaleString('fa-IR') + ' تومان';
  },

  async completePaymentAsync(pending: PendingPayment): Promise<CompletedPayment> {
    const completed: CompletedPayment = {
      ...pending,
      status: 'paid',
      paidAt: new Date().toISOString(),
    };

    if (pending.kind === 'booking') {
      const { booking } = await createBookingApi({
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
        isDeposit: true,
        depositNonRefundable: true,
        referralCode: pending.referralCode,
      });
      PasteurStorage.setSessionLastBooking(booking as Booking);
      // Club points + visits persisted in booking API (Phase 5)
    } else if (pending.planId === 'shop-vip') {
      await completeShopVipPaymentApi({
        patientName: pending.patientName,
        patientPhone: pending.patientPhone,
        planName: pending.planName,
        amount: pending.amount,
        referralCode: pending.referralCode,
      });
      ShopCart.setCustomerType('vip', pending.patientPhone || '');
    } else if (pending.kind === 'membership') {
      await completeMembershipPaymentApi({
        patientName: pending.patientName,
        patientPhone: pending.patientPhone,
        planId: pending.planId,
        planName: pending.planName,
        amount: pending.amount,
        validityLabel: pending.validityLabel,
        membershipDurationLabel: pending.membershipDurationLabel,
        discountPercent: pending.discountPercent,
        referralCode: pending.referralCode,
      });
    } else {
      return this.completePayment(pending);
    }

    PasteurStorage.setLastPayment(completed);
    PasteurStorage.clearPendingPayment();
    return completed;
  },

  completePayment(pending: PendingPayment): CompletedPayment {
    const completed: CompletedPayment = {
      ...pending,
      status: 'paid',
      paidAt: new Date().toISOString(),
    };
    PasteurStorage.setLastPayment(completed);
    PasteurStorage.clearPendingPayment();
    return completed;
  },

  markPaymentFailed(pending: PendingPayment): Record<string, unknown> {
    const failed = {
      ...pending,
      status: 'failed',
      failedAt: new Date().toISOString(),
    };
    PasteurStorage.setLastPayment(failed);
    return failed;
  },

  cancelPayment(pending?: PendingPayment | null): string {
    PasteurStorage.clearPendingPayment();
    return this.defaultCancelHref(pending);
  },
};

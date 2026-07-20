/**
 * پرداخت mock — پاستور پلاس
 */
import { PasteurStorage, type Booking } from './storage';

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

  completePayment(pending: PendingPayment): CompletedPayment {
    const completed: CompletedPayment = {
      ...pending,
      status: 'paid',
      paidAt: new Date().toISOString(),
    };

    if (pending.kind === 'booking') {
      const booking: Booking = PasteurStorage.saveBooking({
        id: PasteurStorage.generateId(),
        doctorId: pending.doctorId as string | undefined,
        doctorName: pending.doctorName as string | undefined,
        specialty: pending.specialty as string | undefined,
        type: pending.type as string | undefined,
        typeLabel: pending.typeLabel as string | undefined,
        day: pending.day as string | undefined,
        timeValue: pending.timeValue as string | number | undefined,
        timeLabel: pending.timeLabel as string | undefined,
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
          sourceLabel: pending.typeLabel as string | undefined,
          customerName: pending.patientName,
          customerPhone: pending.patientPhone,
          amount: pending.amount,
        });
      }
      PasteurStorage.setSessionLastBooking(booking);
    } else if (pending.planId === 'shop-vip') {
      PasteurStorage.activateShopVip(pending.patientPhone);
      PasteurStorage.setShopCustomerType('vip', pending.patientPhone || '');
      if (pending.referralCode) {
        PasteurStorage.saveCommission({
          referralCode: pending.referralCode,
          sourceType: 'shop-vip',
          sourceLabel: pending.planName as string | undefined,
          customerName: pending.patientName,
          customerPhone: pending.patientPhone,
          amount: pending.amount,
        });
      }
    } else if (pending.kind === 'membership') {
      PasteurStorage.saveMember({
        id: PasteurStorage.generateId(),
        planId: pending.planId as string | undefined,
        planName: pending.planName as string | undefined,
        patientName: pending.patientName,
        patientPhone: pending.patientPhone,
        amount: pending.amount,
        validityLabel: pending.validityLabel as string | undefined,
        membershipDurationLabel: pending.membershipDurationLabel as string | undefined,
        discountPercent: pending.discountPercent as number | undefined,
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
          sourceLabel: pending.planName as string | undefined,
          customerName: pending.patientName,
          customerPhone: pending.patientPhone,
          amount: pending.amount,
        });
      }
    }

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

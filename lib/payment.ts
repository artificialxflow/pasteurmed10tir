/**
 * پرداخت — پاستور پلاس (زیبال)
 */
import { PasteurStorage } from './storage';

export type PendingPaymentKind = 'booking' | 'membership' | 'shop-vip' | 'shop-order' | 'consultation';

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

export type PendingShopOrderPayment = PendingPaymentBase & {
  kind: 'shop-order';
  customerType?: string;
  address?: string;
  items?: Array<{
    id?: string | number;
    name?: string;
    category?: string;
    qty?: number;
    unitPrice?: number;
    finalUnitPrice?: number;
  }>;
  subtotal?: number;
  discount?: number;
  orderId?: string;
};

export type PendingConsultationPayment = PendingPaymentBase & {
  kind: 'consultation';
  type?: string;
  typeLabel?: string;
  category?: string;
  categoryLabel?: string;
  specialty?: string;
  specialtyLabel?: string;
  doctorId?: string | number;
  doctorName?: string;
  description?: string;
  estimate?: string;
  priceSource?: string;
  hasImage?: boolean;
  onlineInsuranceCovered?: boolean;
  paymentLabel?: string;
};

export type PendingPayment =
  | PendingBookingPayment
  | PendingMembershipPayment
  | PendingShopVipPayment
  | PendingShopOrderPayment
  | PendingConsultationPayment
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
    if (pending?.kind === 'shop-order') return app ? '/app/shop/cart' : '/shop/cart';
    if (pending?.planId === 'shop-vip') return app ? '/app/shop-vip' : '/shop/vip';
    if (pending?.kind === 'membership') return app ? '/app/dental/membership' : '/dental/membership';
    if (pending?.kind === 'consultation') return app ? '/app/consultation' : '/consultation';
    return app ? '/app/dental/general' : '/dental/general';
  },

  defaultSuccessHref(pending?: PendingPayment | null, pathname?: string): string {
    if (pending?.successTo) return String(pending.successTo);
    if (pending?.kind === 'shop-order') {
      return this.isAppContext(pathname) ? '/app/shop/success' : '/shop/success';
    }
    if (pending?.planId === 'shop-vip') {
      return this.isAppContext(pathname)
        ? '/app/shop-catalog?vip=paid'
        : '/shop/catalog?vip=paid';
    }
    if (pending?.kind === 'consultation') {
      return this.isAppContext(pathname) ? '/app/consultation/success' : '/consultation/success';
    }
    return this.isAppContext(pathname) ? '/app/dental/success' : '/dental/success';
  },

  formatPrice(amount?: number | null): string {
    if (!amount) return 'رایگان';
    return amount.toLocaleString('fa-IR') + ' تومان';
  },

  cancelPayment(pending?: PendingPayment | null): string {
    PasteurStorage.clearPendingPayment();
    return this.defaultCancelHref(pending);
  },
};

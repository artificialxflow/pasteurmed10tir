/**
 * کیف اعتبار — مدل و منطق سقف
 */

export type WalletKind = 'regular' | 'membership-vip' | 'shop-vip';

export type WalletStatus = 'active' | 'suspended' | 'closed';

export type WalletTransactionStatus = 'pending' | 'completed' | 'cancelled';

export type WalletTransactionType = 'credit' | 'debit' | 'upgrade' | 'adjustment';

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  status: WalletTransactionStatus;
  createdAt: string;
};

export type Wallet = {
  phone: string;
  balance: number;
  ceiling: number;
  activeKinds: WalletKind[];
  status: WalletStatus;
  transactions: WalletTransaction[];
  createdAt: string;
  updatedAt: string;
};

export type WalletSettings = {
  regularCap: number;
  membershipVipCap: number;
  shopVipCap: number;
  graceMonths: number;
  installmentMin: number;
  installmentMax: number;
};

export const DEFAULT_WALLET_SETTINGS: WalletSettings = {
  regularCap: 15_000_000,
  membershipVipCap: 30_000_000,
  shopVipCap: 20_000_000,
  graceMonths: 1,
  installmentMin: 4,
  installmentMax: 6,
};

export const WALLET_KIND_LABELS: Record<WalletKind, string> = {
  regular: 'بیمار عادی',
  'membership-vip': 'VIP عضویت',
  'shop-vip': 'VIP تجهیزات',
};

export function computeWalletCeiling(kinds: WalletKind[], settings: WalletSettings): number {
  const caps: number[] = [];
  if (kinds.includes('regular')) caps.push(settings.regularCap);
  if (kinds.includes('membership-vip')) caps.push(settings.membershipVipCap);
  if (kinds.includes('shop-vip')) caps.push(settings.shopVipCap);
  if (!caps.length) caps.push(settings.regularCap);
  return Math.max(...caps);
}

export function planIdToWalletKinds(planId?: string | null): WalletKind[] {
  if (planId === 'regular') return ['regular'];
  if (planId === 'vip') return ['membership-vip'];
  if (planId === 'shop-vip') return ['shop-vip'];
  return [];
}

export function formatWalletRepaymentTerms(settings: WalletSettings): string {
  return `فرجه ${settings.graceMonths.toLocaleString('fa-IR')} ماهه — بازپرداخت ${settings.installmentMin.toLocaleString('fa-IR')} تا ${settings.installmentMax.toLocaleString('fa-IR')} ماهه`;
}

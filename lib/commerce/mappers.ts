import type {
  Commission,
  FacilityRequest,
  InstallmentPlan,
  Member,
  MembershipApplication,
  MembershipPlan,
  ShopOrder,
  Visitor,
  Wallet,
  WalletTransaction,
} from '@prisma/client';
import type { WalletKind } from '@/lib/wallet';
import { buildZohalCreditSummary } from '@/lib/zohal/run-credit-check';

export function generateCommerceId(): string {
  return `PST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function mapMembershipPlan(row: MembershipPlan) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    priceNum: row.priceNum,
    loanTermLabel: row.loanTermLabel,
    loanLimit: row.loanLimit,
    downPaymentPercent: row.downPaymentPercent,
    features: [...row.features],
    terms: row.terms,
    highlighted: row.highlighted,
  };
}

export function mapMember(row: Member) {
  return {
    id: row.id,
    planId: row.planId ?? undefined,
    planName: row.planName ?? undefined,
    patientName: row.patientName ?? undefined,
    patientPhone: row.patientPhone,
    amount: row.amount,
    status: row.status,
    validityLabel: row.validityLabel ?? undefined,
    membershipDurationLabel: row.membershipDurationLabel ?? undefined,
    discountPercent: row.discountPercent ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapMembershipApplication(row: MembershipApplication) {
  const extra =
    row.extra && typeof row.extra === 'object' && !Array.isArray(row.extra)
      ? (row.extra as Record<string, unknown>)
      : {};

  const payload = row.zohalPayload;
  let zohalSummary: string | undefined;
  let zohalShahkarMatched: boolean | null | undefined = row.shahkarMatched ?? undefined;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    if (typeof p.shahkarMatched === 'boolean') zohalShahkarMatched = p.shahkarMatched;
    zohalSummary = buildZohalCreditSummary(p);
  }

  return {
    ...extra,
    id: row.id,
    patientName: row.patientName ?? undefined,
    phone: row.phone ?? undefined,
    nationalId: row.nationalId ?? undefined,
    age: row.age ?? undefined,
    job: row.job ?? undefined,
    postalCode: row.postalCode ?? undefined,
    homeAddress: row.homeAddress ?? undefined,
    workAddress: row.workAddress ?? undefined,
    medicalHistory: row.medicalHistory ?? undefined,
    dependents: row.dependents ?? undefined,
    planId: row.planId ?? undefined,
    planTitle: row.planTitle ?? undefined,
    tier: row.tier ?? undefined,
    tierLabel: row.tierLabel ?? undefined,
    validityLabel: row.validityLabel ?? undefined,
    membershipDurationLabel: row.membershipDurationLabel ?? undefined,
    discountPercent: row.discountPercent ?? undefined,
    memberCount: row.memberCount ?? undefined,
    unitPriceToman: row.unitPriceToman ?? undefined,
    amountRial: row.amountRial ?? undefined,
    amountToman: row.amountToman ?? undefined,
    loanAmount: row.loanAmount ?? undefined,
    referralCode: row.referralCode ?? undefined,
    visitorName: row.visitorName ?? undefined,
    status: row.status,
    zohalStatus: row.zohalStatus ?? undefined,
    zohalShahkarMatched,
    zohalSummary,
    zohalCheckedAt: row.zohalCheckedAt?.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
    reviewNote: row.reviewNote ?? undefined,
    source: row.source ?? undefined,
    date: row.date ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapWalletTransaction(row: WalletTransaction) {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapWallet(row: Wallet & { transactions?: WalletTransaction[] }) {
  return {
    phone: row.phone,
    balance: row.balance,
    ceiling: row.ceiling,
    activeKinds: (row.activeKinds.length ? row.activeKinds : ['regular']) as WalletKind[],
    status: row.status,
    shopVip: row.shopVip,
    transactions: (row.transactions || []).map(mapWalletTransaction),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapShopOrder(row: ShopOrder) {
  return {
    id: row.id,
    customerType: row.customerType ?? undefined,
    customerTypeLabel: row.customerTypeLabel ?? undefined,
    customerName: row.customerName ?? undefined,
    customerPhone: row.customerPhone,
    address: row.address ?? undefined,
    items: row.items,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapVisitor(row: Visitor) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    commissionRate: row.commissionRate,
    commissionRateClinical: row.commissionRateClinical ?? row.commissionRate,
    commissionRateShop: row.commissionRateShop ?? row.commissionRate,
    phone: row.phone,
    status: row.status,
  };
}

export function mapCommission(row: Commission) {
  return {
    id: row.id,
    visitorId: row.visitorId,
    visitorName: row.visitorName,
    referralCode: row.referralCode,
    commissionRate: row.commissionRate,
    commissionAmount: row.commissionAmount,
    sourceType: row.sourceType ?? undefined,
    sourceLabel: row.sourceLabel ?? undefined,
    customerName: row.customerName ?? undefined,
    customerPhone: row.customerPhone ?? undefined,
    amount: row.amount,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapFacilityRequest(row: FacilityRequest) {
  const payload = row.zohalPayload;
  let zohalSummary: string | undefined;
  let zohalShahkarMatched: boolean | null | undefined;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    if (typeof p.shahkarMatched === 'boolean') zohalShahkarMatched = p.shahkarMatched;
    zohalSummary = buildZohalCreditSummary(p);
  }

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    nationalId: row.nationalId ?? undefined,
    amount: row.amount,
    description: row.description ?? undefined,
    status: row.status,
    zohalStatus: row.zohalStatus ?? undefined,
    zohalShahkarMatched,
    zohalSummary,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapInstallmentScheduleItem(row: {
  id: string;
  planId: string;
  index: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: string;
}) {
  return {
    id: row.id,
    planId: row.planId,
    index: row.index,
    dueDate: row.dueDate.toISOString(),
    amount: row.amount,
    paidAmount: row.paidAmount,
    status: row.status,
    remaining: Math.max(0, row.amount - row.paidAmount),
  };
}

export function mapInstallmentPayment(row: {
  id: string;
  planId: string;
  scheduleItemId: string | null;
  amount: number;
  method: string;
  status: string;
  trackId: string | null;
  note: string | null;
  paidAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    planId: row.planId,
    scheduleItemId: row.scheduleItemId ?? undefined,
    amount: row.amount,
    method: row.method,
    status: row.status,
    trackId: row.trackId ?? undefined,
    note: row.note ?? undefined,
    paidAt: row.paidAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapInstallmentPlan(
  row: InstallmentPlan & {
    scheduleItems?: Array<{
      id: string;
      planId: string;
      index: number;
      dueDate: Date;
      amount: number;
      paidAmount: number;
      status: string;
    }>;
    payments?: Array<{
      id: string;
      planId: string;
      scheduleItemId: string | null;
      amount: number;
      method: string;
      status: string;
      trackId: string | null;
      note: string | null;
      paidAt: Date | null;
      createdAt: Date;
    }>;
  },
) {
  const items = (row.scheduleItems || []).map(mapInstallmentScheduleItem);
  const overdueAmount = items
    .filter((i) => i.status === 'overdue' || i.status === 'partial')
    .reduce((sum, i) => sum + i.remaining, 0);
  return {
    id: row.id,
    phone: row.phone,
    patientName: row.patientName ?? undefined,
    source: row.source,
    title: row.title,
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    installmentCount: row.installmentCount,
    dueDates: [...row.dueDates],
    status: row.status,
    linkedRequestId: row.linkedRequestId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    items,
    payments: (row.payments || []).map(mapInstallmentPayment),
    overdueAmount,
  };
}

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
    const parts: string[] = [];
    if (typeof p.shahkarMatched === 'boolean') {
      parts.push(p.shahkarMatched ? 'شاهکار: تطبیق' : 'شاهکار: عدم تطبیق');
    }
    if (p.credit && typeof p.credit === 'object') {
      const c = p.credit as Record<string, unknown>;
      if (c.error) parts.push(`اعتبار: خطا`);
      else parts.push('اعتبار: دریافت شد');
    }
    if (p.bouncedCheque && typeof p.bouncedCheque === 'object') {
      const b = p.bouncedCheque as Record<string, unknown>;
      if (b.error) parts.push('چک: خطا');
      else parts.push('چک: دریافت شد');
    }
    if (parts.length) zohalSummary = parts.join(' · ');
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

export function mapInstallmentPlan(row: InstallmentPlan) {
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
  };
}

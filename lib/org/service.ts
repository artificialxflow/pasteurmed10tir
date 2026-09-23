import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import type { InstallmentPlan, OrganizationMember } from '@prisma/client';

export async function getOrganizationForUser(userId: string) {
  return prisma.organization.findUnique({
    where: { representativeUserId: userId },
    include: { members: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function requireOrganizationForUser(userId: string) {
  const org = await getOrganizationForUser(userId);
  if (!org) throw new Error('حساب سازمانی برای این شماره ثبت نشده است.');
  return org;
}

export async function findMemberOrganizationName(phone: string): Promise<string | undefined> {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return undefined;
  const row = await prisma.organizationMember.findFirst({
    where: { phone: digits },
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return row?.organization.name;
}

export async function organizationLookupByPhones() {
  const orgs = await prisma.organization.findMany({
    select: {
      name: true,
      representative: { select: { phone: true } },
      members: { select: { phone: true } },
    },
  });
  const map = new Map<string, { name: string; isRep: boolean }>();
  for (const org of orgs) {
    map.set(org.representative.phone, { name: org.name, isRep: true });
    for (const m of org.members) {
      if (!map.has(m.phone)) map.set(m.phone, { name: org.name, isRep: false });
    }
  }
  return map;
}

export async function installmentsByPhones(phones: string[]) {
  const unique = [...new Set(phones.filter(Boolean))];
  if (!unique.length) return new Map<string, InstallmentPlan>();
  const plans = await prisma.installmentPlan.findMany({
    where: { phone: { in: unique }, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  const planByPhone = new Map<string, InstallmentPlan>();
  for (const plan of plans) {
    if (!planByPhone.has(plan.phone)) planByPhone.set(plan.phone, plan);
  }
  return planByPhone;
}

export function serializeOrgMember(
  m: OrganizationMember,
  plan: InstallmentPlan | undefined,
) {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    nationalId: m.nationalId,
    membershipPaid: m.membershipPaid,
    membershipAmount: m.membershipAmount,
    lastPaidAt: m.lastPaidAt?.toISOString() || null,
    installment: plan
      ? {
          id: plan.id,
          title: plan.title,
          status: plan.status,
          totalAmount: plan.totalAmount,
          paidAmount: plan.paidAmount,
        }
      : null,
  };
}

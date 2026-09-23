import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';

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

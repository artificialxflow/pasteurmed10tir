import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';

export type VisitorSelf = {
  id: number;
  name: string;
  code: string;
  phone: string;
  status: string;
  role: 'visitor' | 'referrer';
  showMarketingPanel: boolean;
  showCompetitorPanel: boolean;
  referralCommissionPercent: number;
};

/** ویزیتور فعال متناظر با موبایل سشن (OTP مشترک). */
export async function findActiveVisitorByPhone(
  phone?: string | null,
): Promise<VisitorSelf | null> {
  const key = normalizePhoneDigits(phone || '');
  if (!key) return null;

  const rows = await prisma.visitor.findMany({
    where: { status: 'active' },
    orderBy: { id: 'asc' },
  });

  const row = rows.find((v) => normalizePhoneDigits(v.phone) === key);
  if (!row) return null;

  const role = row.role === 'referrer' ? 'referrer' : 'visitor';
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    phone: key,
    status: row.status,
    role,
    showMarketingPanel: role === 'visitor',
    showCompetitorPanel: role === 'visitor',
    referralCommissionPercent: row.commissionRate,
  };
}

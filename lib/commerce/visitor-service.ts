import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';

export type VisitorSelf = {
  id: number;
  name: string;
  code: string;
  phone: string;
  status: string;
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

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    phone: key,
    status: row.status,
  };
}

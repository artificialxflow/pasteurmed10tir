import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { clampContractDiscountPercent } from '@/lib/membership/group-discount';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const rows = await prisma.organization.findMany({
    include: {
      representative: { select: { phone: true, name: true } },
      members: { select: { membershipPaid: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    items: rows.map((row) => {
      const memberCount = row.members.length;
      const paidCount = row.members.filter((m) => m.membershipPaid).length;
      return {
        id: row.id,
        name: row.name,
        contractDiscountPercent: row.contractDiscountPercent,
        representativeName: row.representative.name,
        representativePhone: row.representative.phone,
        memberCount,
        paidCount,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    name?: string;
    representativePhone?: string;
    contractDiscountPercent?: number;
  }>(request);
  const name = (body?.name || '').trim();
  const phone = normalizePhoneDigits(body?.representativePhone || '');
  if (name.length < 2) return jsonError('نام سازمان را وارد کنید.');
  if (phone.length < 10) return jsonError('موبایل نماینده معتبر نیست.');

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return jsonError('این موبایل در سامانه ثبت‌نام نکرده است. ابتدا نماینده وارد شود.');

  const existing = await prisma.organization.findUnique({
    where: { representativeUserId: user.id },
  });
  if (existing) return jsonError('این شماره از قبل نماینده یک سازمان است.');

  const row = await prisma.organization.create({
    data: {
      name,
      representativeUserId: user.id,
      contractDiscountPercent: clampContractDiscountPercent(body?.contractDiscountPercent),
    },
    include: { representative: { select: { phone: true, name: true } } },
  });

  return NextResponse.json(
    {
      item: {
        id: row.id,
        name: row.name,
        contractDiscountPercent: row.contractDiscountPercent,
        representativeName: row.representative.name,
        representativePhone: row.representative.phone,
        memberCount: 0,
        paidCount: 0,
      },
    },
    { status: 201 },
  );
}

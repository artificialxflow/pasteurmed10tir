import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { clampContractDiscountPercent } from '@/lib/membership/group-discount';
import { installmentsByPhones, serializeOrgMember } from '@/lib/org/service';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      representative: { select: { phone: true, name: true } },
      members: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!org) return jsonError('سازمان یافت نشد.', 404);

  const planByPhone = await installmentsByPhones(org.members.map((m) => m.phone));

  return NextResponse.json({
    organization: {
      id: org.id,
      name: org.name,
      contractDiscountPercent: org.contractDiscountPercent,
      representativeName: org.representative.name,
      representativePhone: org.representative.phone,
      createdAt: org.createdAt.toISOString(),
    },
    members: org.members.map((m) => serializeOrgMember(m, planByPhone.get(m.phone))),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = await parseJson<{ name?: string; contractDiscountPercent?: number }>(request);

  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) return jsonError('سازمان یافت نشد.', 404);

  const name = body?.name !== undefined ? body.name.trim() : existing.name;
  if (name.length < 2) return jsonError('نام سازمان را وارد کنید.');

  const row = await prisma.organization.update({
    where: { id },
    data: {
      name,
      contractDiscountPercent:
        body?.contractDiscountPercent !== undefined
          ? clampContractDiscountPercent(body.contractDiscountPercent)
          : existing.contractDiscountPercent,
    },
  });

  return NextResponse.json({
    organization: {
      id: row.id,
      name: row.name,
      contractDiscountPercent: row.contractDiscountPercent,
    },
  });
}

import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { getOrganizationForUser, requireOrganizationForUser, installmentsByPhones, serializeOrgMember } from '@/lib/org/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const org = await getOrganizationForUser(auth.session.userId);
  if (!org) return NextResponse.json({ organization: null, members: [] });

  const planByPhone = await installmentsByPhones(org.members.map((m) => m.phone));

  return NextResponse.json({
    organization: {
      id: org.id,
      name: org.name,
      contractDiscountPercent: org.contractDiscountPercent,
    },
    members: org.members.map((m) => serializeOrgMember(m, planByPhone.get(m.phone))),
  });
}

export async function PATCH(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const body = await parseJson<{ name?: string }>(request);
  const name = (body?.name || '').trim();
  if (name.length < 2) return jsonError('نام سازمان را وارد کنید.');
  const org = await requireOrganizationForUser(auth.session.userId).catch((e: Error) => e);
  if (org instanceof Error) return jsonError(org.message, 404);
  const row = await prisma.organization.update({
    where: { id: org.id },
    data: { name },
  });
  return NextResponse.json({
    organization: {
      id: row.id,
      name: row.name,
      contractDiscountPercent: row.contractDiscountPercent,
    },
  });
}

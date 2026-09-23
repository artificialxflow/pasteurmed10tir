import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { getOrganizationForUser, requireOrganizationForUser } from '@/lib/org/service';
import { requirePatient } from '@/lib/operations/require-patient';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const org = await getOrganizationForUser(auth.session.userId);
  if (!org) return NextResponse.json({ organization: null, members: [] });

  const phones = org.members.map((m) => m.phone);
  const plans = phones.length
    ? await prisma.installmentPlan.findMany({
        where: { phone: { in: phones }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      })
    : [];
  const planByPhone = new Map<string, (typeof plans)[number]>();
  for (const plan of plans) {
    if (!planByPhone.has(plan.phone)) planByPhone.set(plan.phone, plan);
  }

  return NextResponse.json({
    organization: { id: org.id, name: org.name },
    members: org.members.map((m) => {
      const plan = planByPhone.get(m.phone);
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
              title: plan.title,
              status: plan.status,
              totalAmount: plan.totalAmount,
              paidAmount: plan.paidAmount,
            }
          : null,
      };
    }),
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
  return NextResponse.json({ organization: { id: row.id, name: row.name } });
}

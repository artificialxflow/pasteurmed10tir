import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateCommerceId, mapMembershipApplication } from '@/lib/commerce/mappers';
import { findVisitorByCode } from '@/lib/commerce/commission-service';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(String(body.phone || ''));
  let visitorName = body.visitorName ? String(body.visitorName) : null;
  if (!visitorName && body.referralCode) {
    const visitor = await findVisitorByCode(String(body.referralCode));
    visitorName = visitor?.name || null;
  }

  const row = await prisma.membershipApplication.create({
    data: {
      id: String(body.id || generateCommerceId()),
      patientName: body.patientName ? String(body.patientName) : null,
      phone: phone || null,
      nationalId: body.nationalId ? String(body.nationalId) : null,
      age: body.age != null ? String(body.age) : null,
      job: body.job ? String(body.job) : null,
      postalCode: body.postalCode ? String(body.postalCode) : null,
      homeAddress: body.homeAddress ? String(body.homeAddress) : null,
      workAddress: body.workAddress ? String(body.workAddress) : null,
      medicalHistory: body.medicalHistory ? String(body.medicalHistory) : null,
      dependents: body.dependents != null ? String(body.dependents) : null,
      planId: body.planId ? String(body.planId) : null,
      planTitle: body.planTitle ? String(body.planTitle) : null,
      tier: body.tier ? String(body.tier) : null,
      tierLabel: body.tierLabel ? String(body.tierLabel) : null,
      validityLabel: body.validityLabel ? String(body.validityLabel) : null,
      membershipDurationLabel: body.membershipDurationLabel
        ? String(body.membershipDurationLabel)
        : null,
      discountPercent:
        body.discountPercent === undefined || body.discountPercent === null
          ? null
          : Number(body.discountPercent),
      memberCount:
        body.memberCount === undefined || body.memberCount === null
          ? null
          : Number(body.memberCount),
      unitPriceToman:
        body.unitPriceToman === undefined || body.unitPriceToman === null
          ? null
          : Number(body.unitPriceToman),
      amountRial:
        body.amountRial === undefined || body.amountRial === null
          ? null
          : Number(body.amountRial),
      amountToman:
        body.amountToman === undefined || body.amountToman === null
          ? null
          : Number(body.amountToman),
      loanAmount:
        body.loanAmount === undefined || body.loanAmount === null
          ? null
          : Number(body.loanAmount),
      referralCode: body.referralCode ? String(body.referralCode) : null,
      visitorName,
      status: String(body.status || 'pending'),
      source: body.source ? String(body.source) : null,
      date: body.date ? String(body.date) : null,
      extra: JSON.parse(JSON.stringify(body)) as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ application: mapMembershipApplication(row) }, { status: 201 });
}

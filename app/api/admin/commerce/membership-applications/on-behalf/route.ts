import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateCommerceId, mapMembershipApplication } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import {
  getDurationOptions,
  getUnitPrice,
  getValidityLabel,
  membershipDurationDiscountForPayment,
  membershipTierLabel,
  normalizeMemberCount,
  parseMembershipTier,
} from '@/lib/membership';
import { applyMembershipDiscounts, clampGroupDiscountPercent } from '@/lib/membership/group-discount';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const patientPhone = normalizePhoneDigits(String(body.patientPhone || body.phone || ''));
  const patientUserId = body.patientUserId ? String(body.patientUserId) : '';
  if (!patientPhone && !patientUserId) {
    return jsonError('موبایل یا شناسه بیمار الزامی است.');
  }

  const user = await prisma.user.findFirst({
    where: patientUserId
      ? { id: patientUserId }
      : { phone: patientPhone },
    select: { id: true, phone: true, name: true },
  });
  if (!user?.phone) return jsonError('بیمار یافت نشد.');

  const tier = parseMembershipTier(body.tier ?? body.planId);
  const planId = String(body.membershipPlanId || body.planId || 'one-year');
  const memberCountRaw = body.memberCount;
  const memberCount = normalizeMemberCount(
    typeof memberCountRaw === 'number' || typeof memberCountRaw === 'string'
      ? memberCountRaw
      : 1,
  );
  const durationOptions = getDurationOptions();
  const durationPlan = durationOptions.find((p) => p.id === planId);
  const unit = getUnitPrice(tier, planId);
  const subtotal = unit * memberCount;
  const durationDisc = membershipDurationDiscountForPayment(durationPlan);
  const groupDisc = clampGroupDiscountPercent(
    body.groupDiscountPercent === undefined || body.groupDiscountPercent === null
      ? 0
      : Number(body.groupDiscountPercent),
  );
  const amountToman = applyMembershipDiscounts({
    subtotal,
    durationDiscountPercent: durationDisc,
    groupDiscountPercent: groupDisc,
  });

  const row = await prisma.membershipApplication.create({
    data: {
      id: generateCommerceId(),
      patientName: body.patientName ? String(body.patientName) : user.name || null,
      phone: user.phone,
      planId: durationPlan?.id || planId,
      planTitle: durationPlan ? `${durationPlan.title} (${durationPlan.duration})` : planId,
      tier,
      tierLabel: membershipTierLabel(tier),
      memberCount,
      unitPriceToman: unit,
      amountToman,
      amountRial: amountToman * 10,
      validityLabel: getValidityLabel(tier, planId),
      membershipDurationLabel: getValidityLabel(tier, planId),
      discountPercent: durationDisc,
      status: 'pending',
      source: 'admin-in-person',
      channel: 'in_person',
      onBehalfUserId: user.id,
      createdByAdminId: auth.session.userId,
      date: new Date().toLocaleDateString('fa-IR'),
      extra: {
        groupDiscountPercent: groupDisc,
        operatorNote: body.note ? String(body.note) : undefined,
      },
    },
  });

  return NextResponse.json(
    {
      application: mapMembershipApplication(row),
      payment: {
        kind: 'membership',
        planId: tier,
        patientName: row.patientName,
        patientPhone: user.phone,
        amountToman,
        onBehalfUserId: user.id,
        createdByAdminId: auth.session.userId,
      },
    },
    { status: 201 },
  );
}
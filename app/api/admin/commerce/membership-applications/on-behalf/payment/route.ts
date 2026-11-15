import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { createZibalPaymentIntent } from '@/lib/commerce/zibal-intent-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { parseMembershipTier, membershipTierLabel } from '@/lib/membership';
import type { PendingMembershipPayment } from '@/lib/payment';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const applicationId = String(body.applicationId || '');
  if (!applicationId) return jsonError('شناسه درخواست عضویت الزامی است.');

  const row = await prisma.membershipApplication.findUnique({ where: { id: applicationId } });
  if (!row || row.deletedAt) return jsonError('درخواست عضویت یافت نشد.', 404);
  if (row.status === 'paid') return jsonError('این درخواست قبلاً پرداخت شده است.');

  const tier = parseMembershipTier(row.tier);
  const amount = Math.max(0, Number(row.amountToman || 0));
  if (amount < 1000) return jsonError('مبلغ درخواست معتبر نیست.');

  const pending: PendingMembershipPayment = {
    kind: 'membership',
    planId: tier,
    planName: row.planTitle || membershipTierLabel(tier),
    patientName: row.patientName || undefined,
    patientPhone: row.phone || undefined,
    amount,
    amountToman: amount,
    validityLabel: row.validityLabel || undefined,
    membershipDurationLabel: row.membershipDurationLabel || undefined,
    membershipApplicationId: row.id,
    onBehalfUserId: row.onBehalfUserId || undefined,
    createdByAdminId: auth.session.userId,
    successTo: '/admin/memberships',
    returnTo: '/admin/memberships/in-person',
  };

  try {
    const intent = await createZibalPaymentIntent({ pending, basePath: '/dental' });
    return NextResponse.json({
      redirectUrl: intent.redirectUrl,
      intentId: intent.intentId,
      trackId: intent.trackId,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'شروع درگاه ناموفق بود.', 400);
  }
}
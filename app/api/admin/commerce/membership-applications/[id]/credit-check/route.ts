import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapMembershipApplication } from '@/lib/commerce/mappers';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import {
  completeZohalCreditOtp,
  startZohalCreditOtp,
  zohalCreditCheckNotice,
} from '@/lib/zohal/run-credit-check';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

type Body = {
  action?: 'send_otp' | 'verify_otp';
  otp?: string;
  referenceId?: string;
};

function payloadRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.membershipApplication.findUnique({ where: { id } });
  if (!row || row.deletedAt) return jsonError('درخواست یافت نشد.', 404);

  const body = (await parseJson<Body>(request)) || {};
  const action = body.action || 'send_otp';
  const previousPayload = payloadRecord(row.zohalPayload);

  const result =
    action === 'verify_otp'
      ? await completeZohalCreditOtp({
          nationalId: String(row.nationalId || ''),
          phone: String(row.phone || ''),
          otp: String(body.otp || ''),
          referenceId: body.referenceId ? String(body.referenceId) : undefined,
          previousPayload,
        })
      : await startZohalCreditOtp(
          {
            nationalId: String(row.nationalId || ''),
            phone: String(row.phone || ''),
          },
          previousPayload,
        );

  if ('error' in result) {
    return jsonError(result.error, result.status);
  }

  const updated = await prisma.membershipApplication.update({
    where: { id },
    data: {
      zohalStatus: result.zohalStatus,
      zohalPayload: result.zohalPayload,
      shahkarMatched: result.shahkarMatched,
      zohalCheckedAt: result.zohalCheckedAt,
    },
  });

  return NextResponse.json({
    item: mapMembershipApplication(updated),
    zohalStatus: result.zohalStatus,
    summary: result.summary,
    referenceId: result.referenceId,
    notice: zohalCreditCheckNotice(result.zohalStatus),
  });
}

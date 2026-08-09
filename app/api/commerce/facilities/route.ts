import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateCommerceId, mapFacilityRequest } from '@/lib/commerce/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import {
  isZohalConfigured,
  shahkarMatched,
  zohalBouncedCheque,
  zohalCreditInquiry,
  zohalNationalIdentity,
  zohalShahkar,
} from '@/lib/zohal/client';
import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  const body = await parseJson<{
    name?: string;
    phone?: string;
    nationalId?: string;
    amount?: string | number;
    description?: string;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(String(body.phone || ''));
  const name = String(body.name || '').trim();
  const nationalId = normalizeNationalId(String(body.nationalId || ''));
  const amountRaw = String(body.amount ?? '').trim();
  const amountNum = Number(String(amountRaw).replace(/[^\d]/g, '')) || 0;

  if (!phone || !name) return jsonError('نام و موبایل الزامی است.');
  if (!nationalId || !isValidNationalId(nationalId)) {
    return jsonError('کد ملی معتبر الزامی است.');
  }

  let zohalStatus = 'skipped';
  let zohalPayload: Prisma.InputJsonValue | undefined;

  if (isZohalConfigured()) {
    const shahkar = await zohalShahkar(nationalId, phone);
    const matched = shahkar.ok ? shahkarMatched(shahkar.data) : false;
    const identity = await zohalNationalIdentity(nationalId);
    const credit = await zohalCreditInquiry(nationalId);
    const bounced = await zohalBouncedCheque(nationalId);

    zohalPayload = {
      shahkar: shahkar.ok ? shahkar.data : { error: shahkar.error },
      identity: identity.ok ? identity.data : { error: identity.error },
      credit: credit.ok ? credit.data : { error: credit.error },
      bouncedCheque: bounced.ok ? bounced.data : { error: bounced.error },
      shahkarMatched: matched,
    } as Prisma.InputJsonValue;

    if (!shahkar.ok) {
      zohalStatus = 'error';
      return jsonError(shahkar.error || 'خطا در استعلام شاهکار.', 502);
    }
    if (matched === false) {
      zohalStatus = 'failed';
      await prisma.facilityRequest.create({
        data: {
          id: generateCommerceId(),
          name,
          phone,
          nationalId,
          amount: amountRaw || String(amountNum),
          amountNum,
          description: body.description ? String(body.description) : null,
          status: 'rejected',
          zohalStatus,
          zohalPayload,
        },
      });
      return jsonError('کد ملی با شماره موبایل تطبیق ندارد (شاهکار).', 403);
    }
    zohalStatus = 'passed';
  }

  const row = await prisma.facilityRequest.create({
    data: {
      id: generateCommerceId(),
      name,
      phone,
      nationalId,
      amount: amountRaw || String(amountNum),
      amountNum,
      description: body.description ? String(body.description) : null,
      status: 'pending',
      zohalStatus,
      zohalPayload,
    },
  });

  return NextResponse.json({ item: mapFacilityRequest(row) }, { status: 201 });
}

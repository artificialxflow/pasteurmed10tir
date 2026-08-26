import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateCommerceId, mapFacilityRequest } from '@/lib/commerce/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import { runZohalCreditCheck } from '@/lib/zohal/run-credit-check';
import { NextResponse } from 'next/server';

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

  const zohal = await runZohalCreditCheck({ nationalId, phone });
  if ('error' in zohal) {
    return jsonError(zohal.error, zohal.status);
  }

  if (zohal.zohalStatus === 'failed') {
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
        zohalStatus: zohal.zohalStatus,
        zohalPayload: zohal.zohalPayload,
      },
    });
    return jsonError('کد ملی با شماره موبایل تطبیق ندارد (شاهکار).', 403);
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
      zohalStatus: zohal.zohalStatus,
      zohalPayload: zohal.zohalPayload,
    },
  });

  return NextResponse.json({ item: mapFacilityRequest(row) }, { status: 201 });
}

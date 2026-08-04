import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateCommerceId, mapFacilityRequest } from '@/lib/commerce/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await parseJson<{
    name?: string;
    phone?: string;
    amount?: string | number;
    description?: string;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(String(body.phone || ''));
  const name = String(body.name || '').trim();
  const amountRaw = String(body.amount ?? '').trim();
  const amountNum = Number(String(amountRaw).replace(/[^\d]/g, '')) || 0;

  if (!phone || !name) return jsonError('نام و موبایل الزامی است.');

  const row = await prisma.facilityRequest.create({
    data: {
      id: generateCommerceId(),
      name,
      phone,
      amount: amountRaw || String(amountNum),
      amountNum,
      description: body.description ? String(body.description) : null,
      status: 'pending',
    },
  });

  return NextResponse.json({ item: mapFacilityRequest(row) }, { status: 201 });
}

import { jsonError } from '@/lib/auth/api-utils';
import { generateOperationId, mapPartnerRequest } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('درخواست نامعتبر است.');
  }

  const patientPhone = normalizePhoneDigits(String(body.phone || ''));
  const patientName = String(body.name || '').trim();
  const type = String(body.type || '').trim();

  if (!patientPhone || !patientName || !type) {
    return jsonError('اطلاعات درخواست همکاری ناقص است.');
  }

  const row = await prisma.partnerRequest.create({
    data: {
      id: generateOperationId(),
      type,
      typeLabel: body.typeLabel ? String(body.typeLabel) : null,
      patientName,
      patientPhone,
      specialty: body.specialty ? String(body.specialty) : null,
      city: body.city ? String(body.city) : null,
      description: body.description ? String(body.description) : null,
      notes: body.notes ? String(body.notes) : null,
      status: 'new',
    },
  });

  return NextResponse.json({ item: mapPartnerRequest(row) }, { status: 201 });
}

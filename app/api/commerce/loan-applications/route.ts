import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { generateCommerceId, mapMembershipApplication } from '@/lib/commerce/mappers';
import { LOAN_DOC_REQUIRED_KINDS } from '@/lib/loan-documents/constants';
import { mapLoanDocumentPublic } from '@/lib/loan-documents/storage';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { isValidNationalId, normalizeNationalId } from '@/lib/validation/national-id';
import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(auth.session.phone || '');
  if (!phone) return jsonError('شماره موبایل یافت نشد.', 401);

  const loanAmount = Number(body.loanAmount || 0);
  if (!loanAmount || loanAmount < 1) {
    return jsonError('مبلغ وام معتبر نیست.');
  }

  const nationalId = normalizeNationalId(String(body.nationalId || ''));
  if (!nationalId || !isValidNationalId(nationalId)) {
    return jsonError('برای درخواست وام، کد ملی ۱۰ رقمی معتبر الزامی است.');
  }

  const documentIds = Array.isArray(body.documentIds)
    ? body.documentIds.map((id) => String(id))
    : [];
  const docs = await prisma.loanDocument.findMany({
    where: {
      id: { in: documentIds },
      phone,
      deletedAt: null,
      applicationId: null,
    },
  });
  const kinds = new Set(docs.map((d) => d.kind));
  const missing = LOAN_DOC_REQUIRED_KINDS.filter((k) => !kinds.has(k));
  if (missing.length) {
    return jsonError('چهار مدرک الزامی را آپلود کنید.');
  }

  const extra = { ...body };
  delete extra.documentIds;

  const row = await prisma.membershipApplication.create({
    data: {
      id: generateCommerceId(),
      patientName: body.patientName ? String(body.patientName) : null,
      phone,
      nationalId,
      loanAmount,
      source: 'loan-request',
      planTitle: body.planTitle ? String(body.planTitle) : 'درخواست وام درمانی',
      status: 'pending',
      date: body.date ? String(body.date) : new Date().toLocaleDateString('fa-IR'),
      extra: JSON.parse(JSON.stringify(extra)) as Prisma.InputJsonValue,
    },
  });

  await prisma.loanDocument.updateMany({
    where: { id: { in: docs.map((d) => d.id) } },
    data: { applicationId: row.id },
  });

  const attached = await prisma.loanDocument.findMany({
    where: { applicationId: row.id, deletedAt: null },
  });

  return NextResponse.json(
    {
      application: mapMembershipApplication(row),
      documents: attached.map(mapLoanDocumentPublic),
    },
    { status: 201 },
  );
}

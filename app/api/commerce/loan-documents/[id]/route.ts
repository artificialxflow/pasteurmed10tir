import { jsonError } from '@/lib/auth/api-utils';
import { mapLoanDocumentPublic, removePrivateLoanFile } from '@/lib/loan-documents/storage';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const phone = normalizePhoneDigits(auth.session.phone || '');
  if (!phone) return jsonError('شماره موبایل یافت نشد.', 401);

  const { id } = await context.params;
  const row = await prisma.loanDocument.findUnique({ where: { id } });
  if (!row || row.deletedAt || row.phone !== phone) {
    return jsonError('مدرک یافت نشد.', 404);
  }

  if (row.applicationId) {
    const app = await prisma.membershipApplication.findUnique({
      where: { id: row.applicationId },
    });
    if (app && app.status !== 'pending') {
      return jsonError('پس از بررسی درخواست نمی‌توان مدرک را حذف کرد.');
    }
  }

  await prisma.loanDocument.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await removePrivateLoanFile(row.storagePath);
  return NextResponse.json({ ok: true, item: mapLoanDocumentPublic(row) });
}

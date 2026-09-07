import { jsonError } from '@/lib/auth/api-utils';
import { generateCommerceId } from '@/lib/commerce/mappers';
import {
  LOAN_DOC_KINDS,
  LOAN_DOC_OTHER_MAX,
  type LoanDocKind,
} from '@/lib/loan-documents/constants';
import { mapLoanDocumentPublic, savePrivateLoanFile } from '@/lib/loan-documents/storage';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const phone = normalizePhoneDigits(auth.session.phone || '');
  if (!phone) return jsonError('شماره موبایل یافت نشد.', 401);

  const rows = await prisma.loanDocument.findMany({
    where: { phone, deletedAt: null },
    orderBy: { uploadedAt: 'desc' },
  });
  return NextResponse.json({ items: rows.map(mapLoanDocumentPublic) });
}

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const phone = normalizePhoneDigits(auth.session.phone || '');
  if (!phone) return jsonError('شماره موبایل یافت نشد.', 401);

  const form = await request.formData();
  const kind = String(form.get('kind') || '') as LoanDocKind;
  const file = form.get('file');
  if (!LOAN_DOC_KINDS.includes(kind)) {
    return jsonError('نوع مدرک نامعتبر است.');
  }
  if (!(file instanceof File) || !file.size) {
    return jsonError('فایل الزامی است.');
  }

  if (kind === 'other') {
    const others = await prisma.loanDocument.count({
      where: { phone, kind: 'other', deletedAt: null, applicationId: null },
    });
    if (others >= LOAN_DOC_OTHER_MAX) {
      return jsonError(`حداکثر ${LOAN_DOC_OTHER_MAX} فایل برای سایر مدارک مجاز است.`);
    }
  } else {
    const existing = await prisma.loanDocument.findFirst({
      where: { phone, kind, deletedAt: null, applicationId: null },
    });
    if (existing) {
      return jsonError('این مدرک از قبل آپلود شده. ابتدا آن را حذف کنید.');
    }
  }

  try {
    const saved = await savePrivateLoanFile(file);
    const row = await prisma.loanDocument.create({
      data: {
        id: generateCommerceId(),
        phone,
        kind,
        filename: saved.filename,
        mime: saved.mime,
        sizeBytes: saved.sizeBytes,
        storagePath: saved.storagePath,
      },
    });
    return NextResponse.json({ item: mapLoanDocumentPublic(row) }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'آپلود ناموفق بود.');
  }
}

import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { loadWalletSettings } from '@/lib/commerce/wallet-service';
import {
  parseRequestedAmount,
  validateInstallmentCount,
  validateRequestedAmount,
} from '@/lib/commerce/credit-activation';
import { generateCommerceId, mapCreditActivationRequest } from '@/lib/commerce/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { requirePatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;
  const phone = normalizePhoneDigits(auth.session.phone || '');
  if (!phone) return jsonError('شماره موبایل یافت نشد.', 401);

  const rows = await prisma.creditActivationRequest.findMany({
    where: { phone, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items: rows.map(mapCreditActivationRequest) });
}

export async function POST(request: Request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const body = await parseJson<{
    requestedAmount?: unknown;
    installmentCount?: unknown;
    patientName?: unknown;
    nationalId?: unknown;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const phone = normalizePhoneDigits(auth.session.phone || '');
  if (!phone) return jsonError('شماره موبایل یافت نشد.', 401);

  const wallet = await prisma.wallet.findUnique({ where: { phone } });
  const ceiling = wallet?.ceiling ?? 0;
  const requestedAmount = parseRequestedAmount(body.requestedAmount);
  const amountError = validateRequestedAmount(requestedAmount, ceiling);
  if (amountError) return jsonError(amountError);

  const settings = await loadWalletSettings();
  const installmentCount = Number(body.installmentCount ?? settings.installmentMax ?? 6);
  const countError = validateInstallmentCount(
    installmentCount,
    settings.installmentMin || 1,
    settings.installmentMax || 6,
  );
  if (countError) return jsonError(countError);

  const pending = await prisma.creditActivationRequest.findFirst({
    where: { phone, status: 'pending', deletedAt: null },
  });
  if (pending) {
    return jsonError('یک درخواست فعال‌سازی در انتظار بررسی دارید.');
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    include: { profile: true },
  });

  const row = await prisma.creditActivationRequest.create({
    data: {
      id: generateCommerceId(),
      phone,
      patientName: user?.name || (body.patientName ? String(body.patientName) : null),
      nationalId: user?.profile?.nationalId || (body.nationalId ? String(body.nationalId) : null),
      requestedAmount,
      installmentCount,
      status: 'pending',
    },
  });

  return NextResponse.json({ item: mapCreditActivationRequest(row) }, { status: 201 });
}

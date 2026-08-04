import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapWallet, mapWalletTransaction } from '@/lib/commerce/mappers';
import { getOrCreateWallet, walletToClient } from '@/lib/commerce/wallet-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { prisma } from '@/lib/prisma';
import type { WalletStatus, WalletTransactionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('wallets');
  if (auth.error) return auth.error;

  const rows = await prisma.wallet.findMany({
    include: { transactions: { orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ items: rows.map(walletToClient) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin('wallets');
  if (auth.error) return auth.error;

  const body = await parseJson<{
    phone?: string;
    status?: WalletStatus;
    transactionId?: string;
    transactionStatus?: WalletTransactionStatus;
  }>(request);
  if (!body?.phone) return jsonError('شماره موبایل الزامی است.');

  const phone = normalizePhoneDigits(body.phone);
  const wallet = await getOrCreateWallet(phone);
  if (!wallet) return jsonError('کیف یافت نشد.', 404);

  if (body.status) {
    const updated = await prisma.wallet.update({
      where: { phone },
      data: { status: body.status },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
    return NextResponse.json({ wallet: mapWallet(updated) });
  }

  if (body.transactionId && body.transactionStatus) {
    await prisma.walletTransaction.update({
      where: { id: body.transactionId },
      data: { status: body.transactionStatus },
    });
    const updated = await prisma.wallet.findUnique({
      where: { phone },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
    return NextResponse.json({
      wallet: updated ? mapWallet(updated) : null,
      transaction: updated?.transactions.find((t) => t.id === body.transactionId)
        ? mapWalletTransaction(
            updated.transactions.find((t) => t.id === body.transactionId)!,
          )
        : null,
    });
  }

  return jsonError('درخواست نامعتبر است.');
}

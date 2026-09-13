import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { validateRequestedAmount } from '@/lib/commerce/credit-activation';
import { createCreditInstallmentPlan } from '@/lib/commerce/installment-service';
import { mapCreditActivationRequest } from '@/lib/commerce/mappers';
import { SoftDeleteError, softDeleteCreditActivationRequest } from '@/lib/commerce/soft-delete';
import { applyCreditActivationDraw, getOrCreateWallet } from '@/lib/commerce/wallet-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin('wallets');
  if (auth.error) return auth.error;

  const body = await parseJson<{ status?: string; reviewNote?: string }>(request);
  const { id } = await context.params;

  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    return jsonError('وضعیت نامعتبر است.');
  }

  const row = await prisma.creditActivationRequest.findUnique({ where: { id } });
  if (!row || row.deletedAt) return jsonError('درخواست یافت نشد.', 404);

  let reviewNote = row.reviewNote;
  if (body.status === 'rejected') {
    const note = String(body.reviewNote || '').trim();
    if (!note) {
      return jsonError('برای رد درخواست، نوشتن توضیح الزامی است.');
    }
    reviewNote = note;
  } else if (body.reviewNote !== undefined) {
    reviewNote = String(body.reviewNote).trim() || null;
  } else if (body.status === 'approved') {
    reviewNote = null;
  }

  let linkedPlanId = row.linkedPlanId;

  if (body.status === 'approved' && row.status !== 'approved') {
    const wallet = await getOrCreateWallet(row.phone);
    const amountError = validateRequestedAmount(row.requestedAmount, wallet?.ceiling ?? 0);
    if (amountError) return jsonError(amountError);

    const available = Math.max(0, (wallet?.ceiling ?? 0) - (wallet?.balance ?? 0));
    if (row.requestedAmount > available) {
      return jsonError(
        `اعتبار باقی‌مانده کافی نیست (${available.toLocaleString('fa-IR')} تومان).`,
      );
    }

    const drawn = await applyCreditActivationDraw({
      phone: row.phone,
      amount: row.requestedAmount,
      requestId: row.id,
    });
    if (!drawn) {
      return jsonError('کسر از اعتبار باقی‌مانده ناموفق بود.');
    }

    const already = await prisma.installmentPlan.findFirst({
      where: { linkedRequestId: row.id, source: 'credit', deletedAt: null },
    });
    if (!already) {
      const plan = await createCreditInstallmentPlan({
        phone: row.phone,
        patientName: row.patientName || undefined,
        ceilingAmount: row.requestedAmount,
        label: `اقساط اعتباری ${row.requestedAmount.toLocaleString('fa-IR')} تومان`,
        linkedRequestId: row.id,
        installmentCount: row.installmentCount ?? undefined,
      });
      if (!plan) {
        return jsonError('ساخت طرح اقساط ناموفق بود. شماره موبایل یا مبلغ را بررسی کنید.');
      }
      linkedPlanId = plan.id;
    } else {
      linkedPlanId = already.id;
    }
  }

  const updated = await prisma.creditActivationRequest.update({
    where: { id },
    data: {
      status: body.status,
      reviewNote,
      reviewedAt: new Date(),
      linkedPlanId,
    },
  });

  return NextResponse.json({ item: mapCreditActivationRequest(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin('wallets');
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const result = await softDeleteCreditActivationRequest(id, auth.session);
    const extra =
      result.cascadedPlans > 0
        ? ` ${result.cascadedPlans.toLocaleString('fa-IR')} طرح اقساط مرتبط هم حذف شد.`
        : '';
    return NextResponse.json({
      ok: true,
      ...result,
      message: `درخواست فعال‌سازی حذف شد.${extra}`,
    });
  } catch (e) {
    if (e instanceof SoftDeleteError) return jsonError(e.message, e.status);
    return jsonError(e instanceof Error ? e.message : 'حذف ناموفق.');
  }
}

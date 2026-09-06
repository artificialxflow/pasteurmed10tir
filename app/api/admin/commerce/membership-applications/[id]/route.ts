import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { createLoanInstallmentPlan } from '@/lib/commerce/installment-service';
import { mapMembershipApplication } from '@/lib/commerce/mappers';
import { SoftDeleteError, softDeleteMembershipApplication } from '@/lib/commerce/soft-delete';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const body = await parseJson<{ status?: string; reviewNote?: string }>(request);
  const { id } = await context.params;

  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    return jsonError('وضعیت نامعتبر است.');
  }

  const row = await prisma.membershipApplication.findUnique({ where: { id } });
  if (!row || row.deletedAt) return jsonError('درخواست یافت نشد.', 404);

  let reviewNote = row.reviewNote;
  if (body.status === 'rejected') {
    const note = String(body.reviewNote || '').trim();
    if (!note) {
      return jsonError('برای رد وام، نوشتن توضیح برای وام‌گیرنده الزامی است.');
    }
    reviewNote = note;
  } else if (body.reviewNote !== undefined) {
    reviewNote = String(body.reviewNote).trim() || null;
  } else if (body.status === 'approved') {
    reviewNote = null;
  }

  const updated = await prisma.membershipApplication.update({
    where: { id },
    data: {
      status: body.status,
      reviewNote,
      reviewedAt: new Date(),
    },
  });

  if (
    body.status === 'approved' &&
    row.status !== 'approved' &&
    updated.loanAmount != null &&
    updated.loanAmount > 0
  ) {
    const already = await prisma.installmentPlan.findFirst({
      where: { linkedRequestId: updated.id, source: 'loan', deletedAt: null },
    });
    if (!already) {
      const extra =
        updated.extra && typeof updated.extra === 'object' && !Array.isArray(updated.extra)
          ? (updated.extra as Record<string, unknown>)
          : {};
      const months = Number(extra.loanMonths || extra.months || 12);
      await createLoanInstallmentPlan({
        phone: updated.phone,
        patientName: updated.patientName || undefined,
        amount: updated.loanAmount,
        months: Number.isFinite(months) ? months : 12,
        linkedRequestId: updated.id,
      });
    }
  }

  return NextResponse.json({ item: mapMembershipApplication(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin('memberships');
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const result = await softDeleteMembershipApplication(id, auth.session);
    const extra =
      result.cascadedPlans > 0
        ? ` ${result.cascadedPlans.toLocaleString('fa-IR')} طرح اقساط مرتبط هم حذف شد.`
        : '';
    return NextResponse.json({
      ok: true,
      ...result,
      message: `درخواست وام حذف شد.${extra}`,
    });
  } catch (e) {
    if (e instanceof SoftDeleteError) return jsonError(e.message, e.status);
    return jsonError(e instanceof Error ? e.message : 'حذف ناموفق.');
  }
}

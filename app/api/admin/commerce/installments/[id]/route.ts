import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { mapInstallmentPlan } from '@/lib/commerce/mappers';
import {
  addInstallmentScheduleItem,
  adminAdjustInstallmentPlan,
  removeInstallmentScheduleItem,
  updateInstallmentScheduleItemAmount,
  updateInstallmentPlanTotal,
} from '@/lib/commerce/installment-service';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

type PatchBody = {
  action?: 'updateTotal' | 'updateItem' | 'addItem' | 'removeItem';
  totalAmount?: number;
  scheduleItemId?: string;
  amount?: number;
  dueDate?: string;
  note?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin('installments');
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await parseJson<PatchBody>(request);
  if (!body?.action) return jsonError('عملیات نامعتبر است.');

  try {
    let plan;
    switch (body.action) {
      case 'updateTotal':
        if (body.totalAmount == null || Number(body.totalAmount) <= 0) {
          return jsonError('مبلغ کل باید بیشتر از صفر باشد.');
        }
        plan = await updateInstallmentPlanTotal({
          planId: id,
          totalAmount: Number(body.totalAmount),
          note: body.note,
        });
        break;
      case 'updateItem':
        if (!body.scheduleItemId || body.amount == null) {
          return jsonError('شناسه قسط و مبلغ الزامی است.');
        }
        plan = await updateInstallmentScheduleItemAmount({
          planId: id,
          scheduleItemId: body.scheduleItemId,
          amount: Number(body.amount),
          note: body.note,
        });
        break;
      case 'addItem':
        plan = await addInstallmentScheduleItem({
          planId: id,
          amount: body.amount != null ? Number(body.amount) : undefined,
          dueDate: body.dueDate,
          note: body.note,
        });
        break;
      case 'removeItem':
        if (!body.scheduleItemId) return jsonError('شناسه قسط الزامی است.');
        plan = await removeInstallmentScheduleItem({
          planId: id,
          scheduleItemId: body.scheduleItemId,
          note: body.note,
        });
        break;
      default:
        return jsonError('عملیات پشتیبانی نمی‌شود.');
    }

    if (!plan) return jsonError('طرح اقساط یافت نشد.', 404);
    return NextResponse.json({ item: mapInstallmentPlan(plan) });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ویرایش ناموفق.');
  }
}

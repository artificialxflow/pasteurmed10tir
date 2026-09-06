import { jsonError } from '@/lib/auth/api-utils';
import { SoftDeleteError, softDeleteFacilityRequest } from '@/lib/commerce/soft-delete';
import { requireAdmin } from '@/lib/content/require-admin';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin('facilities');
  if (auth.error) return auth.error;

  const { id } = await context.params;
  try {
    const result = await softDeleteFacilityRequest(id, auth.session);
    const extra =
      result.cascadedPlans > 0
        ? ` ${result.cascadedPlans.toLocaleString('fa-IR')} طرح اقساط مرتبط هم حذف شد.`
        : '';
    return NextResponse.json({
      ok: true,
      ...result,
      message: `درخواست تسهیلات حذف شد.${extra}`,
    });
  } catch (e) {
    if (e instanceof SoftDeleteError) return jsonError(e.message, e.status);
    return jsonError(e instanceof Error ? e.message : 'حذف ناموفق.');
  }
}

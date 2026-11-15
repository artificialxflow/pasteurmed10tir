import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdminAny } from '@/lib/content/require-admin';
import { updateHealthEntryForAdmin } from '@/lib/health-record/service';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAny(['patients', 'fieldStaff', 'consultations']);
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const date = body.date ? String(body.date).slice(0, 10) : undefined;
  const payload =
    body.payload && typeof body.payload === 'object'
      ? (body.payload as Record<string, unknown>)
      : undefined;

  if (!payload && !date) return jsonError('دادهٔ ویرایش خالی است.');

  try {
    const item = await updateHealthEntryForAdmin({
      entryId: id,
      payload,
      date,
      editorAdminId: auth.session.userId,
    });
    return NextResponse.json({ item });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'ویرایش ناموفق', 400);
  }
}
import { jsonError } from '@/lib/auth/api-utils';
import { generateCommerceId } from '@/lib/commerce/mappers';
import { saveHealthRecordAttachment } from '@/lib/content/save-upload';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

function parseKind(raw: FormDataEntryValue | null): 'contract' | 'cheque' | null {
  const k = String(raw || '').trim();
  if (k === 'contract' || k === 'cheque') return k;
  return null;
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireAdmin('installments');
  if (auth.error) return auth.error;

  const { id: planId } = await ctx.params;
  const plan = await prisma.installmentPlan.findFirst({
    where: { id: planId, deletedAt: null },
  });
  if (!plan) return jsonError('طرح اقساط یافت نشد.', 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('درخواست نامعتبر است.', 400);
  }

  const kind = parseKind(form.get('kind'));
  if (!kind) return jsonError('نوع فایل (قرارداد یا چک) الزامی است.');

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return jsonError('فایل انتخاب نشده است.', 400);
  }

  try {
    const uploaded = await saveHealthRecordAttachment(file);
    const row = await prisma.installmentPlanDocument.create({
      data: {
        id: generateCommerceId(),
        planId,
        kind,
        path: uploaded.path,
        mimeType: file.type || 'application/octet-stream',
        originalName: file.name || 'upload',
        createdByAdminId: auth.session.userId,
      },
    });
    return NextResponse.json(
      {
        item: {
          id: row.id,
          kind: row.kind,
          path: row.path,
          mimeType: row.mimeType,
          originalName: row.originalName,
          createdAt: row.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return prismaRouteError(e, 'installments/documents POST');
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireAdmin('installments');
  if (auth.error) return auth.error;

  const { id: planId } = await ctx.params;
  const docId = new URL(request.url).searchParams.get('docId')?.trim();
  if (!docId) return jsonError('شناسه فایل الزامی است.');

  const row = await prisma.installmentPlanDocument.findFirst({
    where: { id: docId, planId },
  });
  if (!row) return jsonError('فایل یافت نشد.', 404);

  await prisma.installmentPlanDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}

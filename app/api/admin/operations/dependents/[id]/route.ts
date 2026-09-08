import { jsonError, parseJson } from '@/lib/auth/api-utils';
import { requireAdmin } from '@/lib/content/require-admin';
import { mapDependent } from '@/lib/dependents';
import { clampFranchisePercent } from '@/lib/patient';
import { prisma } from '@/lib/prisma';
import { isUniqueViolation } from '@/lib/prisma/route-error';
import {
  FILE_NUMBER_INVALID_MESSAGE,
  isValidFileNumber,
  normalizeFileNumber,
} from '@/lib/validation/file-number';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin('patients');
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const row = await prisma.dependent.findUnique({ where: { id } });
  if (!row || row.deletedAt) return jsonError('فرد تحت تکفل یافت نشد.', 404);

  const body = await parseJson<{
    fileNumber?: string | null;
    franchisePercent?: number;
  }>(request);
  if (!body) return jsonError('درخواست نامعتبر است.');

  const data: { fileNumber?: string | null; franchisePercent?: number } = {};
  if (body.fileNumber !== undefined) {
    const raw = normalizeFileNumber(body.fileNumber);
    if (!raw) data.fileNumber = null;
    else if (!isValidFileNumber(raw)) {
      return jsonError(FILE_NUMBER_INVALID_MESSAGE);
    } else {
      data.fileNumber = raw;
    }
  }
  if (body.franchisePercent !== undefined) {
    data.franchisePercent = clampFranchisePercent(body.franchisePercent);
  }
  if (!Object.keys(data).length) {
    return jsonError('هیچ فیلدی برای به‌روزرسانی ارسال نشده است.');
  }

  try {
    const updated = await prisma.dependent.update({ where: { id }, data });
    return NextResponse.json({ item: mapDependent(updated) });
  } catch (e) {
    if (isUniqueViolation(e, 'fileNumber')) {
      return jsonError('این شماره پرونده قبلاً ثبت شده است.', 409);
    }
    throw e;
  }
}

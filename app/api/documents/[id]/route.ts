import { jsonError } from '@/lib/auth/api-utils';
import { getAdminSession } from '@/lib/auth/session';
import { buildAdminSession } from '@/lib/auth/admin-db';
import { getPrivateUploadDir } from '@/lib/loan-documents/storage';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const row = await prisma.loanDocument.findUnique({ where: { id } });
  if (!row || row.deletedAt) return jsonError('مدرک یافت نشد.', 404);

  const patient = await optionalPatient();
  const patientPhone = patient ? normalizePhoneDigits(patient.phone) : '';
  const isOwner = Boolean(patientPhone && patientPhone === row.phone);

  const adminPayload = await getAdminSession();
  const admin = adminPayload ? await buildAdminSession(adminPayload.adminUserId) : null;
  const isAdmin = Boolean(
    admin &&
      (admin.permissions.includes('memberships') || admin.roleId === 'superadmin'),
  );

  if (!isOwner && !isAdmin) {
    return jsonError('دسترسی ندارید.', 403);
  }

  const filename = row.storagePath;
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return jsonError('مدرک یافت نشد.', 404);
  }

  try {
    const buf = await readFile(path.join(getPrivateUploadDir(), filename));
    const download = new URL(request.url).searchParams.get('download') === '1';
    return new NextResponse(buf, {
      headers: {
        'Content-Type': row.mime || 'application/octet-stream',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(row.filename)}"`,
      },
    });
  } catch {
    return jsonError('فایل یافت نشد.', 404);
  }
}

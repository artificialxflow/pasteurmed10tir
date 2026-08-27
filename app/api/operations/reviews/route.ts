import { jsonError } from '@/lib/auth/api-utils';
import { generateOperationId, mapDoctorReview } from '@/lib/operations/mappers';
import { normalizePhoneDigits } from '@/lib/operations/phone';
import { optionalPatient } from '@/lib/operations/require-patient';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function mapPublicReview(row: {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorKind: string;
  rating: number;
  comment: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    doctorId: row.doctorId,
    doctorName: row.doctorName,
    doctorKind: row.doctorKind as 'dental' | 'medical',
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const doctorId = new URL(request.url).searchParams.get('doctorId')?.trim();
  if (!doctorId) return jsonError('شناسه پزشک الزامی است.');

  const rows = await prisma.doctorReview.findMany({
    where: { doctorId, status: 'approved' },
    orderBy: { createdAt: 'desc' },
  });

  const avg =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length
      : 0;

  return NextResponse.json({
    items: rows.map(mapPublicReview),
    stats: { avg, count: rows.length },
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('درخواست نامعتبر است.');
  }

  const patientPhone = normalizePhoneDigits(String(body.phone || ''));
  const comment = String(body.comment || '').trim();
  const doctorName = String(body.doctorName || '').trim();
  const doctorId = body.doctorId != null ? String(body.doctorId) : '';

  if (!patientPhone || !comment || !doctorName || !doctorId) {
    return jsonError('اطلاعات نظر ناقص است.');
  }

  const session = await optionalPatient();
  const userId =
    session && normalizePhoneDigits(session.phone) === patientPhone
      ? session.userId
      : null;

  const row = await prisma.doctorReview.create({
    data: {
      id: generateOperationId(),
      userId,
      patientPhone,
      doctorId,
      doctorName,
      doctorKind: String(body.doctorKind || 'dental'),
      rating: Math.min(5, Math.max(1, Number(body.rating || 5))),
      comment,
      status: 'pending',
    },
  });

  return NextResponse.json({ item: mapDoctorReview(row) }, { status: 201 });
}

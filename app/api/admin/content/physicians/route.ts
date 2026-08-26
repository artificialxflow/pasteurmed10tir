import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  mapPhysician,
  normalizePhysicianBody,
  type PhysicianBody,
} from '@/lib/content/doctor-mappers';
import { assignIntIds } from '@/lib/content/int-id';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('doctors');
  if (auth.error) return auth.error;
  const items = await prisma.physician.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  return NextResponse.json({ items: items.map(mapPhysician) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('doctors');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: PhysicianBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = assignIntIds(
    body.items
      .map((item) => normalizePhysicianBody(item))
      .filter((item) => item.name),
  );

  await prisma.$transaction([
    prisma.physician.deleteMany(),
    ...cleaned.map((item, index) =>
      prisma.physician.create({
        data: {
          id: item.id,
          name: item.name,
          specialty: item.specialty,
          specialtyId: item.specialtyId || null,
          medicalCouncilNumber: item.medicalCouncilNumber || '',
          image: item.image,
          days: item.days,
          status: item.status || 'available',
          sortOrder: index,
        },
      }),
    ),
  ]);

  return NextResponse.json({ items: cleaned });
}

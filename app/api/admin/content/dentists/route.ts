import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  dentistToDbInput,
  mapDentist,
  normalizeDentistBody,
  type DentistBody,
} from '@/lib/content/doctor-mappers';
import { assignIntIds } from '@/lib/content/int-id';
import { requireAdmin } from '@/lib/content/require-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('doctors');
  if (auth.error) return auth.error;
  const items = await prisma.dentist.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  return NextResponse.json({ items: items.map(mapDentist) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin('doctors');
  if (auth.error) return auth.error;

  const body = await parseJson<{ items?: DentistBody[] }>(request);
  if (!body?.items) return jsonError('درخواست نامعتبر است.');

  const cleaned = assignIntIds(
    body.items
      .map((item) => normalizeDentistBody(item))
      .filter((item) => item.name),
  );

  await prisma.$transaction([
    prisma.dentist.deleteMany(),
    ...cleaned.map((item, index) =>
      prisma.dentist.create({ data: dentistToDbInput(item, index) }),
    ),
  ]);

  return NextResponse.json({ items: cleaned });
}

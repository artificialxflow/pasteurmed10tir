import { jsonError, parseJson } from '@/lib/auth/api-utils';
import {
  dentistToDbInput,
  mapDentist,
  normalizeDentistBody,
  type DentistBody,
} from '@/lib/content/doctor-mappers';
import { assignIntIds } from '@/lib/content/int-id';
import { ensureDefaultDentists } from '@/lib/content/ensure-dentists';
import { requireAdmin } from '@/lib/content/require-admin';
import { prismaRouteError } from '@/lib/prisma/route-error';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await requireAdmin('doctors');
  if (auth.error) return auth.error;

  try {
    await ensureDefaultDentists();
    const items = await prisma.dentist.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return NextResponse.json({ items: items.map(mapDentist) });
  } catch (e) {
    return prismaRouteError(e, 'admin/dentists GET');
  }
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

  if (cleaned.length === 0) {
    return jsonError('حداقل یک دندانپزشک باید ثبت شود. حذف همهٔ پزشکان مجاز نیست.');
  }

  try {
    await prisma.$transaction([
      prisma.dentist.deleteMany(),
      ...cleaned.map((item, index) =>
        prisma.dentist.create({ data: dentistToDbInput(item, index) }),
      ),
    ]);
    return NextResponse.json({ items: cleaned });
  } catch (e) {
    return prismaRouteError(e, 'admin/dentists PUT');
  }
}

import type { FollowUpServiceCategory } from '@prisma/client';
import { FOLLOW_UP_SERVICE_OPTIONS } from '@/lib/follow-up/types';
import { prisma } from '@/lib/prisma';

export function parseFollowUpServiceCategory(
  raw: string | null,
): FollowUpServiceCategory | 'all' {
  if (raw && FOLLOW_UP_SERVICE_OPTIONS.some((o) => o.id === raw)) {
    return raw as FollowUpServiceCategory;
  }
  return 'all';
}

/** Names from admin dentist / physician lists for follow-up forms. */
export async function listFollowUpDoctorNames(
  serviceCategory: FollowUpServiceCategory | 'all',
): Promise<string[]> {
  if (serviceCategory === 'dental') {
    const rows = await prisma.dentist.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { name: true },
    });
    return rows.map((r) => r.name.trim()).filter(Boolean);
  }
  if (serviceCategory === 'medical') {
    const rows = await prisma.physician.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { name: true },
    });
    return rows.map((r) => r.name.trim()).filter(Boolean);
  }
  if (serviceCategory === 'all') {
    const [dentists, physicians] = await Promise.all([
      prisma.dentist.findMany({ orderBy: { sortOrder: 'asc' }, select: { name: true } }),
      prisma.physician.findMany({ orderBy: { sortOrder: 'asc' }, select: { name: true } }),
    ]);
    const unique = new Set<string>();
    for (const row of [...dentists, ...physicians]) {
      const name = row.name.trim();
      if (name) unique.add(name);
    }
    return [...unique].sort((a, b) => a.localeCompare(b, 'fa'));
  }
  return [];
}

export function followUpCategoryUsesDoctorPicklist(
  category: FollowUpServiceCategory | 'all',
): boolean {
  return category === 'dental' || category === 'medical' || category === 'all';
}

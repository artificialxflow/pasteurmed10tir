import { prisma } from '@/lib/prisma';

export type SpecialistPickOption = {
  id: string;
  name: string;
  specialty: string;
  kind: 'dentist' | 'physician';
};

export async function listSpecialistPickOptions(): Promise<SpecialistPickOption[]> {
  const [dentists, physicians] = await Promise.all([
    prisma.dentist.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, specialty: true } }),
    prisma.physician.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, specialty: true } }),
  ]);
  const items: SpecialistPickOption[] = [
    ...dentists.map((d) => ({
      id: `dentist:${d.id}`,
      name: d.name,
      specialty: d.specialty || 'دندانپزشکی',
      kind: 'dentist' as const,
    })),
    ...physicians.map((p) => ({
      id: `physician:${p.id}`,
      name: p.name,
      specialty: p.specialty || 'پزشکی',
      kind: 'physician' as const,
    })),
  ];
  return items.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
}

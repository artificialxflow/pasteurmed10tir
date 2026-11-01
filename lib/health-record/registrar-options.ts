import { prisma } from '@/lib/prisma';

export type HealthRecordRegistrarOption = { id: string; name: string };

/** پرسنل اورژانس + پزشکان + دندانپزشکان — برای انتخاب ثبت‌کننده در پرونده سلامت */
export async function listHealthRecordRegistrarOptions(): Promise<HealthRecordRegistrarOption[]> {
  const [emergency, physicians, dentists] = await Promise.all([
    prisma.emergencyPhysician.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.physician.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.dentist.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);

  const seen = new Set<string>();
  const items: HealthRecordRegistrarOption[] = [];

  const add = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = trimmed.replace(/\s+/g, ' ');
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ id, name: trimmed });
  };

  for (const row of emergency) add(`ep:${row.id}`, row.name);
  for (const row of physicians) add(`physician:${row.id}`, row.name);
  for (const row of dentists) add(`dentist:${row.id}`, row.name);

  return items;
}

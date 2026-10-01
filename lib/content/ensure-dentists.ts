import { dentistToDbInput, normalizeDentistBody } from '@/lib/content/doctor-mappers';
import { PASTEUR_DATA } from '@/lib/data';
import { prisma } from '@/lib/prisma';

const PROSTHETICS_SPECIALTY_ID = 'cosmetic';

/** Keep specialty display name in sync when catalog label changes. */
async function syncProstheticsSpecialtyLabel(): Promise<void> {
  const label =
    PASTEUR_DATA.dentalSpecialties.find((s) => s.id === PROSTHETICS_SPECIALTY_ID)?.name ||
    'متخصص پروتز (روکش ایمپلنت و..)';
  await prisma.dentist.updateMany({
    where: {
      specialtyId: PROSTHETICS_SPECIALTY_ID,
      NOT: { specialty: label },
    },
    data: { specialty: label },
  });
}

/** Restore bundled default dentists when the table is empty (e.g. after accidental admin wipe). */
export async function ensureDefaultDentists(): Promise<boolean> {
  const count = await prisma.dentist.count();
  if (count > 0) {
    await syncProstheticsSpecialtyLabel();
    return false;
  }

  for (let di = 0; di < PASTEUR_DATA.dentists.length; di++) {
    const d = PASTEUR_DATA.dentists[di];
    const normalized = normalizeDentistBody({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      specialtyId: d.specialtyId,
      image: d.image,
      days: [...d.days],
      hours: d.hours,
      status: d.status,
      schedule: d.schedule,
    });
    await prisma.dentist.create({
      data: {
        ...dentistToDbInput(normalized, di),
        image: normalized.image || '/uploads/placeholder.svg',
      },
    });
  }

  await syncProstheticsSpecialtyLabel();
  return true;
}

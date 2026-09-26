import { mapMembershipPlan } from '@/lib/commerce/mappers';
import { PASTEUR_DATA, type Membership } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export async function loadMembershipPlansFromDb(): Promise<Membership[]> {
  const rows = await prisma.membershipPlan.findMany({ orderBy: { sortOrder: 'asc' } });
  const filtered = rows.filter((m) => m.id === 'regular' || m.id === 'vip');
  if (filtered.length) {
    return filtered.map((row) => {
      const mapped = mapMembershipPlan(row);
      return { ...mapped, features: [...mapped.features] };
    });
  }
  return PASTEUR_DATA.memberships
    .filter((m) => m.id === 'regular' || m.id === 'vip')
    .map((m) => ({ ...m, features: [...m.features] }));
}

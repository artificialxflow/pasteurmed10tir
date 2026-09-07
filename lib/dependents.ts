export const DEPENDENT_MAX = 10;

export const DEPENDENT_RELATIONS = ['child', 'spouse', 'parent', 'other'] as const;
export type DependentRelation = (typeof DEPENDENT_RELATIONS)[number];

export const DEPENDENT_RELATION_LABELS: Record<DependentRelation, string> = {
  child: 'فرزند',
  spouse: 'همسر',
  parent: 'والد',
  other: 'سایر',
};

import { prisma } from '@/lib/prisma';

export async function resolveOwnedDependent(
  userId: string | undefined | null,
  dependentId?: string | null,
) {
  if (!userId || !dependentId) return null;
  return prisma.dependent.findFirst({
    where: { id: dependentId, guardianUserId: userId, deletedAt: null },
  });
}

export function mapDependent(row: {
  id: string;
  name: string;
  nationalId: string | null;
  birthDate: Date | null;
  relation: string;
  fileNumber: string | null;
  franchisePercent: number;
  baseInsuranceId: string | null;
  complementaryInsuranceId: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    nationalId: row.nationalId ?? undefined,
    birthDate: row.birthDate?.toISOString().slice(0, 10),
    relation: row.relation,
    fileNumber: row.fileNumber ?? undefined,
    franchisePercent: row.franchisePercent,
    baseInsuranceId: row.baseInsuranceId ?? undefined,
    complementaryInsuranceId: row.complementaryInsuranceId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

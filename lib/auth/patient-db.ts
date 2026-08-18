import type { PatientProfile, PatientStatus } from '@/lib/patient';
import { DEFAULT_FRANCHISE_PERCENT } from '@/lib/patient';
import type { PatientProfile as DbPatientProfile, User } from '@prisma/client';

type UserWithProfile = User & { profile: DbPatientProfile | null };

export function mapDbToPatientProfile(user: UserWithProfile): PatientProfile {
  const profile = user.profile;
  return {
    phone: user.phone,
    name: user.name,
    nationalId: profile?.nationalId ?? undefined,
    baseInsuranceId: profile?.baseInsuranceId ?? undefined,
    complementaryInsuranceId: profile?.complementaryInsuranceId ?? undefined,
    franchisePercent: profile?.franchisePercent ?? DEFAULT_FRANCHISE_PERCENT,
    status: (profile?.status ?? 'pending') as PatientStatus,
    reviewedAt: profile?.reviewedAt?.toISOString(),
    reviewNote: profile?.reviewNote ?? undefined,
    zohalStatus: (profile?.zohalStatus as PatientProfile['zohalStatus']) ?? undefined,
    shahkarMatched: profile?.shahkarMatched ?? undefined,
    zohalCheckedAt: profile?.zohalCheckedAt?.toISOString(),
    createdAt: profile?.createdAt.toISOString() ?? user.createdAt.toISOString(),
    updatedAt: profile?.updatedAt.toISOString() ?? user.updatedAt.toISOString(),
  };
}

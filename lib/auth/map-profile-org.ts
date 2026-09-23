import { findMemberOrganizationName, getOrganizationForUser } from '@/lib/org/service';
import { mapDbToPatientProfile } from '@/lib/auth/patient-db';
import type { PatientProfile } from '@/lib/patient';
import type { Dependent, PatientProfile as DbPatientProfile, User } from '@prisma/client';

type UserWithProfile = User & {
  profile: DbPatientProfile | null;
  dependents?: Dependent[];
};

export async function mapUserProfileWithOrg(user: UserWithProfile): Promise<PatientProfile> {
  const org = await getOrganizationForUser(user.id);
  const memberOrgName = org?.name || (await findMemberOrganizationName(user.phone));
  return mapDbToPatientProfile(user, {
    organizationName: memberOrgName,
    isOrganizationRep: Boolean(org),
  });
}

import { prisma } from '@/lib/prisma';

export const NOT_DELETED = { deletedAt: null } as const;

export class SoftDeleteError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = 'SoftDeleteError';
  }
}

export type SoftDeleteActor = {
  username?: string;
  displayName?: string;
};

export type SoftDeleteResult = {
  id: string;
  cascadedPlans: number;
  paidAmount: number;
};

function actorLabel(actor?: SoftDeleteActor): string | null {
  const name = actor?.displayName?.trim() || actor?.username?.trim();
  return name || null;
}

function stamp(actor?: SoftDeleteActor, note?: string) {
  const now = new Date();
  return {
    deletedAt: now,
    deletedBy: actorLabel(actor),
    deleteNote: note?.trim() || null,
  };
}

export async function softDeleteInstallmentPlan(
  planId: string,
  actor?: SoftDeleteActor,
  note?: string,
): Promise<SoftDeleteResult> {
  const plan = await prisma.installmentPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.deletedAt) {
    throw new SoftDeleteError('طرح اقساط یافت نشد.', 404);
  }

  await prisma.installmentPlan.update({
    where: { id: planId },
    data: stamp(actor, note),
  });

  return { id: planId, cascadedPlans: 0, paidAmount: plan.paidAmount };
}

export async function softDeleteMembershipApplication(
  id: string,
  actor?: SoftDeleteActor,
  note?: string,
): Promise<SoftDeleteResult> {
  const row = await prisma.membershipApplication.findUnique({ where: { id } });
  if (!row || row.deletedAt) {
    throw new SoftDeleteError('درخواست وام یافت نشد.', 404);
  }

  const linked = await prisma.installmentPlan.findMany({
    where: { linkedRequestId: id, deletedAt: null },
    select: { paidAmount: true },
  });
  const data = stamp(actor, note);
  const cascadeNote = note?.trim() || 'حذف همراه با درخواست وام';

  await prisma.$transaction([
    prisma.installmentPlan.updateMany({
      where: { linkedRequestId: id, deletedAt: null },
      data: { ...data, deleteNote: cascadeNote },
    }),
    prisma.membershipApplication.update({
      where: { id },
      data,
    }),
  ]);

  return {
    id,
    cascadedPlans: linked.length,
    paidAmount: linked.reduce((sum, p) => sum + p.paidAmount, 0),
  };
}

export async function softDeleteFacilityRequest(
  id: string,
  actor?: SoftDeleteActor,
  note?: string,
): Promise<SoftDeleteResult> {
  const row = await prisma.facilityRequest.findUnique({ where: { id } });
  if (!row || row.deletedAt) {
    throw new SoftDeleteError('درخواست تسهیلات یافت نشد.', 404);
  }

  const linked = await prisma.installmentPlan.findMany({
    where: { linkedRequestId: id, deletedAt: null },
    select: { paidAmount: true },
  });
  const data = stamp(actor, note);
  const cascadeNote = note?.trim() || 'حذف همراه با درخواست تسهیلات';

  await prisma.$transaction([
    prisma.installmentPlan.updateMany({
      where: { linkedRequestId: id, deletedAt: null },
      data: { ...data, deleteNote: cascadeNote },
    }),
    prisma.facilityRequest.update({
      where: { id },
      data,
    }),
  ]);

  return {
    id,
    cascadedPlans: linked.length,
    paidAmount: linked.reduce((sum, p) => sum + p.paidAmount, 0),
  };
}

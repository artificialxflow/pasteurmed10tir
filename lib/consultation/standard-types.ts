import type { ConsultationType } from '@/lib/data';

/** انواع فعال در فرم و API عمومی (بدون آرشیو image). */
export const CONSULTATION_STANDARD_TYPE_IDS = ['text', 'phone', 'video', 'emergency'] as const;

export type ConsultationStandardTypeId = (typeof CONSULTATION_STANDARD_TYPE_IDS)[number];

export function isStandardConsultationTypeId(id: string): boolean {
  return (CONSULTATION_STANDARD_TYPE_IDS as readonly string[]).includes(id);
}

type ConsultationTypeLike = {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  priceNum?: number | null;
  price?: string | null;
};

export function filterStandardConsultationTypes(
  types: ConsultationTypeLike[],
): ConsultationType[] {
  const byId = new Map(types.map((t) => [t.id, t]));
  return CONSULTATION_STANDARD_TYPE_IDS.map((id) => byId.get(id))
    .filter((t): t is ConsultationTypeLike => Boolean(t))
    .map((t) => ({
      id: t.id,
      label: t.label,
      emoji: t.emoji,
      desc: t.desc,
      priceNum: t.priceNum ?? undefined,
      price: t.price ?? undefined,
    }));
}

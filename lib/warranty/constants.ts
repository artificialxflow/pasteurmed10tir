import type { ServiceWarrantyType } from '@prisma/client';

export const WARRANTY_DURATION_MONTHS: Record<ServiceWarrantyType, number> = {
  root_canal: 6,
  crown: 12,
  implant: 60,
  laminate_composite: 24,
  denture: 24,
  orthodontics: 24,
};

export const WARRANTY_TYPE_LABELS: Record<ServiceWarrantyType, string> = {
  root_canal: 'ترمیم و درمان ریشه',
  crown: 'روکش',
  implant: 'ایمپلنت',
  laminate_composite: 'لمینت و کامپوزیت',
  denture: 'دندان مصنوعی',
  orthodontics: 'ارتودنسی',
};

export function warrantyExpiresAt(startedAt: Date, type: ServiceWarrantyType): Date {
  const months = WARRANTY_DURATION_MONTHS[type];
  const out = new Date(startedAt);
  out.setMonth(out.getMonth() + months);
  return out;
}

export const WARRANTY_CARD_THEME: Record<
  ServiceWarrantyType,
  { border: string; bg: string; accent: string }
> = {
  root_canal: {
    border: "border-sky-200",
    bg: "bg-sky-50/80",
    accent: "text-sky-900",
  },
  crown: {
    border: "border-violet-200",
    bg: "bg-violet-50/80",
    accent: "text-violet-900",
  },
  implant: {
    border: "border-slate-300",
    bg: "bg-slate-100/90",
    accent: "text-slate-900",
  },
  laminate_composite: {
    border: "border-pink-200",
    bg: "bg-pink-50/80",
    accent: "text-pink-900",
  },
  denture: {
    border: "border-amber-200",
    bg: "bg-amber-50/80",
    accent: "text-amber-900",
  },
  orthodontics: {
    border: "border-teal-200",
    bg: "bg-teal-50/80",
    accent: "text-teal-900",
  },
};

export const WARRANTY_TYPE_OPTIONS = Object.entries(WARRANTY_TYPE_LABELS).map(([id, label]) => ({
  id,
  label,
}));
import { PASTEUR_DATA, type SpecialtyTariffs } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

/** کلید رزرو‌شده داخل JSON تعرفه‌ها — ویزیت در منزل per-specialty */
export const HOME_VISIT_TARIFF_KEY = "__homeVisit";

export type HomeVisitTariffs = Record<string, number>;

export const DEFAULT_HOME_VISIT_TARIFFS: HomeVisitTariffs = {
  general: 500_000,
  cardiology: 700_000,
  pediatrics: 650_000,
  urology: 650_000,
  infectious: 600_000,
  internal: 600_000,
  surgery: 800_000,
  orthopedics: 700_000,
  dermatology: 650_000,
  neurology: 750_000,
  psychiatry: 700_000,
};

export function splitTariffStore(raw: SpecialtyTariffs): {
  specialtyTariffs: SpecialtyTariffs;
  homeVisitTariffs: HomeVisitTariffs;
} {
  const specialtyTariffs: SpecialtyTariffs = {};
  let homeVisitTariffs: HomeVisitTariffs = { ...DEFAULT_HOME_VISIT_TARIFFS };

  for (const [key, value] of Object.entries(raw || {})) {
    if (key === HOME_VISIT_TARIFF_KEY) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        homeVisitTariffs = {
          ...DEFAULT_HOME_VISIT_TARIFFS,
          ...(value as HomeVisitTariffs),
        };
      }
      continue;
    }
    specialtyTariffs[key] = value as SpecialtyTariffs[string];
  }

  return { specialtyTariffs, homeVisitTariffs };
}

export function mergeTariffStore(
  specialtyTariffs: SpecialtyTariffs,
  homeVisitTariffs: HomeVisitTariffs,
): SpecialtyTariffs {
  return {
    ...specialtyTariffs,
    [HOME_VISIT_TARIFF_KEY]: homeVisitTariffs,
  };
}

export function getHomeVisitPrice(
  homeVisitTariffs: HomeVisitTariffs,
  specialtyId: string,
): { amount: number; label: string } {
  const isGeneral = specialtyId === "general";
  const specialty = isGeneral
    ? { name: "پزشک عمومی" }
    : PASTEUR_DATA.medicalSpecialties.find((s) => String(s.id) === specialtyId);

  const amount =
    homeVisitTariffs[specialtyId] ??
    homeVisitTariffs.general ??
    DEFAULT_HOME_VISIT_TARIFFS[specialtyId] ??
    DEFAULT_HOME_VISIT_TARIFFS.general ??
    500_000;

  const name = isGeneral ? "پزشک عمومی" : specialty?.name || specialtyId;
  return {
    amount,
    label: `ویزیت در منزل — ${name}: ${formatPrice(amount)}`,
  };
}

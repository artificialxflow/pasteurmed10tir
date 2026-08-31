import {
  DEFAULT_HOME_VISIT_TARIFFS,
  HOME_VISIT_TARIFF_KEY,
  type HomeVisitTariffs,
} from './consultation/home-visit';
import {
  PASTEUR_DATA,
  type ConsultationCategory,
  type ConsultationType,
  type SpecialtyTariffs,
} from './data';
import { formatPrice } from './utils';

export type ConsultationPriceInput = {
  specialtyId?: string | null;
  specialtyName?: string | null;
  typeId?: string | null;
  categoryId?: string | null;
};

export type ConsultationPriceSource = 'tariff' | 'type' | 'category';

export type ConsultationPriceResult = {
  amount: number;
  source: ConsultationPriceSource;
  label: string;
};

type ConsultationPricingCache = {
  consultationTypes: ConsultationType[];
  specialtyTariffs: SpecialtyTariffs;
  homeVisitTariffs: HomeVisitTariffs;
};

let pricingCache: ConsultationPricingCache | null = null;

const GENERAL_TARIFF_KEY = 'general';

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function parseEstimateMin(estimate: string): number | null {
  const match = normalizeDigits(estimate).match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getCategoryFallback(categoryId?: string | null): ConsultationCategory | undefined {
  return PASTEUR_DATA.consultationCategories.find((category) => category.id === categoryId);
}

function isGeneralMedicineCategory(input: ConsultationPriceInput): boolean {
  if (input.categoryId === 'medical') return true;
  if (input.specialtyId === GENERAL_TARIFF_KEY) return true;
  return false;
}

function buildPreviewLabel(
  amount: number,
  type?: ConsultationType,
  specialtyName?: string | null,
  category?: ConsultationCategory,
): string {
  const price = formatPrice(amount);
  if (specialtyName && type) {
    return `متخصص ${specialtyName} — ${type.label}: ${price}`;
  }
  if (type && category?.id === 'medical') {
    return `پزشکی عمومی — ${type.label}: ${price}`;
  }
  if (type) {
    return `${type.label}: ${price}`;
  }
  if (category) {
    return `${category.service}: ${price}`;
  }
  return price;
}

export async function loadConsultationPricing(): Promise<ConsultationPricingCache> {
  if (pricingCache) return pricingCache;
  const { fetchPublic } = await import('./content/client');
  const data = await fetchPublic<{
    consultationTypes: ConsultationType[];
    specialtyTariffs: SpecialtyTariffs;
    homeVisitTariffs?: HomeVisitTariffs;
  }>('/api/content/consultation-pricing');
  pricingCache = {
    consultationTypes: data.consultationTypes.map((type) => ({ ...type })),
    specialtyTariffs: { ...data.specialtyTariffs },
    homeVisitTariffs: {
      ...DEFAULT_HOME_VISIT_TARIFFS,
      ...(data.homeVisitTariffs || {}),
    },
  };
  return pricingCache;
}

export function getConsultationTypes(): ConsultationType[] {
  return pricingCache?.consultationTypes ?? [];
}

export function getSpecialtyTariffs(): SpecialtyTariffs {
  const raw = pricingCache?.specialtyTariffs ?? {};
  const filtered: SpecialtyTariffs = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === HOME_VISIT_TARIFF_KEY) continue;
    filtered[key] = value;
  }
  return filtered;
}

export function getHomeVisitTariffs(): HomeVisitTariffs {
  return pricingCache?.homeVisitTariffs ?? { ...DEFAULT_HOME_VISIT_TARIFFS };
}

export function getTypePrice(typeId?: string | null): number | null {
  if (!typeId) return null;
  const type = getConsultationTypes().find((item) => item.id === typeId);
  return type?.priceNum ?? null;
}

export function getConsultationPrice(input: ConsultationPriceInput): ConsultationPriceResult {
  const { specialtyId, specialtyName, typeId, categoryId } = input;
  const types = getConsultationTypes();
  const tariffs = getSpecialtyTariffs();
  const type = types.find((item) => item.id === typeId);
  const category = getCategoryFallback(categoryId);

  if (isGeneralMedicineCategory(input) && typeId) {
    const generalAmount = tariffs[GENERAL_TARIFF_KEY]?.[typeId];
    if (generalAmount) {
      return {
        amount: generalAmount,
        source: 'tariff',
        label: buildPreviewLabel(generalAmount, type, null, category),
      };
    }
  }

  if (specialtyId && specialtyId !== GENERAL_TARIFF_KEY && typeId) {
    const tariffAmount = tariffs[specialtyId]?.[typeId];
    if (tariffAmount) {
      return {
        amount: tariffAmount,
        source: 'tariff',
        label: buildPreviewLabel(tariffAmount, type, specialtyName, category),
      };
    }
  }

  if (type?.priceNum) {
    return {
      amount: type.priceNum,
      source: 'type',
      label: buildPreviewLabel(type.priceNum, type, specialtyName, category),
    };
  }

  const categoryAmount =
    category?.estimateMin ?? (category ? parseEstimateMin(category.estimate) : null) ?? 0;

  return {
    amount: categoryAmount,
    source: 'category',
    label: buildPreviewLabel(categoryAmount, type, specialtyName, category),
  };
}

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
};

let pricingCache: ConsultationPricingCache | null = null;

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
  const data = await fetchPublic<ConsultationPricingCache>('/api/content/consultation-pricing');
  pricingCache = {
    consultationTypes: data.consultationTypes.map((type) => ({ ...type })),
    specialtyTariffs: { ...data.specialtyTariffs },
  };
  return pricingCache;
}

export function getConsultationTypes(): ConsultationType[] {
  return pricingCache?.consultationTypes ?? [];
}

export function getSpecialtyTariffs(): SpecialtyTariffs {
  return pricingCache?.specialtyTariffs ?? {};
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

  if (specialtyId && typeId) {
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

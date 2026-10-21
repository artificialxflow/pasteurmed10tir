import {
  PASTEUR_DATA,
  type ConsultationCategory,
  type ConsultationType,
  type SpecialtyTariffs,
} from '@/lib/data';
import { tariffLookupKeys } from '@/lib/consultation/type-id';
import {
  type ConsultationPriceInput,
  type ConsultationPriceResult,
} from '@/lib/consultationPrice';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';

const GENERAL_TARIFF_KEY = 'general';

function isGeneralMedicineCategory(input: ConsultationPriceInput): boolean {
  if (input.categoryId === 'medical') return true;
  if (input.specialtyId === GENERAL_TARIFF_KEY) return true;
  return false;
}

function getCategoryFallback(categoryId?: string | null): ConsultationCategory | undefined {
  return PASTEUR_DATA.consultationCategories.find((category) => category.id === categoryId);
}

function parseEstimateMin(estimate: string): number | null {
  const match = estimate.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function buildPreviewLabel(
  amount: number,
  type?: ConsultationType,
  specialtyName?: string | null,
  category?: ConsultationCategory,
): string {
  const price = formatPrice(amount);
  if (specialtyName && type) return `متخصص ${specialtyName} — ${type.label}: ${price}`;
  if (type && category?.id === 'medical') return `پزشکی عمومی — ${type.label}: ${price}`;
  if (type) return `${type.label}: ${price}`;
  if (category) return `${category.service}: ${price}`;
  return price;
}

export async function resolveConsultationPriceServer(
  input: ConsultationPriceInput,
): Promise<ConsultationPriceResult> {
  const types = await prisma.consultationType.findMany();
  const tariffRow = await prisma.specialtyTariff.findUnique({ where: { id: 'default' } });
  const tariffs = (tariffRow?.tariffs as SpecialtyTariffs) || {};

  const { specialtyId, specialtyName, typeId, categoryId } = input;
  const normalizedId = typeId ? tariffLookupKeys(typeId)[0] : '';
  const type =
    types.find((item) => item.id === typeId) ||
    types.find((item) => item.id === normalizedId) ||
    types.find((item) => item.id === 'image' && normalizedId === 'video');
  const category = getCategoryFallback(categoryId);
  const priceTypeKeys = typeId ? tariffLookupKeys(typeId) : [];

  const typeMapped: ConsultationType | undefined = type
    ? {
        id: type.id,
        label: type.label,
        emoji: type.emoji,
        desc: type.desc,
        priceNum: type.priceNum ?? undefined,
        price: type.price ?? undefined,
      }
    : undefined;

  if (isGeneralMedicineCategory(input) && priceTypeKeys.length) {
    const row = tariffs[GENERAL_TARIFF_KEY];
    let generalTariff: number | undefined;
    for (const key of priceTypeKeys) {
      const v = row?.[key];
      if (v) {
        generalTariff = v;
        break;
      }
    }
    const typeAmount = type?.priceNum && type.priceNum > 0 ? type.priceNum : undefined;
    const generalAmount = typeAmount ?? generalTariff;
    if (generalAmount) {
      return {
        amount: generalAmount,
        source: typeAmount ? 'type' : 'tariff',
        label: buildPreviewLabel(generalAmount, typeMapped, null, category),
      };
    }
  }

  if (specialtyId && specialtyId !== GENERAL_TARIFF_KEY && priceTypeKeys.length) {
    let tariffAmount: number | undefined;
    for (const key of priceTypeKeys) {
      const v = tariffs[specialtyId]?.[key];
      if (v) {
        tariffAmount = v;
        break;
      }
    }
    if (tariffAmount) {
      return {
        amount: tariffAmount,
        source: 'tariff',
        label: buildPreviewLabel(tariffAmount, typeMapped, specialtyName, category),
      };
    }
  }

  if (type?.priceNum) {
    return {
      amount: type.priceNum,
      source: 'type',
      label: buildPreviewLabel(type.priceNum, typeMapped, specialtyName, category),
    };
  }

  const categoryAmount =
    category?.estimateMin ?? (category ? parseEstimateMin(category.estimate) : null) ?? 0;

  return {
    amount: categoryAmount,
    source: 'category',
    label: buildPreviewLabel(categoryAmount, typeMapped, specialtyName, category),
  };
}

export const CONSULTATION_AMOUNT_TOLERANCE_TOMAN = 50;

export function amountsMatchConsultationPrice(
  clientAmount: number,
  serverAmount: number,
): boolean {
  return Math.abs(Number(clientAmount) - Number(serverAmount)) <= CONSULTATION_AMOUNT_TOLERANCE_TOMAN;
}

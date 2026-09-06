export type DentalTariffItem = {
  id: string;
  title: string;
  priceNum: number;
  price?: string;
  unit?: string;
  active?: boolean;
};

export type DentalTariffCategory = {
  id: string;
  title: string;
  emoji: string;
  description?: string;
  active?: boolean;
  items?: DentalTariffItem[];
};

export function formatDentalTariffPrice(item: DentalTariffItem): string {
  if (item.price?.trim()) return item.price.trim();
  if (item.priceNum > 0) return `${item.priceNum.toLocaleString('fa-IR')} تومان`;
  return 'تماس بگیرید';
}

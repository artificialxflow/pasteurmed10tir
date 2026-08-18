const ADDRESS_KEY = 'pasteur_shop_delivery_address';

export function getSavedShopAddress(): string {
  if (typeof window === 'undefined') return '';
  return String(localStorage.getItem(ADDRESS_KEY) || '').trim();
}

export function saveShopAddress(address: string): void {
  if (typeof window === 'undefined') return;
  const value = String(address || '').trim();
  if (value) localStorage.setItem(ADDRESS_KEY, value);
}

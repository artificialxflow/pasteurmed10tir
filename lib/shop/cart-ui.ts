const FLASH_MS = 1400;

export function flashShopCartButton(): void {
  if (typeof window === 'undefined') return;
  const el = document.getElementById('shop-cart-button');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('shop-cart-flash');
  void el.offsetWidth;
  el.classList.add('shop-cart-flash');
  window.setTimeout(() => el.classList.remove('shop-cart-flash'), FLASH_MS);
}

export function scrollToAdminProductForm(): void {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => {
    document.getElementById('admin-product-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 50);
}

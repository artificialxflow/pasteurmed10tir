/**
 * فروشگاه تجهیزات — سبد و قیمت‌گذاری VIP
 */
import type { Product } from './data';
import { PasteurStorage, type ShopCartItem } from './storage';

const LAST_ORDER_TOTAL_KEY = 'pasteur_last_shop_order_total';

export const ShopCart = {
  getCustomerType(): string {
    return PasteurStorage.getShopCustomerType();
  },

  setCustomerType(type: string, phone = ''): void {
    PasteurStorage.setShopCustomerType(type, phone);
  },

  getVipPhone(): string {
    return PasteurStorage.getShopVipPhone();
  },

  getCart(): ShopCartItem[] {
    return PasteurStorage.getShopCart();
  },

  saveCart(cart: ShopCartItem[]): void {
    PasteurStorage.setShopCart(cart);
  },

  getCartCount(): number {
    return this.getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  },

  formatPrice(num?: number | null): string {
    return Number(num || 0).toLocaleString('fa-IR');
  },

  getProductPrice(product: Product): number {
    if (product.priceNum) return product.priceNum;
    const normalized = String(product.price || '')
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    return Number(normalized.replace(/[^\d]/g, '')) || 0;
  },

  getFinalProductPrice(product: Product): number {
    const price = this.getProductPrice(product);
    return this.getCustomerType() === 'vip' ? Math.round(price * 0.98) : price;
  },

  getCartTotals(): { subtotal: number; total: number; count: number } {
    PasteurStorage.initProductsIfNeeded();
    const products = PasteurStorage.getProducts();
    return this.getCart().reduce(
      (totals, item) => {
        const product = products.find((p) => String(p.id) === String(item.id));
        if (!product) return totals;
        const price = this.getProductPrice(product);
        const finalPrice = this.getFinalProductPrice(product);
        totals.subtotal += price * item.qty;
        totals.total += finalPrice * item.qty;
        totals.count += item.qty;
        return totals;
      },
      { subtotal: 0, total: 0, count: 0 },
    );
  },

  addToCart(productId: string | number): boolean {
    PasteurStorage.initProductsIfNeeded();
    const product = PasteurStorage.getProducts().find(
      (p) => String(p.id) === String(productId),
    );
    if (!product || product.stock <= 0) return false;
    const cart = this.getCart();
    const existing = cart.find((item) => String(item.id) === String(productId));
    if (existing) {
      existing.qty = Math.min(existing.qty + 1, product.stock);
    } else {
      cart.push({ id: product.id, qty: 1 });
    }
    this.saveCart(cart);
    return true;
  },

  changeQty(productId: string | number, delta: number): void {
    PasteurStorage.initProductsIfNeeded();
    const product = PasteurStorage.getProducts().find(
      (p) => String(p.id) === String(productId),
    );
    let cart = this.getCart();
    const item = cart.find((i) => String(i.id) === String(productId));
    if (!item || !product) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => String(i.id) !== String(productId));
    } else {
      item.qty = Math.min(item.qty, product.stock);
    }
    this.saveCart(cart);
  },

  clearCart(): void {
    this.saveCart([]);
  },

  async submitOrderAsync({
    name,
    phone,
    address,
  }: {
    name: string;
    phone: string;
    address: string;
  }): Promise<{ ok: boolean; message?: string; total?: number }> {
    const cart = this.getCart();
    if (!cart.length) return { ok: false, message: 'سبد خالی است' };

    const { fetchPublic } = await import('./content/client');
    const { createShopOrderApi } = await import('./commerce/client');

    let products: Product[] = [];
    try {
      const data = await fetchPublic<{ items: Product[] }>('/api/content/products');
      products = data.items;
    } catch {
      PasteurStorage.initProductsIfNeeded();
      products = PasteurStorage.getProducts();
    }

    const customerType = this.getCustomerType();
    const getPrice = (product: Product) => this.getProductPrice(product);
    const getFinal = (product: Product) =>
      customerType === 'vip' ? Math.round(getPrice(product) * 0.98) : getPrice(product);

    let subtotal = 0;
    let total = 0;
    const orderItems = cart.map((item) => {
      const product = products.find((p) => String(p.id) === String(item.id));
      if (!product) {
        return null;
      }
      const unitPrice = getPrice(product);
      const finalUnitPrice = getFinal(product);
      subtotal += unitPrice * item.qty;
      total += finalUnitPrice * item.qty;
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        qty: item.qty,
        unitPrice,
        finalUnitPrice,
      };
    }).filter(Boolean);

    if (!orderItems.length) return { ok: false, message: 'سبد نامعتبر است' };

    try {
      await createShopOrderApi({
        customerName: name,
        customerPhone: phone,
        address,
        customerType,
        items: orderItems,
        subtotal,
        discount: subtotal - total,
        total,
      });
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'ثبت سفارش ناموفق' };
    }

    this.clearCart();
    this.setLastOrderTotal(total);
    return { ok: true, total };
  },

  submitOrder(args: {
    name: string;
    phone: string;
    address: string;
  }): { ok: boolean; message?: string; total?: number } {
    // Sync stub — UI should call submitOrderAsync
    void this.submitOrderAsync(args);
    return { ok: false, message: 'لطفاً دوباره تلاش کنید' };
  },

  setLastOrderTotal(total: number): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(LAST_ORDER_TOTAL_KEY, String(total));
  },

  getLastOrderTotal(): number | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(LAST_ORDER_TOTAL_KEY);
    return raw ? Number(raw) : null;
  },
};

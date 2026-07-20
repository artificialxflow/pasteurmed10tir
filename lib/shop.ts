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

  submitOrder({
    name,
    phone,
    address,
  }: {
    name: string;
    phone: string;
    address: string;
  }): { ok: boolean; message?: string; total?: number } {
    const cart = this.getCart();
    if (!cart.length) return { ok: false, message: 'سبد خالی است' };

    PasteurStorage.initProductsIfNeeded();
    const products = PasteurStorage.getProducts();
    const totals = this.getCartTotals();
    const customerType = this.getCustomerType();

    const orderItems = cart.map((item) => {
      const product = products.find((p) => String(p.id) === String(item.id))!;
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        qty: item.qty,
        unitPrice: this.getProductPrice(product),
        finalUnitPrice: this.getFinalProductPrice(product),
      };
    });

    PasteurStorage.saveShopOrder({
      id: PasteurStorage.generateId(),
      customerType,
      customerTypeLabel: customerType === 'vip' ? 'VIP تجهیزات' : 'عادی',
      customerName: name,
      customerPhone: phone,
      address,
      items: orderItems,
      subtotal: totals.subtotal,
      discount: totals.subtotal - totals.total,
      total: totals.total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const updatedProducts = products.map((product) => {
      const item = cart.find((i) => String(i.id) === String(product.id));
      return item
        ? { ...product, stock: Math.max(0, Number(product.stock || 0) - item.qty) }
        : product;
    });
    PasteurStorage.saveProducts(updatedProducts);
    this.clearCart();
    this.setLastOrderTotal(totals.total);
    return { ok: true, total: totals.total };
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

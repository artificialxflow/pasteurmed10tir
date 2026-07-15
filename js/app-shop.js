/**
 * فروشگاه اپ — سبد خرید و checkout
 */
const AppShop = {
  KEYS: {
    cart: 'pasteur_app_shop_cart',
    customerType: 'pasteur_app_shop_customer_type',
    vipPhone: 'pasteur_app_shop_vip_phone',
  },

  getCustomerType() {
    return localStorage.getItem(this.KEYS.customerType) || 'regular';
  },

  setCustomerType(type, phone = '') {
    localStorage.setItem(this.KEYS.customerType, type);
    if (phone) localStorage.setItem(this.KEYS.vipPhone, phone);
  },

  getVipPhone() {
    return localStorage.getItem(this.KEYS.vipPhone) || '';
  },

  getCart() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.cart) || '[]');
    } catch (_) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(this.KEYS.cart, JSON.stringify(cart));
  },

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + item.qty, 0);
  },

  formatPrice(num) {
    return Number(num || 0).toLocaleString('fa-IR');
  },

  getProductPrice(product) {
    if (product.priceNum) return product.priceNum;
    const normalized = String(product.price || '')
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    return Number(normalized.replace(/[^\d]/g, '')) || 0;
  },

  getFinalProductPrice(product) {
    const price = this.getProductPrice(product);
    return this.getCustomerType() === 'vip' ? Math.round(price * 0.98) : price;
  },

  getCartTotals() {
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
      { subtotal: 0, total: 0, count: 0 }
    );
  },

  addToCart(productId) {
    PasteurStorage.initProductsIfNeeded();
    const product = PasteurStorage.getProducts().find((p) => String(p.id) === String(productId));
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

  changeQty(productId, delta) {
    PasteurStorage.initProductsIfNeeded();
    const product = PasteurStorage.getProducts().find((p) => String(p.id) === String(productId));
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

  clearCart() {
    this.saveCart([]);
  },

  submitOrder({ name, phone, address }) {
    const cart = this.getCart();
    if (!cart.length) return { ok: false, message: 'سبد خالی است' };

    PasteurStorage.initProductsIfNeeded();
    const products = PasteurStorage.getProducts();
    const totals = this.getCartTotals();
    const customerType = this.getCustomerType();

    const orderItems = cart.map((item) => {
      const product = products.find((p) => String(p.id) === String(item.id));
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
      return item ? { ...product, stock: Math.max(0, Number(product.stock || 0) - item.qty) } : product;
    });
    PasteurStorage.saveProducts(updatedProducts);
    this.clearCart();
    return { ok: true, total: totals.total };
  },
};

function mountAppShopBar(title, options = {}) {
  const { backHref, page = 'shop', showNav = true } = options;
  const count = AppShop.getCartCount();
  mountAppLayout({
    page,
    title,
    backHref,
    showNav,
    actionHref: count > 0 ? appHref('shop-cart.html') : null,
    actionLabel: count > 0 ? `🛒 ${count}` : null,
  });
}

"use client";

import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormSelect } from "@/components/ui/Card";
import type { Product } from "@/lib/data";
import { fetchPublic } from "@/lib/content/client";
import { ShopCart } from "@/lib/shop";
import { productThumbnail } from "@/lib/shop/product-display";
import { PasteurStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { shopRoutes, type ShopVariant } from "./types";

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

export function ShopCatalog({ variant = "web" }: { variant?: ShopVariant }) {
  const routes = shopRoutes(variant);
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [customerType, setCustomerType] = useState("regular");
  const [snack, setSnack] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [productData, categoryData] = await Promise.all([
        fetchPublic<{ items: Product[] }>("/api/content/products"),
        fetchPublic<{ items: ProductCategory[] }>("/api/content/product-categories"),
      ]);
      ShopCart.setProductsCache(productData.items);
      setCategories(categoryData.items);
      let list = productData.items;
      if (category !== "all") {
        list = list.filter(
          (p) => p.category === category || p.categorySlug === category || String(p.categoryId) === category,
        );
      }
      const q = search.trim().toLowerCase();
      if (q) {
        list = list.filter((p) =>
          `${p.name} ${p.category} ${p.description || ""}`.toLowerCase().includes(q),
        );
      }
      if (sort === "price-asc") list = [...list].sort((a, b) => a.priceNum - b.priceNum);
      if (sort === "price-desc") list = [...list].sort((a, b) => b.priceNum - a.priceNum);
      if (sort === "stock-desc") list = [...list].sort((a, b) => b.stock - a.stock);
      setProducts(list);
      setLoadError("");
    } catch (e) {
      setProducts([]);
      setLoadError(e instanceof Error ? e.message : "بارگذاری محصولات ناموفق");
    }
    setCustomerType(ShopCart.getCustomerType());
    setCartCount(ShopCart.getCartCount());
  }, [category, search, sort]);

  useEffect(() => {
    if (searchParams.get("vip") === "paid") {
      const last = PasteurStorage.getLastPayment();
      ShopCart.setCustomerType("vip", String(last?.patientPhone || ShopCart.getVipPhone()));
      setSnack("VIP تجهیزات فعال شد");
    }
    refresh();
  }, [refresh, searchParams]);

  function addToCart(id: number) {
    if (ShopCart.addToCart(id)) {
      setSnack("به سبد اضافه شد");
      setCartCount(ShopCart.getCartCount());
    }
  }

  const isVip = customerType === "vip";
  const categoryFilters = [
    { id: "all", label: "همه" },
    ...categories.map((c) => ({
      id: c.name,
      label: variant === "app" && c.name === "دندانپزشکی" ? "دندان" : c.name,
    })),
  ];

  const content = (
    <>
      <Card
        hover={false}
        className={cn(
          "mb-4 p-4 text-sm",
          isVip ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50",
        )}
      >
        <p className="font-bold">
          {isVip ? "💎 مشتری VIP — ۲٪ تخفیف فعال" : "🧾 مشتری عادی"}
        </p>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FormInput
          type="search"
          placeholder="جستجوی نام محصول یا دسته..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        {variant === "web" ? (
          <FormSelect value={sort} onChange={(e) => setSort(e.target.value)} className="w-full sm:w-56">
            <option value="default">مرتب‌سازی پیش‌فرض</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
            <option value="stock-desc">بیشترین موجودی</option>
          </FormSelect>
        ) : null}
        <Button href={routes.cart} variant="accent" className="text-sm">
          🛒 سبد {cartCount > 0 ? `(${cartCount.toLocaleString("fa-IR")})` : ""}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {categoryFilters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              category === c.id
                ? "border-green-300 bg-green-100 text-green-800"
                : "border-slate-300 bg-slate-100 text-slate-700",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {snack ? (
        <p className="mb-3 text-sm font-bold text-teal-700">{snack}</p>
      ) : null}

      {loadError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      <div
        className={cn(
          "grid gap-5",
          variant === "app" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {products.length ? (
          products.map((p) => {
            const base = ShopCart.getProductPrice(p);
            const final = ShopCart.getFinalProductPrice(p);
            const productHref = routes.product(p.slug || String(p.id));
            return (
              <Card key={p.id} hover={false} className="overflow-hidden p-0">
                <Link href={productHref}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productThumbnail(p)}
                    alt={p.name}
                    className="h-36 w-full object-cover"
                  />
                </Link>
                <div className="p-3">
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600">
                    {p.category}
                  </span>
                  <Link href={productHref} className="mt-2 block text-sm font-bold text-slate-900">
                    {p.name}
                  </Link>
                  {isVip ? (
                    <>
                      <p className="mt-1 text-xs text-slate-400 line-through">{p.price}</p>
                      <p className="font-bold text-teal-700">
                        {ShopCart.formatPrice(final)} تومان
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 font-bold text-teal-700">{p.price} تومان</p>
                  )}
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      p.stock > 0 ? "text-teal-700" : "text-red-700",
                    )}
                  >
                    {p.stock > 0
                      ? `${p.stock.toLocaleString("fa-IR")} موجود`
                      : "ناموجود"}
                  </p>
                  <Button
                    variant="primary"
                    className="mt-2 w-full text-xs"
                    disabled={p.stock <= 0}
                    onClick={() => addToCart(p.id)}
                  >
                    افزودن به سبد
                  </Button>
                  <Link
                    href={productHref}
                    className="mt-2 block text-center text-[0.65rem] font-bold text-slate-600 hover:text-teal-700"
                  >
                    جزئیات محصول
                  </Link>
                  {isVip && variant === "web" && base !== final ? (
                    <p className="mt-1 text-center text-[0.65rem] text-amber-700">
                      ۲٪ تخفیف VIP اعمال شد
                    </p>
                  ) : null}
                </div>
              </Card>
            );
          })
        ) : (
          <p className="col-span-full py-8 text-center text-sm text-slate-500">
            {loadError
              ? "محصولی بارگذاری نشد. بعداً دوباره تلاش کنید."
              : "محصولی یافت نشد. از پنل ادمین محصول فعال اضافه کنید."}
          </p>
        )}
      </div>

      {isVip ? (
        <Link
          href={routes.facility}
          className="mt-6 block text-center text-sm font-bold text-teal-700 hover:underline"
        >
          درخواست تسهیلات VIP
        </Link>
      ) : null}
    </>
  );

  if (variant === "app") return <div>{content}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">کاتالوگ تجهیزات</h1>
          <p className="mt-1 text-sm text-slate-600">جستجو، فیلتر و افزودن به سبد</p>
        </div>
        <Button href={routes.home} variant="ghost" className="border border-slate-200">
          تغییر نوع مشتری
        </Button>
      </div>
      {content}
    </div>
  );
}

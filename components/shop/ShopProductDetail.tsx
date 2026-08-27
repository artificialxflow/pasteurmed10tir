"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Product } from "@/lib/data";
import { fetchPublic } from "@/lib/content/client";
import { ShopCart } from "@/lib/shop";
import { flashShopCartButton } from "@/lib/shop/cart-ui";
import {
  findProductVariants,
  formatProductPercent,
  percentsForSize,
  productGallery,
  productPathKey,
  productThumbnail,
  productVariantLabel,
  resolveVariant,
} from "@/lib/shop/product-display";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { shopRoutes, type ShopVariant } from "./types";

export function ShopProductDetail({
  slug,
  variant = "web",
}: {
  slug: string;
  variant?: ShopVariant;
}) {
  const routes = shopRoutes(variant);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Product[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPercent, setSelectedPercent] = useState(0);
  const [activeImage, setActiveImage] = useState("");
  const [error, setError] = useState("");
  const [snack, setSnack] = useState("");
  const [qty, setQty] = useState(1);
  const isVip = ShopCart.getCustomerType() === "vip";

  useEffect(() => {
    void Promise.all([
      fetchPublic<{ item: Product }>(`/api/content/products/${encodeURIComponent(slug)}`),
      fetchPublic<{ items: Product[] }>("/api/content/products"),
    ])
      .then(([detail, catalog]) => {
        const item = detail.item;
        const family = findProductVariants(catalog.items, item);
        const list = family.length ? family : [item];
        setVariants(list);
        setProduct(item);
        setSelectedSize(String(item.size || "").trim());
        setSelectedPercent(Number(item.discountPercent || 0));
        setActiveImage(productThumbnail(item));
        setQty(1);
        ShopCart.setProductsCache(list);
        setError("");
      })
      .catch((e) => {
        setProduct(null);
        setVariants([]);
        setError(e instanceof Error ? e.message : "محصول یافت نشد");
      });
  }, [slug]);

  const sizes = useMemo(
    () =>
      Array.from(new Set(variants.map((v) => String(v.size || "").trim()).filter(Boolean))),
    [variants],
  );

  const percentOptions = useMemo(
    () => percentsForSize(variants, selectedSize),
    [variants, selectedSize],
  );

  const hasVariantUi = variants.length > 1 || sizes.length > 0 || percentOptions.some((n) => n > 0);

  useEffect(() => {
    if (!variants.length) return;
    const next = resolveVariant(variants, selectedSize, selectedPercent);
    if (!next) return;
    setProduct(next);
    setActiveImage(productThumbnail(next));

    const pathKey = productPathKey(next);
    if (typeof window !== "undefined" && pathKey && pathKey !== slug) {
      const nextUrl = routes.product(pathKey);
      window.history.replaceState(null, "", nextUrl);
    }
  }, [variants, selectedSize, selectedPercent, routes, slug]);

  function pickSize(size: string) {
    setSelectedSize(size);
    const nextPercents = percentsForSize(variants, size);
    if (!nextPercents.includes(selectedPercent)) {
      setSelectedPercent(nextPercents[0] ?? 0);
    }
  }

  function addToCart() {
    if (!product) return;
    let added = 0;
    for (let i = 0; i < qty; i++) {
      if (ShopCart.addToCart(product.id)) added += 1;
      else break;
    }
    if (added > 0) {
      setSnack(
        added > 1
          ? `${added.toLocaleString("fa-IR")} عدد به سبد اضافه شد`
          : "به سبد اضافه شد",
      );
      flashShopCartButton();
    }
  }

  if (error) {
    return (
      <div className={variant === "app" ? "p-4" : "mx-auto max-w-3xl px-4 py-10"}>
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        <Button href={routes.catalog} className="mt-4 text-sm">
          بازگشت به کاتالوگ
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className={
          variant === "app"
            ? "p-4 text-sm text-slate-500"
            : "mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500"
        }
      >
        در حال بارگذاری...
      </div>
    );
  }

  const gallery = productGallery(product);
  const base = ShopCart.getProductPrice(product);
  const final = ShopCart.getFinalProductPrice(product);
  const variantLabel = productVariantLabel(product);

  const content = (
    <>
      {variant === "web" ? (
        <nav className="mb-4 text-xs text-slate-500">
          <Link href={routes.home} className="hover:text-teal-700">
            فروشگاه
          </Link>
          <span className="mx-2">/</span>
          <Link href={routes.catalog} className="hover:text-teal-700">
            کاتالوگ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{product.name}</span>
        </nav>
      ) : null}

      <Card hover={false} className="overflow-hidden p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage || productThumbnail(product)}
          alt={product.name}
          className="h-72 w-full object-cover"
        />
        {gallery.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3">
            {gallery.map((src) => (
              <button key={src} type="button" onClick={() => setActiveImage(src)} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className={cn(
                    "h-16 w-16 rounded-lg border object-cover",
                    activeImage === src ? "border-teal-500" : "border-slate-200",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}

        <div className="p-5">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600">
            {product.category}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{product.name}</h1>
          {variantLabel ? (
            <p className="mt-1 text-sm font-bold text-cyan-800">{variantLabel}</p>
          ) : null}

          {isVip ? (
            <div className="mt-3">
              <p className="text-sm text-slate-400 line-through">{product.price} تومان</p>
              <p className="text-2xl font-extrabold text-teal-700">
                {ShopCart.formatPrice(final)} تومان
              </p>
              {base !== final ? (
                <p className="mt-1 text-xs text-amber-700">۲٪ تخفیف VIP اعمال شد</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-2xl font-extrabold text-teal-700">{product.price} تومان</p>
          )}

          <p className={cn("mt-2 text-sm", product.stock > 0 ? "text-teal-700" : "text-red-700")}>
            {product.stock > 0
              ? `${product.stock.toLocaleString("fa-IR")} عدد موجود`
              : "ناموجود"}
          </p>

          {hasVariantUi ? (
            <div className="mt-5 space-y-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              {sizes.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-extrabold text-slate-900">سایز</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => pickSize(size)}
                        className={cn(
                          "min-w-[3rem] rounded-xl border px-3 py-2 text-sm font-bold transition",
                          selectedSize === size
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-400",
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {percentOptions.length > 0 &&
              (percentOptions.length > 1 || percentOptions.some((n) => n > 0)) ? (
                <div>
                  <p className="mb-2 text-sm font-extrabold text-slate-900">درصد</p>
                  <div className="flex flex-wrap gap-2">
                    {percentOptions.map((percent) => (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => setSelectedPercent(percent)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm font-bold transition",
                          selectedPercent === percent
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-400",
                        )}
                      >
                        {formatProductPercent(percent)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="text-xs text-slate-500">
                با تغییر سایز یا درصد، قیمت و موجودی همان ترکیب به‌روز می‌شود.
              </p>
            </div>
          ) : null}

          {product.description ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-extrabold text-slate-900">توضیحات</p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {product.description}
              </p>
            </div>
          ) : null}

          {snack ? <p className="mt-3 text-sm font-bold text-teal-700">{snack}</p> : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1">
              <button
                type="button"
                className="h-8 w-8 rounded-lg text-lg font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="کاهش"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold">
                {qty.toLocaleString("fa-IR")}
              </span>
              <button
                type="button"
                className="h-8 w-8 rounded-lg text-lg font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))}
                aria-label="افزایش"
              >
                +
              </button>
            </div>
            <Button disabled={product.stock <= 0} onClick={addToCart} className="text-sm">
              افزودن به سبد خرید
            </Button>
            <span id="shop-cart-button" className="inline-flex">
              <Button href={routes.cart} variant="accent" className="text-sm">
                مشاهده سبد
              </Button>
            </span>
            <Button href={routes.catalog} variant="ghost" className="text-sm">
              بازگشت به کاتالوگ
            </Button>
          </div>
        </div>
      </Card>
    </>
  );

  if (variant === "app") return <div className="p-4">{content}</div>;

  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">{content}</div>;
}

"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Product } from "@/lib/data";
import { fetchPublic } from "@/lib/content/client";
import { ShopCart } from "@/lib/shop";
import { flashShopCartButton } from "@/lib/shop/cart-ui";
import { productGallery, productThumbnail } from "@/lib/shop/product-display";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [activeImage, setActiveImage] = useState("");
  const [error, setError] = useState("");
  const [snack, setSnack] = useState("");
  const isVip = ShopCart.getCustomerType() === "vip";

  useEffect(() => {
    void fetchPublic<{ item: Product }>(`/api/content/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        setProduct(data.item);
        setActiveImage(productThumbnail(data.item));
        ShopCart.setProductsCache([data.item]);
        setError("");
      })
      .catch((e) => {
        setProduct(null);
        setError(e instanceof Error ? e.message : "محصول یافت نشد");
      });
  }, [slug]);

  function addToCart() {
    if (!product) return;
    if (ShopCart.addToCart(product.id)) {
      setSnack("به سبد اضافه شد");
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
      <div className={variant === "app" ? "p-4 text-sm text-slate-500" : "mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500"}>
        در حال بارگذاری...
      </div>
    );
  }

  const gallery = productGallery(product);
  const base = ShopCart.getProductPrice(product);
  const final = ShopCart.getFinalProductPrice(product);

  const content = (
    <>
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

      <Card hover={false} className="overflow-hidden p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage || productThumbnail(product)} alt={product.name} className="h-72 w-full object-cover" />
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
          {isVip ? (
            <div className="mt-3">
              <p className="text-sm text-slate-400 line-through">{product.price} تومان</p>
              <p className="text-xl font-bold text-teal-700">{ShopCart.formatPrice(final)} تومان</p>
              {base !== final ? (
                <p className="mt-1 text-xs text-amber-700">۲٪ تخفیف VIP اعمال شد</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xl font-bold text-teal-700">{product.price} تومان</p>
          )}
          <p className={cn("mt-2 text-sm", product.stock > 0 ? "text-teal-700" : "text-red-700")}>
            {product.stock > 0
              ? `${product.stock.toLocaleString("fa-IR")} عدد موجود`
              : "ناموجود"}
          </p>
          {product.size?.trim() ? (
            <p className="mt-2 text-sm text-slate-600">سایز: {product.size}</p>
          ) : null}
          {(product.discountPercent ?? 0) > 0 ? (
            <p className="mt-1 text-sm text-amber-700">
              تخفیف محصول: {Number(product.discountPercent).toLocaleString("fa-IR")}٪
            </p>
          ) : null}
          {product.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {product.description}
            </p>
          ) : null}
          {snack ? <p className="mt-3 text-sm font-bold text-teal-700">{snack}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={product.stock <= 0} onClick={addToCart} className="text-sm">
              افزودن به سبد
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

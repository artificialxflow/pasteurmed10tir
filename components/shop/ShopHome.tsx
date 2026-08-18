"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchPublic } from "@/lib/content/client";
import { PASTEUR_DATA } from "@/lib/data";
import type { Product } from "@/lib/data";
import { ShopCart } from "@/lib/shop";
import { productThumbnail } from "@/lib/shop/product-display";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { shopRoutes, type ShopVariant } from "./types";

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

export function ShopHome({ variant = "web" }: { variant?: ShopVariant }) {
  const router = useRouter();
  const routes = shopRoutes(variant);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void Promise.all([
      fetchPublic<{ items: Product[] }>("/api/content/products"),
      fetchPublic<{ items: ProductCategory[] }>("/api/content/product-categories"),
    ])
      .then(([productData, categoryData]) => {
        ShopCart.setProductsCache(productData.items);
        setProducts(productData.items.slice(0, 8));
        setCategories(categoryData.items);
        setLoadError("");
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "بارگذاری محصولات ناموفق");
        setProducts([]);
      });
  }, []);

  function selectType(typeId: string) {
    if (typeId === "regular") {
      ShopCart.setCustomerType("regular");
      router.push(routes.catalog);
    } else {
      router.push(routes.vip);
    }
  }

  const previewSection =
    products.length > 0 ? (
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">محصولات پرطرفدار</h2>
            <p className="mt-1 text-sm text-slate-600">نمونه‌ای از تجهیزات موجود در فروشگاه</p>
          </div>
          <Button href={routes.catalog} variant="accent" className="text-sm">
            مشاهده همه محصولات
          </Button>
        </div>
        <div
          className={cn(
            "grid gap-4",
            variant === "app" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {products.map((p) => (
            <Link key={p.id} href={routes.product(p.slug || String(p.id))}>
              <Card hover className="overflow-hidden p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productThumbnail(p)}
                  alt={p.name}
                  className="h-32 w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-900">{p.name}</p>
                  <p className="mt-1 text-xs font-bold text-teal-700">{p.price} تومان</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    ) : loadError ? (
      <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {loadError} — برای مشاهده کاتالوگ «مشتری عادی» را انتخاب کنید یا به{" "}
        <Link href={routes.catalog} className="font-bold underline">
          کاتالوگ
        </Link>{" "}
        بروید.
      </p>
    ) : null;

  if (variant === "app") {
    return (
      <div className="space-y-3">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-cyan-50 to-white p-4">
          <p className="text-base font-extrabold text-slate-900">فروشگاه تجهیزات</p>
          <p className="mt-1 text-sm text-slate-600">انتخاب نوع مشتری برای شروع خرید</p>
        </section>
        {PASTEUR_DATA.shopCustomerTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectType(t.id)}
            className={cn(
              "w-full rounded-2xl border border-sky-200 bg-white p-4 text-right transition hover:border-teal-500",
              t.id === "vip" && "border-amber-200 bg-gradient-to-br from-orange-50 to-white",
            )}
          >
            <span className="text-3xl">{t.emoji}</span>
            <p className="mt-2 text-sm font-bold">{t.title}</p>
            <p className="mt-1 text-xs text-slate-500">{t.description}</p>
            <ul className="mt-2 list-disc space-y-1 pr-4 text-xs text-slate-500">
              {t.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </button>
        ))}
        {previewSection}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-[1.25rem] border border-cyan-200 bg-gradient-to-bl from-cyan-50 to-amber-50 p-6 sm:p-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-bold text-cyan-800">
              فروشگاه عادی / VIP
            </span>
            <h1 className="mb-2 text-2xl font-extrabold text-slate-950 sm:text-4xl">
              🛒 فروشگاه تجهیزات پاستور پلاس
            </h1>
            <p className="max-w-2xl leading-7 text-slate-600">
              تجهیزات پزشکی و دندانپزشکی را با قیمت شفاف، موجودی قابل مشاهده و امکان ثبت سفارش
              آنلاین بررسی کنید. مشتریان VIP از تخفیف و تسهیلات تجهیزات بهره‌مند می‌شوند.
            </p>
            <div className="mt-4">
              <Button href={routes.catalog} variant="accent" className="text-sm">
                مشاهده همه محصولات
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
              <p className="text-2xl font-extrabold text-cyan-700">۲٪</p>
              <p className="mt-1 text-xs text-slate-500">تخفیف VIP</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
              <p className="text-2xl font-extrabold text-amber-700">
                {(categories.length || 2).toLocaleString("fa-IR")}
              </p>
              <p className="mt-1 text-xs text-slate-500">دسته محصول</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
              <p className="text-2xl font-extrabold text-teal-700">VIP</p>
              <p className="mt-1 text-xs text-slate-500">تسهیلات</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {PASTEUR_DATA.shopCustomerTypes.map((t) => (
          <button key={t.id} type="button" onClick={() => selectType(t.id)} className="text-right">
            <Card vip={t.id === "vip"} className="h-full p-6">
              <div className="flex items-start gap-3">
                <span className="text-4xl">{t.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold">{t.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t.description}</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {t.benefits.map((b) => (
                      <li key={b}>✓ {b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </section>

      {previewSection}
    </div>
  );
}

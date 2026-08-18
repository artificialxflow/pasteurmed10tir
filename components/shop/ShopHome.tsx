"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchPublic } from "@/lib/content/client";
import { PASTEUR_DATA } from "@/lib/data";
import type { Product } from "@/lib/data";
import { catalogCategoryHref, groupProductsByCategory, type ShopCategoryGroup } from "@/lib/shop/group-products";
import { ShopCart } from "@/lib/shop";
import { productThumbnail } from "@/lib/shop/product-display";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ShopCategorySectionsSkeleton,
  ShopStatSkeleton,
} from "./ShopProductSkeleton";
import { shopRoutes, type ShopVariant } from "./types";

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

function scrollToProducts() {
  document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ShopHome({ variant = "web" }: { variant?: ShopVariant }) {
  const router = useRouter();
  const routes = shopRoutes(variant);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    void Promise.all([
      fetchPublic<{ items: Product[] }>("/api/content/products"),
      fetchPublic<{ items: ProductCategory[] }>("/api/content/product-categories"),
    ])
      .then(([productData, categoryData]) => {
        ShopCart.setProductsCache(productData.items);
        setProducts(productData.items);
        setCategories(categoryData.items);
        setLoadError("");
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "بارگذاری محصولات ناموفق");
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categoryGroups = useMemo(
    () => groupProductsByCategory(products, categories, variant === "app" ? 4 : 4),
    [products, categories, variant],
  );

  function selectType(typeId: string) {
    if (typeId === "regular") {
      ShopCart.setCustomerType("regular");
      router.push(routes.catalog);
    } else {
      router.push(routes.vip);
    }
  }

  function renderCategorySection(group: ShopCategoryGroup) {
    const gridClass =
      variant === "app"
        ? "grid grid-cols-2 gap-4"
        : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

    return (
      <section key={group.id || group.slug} className="scroll-mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{group.name}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {group.products.length.toLocaleString("fa-IR")} محصول در این دسته
            </p>
          </div>
          <Button
            href={catalogCategoryHref(routes.catalog, group.name)}
            variant="ghost"
            className="border border-slate-200 text-sm"
          >
            مشاهده همه
          </Button>
        </div>
        <div className={gridClass}>
          {group.products.map((p) => (
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
                  <p
                    className={cn(
                      "mt-1 text-[0.65rem]",
                      p.stock > 0 ? "text-teal-700" : "text-red-700",
                    )}
                  >
                    {p.stock > 0
                      ? `${p.stock.toLocaleString("fa-IR")} موجود`
                      : "ناموجود"}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  const productsSection = (
    <section id="shop-products" className="mt-10 scroll-mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">محصولات فروشگاه</h2>
          <p className="mt-1 text-sm text-slate-600">بر اساس دسته‌بندی — بدون نیاز به کلیک اضافه</p>
        </div>
        <Button href={routes.catalog} variant="accent" className="text-sm">
          کاتالوگ کامل
        </Button>
      </div>

      {loading ? (
        <ShopCategorySectionsSkeleton variant={variant} sectionCount={variant === "app" ? 2 : 3} />
      ) : loadError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {loadError} — می‌توانید به{" "}
          <Link href={routes.catalog} className="font-bold underline">
            کاتالوگ
          </Link>{" "}
          بروید یا دوباره صفحه را رفرش کنید.
        </p>
      ) : categoryGroups.length ? (
        <div className="space-y-10">{categoryGroups.map(renderCategorySection)}</div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
          هنوز محصول فعالی ثبت نشده. از پنل ادمین محصول اضافه کنید.
        </p>
      )}
    </section>
  );

  if (variant === "app") {
    return (
      <div className="space-y-3">
        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-cyan-50 to-white p-4">
          <p className="text-base font-extrabold text-slate-900">فروشگاه تجهیزات</p>
          <p className="mt-1 text-sm text-slate-600">انتخاب نوع مشتری یا مشاهده محصولات زیر</p>
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
        {productsSection}
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
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="accent" className="text-sm" onClick={scrollToProducts}>
                مشاهده محصولات
              </Button>
              <Button href={routes.catalog} variant="ghost" className="border border-slate-200 text-sm">
                کاتالوگ کامل
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
              <p className="text-2xl font-extrabold text-cyan-700">۲٪</p>
              <p className="mt-1 text-xs text-slate-500">تخفیف VIP</p>
            </div>
            {loading ? (
              <>
                <ShopStatSkeleton />
                <ShopStatSkeleton />
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
                  <p className="text-2xl font-extrabold text-amber-700">
                    {categories.length.toLocaleString("fa-IR")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">دسته محصول</p>
                </div>
                <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
                  <p className="text-2xl font-extrabold text-teal-700">
                    {products.length.toLocaleString("fa-IR")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">محصول فعال</p>
                </div>
              </>
            )}
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

      {productsSection}
    </div>
  );
}

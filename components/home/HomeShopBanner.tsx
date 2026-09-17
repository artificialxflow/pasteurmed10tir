"use client";

import { fetchPublic } from "@/lib/content/client";
import type { ShopHomeBanner } from "@/lib/content/shop-home-banners";
import type { Product } from "@/lib/data";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export function HomeShopBanner() {
  const [banners, setBanners] = useState<ShopHomeBanner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    void fetchPublic<{ shopHomeBanners?: ShopHomeBanner[] }>("/api/content/settings")
      .then((data) => setBanners(Array.isArray(data.shopHomeBanners) ? data.shopHomeBanners : []))
      .catch(() => setBanners([]));
    void fetchPublic<{ items: Product[] }>("/api/content/products")
      .then((data) =>
        setProducts(
          (data.items || [])
            .filter((p) => p.active !== false && p.stock > 0)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .slice(0, 8),
        ),
      )
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000);
    return () => window.clearInterval(t);
  }, [banners.length]);

  const current = banners[slide];
  const href = current?.href || ROUTES.web.shop;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {current ? (
          <Link
            href={href}
            className="relative mb-8 block overflow-hidden rounded-[1.25rem] border border-cyan-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image}
              alt={current.title || "فروشگاه تجهیزات"}
              className="h-48 w-full object-cover sm:h-72"
            />
            {current.title ? (
              <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-cyan-900">
                {current.title}
              </span>
            ) : null}
          </Link>
        ) : (
          <div className="relative mb-8 overflow-hidden rounded-[1.25rem] border border-cyan-700 bg-gradient-to-bl from-cyan-700 via-cyan-800 to-slate-900 p-8 text-center text-white sm:p-12">
            <h2 className="relative mb-3 text-2xl font-bold sm:text-3xl">
              فروشگاه تجهیزات پزشکی و دندانپزشکی
            </h2>
            <p className="relative mx-auto mb-6 max-w-lg text-cyan-100">
              مشاهده محصولات، ثبت سفارش، فعال‌سازی مشتری VIP تجهیزات و درخواست تسهیلات خرید
            </p>
            <Link
              href={ROUTES.web.shop}
              className="relative inline-flex items-center gap-2 rounded-full border border-white bg-white px-8 py-3 font-bold text-cyan-900 transition-colors hover:bg-cyan-50"
            >
              ورود به فروشگاه تجهیزات
            </Link>
          </div>
        )}

        {products.length ? (
          <div>
            <p className="mb-4 text-lg font-extrabold text-slate-900">محصولات پرفروش</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`${ROUTES.web.shop}/product/${p.slug || p.id}`}
                  className="w-40 shrink-0 rounded-2xl border border-sky-200 bg-white p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="mb-2 h-24 w-full rounded-xl object-cover" />
                  <p className="line-clamp-2 text-xs font-bold text-slate-900">{p.name}</p>
                  <p className="mt-1 text-xs font-extrabold text-teal-800">{formatPrice(p.priceNum)}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

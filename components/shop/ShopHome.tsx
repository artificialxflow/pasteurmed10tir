"use client";

import { Card } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import { ShopCart } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { shopRoutes, type ShopVariant } from "./types";

export function ShopHome({ variant = "web" }: { variant?: ShopVariant }) {
  const router = useRouter();
  const routes = shopRoutes(variant);

  function selectType(typeId: string) {
    if (typeId === "regular") {
      ShopCart.setCustomerType("regular");
      router.push(routes.catalog);
    } else {
      router.push(routes.vip);
    }
  }

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
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
              <p className="text-2xl font-extrabold text-cyan-700">۲٪</p>
              <p className="mt-1 text-xs text-slate-500">تخفیف VIP</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-white/85 p-4">
              <p className="text-2xl font-extrabold text-amber-700">۲</p>
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
    </div>
  );
}

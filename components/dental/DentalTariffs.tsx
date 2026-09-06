"use client";

import { Card, EmptyState } from "@/components/ui/Card";
import { fetchPublic } from "@/lib/content/client";
import {
  formatDentalTariffPrice,
  type DentalTariffCategory,
} from "@/lib/dental-tariffs";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DentalBasePath } from "./types";
import { isAppDental } from "./types";

export function DentalTariffs({ basePath }: { basePath: DentalBasePath }) {
  const app = isAppDental(basePath);
  const [categories, setCategories] = useState<DentalTariffCategory[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchPublic<{ items: DentalTariffCategory[] }>("/api/content/dental-tariffs")
      .then((data) => setCategories(data.items || []))
      .catch((e) => {
        setCategories([]);
        setError(e instanceof Error ? e.message : "خطا در دریافت تعرفه‌ها");
      });
  }, []);

  const list = (categories || []).filter(
    (c) => c.active !== false && (c.items || []).some((i) => i.active !== false),
  );

  return (
    <div className={cn(app ? "space-y-4" : "mx-auto max-w-4xl space-y-8")}>
      {!app ? (
        <div>
          <nav className="mb-6 text-sm text-slate-500" aria-label="مسیر">
            <Link href={ROUTES.web.home} className="hover:text-teal-700">
              صفحه اصلی
            </Link>
            <span className="mx-2">/</span>
            <Link href={ROUTES.web.dental} className="hover:text-teal-700">
              دندانپزشکی
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-900">تعرفه‌ها</span>
          </nav>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            تعرفه‌های دندانپزشکی
          </h1>
          <p className="text-slate-600">لیست قیمت خدمات — طبق ثبت ادمین</p>
        </div>
      ) : (
        <p className="text-sm leading-7 text-slate-600">لیست قیمت خدمات دندانپزشکی</p>
      )}

      {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}

      {categories === null ? (
        <p className="text-sm text-slate-500">در حال بارگذاری…</p>
      ) : list.length === 0 ? (
        <EmptyState title="هنوز تعرفه‌ای ثبت نشده" />
      ) : (
        <div className="space-y-4">
          {list.map((category) => (
            <Card key={category.id} hover={false} className={app ? "p-3" : "p-5"}>
              <p className="font-extrabold text-slate-900">
                {category.emoji} {category.title}
              </p>
              {category.description ? (
                <p className="mt-1 text-sm leading-7 text-slate-600">{category.description}</p>
              ) : null}
              <ul className="mt-3 divide-y divide-slate-100">
                {(category.items || [])
                  .filter((item) => item.active !== false)
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                    >
                      <span className="font-bold text-slate-800">
                        {item.title}
                        {item.unit ? (
                          <span className="mr-1 text-xs font-normal text-slate-500">
                            ({item.unit})
                          </span>
                        ) : null}
                      </span>
                      <span className="font-extrabold text-teal-800">
                        {formatDentalTariffPrice(item)}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { fetchPublic } from "@/lib/content/client";
import { defaultInsuranceLogoPath } from "@/lib/content/insurance-logo";
import type { InsuranceCompany } from "@/lib/patient";
import { useMemo, useState, useEffect } from "react";

const PAGE_SIZE = 4;

export function CoveredInsurancesSection({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<InsuranceCompany[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    void fetchPublic<{ site?: InsuranceCompany[]; base: InsuranceCompany[]; complementary: InsuranceCompany[] }>(
      "/api/content/insurances",
    )
      .then((data) => {
        const site = Array.isArray(data.site) ? data.site : [];
        setItems(site.length ? site : [...(data.base || []), ...(data.complementary || [])]);
      })
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  const pages = useMemo(() => {
    const chunks: InsuranceCompany[][] = [];
    for (let i = 0; i < items.length; i += PAGE_SIZE) {
      chunks.push(items.slice(i, i + PAGE_SIZE));
    }
    return chunks.length ? chunks : [[]];
  }, [items]);

  const safePage = Math.min(page, pages.length - 1);
  const visible = pages[safePage] || [];

  if (loaded && items.length === 0) return null;

  return (
    <section
      className={compact ? "py-4" : "border-t border-cyan-100 bg-gradient-to-b from-cyan-50/70 to-white py-12 sm:py-16"}
      aria-labelledby="covered-insurances-heading"
      data-section="covered-insurances"
    >
      <div className={compact ? "" : "mx-auto max-w-xl px-4 sm:px-6"}>
        <div className={compact ? "mb-3 text-center" : "mb-6 text-center"}>
          <h2
            id="covered-insurances-heading"
            className={compact ? "text-base font-extrabold text-slate-900" : "text-2xl font-bold text-slate-900 sm:text-3xl"}
          >
            بیمه‌های تحت پوشش
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
            خدمات با پوشش بیمه‌های پایه و تکمیلی منتخب. انتخاب بیمه در پنل کاربری جداست.
          </p>
        </div>

        {!loaded ? (
          <p className="text-center text-sm text-slate-400">در حال بارگذاری…</p>
        ) : (
          <div className="rounded-[1.75rem] border border-cyan-100 bg-cyan-50/80 p-5 sm:p-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {visible.map((item) => (
                <div
                  key={item.id}
                  className="flex aspect-[5/4] items-center justify-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.logoUrl || defaultInsuranceLogoPath(item.id)}
                    alt={item.name}
                    className="max-h-16 max-w-full object-contain sm:max-h-20"
                    onError={(e) => {
                      e.currentTarget.src = `/api/content/insurance-mark/${encodeURIComponent(item.id)}`;
                    }}
                  />
                </div>
              ))}
            </div>
            {pages.length > 1 ? (
              <div className="mt-5 flex items-center justify-center gap-2">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`صفحه ${index + 1}`}
                    className={`h-2.5 rounded-full transition ${
                      index === safePage ? "w-6 bg-cyan-600" : "w-2.5 bg-cyan-200"
                    }`}
                    onClick={() => setPage(index)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

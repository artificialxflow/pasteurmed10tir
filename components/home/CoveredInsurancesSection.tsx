"use client";

import { fetchPublic } from "@/lib/content/client";
import type { InsuranceCompany } from "@/lib/patient";
import { useEffect, useState } from "react";

export function CoveredInsurancesSection({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<InsuranceCompany[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetchPublic<{ site?: InsuranceCompany[]; base: InsuranceCompany[]; complementary: InsuranceCompany[] }>(
      "/api/content/insurances",
    )
      .then((data) => {
        const site = Array.isArray(data.site) ? data.site : [];
        if (site.length) {
          setItems(site);
          return;
        }
        setItems([...(data.base || []), ...(data.complementary || [])]);
      })
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && items.length === 0) return null;

  const track = [...items, ...items];

  return (
    <section
      className={compact ? "py-6" : "border-y border-cyan-100 bg-gradient-to-b from-cyan-50/40 to-white py-12 sm:py-16"}
      aria-labelledby="covered-insurances-heading"
      data-section="covered-insurances"
    >
      <div className={compact ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"}>
        <div className={compact ? "mb-3" : "mb-8 text-center"}>
          <h2
            id="covered-insurances-heading"
            className={
              compact
                ? "text-base font-extrabold text-slate-900"
                : "mb-2 text-2xl font-bold text-slate-900 sm:text-3xl"
            }
          >
            بیمه‌های تحت پوشش
          </h2>
          {!compact ? (
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              پاستور پلاس با بیمه‌های پایه و تکمیلی منتخب همکاری می‌کند. فهرست زیر برای اطلاع‌رسانی
              عمومی است؛ انتخاب بیمه در پنل کاربری جداگانه انجام می‌شود.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">فهرست عمومی — انتخاب در پنل کاربری جداست</p>
          )}
        </div>

        {!loaded ? (
          <p className="text-center text-sm text-slate-400">در حال بارگذاری…</p>
        ) : (
          <div className="overflow-hidden">
            <ul className="insurance-slide-track flex w-max gap-3 hover:[animation-play-state:paused] sm:gap-4">
              {track.map((item, index) => (
                <li
                  key={`${item.id}-${index}`}
                  className="flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-white px-3 shadow-[0_8px_24px_-20px_rgb(8_145_178_/_0.5)] sm:h-24 sm:w-44"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.logoUrl || `/api/content/insurance-mark/${encodeURIComponent(item.id)}`}
                    alt={item.name}
                    className="max-h-14 max-w-full object-contain"
                    loading="lazy"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

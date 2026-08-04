"use client";

import { EmptyState } from "@/components/ui/Card";
import { PASTEUR_DATA } from "@/lib/data";
import type { GalleryItem } from "@/lib/data";
import { fetchPublic } from "@/lib/content/client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const CAT_LABELS: Record<string, string> = {
  dental: "دندانپزشکی",
  laser: "لیزر",
  beauty: "زیبایی",
};

export function GalleryBrowser({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetchPublic<{ items: GalleryItem[] }>("/api/content/gallery")
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  const filtered = useMemo(() => {
    if (category === "all") return items;
    return items.filter((g) => g.category === category);
  }, [items, category]);

  return (
    <>
      <div className={cn("mb-6 flex flex-wrap gap-2", compact && "mb-4")}>
        {PASTEUR_DATA.galleryCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
              category === c.id
                ? "border-green-300 bg-green-100 text-green-800"
                : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-white",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="موردی یافت نشد." />
      ) : (
        <div
          className={cn(
            "grid gap-4",
            compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6",
          )}
        >
          {filtered.map((g) => (
            <article
              key={g.id}
              role="button"
              tabIndex={0}
              onClick={() => setLightbox(g)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setLightbox(g);
              }}
              className="cursor-pointer overflow-hidden rounded-[1.25rem] border border-sky-300/45 bg-white shadow-[0_18px_45px_-28px_rgb(8_145_178_/_0.45)] transition hover:-translate-y-0.5 hover:border-teal-500"
            >
              <div className="grid grid-cols-2 gap-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.before}
                  alt="قبل"
                  className={cn("w-full object-cover", compact ? "h-22" : "h-32")}
                  style={{ height: compact ? "5.5rem" : undefined }}
                  loading="lazy"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.after}
                  alt="بعد"
                  className={cn("w-full object-cover", compact ? "h-22" : "h-32")}
                  style={{ height: compact ? "5.5rem" : undefined }}
                  loading="lazy"
                />
              </div>
              <div className={cn(compact ? "p-3" : "p-4")}>
                <span className="text-xs font-medium text-teal-700">
                  {CAT_LABELS[g.category] || g.category}
                </span>
                <h3 className={cn("font-bold text-slate-900", compact ? "text-sm" : "")}>{g.title}</h3>
                <p className="mt-1 text-xs text-slate-500">کلیک برای بزرگنمایی</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl animate-[appEnter_0.22s_ease] rounded-xl bg-white p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="بستن"
              onClick={() => setLightbox(null)}
              className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700"
            >
              ✕
            </button>
            <h3 className="mb-4 text-center text-lg font-bold text-slate-900">{lightbox.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-center text-xs text-slate-500">قبل</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightbox.before}
                  alt="قبل"
                  className="h-48 w-full rounded-lg border-2 border-slate-200 object-cover"
                />
              </div>
              <div>
                <p className="mb-2 text-center text-xs text-slate-500">بعد</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightbox.after}
                  alt="بعد"
                  className="h-48 w-full rounded-lg border-2 border-teal-300 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

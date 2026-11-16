"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchPatientCommerce } from "@/lib/commerce/client";
import { formatJalaliDate } from "@/lib/patient";
import { WARRANTY_CARD_THEME } from "@/lib/warranty/constants";
import { warrantyCardArtUrl } from "@/lib/warranty/art";
import { formatWarrantyRemaining } from "@/lib/warranty/time-remaining";
import type { ServiceWarrantyType } from "@prisma/client";
import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";

type WarrantyItem = {
  id: string;
  serviceType?: ServiceWarrantyType;
  serviceLabel: string;
  typeLabel?: string;
  displayImageUrl?: string;
  imageUrl: string;
  startedAt?: string;
  expiresAt: string;
};

function WarrantyArtLightbox({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      role="dialog"
      aria-modal
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} className="aspect-[1.58/1] w-full object-cover" />
        <p className="px-4 py-3 text-center text-sm font-bold text-slate-800">{title}</p>
        <button
          type="button"
          className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white"
          onClick={onClose}
        >
          بستن
        </button>
      </div>
    </div>
  );
}

function WarrantyCard({
  item,
  onPreview,
  compact,
}: {
  item: WarrantyItem;
  onPreview: (src: string, title: string) => void;
  compact?: boolean;
}) {
  const theme = item.serviceType
    ? WARRANTY_CARD_THEME[item.serviceType]
    : WARRANTY_CARD_THEME.crown;
  const remaining = formatWarrantyRemaining(item.expiresAt);
  const expired = remaining === "منقضی شده";
  const thumb =
    item.displayImageUrl ||
    (item.serviceType ? warrantyCardArtUrl(item.serviceType) : item.imageUrl);
  const title = item.serviceLabel || item.typeLabel || "کارت گارانتی";
  const [imgSrc, setImgSrc] = useState(thumb);

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-md ${theme.border} ${theme.bg} ${
        compact ? "" : "max-w-sm"
      }`}
    >
      <button
        type="button"
        className="group block w-full text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        onClick={() => onPreview(imgSrc, title)}
        title="نمایش بزرگ کارت"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={title}
          className={`aspect-[1.58/1] w-full object-cover transition group-hover:brightness-95 ${
            compact ? "max-h-28" : ""
          }`}
          onError={() => setImgSrc(warrantyCardArtUrl(item.serviceType || "crown"))}
        />
        <p className="px-3 py-1 text-center text-[10px] font-bold text-slate-500 opacity-80 group-hover:text-teal-800">
          برای بزرگ‌نمایی بزنید
        </p>
      </button>
      <div className="space-y-1 p-3 text-sm">
        <p className={`font-extrabold leading-snug ${theme.accent}`}>{title}</p>
        {item.typeLabel && item.serviceLabel !== item.typeLabel ? (
          <p className="text-xs text-slate-500">{item.typeLabel}</p>
        ) : null}
        {item.startedAt ? (
          <p className="text-[11px] text-slate-600">
            شروع: {formatJalaliDate(item.startedAt)} — پایان:{" "}
            {formatJalaliDate(item.expiresAt)}
          </p>
        ) : (
          <p className="text-[11px] text-slate-600">پایان: {formatJalaliDate(item.expiresAt)}</p>
        )}
        <p
          className={
            expired ? "text-xs font-bold text-rose-700" : "text-xs font-bold text-emerald-800"
          }
        >
          {remaining}
        </p>
      </div>
    </div>
  );
}

function WarrantyGrid({
  items,
  onPreview,
  compact,
  children,
}: {
  items: WarrantyItem[];
  onPreview: (src: string, title: string) => void;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-2"}`}>
        {items.map((item) => (
          <WarrantyCard key={item.id} item={item} onPreview={onPreview} compact={compact} />
        ))}
      </div>
      {children}
    </>
  );
}

export function ServiceWarrantySection({
  variant = "panel",
  onOpenPanel,
}: {
  variant?: "panel" | "teaser" | "embedded";
  onOpenPanel?: () => void;
}) {
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);

  const reload = useCallback(() => {
    void fetchPatientCommerce<{ items: WarrantyItem[] }>("/api/account/warranty-cards")
      .then((data) => setItems(data.items || []))
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const openPreview = useCallback((src: string, title: string) => {
    setPreview({ src, title });
  }, []);

  const previewModal =
    preview != null ? (
      <WarrantyArtLightbox
        src={preview.src}
        title={preview.title}
        onClose={() => setPreview(null)}
      />
    ) : null;

  if (loadError && variant !== "panel") return null;

  if (variant === "teaser") {
    if (!loaded || !items.length) return null;
    const active = items.filter((i) => formatWarrantyRemaining(i.expiresAt) !== "منقضی شده");
    return (
      <Card hover={false} className="border-emerald-200 bg-emerald-50/40 p-4">
        <p className="text-sm font-extrabold text-slate-900">کارت گارانتی خدمات</p>
        <p className="mt-1 text-xs text-slate-600">
          {active.length.toLocaleString("fa-IR")} کارت فعال از{" "}
          {items.length.toLocaleString("fa-IR")} کارت ثبت‌شده
        </p>
        {onOpenPanel ? (
          <Button type="button" className="mt-3 text-xs" onClick={onOpenPanel}>
            مشاهده کارت‌های گارانتی
          </Button>
        ) : null}
      </Card>
    );
  }

  if (variant === "embedded") {
    if (!loaded) return null;
    if (!items.length) {
      return (
        <Card hover={false} className="border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm">
          <p className="font-bold text-slate-800">گارانتی خدمات دندان</p>
          <p className="mt-1 text-xs text-slate-600">
            هنوز کارت گارانتی برای شما ثبت نشده است. پس از انجام خدمت، درمانگاه کارت را در
            سامانه ثبت می‌کند.
          </p>
          {onOpenPanel ? (
            <button
              type="button"
              className="mt-2 text-xs font-bold text-teal-800 underline"
              onClick={onOpenPanel}
            >
              بخش گارانتی در پنل
            </button>
          ) : null}
        </Card>
      );
    }
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-extrabold text-slate-900">گارانتی خدمات (خلاصه)</p>
          {onOpenPanel ? (
            <button
              type="button"
              className="text-xs font-bold text-teal-800 underline"
              onClick={onOpenPanel}
            >
              همه کارت‌ها
            </button>
          ) : null}
        </div>
        <WarrantyGrid items={items.slice(0, 2)} onPreview={openPreview} compact>
          {previewModal}
        </WarrantyGrid>
      </div>
    );
  }

  return (
    <>
      <Card hover={false} className="space-y-4 border-emerald-200 bg-emerald-50/30 p-4">
        <div>
          <p className="font-extrabold text-slate-900">کارت گارانتی خدمات</p>
          <p className="mt-1 text-xs leading-6 text-slate-600">
            کارت‌های ثبت‌شده توسط درمانگاه برای خدمات دندانپزشکی شما. برای دیدن تصویر در
            اندازه کارت ویزیت، روی تصویر هر کارت بزنید.
          </p>
        </div>
        {loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}
        {loaded && !items.length && !loadError ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
            هنوز کارت گارانتی ثبت نشده است.
          </p>
        ) : null}
        {items.length > 0 ? (
          <WarrantyGrid items={items} onPreview={openPreview} />
        ) : null}
      </Card>
      {previewModal}
    </>
  );
}
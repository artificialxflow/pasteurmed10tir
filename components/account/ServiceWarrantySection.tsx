"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchPatientCommerce } from "@/lib/commerce/client";
import { formatJalaliDate } from "@/lib/patient";
import { WARRANTY_CARD_THEME } from "@/lib/warranty/constants";
import { warrantyCardArtUrl } from "@/lib/warranty/art";
import { formatWarrantyRemaining } from "@/lib/warranty/time-remaining";
import type { ServiceWarrantyType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

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

function WarrantyCard({ item }: { item: WarrantyItem }) {
  const theme = item.serviceType
    ? WARRANTY_CARD_THEME[item.serviceType]
    : WARRANTY_CARD_THEME.crown;
  const remaining = formatWarrantyRemaining(item.expiresAt);
  const expired = remaining === "منقضی شده";
  const thumb =
    item.displayImageUrl ||
    (item.serviceType ? warrantyCardArtUrl(item.serviceType) : item.imageUrl);

  return (
    <div
      className={`flex gap-3 rounded-xl border p-3 shadow-sm ${theme.border} ${theme.bg}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt={item.serviceLabel}
        className="h-14 w-14 shrink-0 rounded-lg border border-white/80 object-cover shadow-sm"
        width={56}
        height={56}
      />
      <div className="min-w-0 flex-1 space-y-0.5 text-sm">
        <p className={`font-bold leading-snug ${theme.accent}`}>
          {item.serviceLabel || item.typeLabel}
        </p>
        {item.typeLabel && item.serviceLabel !== item.typeLabel ? (
          <p className="text-xs text-slate-500">{item.typeLabel}</p>
        ) : null}
        {item.startedAt ? (
          <p className="text-[11px] text-slate-600">
            شروع: {formatJalaliDate(item.startedAt)} — پایان:{" "}
            {formatJalaliDate(item.expiresAt)}
          </p>
        ) : null}
        <p className={expired ? "text-xs font-bold text-rose-700" : "text-xs font-bold text-emerald-800"}>
          {remaining}
        </p>
      </div>
    </div>
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

  const reload = useCallback(() => {
    void fetchPatientCommerce<{ items: WarrantyItem[] }>("/api/account/warranty-cards")
      .then((data) => setItems(data.items || []))
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

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
        <div className="grid gap-3 sm:grid-cols-2">
          {items.slice(0, 2).map((item) => (
            <WarrantyCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card hover={false} className="space-y-4 border-emerald-200 bg-emerald-50/30 p-4">
      <div>
        <p className="font-extrabold text-slate-900">کارت گارانتی خدمات</p>
        <p className="mt-1 text-xs leading-6 text-slate-600">
          کارت‌های ثبت‌شده توسط درمانگاه برای خدمات دندانپزشکی شما. مدت هر کارت از نوع
          خدمت محاسبه شده است.
        </p>
      </div>
      {loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}
      {loaded && !items.length && !loadError ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
          هنوز کارت گارانتی ثبت نشده است.
        </p>
      ) : null}
      {items.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <WarrantyCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
"use client";

import { Card } from "@/components/ui/Card";
import { fetchPatientCommerce } from "@/lib/commerce/client";
import { WARRANTY_CARD_THEME } from "@/lib/warranty/constants";
import type { ServiceWarrantyType } from "@prisma/client";
import { useEffect, useState } from "react";

type WarrantyItem = {
  id: string;
  serviceType?: ServiceWarrantyType;
  serviceLabel: string;
  typeLabel?: string;
  imageUrl: string;
  expiresAt: string;
};

function daysRemaining(expiresAt: string): number {
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
}

export function ServiceWarrantySection() {
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void fetchPatientCommerce<{ items: WarrantyItem[] }>("/api/account/warranty-cards")
      .then((data) => setItems(data.items || []))
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  if (loadError) return null;
  if (!items.length) return null;

  return (
    <Card hover={false} className="space-y-3 border-emerald-200 bg-emerald-50/40 p-4">
      <p className="font-extrabold text-slate-900">کارت گارانتی خدمات</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const left = daysRemaining(item.expiresAt);
          const expired = left <= 0;
          const theme = item.serviceType
            ? WARRANTY_CARD_THEME[item.serviceType]
            : WARRANTY_CARD_THEME.crown;
          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-xl border shadow-sm ${theme.border} ${theme.bg}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.serviceLabel}
                className="h-28 w-full object-cover"
              />
              <div className="space-y-1 bg-white/70 p-3 text-sm">
                <p className={`font-bold ${theme.accent}`}>
                  {item.serviceLabel || item.typeLabel}
                </p>
                <p className={expired ? "text-rose-700" : "text-emerald-800"}>
                  {expired
                    ? "منقضی شده"
                    : `${left.toLocaleString("fa-IR")} روز تا پایان گارانتی`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
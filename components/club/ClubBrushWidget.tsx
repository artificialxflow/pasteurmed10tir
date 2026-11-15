"use client";

import { Card } from "@/components/ui/Card";
import { getClubProfileApi, postClubBrushApi } from "@/lib/club/client";
import type { BrushStatus } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { ToothbrushIcon } from "./ToothbrushIcon";

type Layout = "card" | "compact" | "floating";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function ClubBrushWidget({
  phone,
  variant = "web",
  layout = "card",
}: {
  phone: string;
  variant?: "web" | "app";
  layout?: Layout;
}) {
  const digits = digitsOnly(phone);
  const [brushStatus, setBrushStatus] = useState<BrushStatus | null>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(() => {
    if (digits.length < 10) return;
    setLoadError("");
    void getClubProfileApi(digits)
      .then((data) => setBrushStatus(data.brushStatus))
      .catch((e: Error) => {
        setBrushStatus(null);
        setLoadError(e.message || "بارگذاری باشگاه ناموفق");
      });
  }, [digits]);

  useEffect(() => {
    load();
  }, [load]);

  function recordBrush() {
    if (digits.length < 10 || busy) return;
    setBusy(true);
    void postClubBrushApi(digits)
      .then((data) => {
        setBrushStatus(data.brushStatus);
        setToast("مسواک ثبت شد! +۵ امتیاز");
        window.setTimeout(() => setToast(""), 2500);
      })
      .catch((e: Error) => setToast(e.message || "ثبت ناموفق"))
      .finally(() => setBusy(false));
  }

  if (digits.length < 10) return null;

  const canBrush = Boolean(brushStatus?.canBrush);
  const todayLine =
    brushStatus != null
      ? `امروز: ${brushStatus.brushesToday.toLocaleString("fa-IR")} از ${brushStatus.maxPerDay.toLocaleString("fa-IR")}`
      : null;

  const floatingPos =
    variant === "app"
      ? "bottom-[calc(0.75rem+var(--app-nav-height,3.5rem))] left-3"
      : "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 md:bottom-6 md:left-6";

  if (layout === "floating") {
    return (
      <div className={cn("fixed z-[25] flex flex-col items-start gap-1", floatingPos)}>
        {toast ? (
          <span className="max-w-[11rem] rounded-lg bg-teal-800 px-2 py-1 text-xs font-bold text-white shadow">
            {toast}
          </span>
        ) : null}
        <button
          type="button"
          aria-label="ثبت مسواک روزانه باشگاه"
          disabled={!canBrush || busy || !brushStatus}
          onClick={recordBrush}
          title={todayLine || "مسواک زدم"}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-lg transition",
            canBrush
              ? "border-teal-400 bg-gradient-to-br from-teal-50 to-white text-teal-700 hover:scale-105"
              : "border-slate-200 bg-slate-100 text-slate-400",
          )}
        >
          <ToothbrushIcon className="h-8 w-8" />
        </button>
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <ToothbrushIcon className="h-7 w-7 text-teal-700" />
          <span className="text-xs font-bold text-slate-800">مسواک روزانه</span>
          {todayLine ? <span className="text-xs text-teal-800">{todayLine}</span> : null}
        </div>
        <button
          type="button"
          disabled={!canBrush || busy || !brushStatus}
          onClick={recordBrush}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? "…" : "مسواک زدم"}
        </button>
        {toast ? <p className="w-full text-xs font-bold text-teal-800">{toast}</p> : null}
        {brushStatus && !canBrush && brushStatus.errorMessage ? (
          <p className="w-full text-xs text-amber-800">{brushStatus.errorMessage}</p>
        ) : null}
      </div>
    );
  }

  return (
    <Card hover={false} className="border-teal-200 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <ToothbrushIcon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">مسواک زدم — باشگاه</p>
          <p className="mt-0.5 text-xs text-slate-600">هر ثبت ۵ امتیاز (حداکثر ۳ بار در روز)</p>
          {todayLine ? <p className="mt-1 text-xs font-bold text-teal-700">{todayLine}</p> : null}
          {loadError ? <p className="mt-1 text-xs text-rose-700">{loadError}</p> : null}
          {toast ? <p className="mt-1 text-xs font-bold text-teal-800">{toast}</p> : null}
          {brushStatus && !canBrush && brushStatus.errorMessage ? (
            <p className="mt-1 text-xs font-bold text-amber-800">{brushStatus.errorMessage}</p>
          ) : null}
          <button
            type="button"
            disabled={!canBrush || busy || !brushStatus}
            onClick={recordBrush}
            className="mt-2 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "در حال ثبت…" : "مسواک زدم (+۵)"}
          </button>
        </div>
      </div>
    </Card>
  );
}
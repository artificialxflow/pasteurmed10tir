"use client";

import { Button } from "@/components/ui/Button";
import { FormInput, FormLabel } from "@/components/ui/Card";
import { parseLatLng, type LatLng } from "@/lib/home-visit/geo";
import dynamic from "next/dynamic";
import { useState } from "react";

const LocationMapInner = dynamic(() => import("./LocationMapInner"), { ssr: false });

export function LocationPicker({
  value,
  onChange,
  label = "موقعیت روی نقشه (اختیاری)",
}: {
  value: LatLng | null;
  onChange: (next: LatLng | null) => void;
  label?: string;
}) {
  const [geoError, setGeoError] = useState("");

  function useCurrent() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("مرورگر موقعیت را پشتیبانی نمی‌کند. منطقه را از فهرست انتخاب کنید.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGeoError("اجازه موقعیت داده نشد. منطقه را از فهرست انتخاب کنید.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function onManual(latRaw: string, lngRaw: string) {
    const next = parseLatLng(latRaw, lngRaw);
    onChange(next);
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <FormLabel>{label}</FormLabel>
      <p className="text-xs text-slate-500">روی نقشه بزنید یا موقعیت فعلی را بگیرید. بدون اجازه، همان انتخاب منطقه کافی است.</p>
      <LocationMapInner value={value} onChange={onChange} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FormLabel>عرض جغرافیایی</FormLabel>
          <FormInput
            type="number"
            step="any"
            value={value?.lat ?? ""}
            onChange={(e) => onManual(e.target.value, value?.lng != null ? String(value.lng) : "")}
          />
        </div>
        <div>
          <FormLabel>طول جغرافیایی</FormLabel>
          <FormInput
            type="number"
            step="any"
            value={value?.lng ?? ""}
            onChange={(e) => onManual(value?.lat != null ? String(value.lat) : "", e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={useCurrent}>
          موقعیت فعلی من
        </Button>
        {value ? (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            پاک کردن موقعیت
          </Button>
        ) : null}
      </div>
      {geoError ? <p className="text-xs font-bold text-amber-800">{geoError}</p> : null}
    </div>
  );
}

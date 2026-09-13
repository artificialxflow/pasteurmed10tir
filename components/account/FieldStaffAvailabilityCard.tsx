"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fieldStaffKindLabel, fieldStaffStatusLabel } from "@/lib/home-visit/labels";
import type { FieldStaffAdmin } from "@/lib/home-visit/mappers";
import { fetchPatientOps, patchPatientOps } from "@/lib/operations/client";
import { useCallback, useEffect, useState } from "react";

export function FieldStaffAvailabilityCard() {
  const [staff, setStaff] = useState<FieldStaffAdmin | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const data = await fetchPatientOps<{ item: FieldStaffAdmin | null }>(
      "/api/operations/field-staff/me",
    );
    setStaff(data.item);
  }, []);

  useEffect(() => {
    void reload().catch(() => setStaff(null));
  }, [reload]);

  if (staff === undefined) return null;
  if (!staff) return null;

  const available = staff.status === "available";
  const tone = available
    ? "border-teal-200 bg-teal-50/80"
    : staff.status === "busy"
      ? "border-amber-200 bg-amber-50/80"
      : "border-slate-200 bg-slate-50";

  async function toggle() {
    setError("");
    setBusy(true);
    try {
      const next = available ? "busy" : "available";
      const data = await patchPatientOps<{ item: FieldStaffAdmin }>(
        "/api/operations/field-staff/me/availability",
        { status: next },
      );
      setStaff(data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تغییر وضعیت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card hover={false} className={`space-y-3 p-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-slate-900">دسترس‌پذیری کادر میدانی</p>
          <p className="mt-1 text-xs leading-6 text-slate-600">
            {fieldStaffKindLabel(staff.kind)} · {staff.name}
            {staff.specialty ? ` · ${staff.specialty}` : ""}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            وضعیت فعلی: {fieldStaffStatusLabel(staff.status)}
          </p>
        </div>
        <Button
          type="button"
          variant={available ? "outline" : "primary"}
          className="min-w-[10rem] text-sm"
          disabled={busy || staff.status === "inactive"}
          onClick={() => void toggle()}
        >
          {busy
            ? "…"
            : available
              ? "غیرفعال کردن دسترس‌پذیری"
              : "در دسترس هستم"}
        </Button>
      </div>
      <p className="text-xs leading-6 text-slate-500">
        وقتی «در دسترس» باشید، اپراتور می‌تواند برای اعزام منزل وقت تنظیم کند. با خاموش کردن، از
        گزینه‌های اعزام خارج می‌شوید.
      </p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </Card>
  );
}

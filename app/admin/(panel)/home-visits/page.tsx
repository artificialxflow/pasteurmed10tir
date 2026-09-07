"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { FormSelect } from "@/components/ui/Card";
import { compareByDistance, formatApproxKm, haversineKm, parseLatLng } from "@/lib/home-visit/geo";
import {
  fieldStaffKindLabel,
  homeVisitKindLabel,
  homeVisitStatusLabel,
  staffKindForVisit,
} from "@/lib/home-visit/labels";
import type { FieldStaffAdmin } from "@/lib/home-visit/mappers";
import { fetchAdminOps, patchAdminOps } from "@/lib/operations/client";
import { formatPrice } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

type HomeVisitRow = {
  id: string;
  kind: "nursing" | "medical_home";
  serviceTitle?: string;
  specialtyLabel?: string;
  patientName?: string;
  patientPhone: string;
  patientArea?: string;
  patientAreaLabel?: string;
  patientAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  amount?: number;
  status: string;
  assignedStaff?: { id?: string; name?: string; specialty?: string; kind?: string } | null;
};

export default function AdminHomeVisitsPage() {
  const [items, setItems] = useState<HomeVisitRow[]>([]);
  const [staff, setStaff] = useState<FieldStaffAdmin[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [visits, roster] = await Promise.all([
      fetchAdminOps<{ items: HomeVisitRow[] }>("/api/admin/operations/home-visits"),
      fetchAdminOps<{ items: FieldStaffAdmin[] }>("/api/admin/operations/field-staff"),
    ]);
    setItems(visits.items);
    setStaff(roster.items);
  }, []);

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "خطا"));
  }, [reload]);

  const assignable = useMemo(
    () => staff.filter((item) => item.active && item.status !== "inactive"),
    [staff],
  );

  function staffOptions(visit: HomeVisitRow) {
    const expected = staffKindForVisit(visit.kind);
    const origin = parseLatLng(visit.latitude, visit.longitude);
    return assignable
      .filter((item) => item.kind === expected)
      .map((item) => {
        const point = parseLatLng(item.latitude, item.longitude);
        return {
          ...item,
          distanceKm: origin && point ? haversineKm(origin, point) : null,
        };
      })
      .sort((a, b) => {
        if (origin) {
          const byDistance = compareByDistance(a.distanceKm, b.distanceKm);
          if (byDistance !== 0) return byDistance;
        } else {
          const aMatch = visit.patientArea && a.serviceAreas.includes(visit.patientArea) ? 0 : 1;
          const bMatch = visit.patientArea && b.serviceAreas.includes(visit.patientArea) ? 0 : 1;
          if (aMatch !== bMatch) return aMatch - bMatch;
        }
        return a.sortOrder - b.sortOrder;
      });
  }

  function assign(id: string, assignedStaffId: string) {
    if (!assignedStaffId) return;
    setBusyId(id);
    void patchAdminOps("/api/admin/operations/home-visits", { id, assignedStaffId })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "تخصیص ناموفق"))
      .finally(() => setBusyId(null));
  }

  function setStatus(id: string, status: string) {
    setBusyId(id);
    void patchAdminOps("/api/admin/operations/home-visits", { id, status })
      .then(() => reload())
      .catch((e) => setError(e instanceof Error ? e.message : "تغییر وضعیت ناموفق"))
      .finally(() => setBusyId(null));
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-slate-500">
        تخصیص نیرو توسط ادمین انجام می‌شود. بیمار فقط نام، تخصص و عکس نیرو را می‌بیند.
      </p>
      <AdminTable
        headers={[
          "مراجع",
          "نوع",
          "منطقه / آدرس",
          "مبلغ",
          "وضعیت",
          "نیروی فعلی",
          "تخصیص نیرو",
          "عملیات",
        ]}
        empty="درخواست خانگی ثبت نشده."
      >
        {items.map((item) => {
          const options = staffOptions(item);
          return (
            <tr key={item.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3">
                <p className="font-bold">{item.patientName || "—"}</p>
                <p className="text-xs text-slate-500">{item.patientPhone}</p>
              </td>
              <td className="px-4 py-3 text-xs">
                <p>{homeVisitKindLabel(item.kind)}</p>
                <p className="text-slate-500">{item.serviceTitle || item.specialtyLabel || "—"}</p>
              </td>
              <td className="max-w-xs px-4 py-3 text-xs">
                <p className="font-bold">{item.patientAreaLabel || "—"}</p>
                <p className="mt-1 text-slate-500">{item.patientAddress || "—"}</p>
                {item.latitude != null && item.longitude != null ? (
                  <p className="mt-1 text-teal-700">موقعیت روی نقشه ثبت شده</p>
                ) : null}
                {item.description ? <p className="mt-1 text-slate-400">{item.description}</p> : null}
              </td>
              <td className="px-4 py-3">{formatPrice(Number(item.amount || 0))}</td>
              <td className="px-4 py-3">
                <AdminBadge tone={item.status === "cancelled" ? "danger" : item.assignedStaff ? "success" : "warn"}>
                  {homeVisitStatusLabel(item.status)}
                </AdminBadge>
              </td>
              <td className="px-4 py-3 text-xs">
                {item.assignedStaff
                  ? `${item.assignedStaff.name || "—"} · ${item.assignedStaff.specialty || fieldStaffKindLabel(item.assignedStaff.kind)}`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                {item.status === "submitted" || item.status === "staff_assigned" ? (
                  <FormSelect
                    disabled={busyId === item.id || options.length === 0}
                    value={item.assignedStaff?.id || ""}
                    onChange={(e) => assign(item.id, e.target.value)}
                  >
                    <option value="">{options.length ? "انتخاب نیرو" : "نیروی مناسب ثبت نشده"}</option>
                    {options.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.specialty ? ` — ${s.specialty}` : ""}
                        {item.latitude != null && item.longitude != null
                          ? ` · ${formatApproxKm(s.distanceKm)}`
                          : ""}
                      </option>
                    ))}
                  </FormSelect>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1 text-xs font-semibold">
                  {item.status === "staff_assigned" ? (
                    <button
                      type="button"
                      className="text-teal-700"
                      disabled={busyId === item.id}
                      onClick={() => setStatus(item.id, "staff_confirmed")}
                    >
                      تأیید نیرو
                    </button>
                  ) : null}
                  {item.status === "staff_confirmed" ? (
                    <button
                      type="button"
                      className="text-teal-700"
                      disabled={busyId === item.id}
                      onClick={() => setStatus(item.id, "en_route")}
                    >
                      نیرو در مسیر
                    </button>
                  ) : null}
                  {item.status === "en_route" ? (
                    <button
                      type="button"
                      className="text-teal-700"
                      disabled={busyId === item.id}
                      onClick={() => setStatus(item.id, "completed")}
                    >
                      خدمت انجام شد
                    </button>
                  ) : null}
                  {item.status === "submitted" ||
                  item.status === "staff_assigned" ||
                  item.status === "staff_confirmed" ? (
                    <button
                      type="button"
                      className="text-rose-700"
                      disabled={busyId === item.id}
                      onClick={() => setStatus(item.id, "cancelled")}
                    >
                      لغو
                    </button>
                  ) : null}
                  {item.status === "completed" || item.status === "reviewed" || item.status === "cancelled"
                    ? "—"
                    : null}
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}

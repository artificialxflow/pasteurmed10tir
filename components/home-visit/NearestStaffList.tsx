"use client";

import { fieldStaffKindLabel } from "@/lib/home-visit/labels";
import { staffGenderLabel } from "@/lib/home-visit/gender";
import { formatApproxKm } from "@/lib/home-visit/geo";

export type NearbyStaff = {
  id: string;
  name: string;
  kind?: string;
  image?: string;
  specialty?: string;
  gender?: string | null;
  distanceKm?: number | null;
};

export function NearestStaffList({
  items,
  title = "نزدیک‌ترین نیروها (پیشنهاد)",
}: {
  items: NearbyStaff[];
  title?: string;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">تخصیص نهایی را ادمین انجام می‌دهد. مختصات نیرو نمایش داده نمی‌شود.</p>
      <ul className="space-y-2">
        {items.map((staff) => (
          <li key={staff.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            {staff.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staff.image} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-sm">
                {staff.kind === "physician" ? "🩺" : "👩‍⚕️"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{staff.name}</p>
              <p className="text-xs text-slate-500">
                {staff.specialty || fieldStaffKindLabel(staff.kind)}
                {staffGenderLabel(staff.gender) !== "—" ? ` · ${staffGenderLabel(staff.gender)}` : ""}
                {" · "}
                {formatApproxKm(staff.distanceKm)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

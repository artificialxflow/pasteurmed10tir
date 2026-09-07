"use client";

import { fieldStaffKindLabel, homeVisitKindLabel, homeVisitStatusLabel } from "@/lib/home-visit/labels";

type Staff = {
  name?: string;
  kind?: string;
  image?: string;
  specialty?: string;
};

export function AssignedStaffCard({
  staff,
  status,
  kind,
  serviceTitle,
  areaLabel,
}: {
  staff: Staff | null;
  status?: string;
  kind?: string;
  serviceTitle?: string;
  areaLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {staff?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={staff.image}
          alt={staff.name || "نیرو"}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg">
          {staff?.kind === "physician" ? "🩺" : "👩‍⚕️"}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">
          {serviceTitle || homeVisitKindLabel(kind)}
        </p>
        {staff ? (
          <p className="mt-0.5 text-xs text-slate-600">
            {staff.name}
            {staff.specialty ? ` · ${staff.specialty}` : ""}
            {` · ${fieldStaffKindLabel(staff.kind)}`}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-500">هنوز نیرویی تخصیص داده نشده است.</p>
        )}
        <p className="mt-0.5 text-xs text-slate-500">
          {areaLabel ? `${areaLabel} · ` : ""}
          {homeVisitStatusLabel(status)}
        </p>
      </div>
    </div>
  );
}

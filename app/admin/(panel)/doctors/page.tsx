"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { fetchAdmin } from "@/lib/content/client";
import { PASTEUR_DATA, type Physician } from "@/lib/data";
import { STATUS_LABELS } from "@/lib/status";
import { useEffect, useState } from "react";

export default function AdminDoctorsPage() {
  const [physicians, setPhysicians] = useState<Physician[]>([]);

  useEffect(() => {
    void fetchAdmin<{ items: Physician[] }>("/api/admin/content/physicians")
      .then((data) => setPhysicians(data.items))
      .catch(() => setPhysicians([]));
  }, []);

  const dentists = [
    ...PASTEUR_DATA.dentists.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      days: [...d.days],
      hours: d.hours,
      status: d.status,
    })),
    ...physicians.map((p) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      days: [...p.days],
      hours: "—",
      status: p.status,
    })),
  ];

  return (
    <div className="space-y-8">
      <AdminTable headers={["نام", "تخصص", "روزها", "ساعات", "وضعیت"]} empty="پزشکی ثبت نشده.">
        {dentists.map((d) => {
          const statusKey =
            d.status === "available" || d.status === "busy" || d.status === "inactive"
              ? d.status
              : "inactive";
          const st = STATUS_LABELS[statusKey];
          return (
            <tr key={String(d.id)} className="border-t border-slate-100">
              <td className="px-4 py-3">{d.name}</td>
              <td className="px-4 py-3">{d.specialty}</td>
              <td className="px-4 py-3">{(d.days || []).join("، ") || "—"}</td>
              <td className="px-4 py-3">{d.hours || "—"}</td>
              <td className="px-4 py-3">
                <AdminBadge
                  tone={
                    statusKey === "available"
                      ? "success"
                      : statusKey === "busy"
                        ? "warn"
                        : "danger"
                  }
                >
                  {st.text}
                </AdminBadge>
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}

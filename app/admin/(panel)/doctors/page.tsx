"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Card, FormInput } from "@/components/ui/Card";
import { fetchAdmin } from "@/lib/content/client";
import { PASTEUR_DATA, type Physician } from "@/lib/data";
import { PasteurStorage } from "@/lib/storage";
import { STATUS_LABELS } from "@/lib/status";
import { FormEvent, useEffect, useState } from "react";

type ExtraDoctor = {
  id: string | number;
  name: string;
  specialty: string;
  days?: string[];
  hours?: string;
  status?: string;
  mock?: boolean;
};

export default function AdminDoctorsPage() {
  const [extra, setExtra] = useState<ExtraDoctor[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [message, setMessage] = useState("");

  function reload() {
    setExtra(PasteurStorage.getExtraDoctors() as ExtraDoctor[]);
    void fetchAdmin<{ items: Physician[] }>("/api/admin/content/physicians")
      .then((data) => setPhysicians(data.items))
      .catch(() => setPhysicians([]));
  }

  useEffect(() => {
    reload();
  }, []);

  const dentists = [
    ...PASTEUR_DATA.dentists.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      days: [...d.days],
      hours: d.hours,
      status: d.status,
      mock: false as boolean,
    })),
    ...physicians.map((p) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      days: [...p.days],
      hours: "—",
      status: p.status,
      mock: false as boolean,
    })),
    ...extra,
  ];

  function addDoctor(e: FormEvent) {
    e.preventDefault();
    const doctorName = name.trim();
    PasteurStorage.saveExtraDoctor({
      id: Date.now(),
      name: doctorName,
      specialty: specialty.trim(),
      days: ["شنبه"],
      hours: "۹ تا ۱۷",
      status: "available",
      mock: true,
    });
    setName("");
    setSpecialty("");
    reload();
    setMessage(`پزشک «${doctorName}» ثبت شد. (نسخه نمایشی)`);
    window.setTimeout(() => setMessage(""), 3000);
  }

  return (
    <div className="space-y-8">
      {message ? <p className="text-sm font-bold text-teal-700">{message}</p> : null}
      <AdminTable headers={["نام", "تخصص", "روزها", "ساعات", "وضعیت"]} empty="پزشکی ثبت نشده.">
        {dentists.map((d) => {
          const statusKey =
            d.status === "available" || d.status === "busy" || d.status === "inactive"
              ? d.status
              : "inactive";
          const st = STATUS_LABELS[statusKey];
          return (
            <tr key={String(d.id)} className="border-t border-slate-100">
              <td className="px-4 py-3">
                {d.name}
                {d.mock ? (
                  <span className="mr-2 text-xs text-amber-700">(نمایشی)</span>
                ) : null}
              </td>
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

      <Card hover={false} className="max-w-lg p-6">
        <h2 className="mb-4 font-bold">افزودن پزشک (نمایشی)</h2>
        <form onSubmit={addDoctor} className="space-y-3">
          <FormInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام پزشک"
            required
          />
          <FormInput
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="تخصص"
            required
          />
          <Button type="submit" className="w-full text-sm">
            افزودن
          </Button>
        </form>
        <p className="mt-2 text-xs text-slate-400">در نسخه نهایی به API متصل می‌شود.</p>
      </Card>
    </div>
  );
}

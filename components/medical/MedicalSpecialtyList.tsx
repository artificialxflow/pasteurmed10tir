"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchPublic } from "@/lib/content/client";
import type { Physician } from "@/lib/data";
import { isGeneralPhysician } from "@/lib/operations/medical-slots";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MedicalBasePath } from "./MedicalHub";

function isAppMedical(basePath: MedicalBasePath): boolean {
  return basePath.startsWith("/app");
}

type SpecialtyItem = {
  id: string;
  name: string;
  emoji: string;
  description: string;
};

function deriveSpecialties(physicians: Physician[]): SpecialtyItem[] {
  const map = new Map<string, SpecialtyItem>();
  for (const doctor of physicians) {
    if (isGeneralPhysician(doctor)) continue;
    const id = String(doctor.specialtyId || doctor.specialty);
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: doctor.specialty,
        emoji: "🔬",
        description: `پزشکان ${doctor.specialty} · ویزیت ۱۵ دقیقه‌ای`,
      });
    }
  }
  return Array.from(map.values());
}

export function MedicalSpecialtyList({ basePath }: { basePath: MedicalBasePath }) {
  const app = isAppMedical(basePath);
  const doctorsPage = app ? ROUTES.app.medicalDoctors : ROUTES.web.medicalDoctors;
  const medical = app ? ROUTES.app.medical : ROUTES.web.medical;
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);

  useEffect(() => {
    void fetchPublic<{ items: Physician[] }>("/api/content/physicians")
      .then((data) => setSpecialties(deriveSpecialties(data.items)))
      .catch(() => setSpecialties([]));
  }, []);

  if (app) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {specialties.length ? (
          specialties.map((s) => (
            <Link
              key={s.id}
              href={`${doctorsPage}?specialty=${s.id}`}
              className="rounded-2xl border border-sky-200 bg-white p-4 transition hover:border-amber-500"
            >
              <span className="text-2xl">{s.emoji}</span>
              <p className="mt-2 text-sm font-bold text-slate-900">{s.name}</p>
              <p className="mt-1 text-xs text-slate-500">{s.description}</p>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            تخصصی ثبت نشده است.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href={medical} className="hover:text-teal-700">
          پزشکی
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">تخصص‌ها</span>
      </nav>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        🔬 تخصص‌های پزشکی
      </h1>
      <p className="mb-8 text-slate-600">
        تخصص مورد نظر را انتخاب کنید؛ سپس پزشک و نوع مشاوره یا ویزیت را مشخص می‌کنید.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {specialties.length ? (
          specialties.map((s) => (
            <Card key={s.id} className="p-6 hover:border-amber-500">
              <span className="text-3xl">{s.emoji}</span>
              <h2 className="mt-3 text-lg font-bold text-slate-900">{s.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{s.description}</p>
              <Button
                variant="accent"
                className="mt-4 text-sm"
                href={`${doctorsPage}?specialty=${s.id}`}
              >
                انتخاب و ادامه ←
              </Button>
            </Card>
          ))
        ) : (
          <p className="col-span-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            تخصصی ثبت نشده است.
          </p>
        )}
      </div>
    </div>
  );
}

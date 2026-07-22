"use client";

import { AppShell } from "@/components/app/AppShell";
import { MedicalDoctorList } from "@/components/medical/MedicalDoctorList";
import { Suspense } from "react";

export default function AppMedicalDoctorsPage() {
  return (
    <AppShell title="انتخاب پزشک">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
        <MedicalDoctorList basePath="/app/medical" />
      </Suspense>
    </AppShell>
  );
}

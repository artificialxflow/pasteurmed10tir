import { MedicalDoctorList } from "@/components/medical/MedicalDoctorList";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "انتخاب پزشک",
};

export default function MedicalDoctorsPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
      <MedicalDoctorList basePath="/medical" />
    </Suspense>
  );
}

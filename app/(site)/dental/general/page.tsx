import { DentistList } from "@/components/dental/DentistList";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "دندانپزشکان",
};

export default function DentalGeneralPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
      <DentistList basePath="/dental" />
    </Suspense>
  );
}

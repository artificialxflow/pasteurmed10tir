import { BookingWizard } from "@/components/dental/BookingWizard";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "رزرو نوبت دندانپزشکی",
  description: "لیست دندانپزشکان پاستور پلاس و رزرو نوبت آنلاین.",
};

export default function DentalGeneralPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-slate-500">در حال بارگذاری...</p>}>
      <BookingWizard basePath="/dental" />
    </Suspense>
  );
}

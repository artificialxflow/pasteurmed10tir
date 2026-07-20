import { BookingWizard } from "@/components/dental/BookingWizard";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "رزرو نوبت",
};

export default function DentalBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-slate-500">
          در حال بارگذاری...
        </div>
      }
    >
      <BookingWizard basePath="/dental" />
    </Suspense>
  );
}

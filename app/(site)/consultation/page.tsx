import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { ConsultationQuickLinks } from "@/components/consultation/ConsultationQuickLinks";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "مشاوره و ویزیت",
  description: "ثبت درخواست مشاوره و ویزیت پاستور پلاس",
};

export default function ConsultationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        💬 مشاوره و ویزیت
      </h1>
      <p className="mb-8 text-slate-600">
        ابتدا درخواست خود را ثبت کنید؛ در مرحله بعد نوع ارتباط متنی، تصویری، ویدیویی یا تلفنی
        هماهنگ می‌شود.
      </p>
      <ConsultationQuickLinks variant="web" />
      <Suspense
        fallback={<p className="text-center text-sm text-slate-500">در حال بارگذاری...</p>}
      >
        <ConsultationForm variant="web" />
      </Suspense>
    </div>
  );
}

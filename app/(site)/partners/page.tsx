import { PartnerRequestForm } from "@/components/partners/PartnerRequestForm";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "درخواست همکاری",
  description: "ثبت درخواست همکاری با پاستور پلاس",
};

export default function PartnersPage() {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Card
          hover={false}
          className="mb-8 border-cyan-200 bg-gradient-to-bl from-cyan-50 to-amber-50 p-6 sm:p-8"
        >
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-bold text-cyan-800">
            همکاری با پاستور پلاس
          </span>
          <h1 className="mb-3 text-2xl font-extrabold text-slate-950 sm:text-4xl">
            درخواست عضویت همکار
          </h1>
          <p className="leading-7 text-slate-600">
            پرستاران، دندانپزشکان، پزشکان و روانشناسان می‌توانند اطلاعات اولیه خود را ثبت کنند تا
            تیم پاستور پلاس برای بررسی شرایط همکاری تماس بگیرد.
          </p>
        </Card>

        <PartnerRequestForm variant="web" />
      </div>
    </main>
  );
}

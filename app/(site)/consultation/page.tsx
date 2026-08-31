import { ConsultationPageContent } from "@/components/consultation/ConsultationPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مشاوره و ویزیت",
  description: "ثبت درخواست مشاوره و ویزیت پاستور پلاس",
};

export default function ConsultationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ConsultationPageContent variant="web" />
    </div>
  );
}

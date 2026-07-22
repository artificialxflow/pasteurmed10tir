import { NursingCatalog } from "@/components/nursing/NursingCatalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "پرستاری",
  description: "خدمات پرستاری در منزل — پاستور پلاس",
};

export default function NursingPage() {
  return (
    <main className="flex-1 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          👩‍⚕️ خدمات پرستاری در منزل
        </h1>
        <p className="mb-8 text-slate-600">
          تزریقات، پانسمان، مراقبت ICU/CCU در منزل و اجاره تجهیزات پزشکی با هماهنگی پاستور پلاس
        </p>
        <NursingCatalog variant="site" />
      </div>
    </main>
  );
}

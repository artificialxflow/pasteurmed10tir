import { DentalTariffs } from "@/components/dental/DentalTariffs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تعرفه‌های دندانپزشکی",
  description: "لیست تعرفه‌های خدمات دندانپزشکی پاستور پلاس.",
};

export default function DentalTariffsPage() {
  return (
    <main className="flex-1 py-10">
      <div className="px-4 sm:px-6">
        <DentalTariffs basePath="/dental" />
      </div>
    </main>
  );
}
